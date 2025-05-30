
"use client";

import type { Task, UserProfile, Comment as CommentType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Added import
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; 
import { AIRewriteCommentButton } from './AIRewriteCommentButton';

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
  const { userProfile, loading: authLoading } = useAuth(); 

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
    if (authLoading || !userProfile) { // Simplified check
        toast({ variant: "destructive", title: "Profile Issue", description: "User profile not available to add comment."});
        return;
    }
    await onAddComment(task.id, newComment);
    setNewComment(''); // Clear input after submission
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

  let commentButtonText = "Add Comment";
  let inputsDisabled = false;

  if (authLoading) {
    commentButtonText = "Loading Auth...";
    inputsDisabled = true;
  } else if (!userProfile) {
    commentButtonText = "Profile Unavailable";
    inputsDisabled = true;
  } else if (isSubmittingComment) {
    commentButtonText = "Adding...";
    inputsDisabled = true;
  } else if (newComment.trim() === '') {
    // Button text remains "Add Comment", but it will be disabled by logic below
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold text-foreground">{task.title}</DialogTitle>
            {canManageTask && (
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => { onOpenChange(false); onEditTask(task);}} aria-label="Edit task" disabled={isSubmittingComment || inputsDisabled}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructiveOutline" size="icon" onClick={() => { onDeleteTask(task.id);}} aria-label="Delete task" disabled={isSubmittingComment || inputsDisabled}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
          </div>
          <DialogDescription>View and manage task details, including comments and assignees.</DialogDescription> {/* Added Description */}
          <div className="flex items-center space-x-3 mt-1">
            {task.priority !== 'NONE' && (
                <Badge variant={getPriorityBadgeVariant(task.priority)} className={`w-fit ${task.priority === 'MEDIUM' ? 'bg-accent text-accent-foreground' : ''}`}>
                Priority: {task.priority}
                </Badge>
            )}
            {dueDateStatusText && (
                <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> {dueDateStatusText}
                </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
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

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center"><MessageSquare className="h-5 w-5 mr-2" />Comments ({comments.length})</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
                {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row pt-4 border-t mt-auto gap-2">
            <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[60px]"
                rows={2}
                disabled={inputsDisabled}
            />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <AIRewriteCommentButton
                    taskTitle={task.title}
                    currentCommentText={newComment}
                    onCommentRewrite={(rewrittenText) => setNewComment(rewrittenText)}
                    disabled={inputsDisabled || newComment.trim() === ''}
                />
                <Button 
                    onClick={handleAddCommentSubmit} 
                    disabled={inputsDisabled || newComment.trim() === '' || isSubmittingComment}
                    className="w-full sm:w-auto"
                >
                    {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {commentButtonText}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


