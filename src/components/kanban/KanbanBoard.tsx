
"use client";

import type { Project, Column, Task, UserProfile, ColumnId, TaskId, NewTaskData, NewCommentData, UserProjectRole } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useState, useEffect, useMemo } from 'react';
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
  addCommentToTask,
  getProjectById // For re-fetching project data
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

  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setProjectData(initialProject);
  }, [initialProject]);

  const isOwner = useMemo(() => currentUser?.uid === projectData.ownerId, [currentUser, projectData.ownerId]);
  const currentUserProjectRole = useMemo((): UserProjectRole | null => {
    if (!currentUser || !projectData.memberRoles) return null;
    return projectData.memberRoles[currentUser.uid] || null;
  }, [currentUser, projectData.memberRoles]);

  const canManageTasks = useMemo(() => isOwner || currentUserProjectRole === 'manager', [isOwner, currentUserProjectRole]);

  const assignableUsers = useMemo(() => {
    if (!projectData || !users) return [];
    const projectMemberAndOwnerIds = new Set<string>([
      projectData.ownerId,
      ...(projectData.memberIds || [])
    ]);
    return users.filter(user => projectMemberAndOwnerIds.has(user.id));
  }, [projectData, users]);


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
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User must be authenticated to add tasks." });
      setIsSubmitting(false);
      return;
    }
    if (!userProfile) {
        toast({ variant: "default", title: "User Profile Warning", description: "User profile not fully loaded. Task will be created without a reporter if you proceed." });
        // Continue, reporterId is optional
    }

    const newTaskPayload: NewTaskData = {
      ...taskData,
      reporterId: userProfile ? userProfile.id : undefined,
    };

    console.log("Attempting to add task with payload:", newTaskPayload);

    try {
      const newTask = await addTaskToProject(projectData.id, newTaskPayload, columnId);
      setProjectData(prevProject => {
        if (!prevProject) return prevProject;
        return {
          ...prevProject,
          tasks: [...prevProject.tasks, newTask],
        };
      });
      toast({ title: "Task Added", description: `"${newTask.title}" has been added.` });
      setIsAddTaskDialogOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Error adding task:", error, "Payload:", newTaskPayload);
      toast({ variant: "destructive", title: "Error Adding Task", description: error instanceof Error ? error.message : "Could not add task." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (taskId: string, taskData: TaskFormData) => {
    if (!canManageTasks) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to edit tasks." });
      return;
    }
    setIsSubmitting(true);
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User must be authenticated to edit tasks." });
      setIsSubmitting(false);
      return;
    }
    try {
      const updatePayload: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>> = {
        ...taskData,
      };

      const updatedTask = await updateTaskInProject(projectData.id, taskId, updatePayload);
      setProjectData(prevProject => {
        if (!prevProject) return prevProject;
        return {
          ...prevProject,
          tasks: prevProject.tasks.map(task =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          ),
        };
      });
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
    if (!canManageTasks) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete tasks." });
      return;
    }
    setTaskToDeleteId(taskId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDeleteId) return;

    if (!canManageTasks) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete tasks." });
      setShowDeleteConfirm(false);
      setTaskToDeleteId(null);
      return;
    }
    setIsSubmitting(true);
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User must be authenticated to delete tasks." });
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      return;
    }
    try {
      const task = projectData.tasks.find(t => t.id === taskToDeleteId);
      await deleteTaskFromProject(projectData.id, taskToDeleteId);
      setProjectData(prevProject => {
        if (!prevProject) return prevProject;
        return {
        ...prevProject,
        tasks: prevProject.tasks.filter(t => t.id !== taskToDeleteId),
        }
      });
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
     if (!currentUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "User must be authenticated to add comments." });
        return;
    }
    if (!userProfile) {
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
        if (!prevProject) return prevProject;
        const updatedTasks = prevProject.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, comments: [...(task.comments || []), newComment] };
          }
          return task;
        });

        if (taskToView?.id === taskId) {
            const updatedTaskForView = updatedTasks.find(t => t.id === taskId);
            if(updatedTaskForView) setTaskToView(updatedTaskForView);
        }
        return { ...prevProject, tasks: updatedTasks };
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
    if (isSubmitting) return;
    const task = projectData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const canDrag = canManageTasks || task.assigneeUids?.includes(currentUser?.uid || '');
    if (!canDrag) {
        e.preventDefault();
        toast({ variant: "destructive", title: "Permission Denied", description: "You can only move tasks you are assigned to, or if you are a manager/owner."});
        return;
    }
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
    if (isSubmitting) {
        setDraggedTaskId(null);
        return;
    }
    const sourceTaskId = e.dataTransfer.getData("taskId");
    if (!sourceTaskId || !projectData || !currentUser) return;

    const taskBeingMoved = projectData.tasks.find(t => t.id === sourceTaskId);
    if (!taskBeingMoved || taskBeingMoved.columnId === targetColumnId) {
        setDraggedTaskId(null);
        return;
    }

    const canMoveThisTask = canManageTasks || taskBeingMoved.assigneeUids?.includes(currentUser.uid);
    if (!canMoveThisTask) {
        toast({ variant: "destructive", title: "Permission Denied", description: "You can only move tasks you are assigned to, or if you are a manager/owner."});
        setDraggedTaskId(null);
        return;
    }

    const originalTasks = [...projectData.tasks];
    let movedTaskOrder = 0;

    const updatedTasksOptimistic = projectData.tasks.map(task => {
        if (task.id === sourceTaskId) {
            movedTaskOrder = projectData.tasks.filter(t => t.columnId === targetColumnId && t.id !== sourceTaskId).length;
            return { ...task, columnId: targetColumnId, order: movedTaskOrder, updatedAt: new Date().toISOString() };
        }
        return task;
    });

    updatedTasksOptimistic.sort((a, b) => {
        if (a.columnId === b.columnId) {
            return a.order - b.order;
        }
        const columnAOrder = projectData.columns.find(c => c.id === a.columnId)?.order ?? 0;
        const columnBOrder = projectData.columns.find(c => c.id === b.columnId)?.order ?? 0;
        return columnAOrder - columnBOrder;
    });


    setProjectData(prev => ({ ...prev!, tasks: updatedTasksOptimistic }));
    setDraggedTaskId(null);
    setIsSubmitting(true);

    try {
      await moveTaskInProject(projectData.id, sourceTaskId, targetColumnId, movedTaskOrder);
      toast({ title: "Task Moved", description: `"${taskBeingMoved.title}" moved.` });
    } catch (error) {
      console.error("Error moving task:", error);
      toast({ variant: "destructive", title: "Error Moving Task", description: error instanceof Error ? error.message : "Could not move task." });
      setProjectData(prev => ({ ...prev!, tasks: originalTasks }));
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-var(--header-height,56px)-2rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">{projectData.name}</h1>
        <Button
            onClick={() => {
                if (projectData.columns.length === 0) {
                    toast({variant: "destructive", title: "No Columns", description: "Please add a column to the project first."});
                    return;
                }
                setSelectedColumnIdForNewTask(projectData.columns.sort((a,b) => a.order - b.order)[0]?.id || null);
                setIsAddTaskDialogOpen(true);
            }}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmitting || projectData.columns.length === 0}
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
            canManageTasks={canManageTasks} // Pass down the broader permission
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
         {projectData.columns.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">This project has no columns. Please configure columns first.</p>
          </div>
        )}
      </div>

      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onOpenChange={(isOpen) => {
          setIsAddTaskDialogOpen(isOpen);
          if (!isOpen) setSelectedColumnIdForNewTask(null);
        }}
        onAddTask={handleAddTask}
        columnId={selectedColumnIdForNewTask}
        assignableUsers={assignableUsers}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />
      <EditTaskDialog
        isOpen={isEditTaskDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditTaskDialogOpen(isOpen);
          if (!isOpen) setTaskToEdit(null);
        }}
        onEditTask={handleEditTask}
        taskToEdit={taskToEdit}
        assignableUsers={assignableUsers}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />
      <TaskDetailsDialog
        isOpen={isTaskDetailsDialogOpen}
        onOpenChange={(isOpen) => {
          setIsTaskDetailsDialogOpen(isOpen);
          if (!isOpen) setTaskToView(null);
        }}
        task={taskToView}
        users={users}
        canManageTask={canManageTasks}
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
