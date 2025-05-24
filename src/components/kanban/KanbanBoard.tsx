
"use client";

import type { Project, Column, Task, UserProfile, ColumnId, TaskId } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useState, useEffect } from 'react';
import type { TaskFormData } from './TaskFormFields';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

interface KanbanBoardProps {
  project: Project;
  users: UserProfile[];
}

export function KanbanBoard({ project: initialProject, users }: KanbanBoardProps) {
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isTaskDetailsDialogOpen, setIsTaskDetailsDialogOpen] = useState(false);
  const [selectedColumnIdForNewTask, setSelectedColumnIdForNewTask] = useState<ColumnId | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<TaskId | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<TaskId | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (initialProject) {
      // Make a deep copy to avoid mutating the prop directly, if necessary for parent state.
      // For now, simple assignment, assuming parent re-fetches or this component owns display state.
      setProjectData(JSON.parse(JSON.stringify(initialProject)));
    }
  }, [initialProject]);

  if (!projectData || !users) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading project board...</div>;
  }
  
  const allTasksForDependencies = projectData.tasks.map(t => ({ id: t.id, title: t.title }));

  const handleAddTask = (taskData: TaskFormData, columnId: string) => {
    setProjectData(prevProject => {
      if (!prevProject) return null;
      const newTask: Task = {
        id: `task-${Date.now()}`,
        projectId: prevProject.id,
        ...taskData,
        columnId,
        order: prevProject.tasks.filter(t => t.columnId === columnId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
      };
      const updatedTasks = [...prevProject.tasks, newTask];
      // No need to update columns taskIds here as KanbanColumn filters tasks directly
      // If Column.taskIds was strictly managed, it would need update.
      // For mock data, easier to derive tasks per column.
      toast({ title: "Task Added", description: `"${newTask.title}" has been added to ${prevProject.name}.` });
      return { ...prevProject, tasks: updatedTasks };
    });
    setIsAddTaskDialogOpen(false);
  };

  const handleEditTask = (taskId: string, taskData: TaskFormData) => {
     setProjectData(prevProject => {
      if (!prevProject) return null;
      const updatedTasks = prevProject.tasks.map(task =>
        task.id === taskId ? { ...task, ...taskData, updatedAt: new Date().toISOString() } : task
      );
      toast({ title: "Task Updated", description: `"${taskData.title}" has been updated.` });
      return { ...prevProject, tasks: updatedTasks };
    });
    setIsEditTaskDialogOpen(false);
    setTaskToEdit(null);
  };

  const openDeleteConfirm = (taskId: TaskId) => {
    setTaskToDeleteId(taskId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = () => {
    if (!taskToDeleteId) return;
    setProjectData(prevProject => {
      if (!prevProject) return null;
      const task = prevProject.tasks.find(t => t.id === taskToDeleteId);
      const updatedTasks = prevProject.tasks.filter(t => t.id !== taskToDeleteId);
      // If Column.taskIds were managed:
      // const updatedColumns = prevProject.columns.map(col => ({
      //   ...col,
      //   taskIds: col.taskIds.filter(id => id !== taskToDeleteId),
      // }));
      if(task) toast({ title: "Task Deleted", description: `"${task.title}" has been deleted.`, variant: "destructive" });
      return { ...prevProject, tasks: updatedTasks /*, columns: updatedColumns */ };
    });
    setShowDeleteConfirm(false);
    setTaskToDeleteId(null);
  };

  const handleAddComment = (taskId: string, commentText: string) => {
    setProjectData(prevProject => {
      if (!prevProject) return null;
      const updatedTasks = prevProject.tasks.map(task => {
        if (task.id === taskId) {
          const newComment = {
            id: `comment-${Date.now()}`,
            userId: users[0]?.id || 'user-unknown', 
            userName: users[0]?.name || 'Current User',
            avatarUrl: users[0]?.avatarUrl,
            content: commentText,
            createdAt: new Date().toISOString(),
          };
          return { ...task, comments: [...(task.comments || []), newComment] };
        }
        return task;
      });
      if (taskToView?.id === taskId) {
        const updatedTaskToView = updatedTasks.find(t => t.id === taskId);
        if (updatedTaskToView) setTaskToView(updatedTaskToView);
      }
      return { ...prevProject, tasks: updatedTasks };
    });
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

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    if (!sourceTaskId || !projectData) return;

    setProjectData(prevProject => {
      if (!prevProject) return null;
      
      let task = prevProject.tasks.find(t => t.id === sourceTaskId);
      if (!task) return prevProject;

      const sourceColumnId = task.columnId;
      let newTasks = [...prevProject.tasks];

      // Update task's columnId and potentially order
      task = { ...task, columnId: targetColumnId };
      newTasks = newTasks.map(t => t.id === sourceTaskId ? task! : t);
      
      // Reorder tasks in source column (if different)
      if (sourceColumnId !== targetColumnId) {
        const sourceColumnTasks = newTasks
          .filter(t => t.columnId === sourceColumnId)
          .sort((a,b) => a.order - b.order);
        sourceColumnTasks.forEach((t, index) => t.order = index);
      }
      
      // Reorder tasks in target column
      const targetColumnTasks = newTasks
        .filter(t => t.columnId === targetColumnId)
        .sort((a,b) => a.order - b.order); // Sort by existing order first

      // Find dragged task's new position (e.g., drop position or end of list)
      // This is a simplified reorder: place at the end. A more complex solution
      // would involve finding the exact drop index among other cards.
      const draggedTaskInTarget = targetColumnTasks.find(t => t.id === sourceTaskId);
      if (draggedTaskInTarget) {
        const otherTasksInTarget = targetColumnTasks.filter(t => t.id !== sourceTaskId);
        const reorderedTargetTasks = [...otherTasksInTarget, draggedTaskInTarget];
        reorderedTargetTasks.forEach((t, index) => t.order = index);
      }


      // Apply updated orders back to the main tasks list
      const finalTasks = prevProject.tasks.map(originalTask => {
        const updatedInSource = sourceColumnId !== targetColumnId ? newTasks.find(nt => nt.id === originalTask.id && nt.columnId === sourceColumnId) : undefined;
        const updatedInTarget = newTasks.find(nt => nt.id === originalTask.id && nt.columnId === targetColumnId);
        
        if (updatedInTarget) return updatedInTarget;
        if (updatedInSource) return updatedInSource;
        return originalTask;
      });


      const taskMoved = finalTasks.find(t => t.id === sourceTaskId);
      if (taskMoved) toast({ title: "Task Moved", description: `"${taskMoved.title}" moved to new column.` });

      return { ...prevProject, tasks: finalTasks };
    });
    setDraggedTaskId(null);
  };


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-var(--header-height,56px)-2rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">{projectData.name}</h1>
        <Button onClick={() => { setSelectedColumnIdForNewTask(projectData.columns[0]?.id || null); setIsAddTaskDialogOpen(true); }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add New Task
        </Button>
      </div>
      <div className="flex-1 flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
        {projectData.columns.sort((a,b) => a.order - b.order).map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            // Pass only tasks relevant to this project
            tasks={projectData.tasks.filter(task => task.projectId === projectData.id)}
            users={users}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onAddTask={(colId) => { setSelectedColumnIdForNewTask(colId); setIsAddTaskDialogOpen(true); }}
            onEditTask={(taskToEdit) => { setTaskToEdit(taskToEdit); setIsEditTaskDialogOpen(true); }}
            onDeleteTask={openDeleteConfirm}
            onViewTaskDetails={(task) => { setTaskToView(task); setIsTaskDetailsDialogOpen(true); }}
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
      />
      <EditTaskDialog
        isOpen={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
        onEditTask={handleEditTask}
        taskToEdit={taskToEdit}
        users={users}
        allTasksForDependencies={allTasksForDependencies}
      />
      <TaskDetailsDialog
        isOpen={isTaskDetailsDialogOpen}
        onOpenChange={setIsTaskDetailsDialogOpen}
        task={taskToView}
        users={users}
        onAddComment={handleAddComment}
        onEditTask={(task) => { setTaskToEdit(task); setIsEditTaskDialogOpen(true); }}
        onDeleteTask={openDeleteConfirm}
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
            <AlertDialogCancel onClick={() => setTaskToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
