import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { TaskApprovalDialog } from './TaskApprovalDialog';
import type { Task } from '@/lib/types';

interface GenerateTasksDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGenerate: (brief: string, taskCount: number) => Promise<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]>;
  onAddTasks: (tasks: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  isGenerating: boolean;
  isAddingTasks: boolean;
}

export function GenerateTasksDialog({
  isOpen,
  onOpenChange,
  onGenerate,
  onAddTasks,
  isGenerating,
  isAddingTasks,
}: GenerateTasksDialogProps) {
  const [briefInput, setBriefInput] = useState('');
  const [taskCount, setTaskCount] = useState(3);
  const [currentStep, setCurrentStep] = useState<'generate' | 'approve'>('generate');
  const [generatedTasks, setGeneratedTasks] = useState<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]>([]);

  const handleSubmit = async () => {
    if (briefInput.trim()) {
      const tasks = await onGenerate(briefInput, taskCount);
      setGeneratedTasks(tasks);
      setCurrentStep('approve');
    }
  };

  const handleApprove = async (selectedTasks: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]) => {
    await onAddTasks(selectedTasks);
    // Reset state after successful addition
    setBriefInput('');
    setTaskCount(3);
    setCurrentStep('generate');
    setGeneratedTasks([]);
    onOpenChange(false);
  };

  const handleBack = () => {
    setCurrentStep('generate');
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog is closed
      setBriefInput('');
      setTaskCount(3);
      setCurrentStep('generate');
      setGeneratedTasks([]);
    }
    onOpenChange(open);
  };

  if (currentStep === 'approve') {
    return (
      <TaskApprovalDialog
        isOpen={isOpen}
        onOpenChange={handleDialogOpenChange}
        generatedTasks={generatedTasks}
        onApprove={handleApprove}
        onBack={handleBack}
        isAdding={isAddingTasks}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Tasks with AI</DialogTitle>
          <DialogDescription>
            Provide a brief description or a list of requirements, and AI will generate tasks for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brief">Project Description</Label>
            <Textarea
              id="brief"
              placeholder="e.g., 'Develop a user authentication system with login, registration, and password reset functionality.' or 'Implement a shopping cart with add, remove, and update item features.'"
              className="min-h-[100px]"
              value={briefInput}
              onChange={(e) => setBriefInput(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskCount">Number of Tasks to Generate</Label>
            <Select value={taskCount.toString()} onValueChange={(value) => setTaskCount(parseInt(value))} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 task</SelectItem>
                <SelectItem value="2">2 tasks</SelectItem>
                <SelectItem value="3">3 tasks</SelectItem>
                <SelectItem value="4">4 tasks</SelectItem>
                <SelectItem value="5">5 tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
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