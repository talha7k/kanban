
"use client";

import type { Task, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MessageSquare, CalendarDays, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  users: UserProfile[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: Task) => void;
  isSubmitting?: boolean; // To disable buttons during global operations
}

export function TaskCard({ task, users, onDragStart, onEdit, onDelete, onViewDetails, isSubmitting }: TaskCardProps) {
  const assignees = task.assigneeUids?.map(uid => users.find(u => u.id === uid)).filter(Boolean) as UserProfile[] || [];

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card 
      draggable={!isSubmitting} // Prevent dragging during submissions
      onDragStart={(e) => !isSubmitting && onDragStart(e, task.id)}
      className={`mb-3 shadow-md hover:shadow-lg transition-shadow duration-200 bg-card ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
      onClick={() => !isSubmitting && onViewDetails(task)}
      aria-label={`Task: ${task.title}, Priority: ${task.priority}`}
    >
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold leading-tight text-card-foreground">{task.title}</CardTitle>
          {task.priority !== 'NONE' && (
             <Badge variant={getPriorityBadgeVariant(task.priority)} className={task.priority === 'MEDIUM' ? 'bg-accent text-accent-foreground' : ''}>
                {task.priority}
            </Badge>
          )}
        </div>
      </CardHeader>
      {task.description && (
        <CardContent className="px-4 pb-2 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        </CardContent>
      )}
      <CardFooter className="p-4 flex flex-col items-start space-y-3">
        <div className="flex justify-between w-full items-center">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map(assignee => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="profile small" />
                <AvatarFallback>{assignee.name.substring(0,1)}</AvatarFallback>
              </Avatar>
            ))}
            {assignees.length > 3 && (
              <Avatar className="h-6 w-6 border-2 border-card">
                <AvatarFallback>+{assignees.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {task.comments && task.comments.length > 0 && (
              <span className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" /> {task.comments.length}
              </span>
            )}
            {task.dueDate && (
               <span className="flex items-center" title={`Due: ${format(new Date(task.dueDate), 'MMM d, yyyy')}`}>
                <CalendarDays className="h-3 w-3 mr-1" /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-1 w-full justify-end mt-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
            aria-label="Edit task"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
            aria-label="Delete task"
            disabled={isSubmitting}
          >
             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
