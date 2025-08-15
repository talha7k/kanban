
"use client";

import type { Column, Task, UserProfile } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  users: UserProfile[];
  projectColumns: Column[]; 
  canManageTasks: boolean; 
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetails: (task: Task) => void;
  onMoveToNextColumn: (task: Task) => void;
  onMoveToPreviousColumn: (task: Task) => void; 
  isSubmitting?: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  users,
  projectColumns,
  canManageTasks, 
  onDragStart,
  onDragOver,
  onDrop,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onViewTaskDetails,
  onMoveToNextColumn,
  onMoveToPreviousColumn, 
  isSubmitting,
}: KanbanColumnProps) {
  const columnTasks = tasks
    .filter(task => task.columnId === column.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className="w-full md:w-auto lg:w-80 xl:w-96 lg:flex-shrink-0 bg-muted/50 p-3 rounded-lg shadow-sm h-full flex flex-col"
      onDragOver={(e) => onDragOver(e, column.id)}
      onDrop={(e) => onDrop(e, column.id)}
      aria-labelledby={`column-title-${column.id}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id={`column-title-${column.id}`} className="text-lg font-semibold text-foreground">{column.title}</h2>
        <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">{columnTasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-[200px]">
        {columnTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            projectColumns={projectColumns}
            canManageTask={canManageTasks}
            onDragStart={onDragStart}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onViewDetails={onViewTaskDetails}
            onMoveToNextColumn={onMoveToNextColumn}
            onMoveToPreviousColumn={onMoveToPreviousColumn} 
            isSubmitting={isSubmitting}
          />
        ))}
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

    
