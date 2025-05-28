"use client";

import { rewriteTaskDescription } from '@/ai/flows/rewrite-task-description';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AIRewriteDescriptionButtonProps {
  taskTitle: string;
  currentDescription: string;
  onDescriptionRewrite: (newDescription: string) => void;
  disabled?: boolean;
}

export function AIRewriteDescriptionButton({
  taskTitle,
  currentDescription,
  onDescriptionRewrite,
  disabled,
}: AIRewriteDescriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRewrite = async () => {
    if (!taskTitle && !currentDescription) {
        toast({
            variant: "default",
            title: "Provide Details",
            description: "Please provide a title or description to rewrite.",
        });
        return;
    }
    setIsLoading(true);
    try {
      const result = await rewriteTaskDescription({ taskTitle, currentDescription });
      onDescriptionRewrite(result.rewrittenDescription);
      toast({
        title: "Description Rewritten",
        description: "The task description has been updated by AI.",
      });
    } catch (err) {
      console.error("Error rewriting description:", err);
      toast({
        variant: "destructive",
        title: "Rewrite Failed",
        description: err instanceof Error ? err.message : "Could not rewrite description.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleRewrite}
      disabled={isLoading || disabled}
      variant="outline"
      size="sm"
      className="mt-2 w-full sm:w-auto"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Rewrite Description with AI
    </Button>
  );
}
