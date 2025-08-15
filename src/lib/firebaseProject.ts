import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteField,
} from "firebase/firestore";
import type {
  Project,
  NewProjectData,
  Column,
  UserId,
  UserProjectRole,
  TeamId,
} from "./types";
import { v4 as uuidv4 } from "uuid";



// Project Functions
export const createProject = async (
  projectData: NewProjectData,
  ownerId: string,
  teamId?: TeamId
): Promise<Project> => {
  const user = auth.currentUser;
  if (!user || user.uid !== ownerId) {
    throw new Error(
      "User must be authenticated and match ownerId to create projects."
    );
  }
  try {
    const newProjectId = uuidv4();
    const defaultColumns: Column[] = [
      { id: `col-${newProjectId}-1`, title: "To Do", order: 0 },
      { id: `col-${newProjectId}-2`, title: "In Progress", order: 1 },
      { id: `col-${newProjectId}-3`, title: "Done", order: 2 },
    ];
    const newProjectDoc = {
      ...projectData,
      ownerId,
      teamId: teamId || null, // Ensure teamId is string or null
      columns: defaultColumns,
      tasks: [],
      memberIds: [ownerId],
      memberRoles: { [ownerId]: "manager" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "projects", newProjectId), newProjectDoc);
    return { id: newProjectId, ...newProjectDoc } as Project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProjectDetails = async (
  projectId: string,
  data: { name?: string; description?: string; teamId?: TeamId | null }
): Promise<Project> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to update project details.");
  }
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Project not found.");
  }
  const projectData = projectSnap.data() as Project;
  if (projectData.ownerId !== currentUser.uid) {
    throw new Error("Only the project owner can update project details.");
  }

  const updatePayload: Partial<
    Pick<Project, "name" | "description" | "teamId" | "updatedAt">
  > = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.description !== undefined)
    updatePayload.description = data.description;
  if (data.teamId !== undefined) updatePayload.teamId = data.teamId;

  if (Object.keys(updatePayload).length === 0) {
    return { ...projectData } as Project; // No changes
  }

  updatePayload.updatedAt = new Date().toISOString();

  await updateDoc(projectRef, updatePayload);

  return { ...projectData, ...updatePayload, id: projectId } as Project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to delete projects.");
  }

  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Project not found.");
  }

  const projectData = projectSnap.data() as Project;
  if (projectData.ownerId !== currentUser.uid) {
    throw new Error("Only the project owner can delete the project.");
  }

  try {
    await deleteDoc(projectRef);
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
};

export const getProjectById = async (
  projectId: string
): Promise<Project | null> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      return { id: projectSnap.id, ...projectSnap.data() } as Project;
    }
    return null;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    throw error;
  }
};

export const getProjectsForUser = async (
  userId: UserId,
  teamId: TeamId
): Promise<Project[]> => {
  try {
    const projectsCollectionRef = collection(db, "projects");
    const q = query(
      projectsCollectionRef,
      where("memberIds", "array-contains", userId),
      where("teamId", "==", teamId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  } catch (error) {
    console.error("Error fetching projects for user:", error);
    throw error;
  }
};

export const addUserToProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const projectRef = doc(db, "projects", projectId);
  const userRef = doc(db, "users", userId);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to manage project members.");
  }

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }
    const projectData = projectSnap.data() as Project;
    if (projectData.ownerId !== currentUser.uid) {
      throw new Error("Only the project owner can add members.");
    }

    const updates: Partial<Project> & {
      updatedAt: string;
      memberRoles?: Record<UserId, UserProjectRole>;
    } = {
      memberIds: arrayUnion(userId) as unknown as string[],
      updatedAt: new Date().toISOString(),
    };
    (updates as any)[`memberRoles.${userId}`] = "member";

    await updateDoc(projectRef, updates);
  } catch (error) {
    console.error(
      `Error adding user ${userId} to project ${projectId}:`,
      error
    );
    throw error;
  }
};

export const removeUserFromProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const projectRef = doc(db, "projects", projectId);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to manage project members.");
  }

  try {
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }
    const projectData = projectSnap.data() as Project;
    if (projectData.ownerId !== currentUser.uid) {
      throw new Error("Only the project owner can remove members.");
    }
    if (projectData.ownerId === userId) {
      throw new Error(
        "The project owner cannot be removed from the project by themselves."
      );
    }

    const updates: Partial<Project> & {
      updatedAt: string;
      memberRoles?: Record<UserId, UserProjectRole | typeof deleteField>;
    } = {
      memberIds: arrayRemove(userId) as unknown as string[],
      updatedAt: new Date().toISOString(),
    };
    (updates as any)[`memberRoles.${userId}`] = deleteField();

    await updateDoc(projectRef, updates);
  } catch (error) {
    console.error(
      `Error removing user ${userId} from project ${projectId}:`,
      error
    );
    throw error;
  }
};

export const updateProjectUserRole = async (
  projectId: string,
  userId: string,
  newRole: UserProjectRole
): Promise<void> => {
  const projectRef = doc(db, "projects", projectId);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("User must be authenticated to change roles.");
  }

  try {
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }
    const projectData = projectSnap.data() as Project;
    if (projectData.ownerId !== currentUser.uid) {
      throw new Error("Only the project owner can change member roles.");
    }
    if (userId === projectData.ownerId) {
      throw new Error("Cannot change the role of the project owner.");
    }
    if (!projectData.memberIds?.includes(userId)) {
      throw new Error("User is not a member of this project.");
    }

    await updateDoc(projectRef, {
      [`memberRoles.${userId}`]: newRole,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `Error updating role for user ${userId} in project ${projectId}:`,
      error
    );
    throw error;
  }
};
