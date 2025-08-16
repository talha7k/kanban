"use client";

import type { Task } from '@/lib/types';
import { type GenerateTaskDetailsInput, type GenerateTaskDetailsOutput } from '@/ai/flows/generate-task-details';
import { generateTaskDetailsAction } from '@/app/actions/project';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface AITaskDetailGeneratorProps {
  briefInput: string;
  onDetailsGenerated?: (details: GenerateTaskDetailsOutput) => void;
}

export function AITaskDetailGenerator({ briefInput, onDetailsGenerated }: AITaskDetailGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDetails, setGeneratedDetails] = useState<GenerateTaskDetailsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateDetails = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedDetails(null);

    const input: GenerateTaskDetailsInput = {
      briefInput: briefInput,
    };

    try {
      const response = await generateTaskDetailsAction(input);
      if (response.success && response.details) {
        setGeneratedDetails(response.details);
        if (onDetailsGenerated) {
          onDetailsGenerated(response.details);
        }
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error("Unknown error during AI task details generation.");
      }
      toast({
        title: "AI Task Details Generated",
        description: `Title: ${response.details.title}`,
      });
    } catch (err) {
      console.error("Error generating AI task details:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate task details at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 my-4">
      <Button onClick={handleGenerateDetails} disabled={isLoading} variant="outline" size="sm">
        <Wand2 className="mr-2 h-4 w-4" />
        {isLoading ? 'Generating Details...' : 'Generate Task Details with AI'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedDetails && !error && (
        <Alert variant="default" className="bg-primary/10 border-primary/30">
          <AlertTitle className="text-primary flex items-center">
            <Wand2 className="mr-2 h-4 w-4" /> AI Generated Details:
          </AlertTitle>
          <AlertDescription>
            <strong>Title:</strong> {generatedDetails.title}
            <br />
            <strong>Description:</strong> {generatedDetails.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
