"use client";

import type { Board, Column, Task, UserProfile, ColumnId, TaskId } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useMockKanbanData } from '@/hooks/use-mock-kanban-data';
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

export function KanbanBoard() {
  const { board: initialBoardData, users } = useMockKanbanData();
  const [boardData, setBoardData] = useState<Board | null>(null);
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
    if (initialBoardData) {
      setBoardData(initialBoardData);
    }
  }, [initialBoardData]);

  if (!boardData || !users) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading board...</div>;
  }
  
  const allTasksForDependencies = boardData.tasks.map(t => ({ id: t.id, title: t.title }));


  const handleAddTask = (taskData: TaskFormData, columnId: string) => {
    setBoardData(prevBoard => {
      if (!prevBoard) return null;
      const newTask: Task = {
        id: `task-${Date.now()}`, // Simple ID generation
        ...taskData,
        columnId,
        order: prevBoard.tasks.filter(t => t.columnId === columnId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
      };
      const updatedTasks = [...prevBoard.tasks, newTask];
      const updatedColumns = prevBoard.columns.map(col =>
        col.id === columnId ? { ...col, taskIds: [...col.taskIds, newTask.id] } : col
      );
      toast({ title: "Task Added", description: `"${newTask.title}" has been added.` });
      return { ...prevBoard, tasks: updatedTasks, columns: updatedColumns };
    });
    setIsAddTaskDialogOpen(false);
  };

  const handleEditTask = (taskId: string, taskData: TaskFormData) => {
     setBoardData(prevBoard => {
      if (!prevBoard) return null;
      const updatedTasks = prevBoard.tasks.map(task =>
        task.id === taskId ? { ...task, ...taskData, updatedAt: new Date().toISOString() } : task
      );
      toast({ title: "Task Updated", description: `"${taskData.title}" has been updated.` });
      return { ...prevBoard, tasks: updatedTasks };
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
    setBoardData(prevBoard => {
      if (!prevBoard) return null;
      const task = prevBoard.tasks.find(t => t.id === taskToDeleteId);
      const updatedTasks = prevBoard.tasks.filter(t => t.id !== taskToDeleteId);
      const updatedColumns = prevBoard.columns.map(col => ({
        ...col,
        taskIds: col.taskIds.filter(id => id !== taskToDeleteId),
      }));
      if(task) toast({ title: "Task Deleted", description: `"${task.title}" has been deleted.`, variant: "destructive" });
      return { ...prevBoard, tasks: updatedTasks, columns: updatedColumns };
    });
    setShowDeleteConfirm(false);
    setTaskToDeleteId(null);
  };

  const handleAddComment = (taskId: string, commentText: string) => {
    setBoardData(prevBoard => {
      if (!prevBoard) return null;
      const updatedTasks = prevBoard.tasks.map(task => {
        if (task.id === taskId) {
          const newComment = {
            id: `comment-${Date.now()}`,
            // In a real app, userId would come from logged-in user
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
      // Update taskToView if it's the one being commented on
      if (taskToView?.id === taskId) {
        const updatedTaskToView = updatedTasks.find(t => t.id === taskId);
        if (updatedTaskToView) setTaskToView(updatedTaskToView);
      }
      return { ...prevBoard, tasks: updatedTasks };
    });
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: TaskId) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: ColumnId) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    if (!sourceTaskId || !boardData) return;

    setBoardData(prevBoard => {
      if (!prevBoard) return null;
      
      const task = prevBoard.tasks.find(t => t.id === sourceTaskId);
      if (!task) return prevBoard;

      const sourceColumnId = task.columnId;

      // If dropped in the same column, reorder (simplified: move to end for now)
      if (sourceColumnId === targetColumnId) {
        const columnTasks = prevBoard.tasks.filter(t => t.columnId === targetColumnId && t.id !== sourceTaskId);
        const reorderedTasksInColumn = [...columnTasks, task].map((t, index) => ({...t, order: index}));
        
        const otherTasks = prevBoard.tasks.filter(t => t.columnId !== targetColumnId);
        const updatedTasks = [...otherTasks, ...reorderedTasksInColumn].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // maintain overall sort for non-column sort

        return { ...prevBoard, tasks: updatedTasks.map(t => t.id === task.id ? {...task, order: reorderedTasksInColumn.find(rt => rt.id === task.id)!.order} : t ) };
      }

      // Move to different column
      const updatedTask = { ...task, columnId: targetColumnId, order: prevBoard.tasks.filter(t => t.columnId === targetColumnId).length };
      
      const newTasks = prevBoard.tasks.map(t => t.id === sourceTaskId ? updatedTask : t);

      // Update task orders in source and target columns
      const finalTasks = newTasks.map(t => {
        if (t.columnId === sourceColumnId) {
          return {...t, order: newTasks.filter(nt => nt.columnId === sourceColumnId && nt.id !== t.id).indexOf(t)}; // This reordering logic might need refinement
        }
        if (t.columnId === targetColumnId) {
           return {...t, order: newTasks.filter(nt => nt.columnId === targetColumnId && nt.id !== t.id).indexOf(t)};
        }
        return t;
      });
      
      const taskMoved = finalTasks.find(t => t.id === sourceTaskId);
      if (taskMoved) toast({ title: "Task Moved", description: `"${taskMoved.title}" moved to new column.` });

      return { ...prevBoard, tasks: finalTasks };
    });
    setDraggedTaskId(null);
  };


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-var(--header-height,56px)-2rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">{boardData.name}</h1>
        <Button onClick={() => { setSelectedColumnIdForNewTask(boardData.columns[0]?.id || null); setIsAddTaskDialogOpen(true); }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add New Task
        </Button>
      </div>
      <div className="flex-1 flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
        {boardData.columns.sort((a,b) => a.order - b.order).map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={boardData.tasks}
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
              "{boardData.tasks.find(t => t.id === taskToDeleteId)?.title}".
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
