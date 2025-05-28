"use client";

import { rewriteComment } from '@/ai/flows/rewrite-comment';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AIRewriteCommentButtonProps {
  taskTitle: string;
  currentCommentText: string;
  onCommentRewrite: (newComment: string) => void;
  disabled?: boolean;
}

export function AIRewriteCommentButton({
  taskTitle,
  currentCommentText,
  onCommentRewrite,
  disabled,
}: AIRewriteCommentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRewrite = async () => {
    if (!currentCommentText) {
        toast({
            variant: "default",
            title: "Write Something",
            description: "Please type some text before rewriting.",
        });
        return;
    }
    setIsLoading(true);
    try {
      const result = await rewriteComment({ taskTitle, currentCommentText });
      onCommentRewrite(result.rewrittenComment);
      toast({
        title: "Comment Rewritten",
        description: "Your comment has been updated by AI.",
      });
    } catch (err) {
      console.error("Error rewriting comment:", err);
      toast({
        variant: "destructive",
        title: "Rewrite Failed",
        description: err instanceof Error ? err.message : "Could not rewrite comment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleRewrite}
      disabled={isLoading || disabled || !currentCommentText}
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Rewrite with AI
    </Button>
  );
}
