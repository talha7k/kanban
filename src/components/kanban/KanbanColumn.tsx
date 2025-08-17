
"use client";

import type { Column, Task, UserProfile } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  users: UserProfile[];
  projectColumns: Column[]; 
  canManageTasks: boolean; 
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetails: (task: Task) => void;
  onMoveToNextColumn: (task: Task) => void;
  onMoveToPreviousColumn: (task: Task) => void; 
  isSubmitting?: boolean;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
}

export function KanbanColumn({
  column,
  tasks,
  users,
  projectColumns,
  canManageTasks, 
  onAddTask,
  onEditTask,
  onDeleteTask,
  onViewTaskDetails,
  onMoveToNextColumn,
  onMoveToPreviousColumn, 
  isSubmitting,
  onUpdateTask,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  const columnTasks = tasks
    .filter(task => task.columnId === column.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      className="w-full md:w-auto lg:w-80 xl:w-96 lg:flex-shrink-0 bg-muted/50 p-3 rounded-lg shadow-sm h-full flex flex-col"
      aria-labelledby={`column-title-${column.id}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id={`column-title-${column.id}`} className="text-lg font-semibold text-foreground">{column.title}</h2>
        <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">{columnTasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-[200px]">
        <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {columnTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              projectColumns={projectColumns}
              canManageTask={canManageTasks}

              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onViewDetails={onViewTaskDetails}
              onMoveToNextColumn={onMoveToNextColumn}
              onMoveToPreviousColumn={onMoveToPreviousColumn} 
              isSubmitting={isSubmitting}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </SortableContext>
        {columnTasks.length === 0 && (
           <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed border-border rounded-md">
            Drag tasks here or click &quot;Add Task&quot;
          </div>
        )}
      </div>
      {canManageTasks && (
        <Button
            variant="ghost"
            className="w-full mt-3 text-muted-foreground hover:text-foreground justify-start"
            onClick={() => onAddTask(column.id)}
            disabled={isSubmitting}
        >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Add Task
        </Button>
      )}
    </div>
  );
}

    
