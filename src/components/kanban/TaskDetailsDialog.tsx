
"use client";

import type { Task, UserProfile, Comment as CommentType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Tag, Users, MessageSquare, Edit2, Trash2, Info, Loader2, Clock } from 'lucide-react';
import { format, parseISO, isValid, differenceInDays, isToday, isPast } from 'date-fns';
import { CommentItem } from './CommentItem';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AITaskDetailGenerator } from './AITaskDetailGenerator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  users: UserProfile[];
  canManageTask: boolean; 
  onAddComment: (taskId: string, commentText: string) => Promise<void> | void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isSubmittingComment?: boolean;
}

export function TaskDetailsDialog({
  isOpen,
  onOpenChange,
  task,
  users,
  canManageTask, 
  onAddComment,
  onEditTask,
  onDeleteTask,
  isSubmittingComment,
}: TaskDetailsDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<CommentType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (task?.comments) {
      setComments([...task.comments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      setComments([]);
    }
    if (isOpen) {
        setNewComment('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const assignees = task.assigneeUids?.map(uid => users.find(u => u.id === uid)).filter(Boolean) as UserProfile[] || [];
  const reporter = users.find(u => u.id === task.reporterId);

  const handleAddCommentSubmit = async () => {
    if (newComment.trim() === '') {
        toast({ variant: "destructive", title: "Empty Comment", description: "Cannot add an empty comment."});
        return;
    }
    try {
      await onAddComment(task.id, newComment);
      setNewComment(''); // Clear the input after successful submission
      toast({ title: "Comment Added", description: "Your comment has been added successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add comment. Please try again." });
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'default';
    }
  };

  const getDueDateStatusText = (): string | null => {
    if (!task.dueDate) return null;
    const dueDate = parseISO(task.dueDate);
    if (!isValid(dueDate)) return null;

    const now = new Date();
    const daysDiff = differenceInDays(dueDate, now);

    if (isToday(dueDate)) return "Due today";
    if (isPast(dueDate)) {
      const daysOverdue = differenceInDays(now, dueDate);
      return `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`;
    }
    return `${daysDiff + 1} day${daysDiff + 1 > 1 ? 's' : ''} left`;
  };
  const dueDateStatusText = getDueDateStatusText();


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col ">
        <DialogHeader className="flex-shrink-0">
          <DialogDescription className="sr-only">
            Task details dialog for {task.title}
          </DialogDescription>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold text-foreground">{task.title}</DialogTitle>
            
          </div>
          <div className="flex items-center justify-between space-x-3 mt-1 ">
            {task.priority !== 'NONE' && (
                <Badge variant={getPriorityBadgeVariant(task.priority)} className={`w-fit ${task.priority === 'MEDIUM' ? 'bg-accent text-accent-foreground' : ''}`}>
                Priority: {task.priority}
                </Badge>
            )}
            {dueDateStatusText && (
                <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> {dueDateStatusText}
                </span>
            )}{canManageTask && (
                <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="icon" onClick={() => { onOpenChange(false); onEditTask(task);}} aria-label="Edit task" disabled={isSubmittingComment}>
                        <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => { onDeleteTask(task.id);}} aria-label="Delete task" disabled={isSubmittingComment}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto max-h-[88vh]">
             <div className="space-y-4 py-4">
            {task.description && (
              <div>
                <h3 className="font-semibold text-sm mb-1 text-muted-foreground">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {task.dueDate && isValid(parseISO(task.dueDate)) && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Due Date:</strong>&nbsp; <span className="text-foreground">{format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {reporter && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Reporter:</strong>&nbsp; <span className="text-foreground">{reporter.name}</span>
                </div>
              )}
               {task.createdAt && isValid(parseISO(task.createdAt)) && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Created:</strong>&nbsp; <span className="text-foreground">{format(parseISO(task.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
              {task.updatedAt && isValid(parseISO(task.updatedAt)) && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Updated:</strong>&nbsp; <span className="text-foreground">{format(parseISO(task.updatedAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
            </div>

            {assignees.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-1 text-muted-foreground flex items-center"><Users className="h-4 w-4 mr-2" />Assignees</h3>
                <div className="flex flex-wrap gap-2">
                  {assignees.map(user => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1.5 pr-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile small" />
                        <AvatarFallback>{user.name?.substring(0,1).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-1 text-muted-foreground flex items-center"><Tag className="h-4 w-4 mr-2" />Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
              </div>
            )}

            {task.dependentTaskTitles && task.dependentTaskTitles.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-1 text-muted-foreground flex items-center"><Info className="h-4 w-4 mr-2" />Dependent Tasks</h3>
                <div className="flex flex-wrap gap-2">
                  {task.dependentTaskTitles.map(depTitle => <Badge key={depTitle} variant="outline" className="bg-primary/10 border-primary/30 text-primary">{depTitle}</Badge>)}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center flex-shrink-0"><MessageSquare className="h-5 w-5 mr-2" />Comments ({comments.length})</h3>
                 <div className="space-y-3 pr-4">
                  {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
                  {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                </div>
             </div>
            </div>
         </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-4 border-t flex-shrink-0">
            <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                disabled={isSubmittingComment}
            />
            <Button onClick={handleAddCommentSubmit} disabled={newComment.trim() === '' || isSubmittingComment} className="w-full sm:w-auto">
                {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Comment
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
