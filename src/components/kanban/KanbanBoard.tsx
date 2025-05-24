
"use client";

import type { Project, Column, Task, UserProfile, ColumnId, TaskId, NewTaskData, NewCommentData } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useState, useEffect } from 'react';
import type { TaskFormData } from './TaskFormFields';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  addTaskToProject, 
  updateTaskInProject, 
  deleteTaskFromProject, 
  moveTaskInProject,
  addCommentToTask
} from '@/lib/firebaseService';
import { useAuth } from '@/hooks/useAuth';


interface KanbanBoardProps {
  project: Project; 
  users: UserProfile[]; 
}

export function KanbanBoard({ project: initialProject, users }: KanbanBoardProps) {
  const [projectData, setProjectData] = useState<Project>(initialProject);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isTaskDetailsDialogOpen, setIsTaskDetailsDialogOpen] = useState(false);
  const [selectedColumnIdForNewTask, setSelectedColumnIdForNewTask] = useState<ColumnId | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<TaskId | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<TaskId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const { userProfile } = useAuth(); 
  const { toast } = useToast();

  useEffect(() => {
    setProjectData(initialProject);
  }, [initialProject]);

  if (!projectData || !users) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading project board...
      </div>
    );
  }
  
  const allTasksForDependencies = projectData.tasks.map(t => ({ id: t.id, title: t.title }));

  const handleAddTask = async (taskData: TaskFormData, columnId: string) => {
    setIsSubmitting(true);
    // reporterId is optional, so we don't need to hard block if userProfile is null,
    // but we should still warn the user.
    if (!userProfile) {
        toast({ variant: "destructive", title: "User Profile Warning", description: "User profile not fully loaded. Task will be created without a reporter." });
    }
    const newTaskPayload: NewTaskData = {
      ...taskData,
      reporterId: userProfile ? userProfile.id : undefined, 
    };
    try {
      const newTask = await addTaskToProject(projectData.id, newTaskPayload, columnId);
      setProjectData(prevProject => ({
        ...prevProject!,
        tasks: [...prevProject!.tasks, newTask],
      }));
      toast({ title: "Task Added", description: `"${newTask.title}" has been added.` });
      setIsAddTaskDialogOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ variant: "destructive", title: "Error Adding Task", description: error instanceof Error ? error.message : "Could not add task." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (taskId: string, taskData: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const updatePayload: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>> = {
        ...taskData,
      };

      const updatedTask = await updateTaskInProject(projectData.id, taskId, updatePayload);
      setProjectData(prevProject => ({
        ...prevProject!,
        tasks: prevProject!.tasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
      }));
      toast({ title: "Task Updated", description: `"${updatedTask.title}" has been updated.` });
      setIsEditTaskDialogOpen(false);
      setTaskToEdit(null);
      if (taskToView?.id === taskId) setTaskToView(updatedTask); 
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ variant: "destructive", title: "Error Updating Task", description: error instanceof Error ? error.message : "Could not update task." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (taskId: TaskId) => {
    setTaskToDeleteId(taskId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDeleteId) return;
    setIsSubmitting(true);
    try {
      const task = projectData.tasks.find(t => t.id === taskToDeleteId);
      await deleteTaskFromProject(projectData.id, taskToDeleteId);
      setProjectData(prevProject => ({
        ...prevProject!,
        tasks: prevProject!.tasks.filter(t => t.id !== taskToDeleteId),
      }));
      if (task) toast({ title: "Task Deleted", description: `"${task.title}" has been deleted.`, variant: "default" });
      if (taskToView?.id === taskToDeleteId) setIsTaskDetailsDialogOpen(false); 
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ variant: "destructive", title: "Error Deleting Task", description: error instanceof Error ? error.message : "Could not delete task." });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setTaskToDeleteId(null);
    }
  };

  const handleAddComment = async (taskId: string, commentText: string) => {
     if (!userProfile) { // This guard is important for comments
        toast({ variant: "destructive", title: "User Profile Error", description: "User profile not available. Cannot add comment." });
        return;
    }
    setIsSubmitting(true); 
    const newCommentPayload: NewCommentData = {
      userId: userProfile.id,
      userName: userProfile.name || userProfile.email || 'Anonymous',
      avatarUrl: userProfile.avatarUrl,
      content: commentText,
    };
    try {
      const newComment = await addCommentToTask(projectData.id, taskId, newCommentPayload);
      setProjectData(prevProject => {
        const updatedTasks = prevProject!.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, comments: [...(task.comments || []), newComment] };
          }
          return task;
        });
        
        if (taskToView?.id === taskId) {
            const updatedTaskForView = updatedTasks.find(t => t.id === taskId);
            if(updatedTaskForView) setTaskToView(updatedTaskForView);
        }
        return { ...prevProject!, tasks: updatedTasks };
      });
      toast({ title: "Comment Added" });
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ variant: "destructive", title: "Error Adding Comment", description: error instanceof Error ? error.message : "Could not add comment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: TaskId) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: ColumnId) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    if (!sourceTaskId || !projectData) return;

    const taskBeingMoved = projectData.tasks.find(t => t.id === sourceTaskId);
    if (!taskBeingMoved || taskBeingMoved.columnId === targetColumnId) { // Prevent drop in same column for now
        setDraggedTaskId(null);
        return;
    }
    
    const targetColumnTasks = projectData.tasks.filter(t => t.columnId === targetColumnId && t.id !== sourceTaskId);
    const newOrder = targetColumnTasks.length; 

    const prevProjectData = {...projectData}; 
    
    // Optimistic UI update
    setProjectData(currentProjectData => {
        if (!currentProjectData) return currentProjectData;
        let movedTask: Task | undefined;
        const updatedTasksOptimistic = currentProjectData.tasks.map(task => {
            if (task.id === sourceTaskId) {
                movedTask = { ...task, columnId: targetColumnId, order: newOrder, updatedAt: new Date().toISOString() };
                return movedTask;
            }
            return task;
        }).filter(Boolean) as Task[]; // filter(Boolean) to remove undefined if any issue, and assert type

        // Further re-order tasks within source and target columns optimistically for smoother UI
        // This can be complex, for now, the main update is the columnId and order of the moved task.
        // A more robust solution would involve sorting tasks in both affected columns by their 'order' property.
        return { ...currentProjectData, tasks: updatedTasksOptimistic };
    });


    setIsSubmitting(true);
    try {
      await moveTaskInProject(projectData.id, sourceTaskId, targetColumnId, newOrder);
      // Fetch the updated project to ensure local state is in sync with Firestore after move
      const latestProjectData = await initialProject.id // Assuming initialProject always has an ID
                                ? (await import('@/lib/firebaseService')).getProjectById(initialProject.id)
                                : null;
      if (latestProjectData) {
        setProjectData(latestProjectData);
      }
      toast({ title: "Task Moved", description: `"${taskBeingMoved.title}" moved.` });
    } catch (error) {
      console.error("Error moving task:", error);
      toast({ variant: "destructive", title: "Error Moving Task", description: error instanceof Error ? error.message : "Could not move task." });
      setProjectData(prevProjectData); 
    } finally {
      setIsSubmitting(false);
      setDraggedTaskId(null);
    }
  };


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-var(--header-height,56px)-2rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">{projectData.name}</h1>
        <Button 
            onClick={() => { 
                setSelectedColumnIdForNewTask(projectData.columns[0]?.id || null); 
                setIsAddTaskDialogOpen(true); 
            }} 
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} 
          Add New Task
        </Button>
      </div>
      <div className="flex-1 flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
        {projectData.columns.sort((a,b) => a.order - b.order).map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={projectData.tasks} 
            users={users}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onAddTask={(colId) => { setSelectedColumnIdForNewTask(colId); setIsAddTaskDialogOpen(true); }}
            onEditTask={(taskToEdit) => { setTaskToEdit(taskToEdit); setIsEditTaskDialogOpen(true); }}
            onDeleteTask={openDeleteConfirm}
            onViewTaskDetails={(task) => { setTaskToView(task); setIsTaskDetailsDialogOpen(true); }}
            isSubmitting={isSubmitting} 
          />
        ))}
      </div>

      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        onAddTask={handleAddTask}
        columnId={selectedColumnIdForNewTask}
        users={users}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />
      <EditTaskDialog
        isOpen={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
        onEditTask={handleEditTask}
        taskToEdit={taskToEdit}
        users={users}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />
      <TaskDetailsDialog
        isOpen={isTaskDetailsDialogOpen}
        onOpenChange={setIsTaskDetailsDialogOpen}
        task={taskToView}
        users={users}
        onAddComment={handleAddComment}
        onEditTask={(task) => { setIsTaskDetailsDialogOpen(false); setTaskToEdit(task); setIsEditTaskDialogOpen(true); }}
        onDeleteTask={openDeleteConfirm}
        isSubmittingComment={isSubmitting} 
      />
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{projectData.tasks.find(t => t.id === taskToDeleteId)?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDeleteId(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
