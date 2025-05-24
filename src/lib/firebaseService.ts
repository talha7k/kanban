
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import type { UserProfile, Project, NewProjectData, Task, Column, Comment, NewTaskData, NewCommentData, ProjectDocument, UserDocument, TaskId, ColumnId, UserId, UserProjectRole } from './types';
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore();

// User Profile Functions
export const createUserProfileDocument = async (userAuth: FirebaseUser, additionalData?: Partial<Pick<UserProfile, 'name' | 'title'>>) => {
  if (!userAuth) return;
  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = userAuth;
    const createdAt = new Date().toISOString();
    try {
      const newUserProfile: UserProfile = {
        id: userAuth.uid,
        name: additionalData?.name || displayName || email?.split('@')[0] || 'New User',
        email: email || '',
        avatarUrl: photoURL || `https://placehold.co/40x40.png?text=${(additionalData?.name || displayName || email || 'U').substring(0,1).toUpperCase()}`,
        role: 'staff', // Default global role
        title: additionalData?.title || 'Team Member',
        createdAt,
      };
      const { id, ...profileToSave } = newUserProfile;
      await setDoc(userRef, profileToSave);
      return newUserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
  const existingData = snapshot.data() as UserDocument;
  return {
    id: snapshot.id,
    ...existingData,
    role: existingData.role || 'staff',
    title: existingData.title || 'Team Member',
   } as UserProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userRef = doc(db, `users/${userId}`);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as UserDocument;
    return {
      id: snapshot.id,
      ...data,
      role: data.role || 'staff',
      title: data.title || 'Team Member',
    } as UserProfile;
  }
  return null;
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as UserDocument;
      return {
        id: doc.id,
        ...data,
        role: data.role || 'staff',
        title: data.title || 'Team Member',
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching all user profiles:', error);
    throw error;
  }
};

// Project Functions
export const createProject = async (projectData: NewProjectData, ownerId: string): Promise<Project> => {
  if (!ownerId) throw new Error("Owner ID is required to create a project.");
  const user = auth.currentUser;
  if (!user || user.uid !== ownerId) {
    throw new Error("User must be authenticated and match ownerId to create projects.");
  }
  try {
    const newProjectId = uuidv4();
    const defaultColumns: Column[] = [
      { id: `col-${newProjectId}-1`, title: 'To Do', order: 0 },
      { id: `col-${newProjectId}-2`, title: 'In Progress', order: 1 },
      { id: `col-${newProjectId}-3`, title: 'Done', order: 2 },
    ];
    const newProjectDoc: Omit<Project, 'id'> = {
      ...projectData,
      ownerId,
      columns: defaultColumns,
      tasks: [],
      memberIds: [ownerId],
      memberRoles: { [ownerId]: 'manager' }, // Owner is implicitly a manager of their project
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'projects', newProjectId), newProjectDoc);
    return { ...newProjectDoc, id: newProjectId };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      return { id: projectSnap.id, ...projectSnap.data() } as Project;
    }
    return null;
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }
};

export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  if (!userId) return [];
  try {
    // Query for projects where the user is the owner OR is listed in memberIds
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('memberIds', 'array-contains', userId));
    
    const querySnapshot = await getDocs(q);
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    
    return projects;

  } catch (error) {
    console.error('Error fetching projects for user:', error);
    throw error;
  }
};

export const addUserToProject = async (projectId: string, userId: string): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  const userRef = doc(db, 'users', userId);

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
    if (!projectSnap.exists()){
        throw new Error(`Project with ID ${projectId} not found.`);
    }
    const projectData = projectSnap.data() as Project;
    if (projectData.ownerId !== currentUser.uid) {
        throw new Error("Only the project owner can add members.");
    }

    const updates: Partial<Project> & { updatedAt: string } = {
        memberIds: arrayUnion(userId) as unknown as string[], // Firestore type trick
        updatedAt: new Date().toISOString(),
    };
    // Add to memberRoles with default 'member' role
    updates[`memberRoles.${userId}` as keyof Project] = 'member';


    await updateDoc(projectRef, updates);
  } catch (error) {
    console.error(`Error adding user ${userId} to project ${projectId}:`, error);
    throw error;
  }
};

export const removeUserFromProject = async (projectId: string, userId: string): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to manage project members.");
  }

  try {
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()){
        throw new Error(`Project with ID ${projectId} not found.`);
    }
    const projectData = projectSnap.data() as Project;
    if (projectData.ownerId !== currentUser.uid) {
        throw new Error("Only the project owner can remove members.");
    }
    if (projectData.ownerId === userId) {
        throw new Error("The project owner cannot be removed from the project by themselves.");
    }

    const updates:any = { // Using 'any' for dynamic field path, ensure type safety in usage
        memberIds: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
    };
    // Remove from memberRoles
    // Firestore does not have a direct "delete field from map" in arrayRemove style
    // We need to fetch, modify, and set the map, or use dot notation with a specific value to delete (which is complex here)
    // For simplicity, we might need to fetch the project, update memberRoles in code, then updateDoc.
    // A simpler approach for now is to leave the role, it just won't be used if memberId is removed.
    // Or, set it to a special value like null, if your types allow. For dot notation:
    updates[`memberRoles.${userId}`] = deleteField(); // This requires importing deleteField from 'firebase/firestore'

    await updateDoc(projectRef, updates);
  } catch (error) {
    console.error(`Error removing user ${userId} from project ${projectId}:`, error);
    throw error;
  }
};

export const updateProjectUserRole = async (projectId: string, userId: string, newRole: UserProjectRole): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
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
        throw new Error("User is not a member of this project.")
    }

    await updateDoc(projectRef, {
      [`memberRoles.${userId}`]: newRole,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error updating role for user ${userId} in project ${projectId}:`, error);
    throw error;
  }
}


// Task Functions
export const addTaskToProject = async (projectId: string, taskData: NewTaskData, columnId: ColumnId): Promise<Task> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to add tasks.");
  }

  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const newTaskId = uuidv4();

    const newTask: Task = {
      title: taskData.title,
      description: taskData.description ?? null,
      priority: taskData.priority,
      assigneeUids: taskData.assigneeUids ?? [],
      reporterId: taskData.reporterId ?? null,
      dueDate: taskData.dueDate ?? null,
      tags: taskData.tags ?? [],
      dependentTaskTitles: taskData.dependentTaskTitles ?? [],
      id: newTaskId,
      projectId,
      columnId,
      order: project.tasks.filter(t => t.columnId === columnId).length,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, {
      tasks: arrayUnion(newTask),
      updatedAt: new Date().toISOString(),
    });
    return newTask;
  } catch (error) {
    console.error('Error adding task to project:', error, 'Task Payload:', taskData);
    throw error;
  }
};

export const updateTaskInProject = async (projectId: string, taskId: string, taskUpdateData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>): Promise<Task> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to update tasks.");
  }
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const existingTask = project.tasks[taskIndex];

    const updatePayload: Partial<Task> = {};
    for (const key in taskUpdateData) {
        if (Object.prototype.hasOwnProperty.call(taskUpdateData, key)) {
            const typedKey = key as keyof typeof taskUpdateData;
            // @ts-ignore
            const value = taskUpdateData[typedKey];
            // @ts-ignore
            updatePayload[typedKey] = value === undefined ? null : value;
        }
    }
    if (taskUpdateData.assigneeUids === undefined) updatePayload.assigneeUids = existingTask.assigneeUids ?? []; else updatePayload.assigneeUids = taskUpdateData.assigneeUids ?? [];
    if (taskUpdateData.tags === undefined) updatePayload.tags = existingTask.tags ?? []; else updatePayload.tags = taskUpdateData.tags ?? [];
    if (taskUpdateData.dependentTaskTitles === undefined) updatePayload.dependentTaskTitles = existingTask.dependentTaskTitles ?? []; else updatePayload.dependentTaskTitles = taskUpdateData.dependentTaskTitles ?? [];


    const updatedTask: Task = {
      ...existingTask,
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = updatedTask;

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
    return updatedTask;
  } catch (error) {
    console.error('Error updating task in project:', error);
    throw error;
  }
};

export const deleteTaskFromProject = async (projectId: string, taskId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to delete tasks.");
  }
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const taskToRemove = project.tasks[taskIndex]; // Get the actual task object

    // Instead of arrayRemove by object (which can be tricky with nested/complex objects),
    // filter the array and set it.
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);

    await updateDoc(projectRef, {
      tasks: updatedTasks, // Use the filtered array
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting task from project:', error);
    throw error;
  }
};


export const moveTaskInProject = async (projectId: string, taskId: string, newColumnId: ColumnId, newOrder: number): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to move tasks.");
  }
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    let project = projectDoc.data() as ProjectDocument;
    let taskToMove: Task | undefined;

    const updatedTasks = project.tasks.map(task => {
      if (task.id === taskId) {
        taskToMove = {
          ...task,
          columnId: newColumnId,
          order: newOrder,
          updatedAt: new Date().toISOString()
        };
        return taskToMove;
      }
      return task;
    });

    if (!taskToMove) throw new Error('Task not found during move operation');

    // Re-order tasks in the target column if necessary (simple example, might need more complex logic for arbitrary order changes)
    // This part is simplified; robust reordering often involves adjusting orders of other tasks.
    // For now, just ensure the moved task has its new order. The client-side already calculates this.

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error moving task in project:', error);
    throw error;
  }
};

export const addCommentToTask = async (projectId: string, taskId: string, commentData: NewCommentData): Promise<Comment> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== commentData.userId) {
    throw new Error("User must be authenticated and match comment author to add comments.");
  }
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const newCommentId = uuidv4();
    const newComment: Comment = {
      ...commentData,
      id: newCommentId,
      createdAt: new Date().toISOString(),
    };

    const task = project.tasks[taskIndex];
    const updatedComments = [...(task.comments || []), newComment];
    const updatedTask: Task = { ...task, comments: updatedComments, updatedAt: new Date().toISOString() };

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = updatedTask;

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
    return newComment;
  } catch (error)
{
    console.error('Error adding comment to task:', error);
    throw error;
  }
};


// Helper to get current authenticated user's profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (user) {
    return getUserProfile(user.uid);
  }
  return null;
};

// Helper for deleting field, used in removeUserFromProject for memberRoles
import { deleteField } from 'firebase/firestore';
