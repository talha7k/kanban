
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
import type { UserProfile, Project, NewProjectData, Task, Column, Comment, NewTaskData, NewCommentData, ProjectDocument, UserDocument, TaskId, ColumnId, UserId } from './types';
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
        role: 'staff', 
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
    role: existingData.role || 'staff', // Ensure default
    title: existingData.title || 'Team Member', // Ensure default
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
      role: data.role || 'staff', // Ensure default
      title: data.title || 'Team Member', // Ensure default
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
        role: data.role || 'staff', // Ensure default
        title: data.title || 'Team Member', // Ensure default
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
    const ownedQuery = query(collection(db, 'projects'), where('ownerId', '==', userId));
    const memberQuery = query(collection(db, 'projects'), where('memberIds', 'array-contains', userId));

    const [ownedSnapshot, memberSnapshot] = await Promise.all([
      getDocs(ownedQuery),
      getDocs(memberQuery)
    ]);

    const projectsMap = new Map<string, Project>();
    ownedSnapshot.docs.forEach(doc => projectsMap.set(doc.id, { id: doc.id, ...doc.data() } as Project));
    memberSnapshot.docs.forEach(doc => projectsMap.set(doc.id, { id: doc.id, ...doc.data() } as Project));
    
    return Array.from(projectsMap.values());

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
  // Future enhancement: Check if currentUser is owner or admin of the project.

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()){
        throw new Error(`Project with ID ${projectId} not found.`);
    }

    await updateDoc(projectRef, {
      memberIds: arrayUnion(userId),
      updatedAt: new Date().toISOString(),
    });
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
  // Future enhancement: Check if currentUser is owner or admin of the project.
  // Future enhancement: Prevent owner from being removed if they are the only member/owner.

  try {
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()){
        throw new Error(`Project with ID ${projectId} not found.`);
    }
    // Optional: Check if user being removed is the owner, and handle accordingly
    // const projectData = projectSnap.data() as Project;
    // if (projectData.ownerId === userId && projectData.memberIds && projectData.memberIds.length === 1) {
    //   throw new Error("Cannot remove the sole owner of the project.");
    // }

    await updateDoc(projectRef, {
      memberIds: arrayRemove(userId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error removing user ${userId} from project ${projectId}:`, error);
    throw error;
  }
};


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
    
    // Ensure optional fields are not undefined for Firestore
    const newTask: Task = {
      title: taskData.title,
      description: taskData.description ?? null, // Use nullish coalescing for stricter undefined check
      priority: taskData.priority,
      assigneeUids: taskData.assigneeUids ?? [],
      reporterId: taskData.reporterId ?? null,
      dueDate: taskData.dueDate ?? null,
      tags: taskData.tags ?? [],
      dependentTaskTitles: taskData.dependentTaskTitles ?? [],
      // Fields to be set by the system
      id: newTaskId,
      projectId,
      columnId,
      order: project.tasks.filter(t => t.columnId === columnId).length,
      comments: [], // Always initialize comments as an empty array
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
    
    // Create a new object for the update, ensuring optional fields are handled correctly
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
     // Ensure arrays are not set to null if they were previously undefined or empty in taskUpdateData
    if (taskUpdateData.assigneeUids === undefined) updatePayload.assigneeUids = existingTask.assigneeUids ?? []; else updatePayload.assigneeUids = taskUpdateData.assigneeUids ?? [];
    if (taskUpdateData.tags === undefined) updatePayload.tags = existingTask.tags ?? []; else updatePayload.tags = taskUpdateData.tags ?? [];
    if (taskUpdateData.dependentTaskTitles === undefined) updatePayload.dependentTaskTitles = existingTask.dependentTaskTitles ?? []; else updatePayload.dependentTaskTitles = taskUpdateData.dependentTaskTitles ?? [];


    const updatedTask: Task = {
      ...existingTask,
      ...updatePayload, // Apply validated updates
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
    const taskToRemove = project.tasks.find(t => t.id === taskId);
    if (!taskToRemove) throw new Error('Task not found for deletion');
    
    await updateDoc(projectRef, {
      tasks: arrayRemove(taskToRemove), 
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
  if (!currentUser || currentUser.uid !== commentData.userId) { // Ensure comment is by the logged-in user
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
    const updatedComments = [...(task.comments || []), newComment]; // Ensure comments array exists
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

