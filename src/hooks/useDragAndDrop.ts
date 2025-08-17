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
    // This provides visual feedback during drag operations
    // The actual logic is handled in handleDragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTaskId(null);
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id as TaskId;
    const overId = over.id as string;
    
    if (!activeId || activeId === overId) return;

    // Simple implementation - just log for now
    // The actual drag and drop logic should be implemented in the parent component
    console.log('Drag ended:', { activeId, overId });
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