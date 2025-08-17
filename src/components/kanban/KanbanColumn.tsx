
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
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const columnTasks = tasks
    .filter(task => task.columnId === column.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      className={`w-full md:flex-1 md:min-w-0 md:max-w-sm lg:max-w-md xl:max-w-lg bg-muted/50 p-3 rounded-lg shadow-sm h-full flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      aria-labelledby={`column-title-${column.id}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id={`column-title-${column.id}`} className="text-lg font-semibold text-foreground">{column.title}</h2>
        <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">{columnTasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-[200px]">
        <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
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
          </div>
        </SortableContext>
        {columnTasks.length === 0 && (
           <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-border rounded-md">
            Drag tasks here or click &quot;Add Task&quot;
          </div>
        )}
        {/* Additional drop zone at the bottom when column has tasks */}
        {columnTasks.length > 0 && isOver && (
          <div className="mt-2 h-2 bg-primary/20 border-2 border-dashed border-primary rounded-md transition-all duration-200" />
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

    
