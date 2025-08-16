import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface GenerateTasksDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGenerate: (brief: string) => Promise<void>;
  isGenerating: boolean;
}

export function GenerateTasksDialog({
  isOpen,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateTasksDialogProps) {
  const [briefInput, setBriefInput] = useState('');

  const handleSubmit = async () => {
    if (briefInput.trim()) {
      await onGenerate(briefInput);
      setBriefInput(''); // Clear input after generation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Tasks with AI</DialogTitle>
          <DialogDescription>
            Provide a brief description or a list of requirements, and AI will generate tasks for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="brief"
            placeholder="e.g., 'Develop a user authentication system with login, registration, and password reset functionality.' or 'Implement a shopping cart with add, remove, and update item features.'"
            className="col-span-3 min-h-[100px]"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!briefInput.trim() || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}