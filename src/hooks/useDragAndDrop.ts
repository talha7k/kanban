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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskId } from '@/lib/types';

export function useDragAndDrop(
  tasks: Task[],
  setTasks: (tasks: Task[]) => void,
  currentUserId: string
) {
  const [draggedTaskId, setDraggedTaskId] = useState<TaskId | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
    const taskId = event.active.id as TaskId;
    const task = event.active.data.current?.task || tasks.find(t => t.id === taskId);
    if (!task) return;

    setDraggedTaskId(taskId);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as TaskId;
    const overId = over.id as string;
    
    // Find the active task
    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Check if we're hovering over a different column
    const isOverColumn = tasks.every(task => task.id !== overId);
    const overTask = tasks.find(task => task.id === overId);
    
    if (isOverColumn) {
      // Hovering over a column - show preview in that column
      const targetColumnId = overId;
      if (activeTask.columnId !== targetColumnId) {
        // Provide visual feedback for cross-column movement
        // This will be handled by the DragOverlay in the parent component
      }
    } else if (overTask && activeTask.columnId !== overTask.columnId) {
      // Hovering over a task in a different column
      // Provide visual feedback for cross-column movement
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTaskId(null);
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id as TaskId;
    const overId = over.id as string;
    
    if (!activeId || activeId === overId) return;

    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Check if we're dropping on a column or another task
    const isDroppedOnColumn = tasks.every(task => task.id !== overId);
    
    if (isDroppedOnColumn) {
      // Dropped on a column - move to that column
      const newColumnId = overId;
      if (activeTask.columnId !== newColumnId) {
        const updatedTasks = tasks.map(task => {
          if (task.id === activeId) {
            return { ...task, columnId: newColumnId };
          }
          return task;
        });
        setTasks(updatedTasks);
      }
    } else {
      // Dropped on another task - reorder within column or move to different column
      const overTask = tasks.find(task => task.id === overId);
      if (!overTask) return;

      if (activeTask.columnId === overTask.columnId) {
        // Reordering within the same column
        const columnTasks = tasks
          .filter(task => task.columnId === activeTask.columnId)
          .sort((a, b) => a.order - b.order);
        
        const activeIndex = columnTasks.findIndex(task => task.id === activeId);
        const overIndex = columnTasks.findIndex(task => task.id === overId);
        
        if (activeIndex !== overIndex) {
          const reorderedTasks = [...columnTasks];
          const [movedTask] = reorderedTasks.splice(activeIndex, 1);
          reorderedTasks.splice(overIndex, 0, movedTask);
          
          // Update order values
          const updatedColumnTasks = reorderedTasks.map((task, index) => ({
            ...task,
            order: index
          }));
          
          const updatedTasks = tasks.map(task => {
            const updatedTask = updatedColumnTasks.find(ct => ct.id === task.id);
            return updatedTask || task;
          });
          
          setTasks(updatedTasks);
        }
      } else {
        // Moving to a different column
        const targetColumnTasks = tasks
          .filter(task => task.columnId === overTask.columnId)
          .sort((a, b) => a.order - b.order);
        
        const overIndex = targetColumnTasks.findIndex(task => task.id === overId);
        
        const updatedTasks = tasks.map(task => {
          if (task.id === activeId) {
            return {
              ...task,
              columnId: overTask.columnId,
              order: overIndex
            };
          }
          // Update order for tasks in the target column that come after the drop position
          if (task.columnId === overTask.columnId && task.order >= overIndex) {
            return {
              ...task,
              order: task.order + 1
            };
          }
          return task;
        });
        
        setTasks(updatedTasks);
      }
    }
  };

  return {
    sensors,
    activeId: draggedTaskId,
    activeTask,
    dragHandlers: {
      handleDragStart,
      handleDragOver,
      handleDragEnd,
    },
  };
}