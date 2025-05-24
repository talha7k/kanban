"use client";

import type { Task, UserProfile, Comment as CommentType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Tag, Users, MessageSquare, Edit2, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { CommentItem } from './CommentItem';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AIPrioritySuggestor } from './AIPrioritySuggestor';
import { useToast } from '@/hooks/use-toast';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  users: UserProfile[];
  onAddComment: (taskId: string, commentText: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskDetailsDialog({
  isOpen,
  onOpenChange,
  task,
  users,
  onAddComment,
  onEditTask,
  onDeleteTask
}: TaskDetailsDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<CommentType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (task?.comments) {
      setComments(task.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      setComments([]);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const assignees = task.assigneeUids?.map(uid => users.find(u => u.id === uid)).filter(Boolean) as UserProfile[] || [];
  const reporter = users.find(u => u.id === task.reporterId);

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    onAddComment(task.id, newComment);
    // Optimistically add comment to UI - parent component will handle actual data update
    // This will be replaced by real-time updates from Firebase later
    const currentUser = users[0] || { id: 'tempUser', name: 'You', avatarUrl: 'https://placehold.co/32x32.png?text=U' }; // Placeholder for current user
    const optimisticComment: CommentType = {
        id: `temp-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        content: newComment,
        createdAt: new Date().toISOString(),
    };
    setComments(prev => [optimisticComment, ...prev]);
    setNewComment('');
    toast({ title: "Comment added!" });
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold text-foreground">{task.title}</DialogTitle>
            <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => { onOpenChange(false); onEditTask(task);}} aria-label="Edit task">
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="destructiveOutline" size="icon" onClick={() => { onDeleteTask(task.id); onOpenChange(false);}} aria-label="Delete task">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </div>
          {task.priority !== 'NONE' && (
            <Badge variant={getPriorityBadgeVariant(task.priority)} className={`w-fit mt-1 ${task.priority === 'MEDIUM' ? 'bg-accent text-accent-foreground' : ''}`}>
              Priority: {task.priority}
            </Badge>
          )}
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
              {task.dueDate && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Due Date:</strong>&nbsp; <span className="text-foreground">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {reporter && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Reporter:</strong>&nbsp; <span className="text-foreground">{reporter.name}</span>
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
                        <AvatarFallback>{user.name.substring(0,1)}</AvatarFallback>
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
                  {task.dependentTaskTitles.map(depTitle => <Badge key={depTitle} variant="outline" className="bg-primary/10 border-primary/30 text-primary-foreground">{depTitle}</Badge>)}
                </div>
              </div>
            )}

             <AIPrioritySuggestor task={task} />


            <Separator className="my-4" />

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center"><MessageSquare className="h-5 w-5 mr-2" />Comments ({comments.length})</h3>
              <div className="space-y-1">
                {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
                {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row pt-4 border-t">
            <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[60px]"
                rows={2}
            />
            <Button onClick={handleAddComment} disabled={newComment.trim() === ''}>Add Comment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
