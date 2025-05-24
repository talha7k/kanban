
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
import { auth } from './firebase'; // Assuming auth is exported from firebase.ts
import type { UserProfile, Project, NewProjectData, Task, Column, Comment, NewTaskData, NewCommentData, ProjectDocument, UserDocument, TaskId, ColumnId } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs

const db = getFirestore();

// User Profile Functions
export const createUserProfileDocument = async (userAuth: FirebaseUser, additionalData?: Partial<UserProfile>) => {
  if (!userAuth) return;
  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = userAuth;
    const createdAt = new Date().toISOString();
    try {
      const newUserProfile: UserProfile = {
        id: userAuth.uid,
        name: displayName || email?.split('@')[0] || 'New User',
        email: email || '',
        avatarUrl: photoURL || `https://placehold.co/40x40.png?text=${(displayName || email || 'U').substring(0,1).toUpperCase()}`,
        createdAt,
        ...additionalData,
      };
      // Firestore expects plain objects, so we remove 'id' before setting, as ID is the doc key
      const { id, ...profileToSave } = newUserProfile;
      await setDoc(userRef, profileToSave);
      return newUserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
  const existingData = snapshot.data() as UserDocument;
  return { id: snapshot.id, ...existingData } as UserProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userRef = doc(db, `users/${userId}`);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as UserProfile;
  }
  return null;
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    console.error('Error fetching all user profiles:', error);
    throw error;
  }
};


// Project Functions
export const createProject = async (projectData: NewProjectData, ownerId: string): Promise<Project> => {
  if (!ownerId) throw new Error("Owner ID is required to create a project.");
  try {
    const newProjectId = uuidv4();
    const defaultColumns: Column[] = [
      { id: `col-${newProjectId}-1`, title: 'To Do', order: 0 },
      { id: `col-${newProjectId}-2`, title: 'In Progress', order: 1 },
      { id: `col-${newProjectId}-3`, title: 'Done', order: 2 },
    ];
    const newProject: Omit<Project, 'id'> = {
      ...projectData,
      ownerId,
      columns: defaultColumns,
      tasks: [],
      memberIds: [ownerId], // Owner is a member by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'projects', newProjectId), newProject);
    return { ...newProject, id: newProjectId };
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
    // Fetch projects where user is owner OR is in memberIds array
    // Firestore doesn't support OR queries directly on different fields in this way.
    // So, we fetch projects owned by user and projects where user is a member, then combine.

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


// Task Functions (Tasks stored as an array in the Project document)

export const addTaskToProject = async (projectId: string, taskData: NewTaskData, columnId: ColumnId): Promise<Task> => {
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    
    const project = projectDoc.data() as ProjectDocument;
    const newTaskId = uuidv4();
    const newTask: Task = {
      ...taskData,
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
    console.error('Error adding task to project:', error);
    throw error;
  }
};

export const updateTaskInProject = async (projectId: string, taskId: string, taskUpdateData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>): Promise<Task> => {
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const updatedTask: Task = {
      ...project.tasks[taskIndex],
      ...taskUpdateData,
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
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskToDelete = project.tasks.find(t => t.id === taskId);
    if (!taskToDelete) throw new Error('Task not found for deletion');

    // Firestore's arrayRemove requires the exact object to remove.
    // For simplicity if object references are tricky, fetching and then filtering might be safer.
    // However, if taskToDelete is exactly what's in Firestore, arrayRemove works.
    // A more robust way if object has changed slightly is to filter:
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);

    await updateDoc(projectRef, {
      tasks: updatedTasks, // or arrayRemove(taskToDelete) if confident about object equality
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting task from project:', error);
    throw error;
  }
};

export const moveTaskInProject = async (projectId: string, taskId: string, newColumnId: ColumnId, newOrder: number): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const taskToMove = { ...project.tasks[taskIndex] };
    taskToMove.columnId = newColumnId;
    taskToMove.order = newOrder;
    taskToMove.updatedAt = new Date().toISOString();
    
    const updatedTasks = project.tasks.map(t => t.id === taskId ? taskToMove : t);
    
    // Potentially re-order other tasks in the affected columns if needed.
    // For now, we assume client sends the correct `newOrder` for the moved task,
    // and other tasks' orders are managed visually on client or by subsequent server logic.
    // A more robust solution would re-calculate orders for tasks in targetColumnId and sourceColumnId.

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
  } catch (error) {
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
