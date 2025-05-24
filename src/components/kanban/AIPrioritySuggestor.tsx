"use client";

import type { Task, AIPrioritySuggestion } from '@/lib/types';
import { suggestTaskPriority, type SuggestTaskPriorityInput } from '@/ai/flows/suggest-task-priority';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface AIPrioritySuggestorProps {
  task: Pick<Task, 'title' | 'description' | 'dueDate' | 'dependentTaskTitles'>;
  onSuggestion?: (suggestion: AIPrioritySuggestion) => void;
}

export function AIPrioritySuggestor({ task, onSuggestion }: AIPrioritySuggestorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIPrioritySuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggestPriority = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const input: SuggestTaskPriorityInput = {
      taskTitle: task.title,
      taskDescription: task.description || '',
      taskDueDate: task.dueDate || new Date().toISOString().split('T')[0], // Default to today if not set
      dependentTaskTitles: task.dependentTaskTitles || [],
    };

    try {
      const result = await suggestTaskPriority(input);
      const aiSuggestion: AIPrioritySuggestion = {
        // @ts-ignore TODO: Fix type mismatch if any, flow returns string but type expects specific enum
        suggestedPriority: result.suggestedPriority.split(' ')[0] as AIPrioritySuggestion['suggestedPriority'] || 'MEDIUM',
        reasoning: result.suggestedPriority, // Full response as reasoning
      };
      setSuggestion(aiSuggestion);
      if (onSuggestion) {
        onSuggestion(aiSuggestion);
      }
      toast({
        title: "AI Suggestion Ready",
        description: `Suggested Priority: ${aiSuggestion.suggestedPriority}`,
      });
    } catch (err) {
      console.error("Error getting AI priority suggestion:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get priority suggestion at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 my-4">
      <Button onClick={handleSuggestPriority} disabled={isLoading} variant="outline" size="sm">
        <Wand2 className="mr-2 h-4 w-4" />
        {isLoading ? 'Getting Suggestion...' : 'AI Suggest Priority'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestion && !error && (
        <Alert variant="default" className="bg-primary/10 border-primary/30">
          <AlertTitle className="text-primary flex items-center">
            <Wand2 className="mr-2 h-4 w-4" /> AI Suggested Priority: {suggestion.suggestedPriority}
          </AlertTitle>
          <AlertDescription>{suggestion.reasoning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
