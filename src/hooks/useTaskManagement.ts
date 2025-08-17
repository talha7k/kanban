import { useState } from 'react';
import type { Task, TaskId, NewTaskData, NewCommentData } from '@/lib/types';
import type { TaskFormData } from '@/components/kanban/TaskFormFields';
import {
  addTaskToProject,
  updateTaskInProject,
  deleteTaskFromProject,
  addCommentToTask,
} from '@/lib/firebaseTask';
import { useToast } from '@/hooks/use-toast';

export function useTaskManagement(
  tasks: Task[],
  setTasks: (tasks: Task[]) => void,
  projectId: string,
  currentUserId: string
) {
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<TaskId | null>(null);
  const { toast } = useToast();

  const handleAddTask = async (taskData: TaskFormData, columnId: string) => {
    try {
      const newTaskPayload: NewTaskData = {
        ...taskData,
        reporterId: currentUserId,
        order: tasks.filter(task => task.columnId === columnId).length,
        projectId,
        createdAt: new Date().toISOString(),
      };

      const newTask = await addTaskToProject(projectId, newTaskPayload, columnId);
      setTasks([...tasks, newTask]);
      toast({ title: "Task Added", description: `"${newTask.title}" has been added.` });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ variant: "destructive", title: "Error Adding Task", description: error instanceof Error ? error.message : "Could not add task." });
    }
  };

  const handleEditTask = async (taskId: string, taskData: TaskFormData) => {
    try {
      const updatedTask = await updateTaskInProject(projectId, taskId, taskData);
      setTasks(tasks.map(task => task.id === taskId ? { ...task, ...updatedTask } : task));
      toast({ title: "Task Updated", description: `"${updatedTask.title}" has been updated.` });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ variant: "destructive", title: "Error Updating Task", description: error instanceof Error ? error.message : "Could not update task." });
    }
  };

  const handleUpdateTask = async (taskId: string, updatedFields: Partial<Task>) => {
    try {
      const updatedTask = await updateTaskInProject(projectId, taskId, updatedFields);
      setTasks(tasks.map(task => task.id === taskId ? { ...task, ...updatedTask } : task));
      toast({ title: "Task Updated", description: `Task updated.` });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ variant: "destructive", title: "Error Updating Task", description: error instanceof Error ? error.message : "Could not update task." });
    }
  };

  const handleDeleteTask = async (taskId: TaskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await deleteTaskFromProject(projectId, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      if (task) toast({ title: "Task Deleted", description: `"${task.title}" has been deleted.` });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ variant: "destructive", title: "Error Deleting Task", description: error instanceof Error ? error.message : "Could not delete task." });
    }
  };

  const handleAddComment = async (taskId: string, commentData: NewCommentData) => {
    try {
      const newComment = await addCommentToTask(projectId, taskId, commentData);
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, comments: [...(task.comments || []), newComment] };
        }
        return task;
      }));
      toast({ title: "Comment Added" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ variant: "destructive", title: "Error Adding Comment", description: error instanceof Error ? error.message : "Could not add comment." });
    }
  };

  return {
    taskToEdit,
    setTaskToEdit,
    taskToView,
    setTaskToView,
    showDeleteConfirm,
    setShowDeleteConfirm,
    taskToDeleteId,
    setTaskToDeleteId,
    handleAddTask,
    handleEditTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddComment,
  };
}