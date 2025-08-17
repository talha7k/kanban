import { useState } from 'react';
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskId, ColumnId, Project } from '@/lib/types';
import { moveTaskInProject } from '@/lib/firebaseTask';
import { useToast } from '@/hooks/use-toast';

interface UseDragAndDropProps {
  projectData: Project;
  setProjectData: React.Dispatch<React.SetStateAction<Project>>;
  canManageTasks: boolean;
  currentUser: any;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export function useDragAndDrop({
  projectData,
  setProjectData,
  canManageTasks,
  currentUser,
  isSubmitting,
  setIsSubmitting,
}: UseDragAndDropProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<TaskId | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Configure sensors for touch and pointer events
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isSubmitting) return;
    const taskId = event.active.id as TaskId;
    const task = event.active.data.current?.task || projectData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const canDrag = canManageTasks || task.assigneeUids?.includes(currentUser?.uid || '');
    if (!canDrag) {
      toast({ 
        variant: "destructive", 
        title: "Permission Denied", 
        description: "You can only move tasks you are assigned to, or if you are a manager/owner."
      });
      return;
    }
    setDraggedTaskId(taskId);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This provides visual feedback during drag operations
    // The actual logic is handled in handleDragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTaskId(null);
    setActiveTask(null);
    
    if (!over || isSubmitting) return;
    
    const activeId = active.id as TaskId;
    const overId = over.id as string;
    
    if (!activeId || !projectData || !currentUser) return;

    const activeTask = projectData.tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const canMoveThisTask = canManageTasks || activeTask.assigneeUids?.includes(currentUser.uid);
    if (!canMoveThisTask) {
      toast({ 
        variant: "destructive", 
        title: "Permission Denied", 
        description: "You can only move tasks you are assigned to, or if you are a manager/owner."
      });
      return;
    }

    // Check if we're dropping on a task (for reordering within column) or a column
    const overTask = projectData.tasks.find(t => t.id === overId);
    const overColumn = projectData.columns.find(c => c.id === overId);
    
    let targetColumnId: ColumnId;
    let newOrder: number;
    
    if (overTask) {
      // Dropping on another task - reorder within the same column or move to that task's column
      targetColumnId = overTask.columnId;
      const tasksInTargetColumn = projectData.tasks
        .filter(t => t.columnId === targetColumnId && t.id !== activeId)
        .sort((a, b) => a.order - b.order);
      
      const overTaskIndex = tasksInTargetColumn.findIndex(t => t.id === overId);
      newOrder = overTaskIndex >= 0 ? overTaskIndex : tasksInTargetColumn.length;
    } else if (overColumn) {
      // Dropping on a column - place at the end
      targetColumnId = overColumn.id;
      newOrder = projectData.tasks.filter(t => t.columnId === targetColumnId && t.id !== activeId).length;
    } else {
      return;
    }

    // If same position, no change needed
    if (activeTask.columnId === targetColumnId) {
      const currentTasksInColumn = projectData.tasks
        .filter(t => t.columnId === targetColumnId && t.id !== activeId)
        .sort((a, b) => a.order - b.order);
      
      if (activeTask.order === newOrder || 
          (newOrder === currentTasksInColumn.length && activeTask.order === currentTasksInColumn.length)) {
        return;
      }
    }

    const originalTasks = [...projectData.tasks];
    
    // Update task orders optimistically
    let updatedTasks = [...projectData.tasks];
    
    if (activeTask.columnId === targetColumnId) {
      // Reordering within the same column
      const tasksInColumn = updatedTasks
        .filter(t => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order);
      
      const reorderedTasks = arrayMove(tasksInColumn, 
        tasksInColumn.findIndex(t => t.id === activeId),
        newOrder
      );
      
      // Update orders
      reorderedTasks.forEach((task, index) => {
        const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
        if (taskIndex >= 0) {
          updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], order: index, updatedAt: new Date().toISOString() };
        }
      });
    } else {
      // Moving between columns
      updatedTasks = updatedTasks.map(task => {
        if (task.id === activeId) {
          return { ...task, columnId: targetColumnId, order: newOrder, updatedAt: new Date().toISOString() };
        }
        // Adjust orders in target column
        if (task.columnId === targetColumnId && task.order >= newOrder) {
          return { ...task, order: task.order + 1, updatedAt: new Date().toISOString() };
        }
        return task;
      });
    }
    
    setProjectData(prev => ({ ...prev!, tasks: updatedTasks }));
    setIsSubmitting(true);

    try {
      await moveTaskInProject(projectData.id, activeId, targetColumnId, newOrder);
      toast({ title: "Task Moved", description: `"${activeTask.title}" moved.` });
    } catch (error) {
      console.error("Error moving task:", error);
      toast({ 
        variant: "destructive", 
        title: "Error Moving Task", 
        description: error instanceof Error ? error.message : "Could not move task." 
      });
      setProjectData(prev => ({ ...prev!, tasks: originalTasks })); // Rollback optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    sensors,
    draggedTaskId,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}