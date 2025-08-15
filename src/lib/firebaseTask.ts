import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Task, NewTaskData, ColumnId, ProjectDocument, Comment, NewCommentData, TaskId } from './types';
import { v4 as uuidv4 } from 'uuid';

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
      description: taskData.description === undefined || taskData.description === '' ? null : taskData.description,
      priority: taskData.priority,
      assigneeUids: taskData.assigneeUids === undefined ? [] : taskData.assigneeUids,
      reporterId: taskData.reporterId === undefined ? null : taskData.reporterId,
      dueDate: taskData.dueDate === undefined  || taskData.dueDate === '' ? null : taskData.dueDate,
      tags: taskData.tags === undefined ? [] : taskData.tags,
      dependentTaskTitles: taskData.dependentTaskTitles === undefined ? [] : taskData.dependentTaskTitles,
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
            const value = taskUpdateData[typedKey];
            if (value !== undefined) {
                (updatePayload as any)[typedKey] = value;
            }
        }
    }
    
    // Explicitly handle array fields to ensure they are empty arrays if undefined, not null
    updatePayload.assigneeUids = taskUpdateData.assigneeUids === null ? [] : (taskUpdateData.assigneeUids ?? existingTask.assigneeUids ?? []);
    updatePayload.tags = taskUpdateData.tags === null ? [] : (taskUpdateData.tags ?? existingTask.tags ?? []);
    updatePayload.dependentTaskTitles = taskUpdateData.dependentTaskTitles === null ? [] : (taskUpdateData.dependentTaskTitles ?? existingTask.dependentTaskTitles ?? []);
    updatePayload.comments = taskUpdateData.comments === null ? [] : (taskUpdateData.comments ?? existingTask.comments ?? []);
    
    // Ensure optional string fields that might be empty string are set to null instead
    if (updatePayload.description === '') updatePayload.description = null;
    if (updatePayload.dueDate === '') updatePayload.dueDate = null;
    if (updatePayload.reporterId === '') updatePayload.reporterId = null;


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
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);

    await updateDoc(projectRef, {
      tasks: updatedTasks, 
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

    const project = projectDoc.data() as ProjectDocument;
    const taskToMoveIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskToMoveIndex === -1) throw new Error('Task not found');

    const taskToMove = project.tasks[taskToMoveIndex];

    // Remove task from its current position
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);

    // Adjust order for tasks in the old column that were after the moved task
    updatedTasks.filter(t => t.columnId === taskToMove.columnId && t.order > taskToMove.order)
      .forEach(t => t.order--);

    // Update the moved task's column and order
    taskToMove.columnId = newColumnId;
    taskToMove.order = newOrder;

    // Adjust order for tasks in the new column to make space for the moved task
    updatedTasks.filter(t => t.columnId === newColumnId && t.order >= newOrder)
      .forEach(t => t.order++);

    // Insert the moved task into its new position
    updatedTasks.push(taskToMove);

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error moving task in project:', error);
    throw error;
  }
};

export const addCommentToTask = async (projectId: string, taskId: TaskId, commentData: NewCommentData): Promise<Comment> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to add comments.");
  }

  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const newComment: Comment = {
      id: uuidv4(),
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      avatarUrl: currentUser.photoURL || undefined,
      content: commentData.content,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      comments: [...(updatedTasks[taskIndex].comments || []), newComment],
      updatedAt: new Date().toISOString(),
    };

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

export const updateCommentInTask = async (projectId: string, taskId: TaskId, commentId: string, newContent: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to update comments.");
  }

  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const task = project.tasks[taskIndex];
    if (!task) throw new Error('Task not found in project tasks array');

    const commentIndex = (task.comments || []).findIndex(c => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const existingComment = (task.comments || [])[commentIndex];
    if (existingComment.userId !== currentUser.uid) {
      throw new Error("Only the comment author can update their comment.");
    }

    const updatedComment = {
      ...existingComment,
      content: newContent,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      comments: [
        ...(updatedTasks[taskIndex].comments || []).slice(0, commentIndex),
        updatedComment,
        ...(updatedTasks[taskIndex].comments || []).slice(commentIndex + 1),
      ],
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating comment in task:', error);
    throw error;
  }
};

export const deleteCommentFromTask = async (projectId: string, taskId: TaskId, commentId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to delete comments.");
  }

  const projectRef = doc(db, 'projects', projectId);
  try {
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');

    const project = projectDoc.data() as ProjectDocument;
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const task = project.tasks[taskIndex];
    if (!task) throw new Error('Task not found in project tasks array');

    const commentIndex = (task.comments || []).findIndex(c => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const existingComment = (task.comments || [])[commentIndex];
    if (existingComment.userId !== currentUser.uid) {
      throw new Error("Only the comment author can delete their comment.");
    }

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      comments: (task.comments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, {
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting comment from task:', error);
    throw error;
  }
};