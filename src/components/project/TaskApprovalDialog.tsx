import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskApprovalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  generatedTasks: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
  onApprove: (selectedTasks: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onBack: () => void;
  isAdding: boolean;
}

export function TaskApprovalDialog({
  isOpen,
  onOpenChange,
  generatedTasks,
  onApprove,
  onBack,
  isAdding,
}: TaskApprovalDialogProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set(generatedTasks.map((_, index) => index)));

  const handleTaskToggle = (taskIndex: number) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskIndex)) {
      newSelected.delete(taskIndex);
    } else {
      newSelected.add(taskIndex);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === generatedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(generatedTasks.map((_, index) => index)));
    }
  };

  const handleApprove = async () => {
    const selectedTasks = generatedTasks.filter((_, index) => selectedTaskIds.has(index));
    await onApprove(selectedTasks);
  };

  const selectedCount = selectedTaskIds.size;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isAdding}
              className="p-1 h-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Review Generated Tasks
          </DialogTitle>
          <DialogDescription>
            Select the tasks you want to add to your project. You can modify or remove any tasks before adding them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isAdding}
            >
              {selectedTaskIds.size === generatedTasks.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {generatedTasks.length} tasks selected
            </span>
          </div>
          
          <div className="space-y-3">
            {generatedTasks.map((task, index) => (
              <Card key={index} className={`transition-all ${
                selectedTaskIds.has(index) ? 'ring-2 ring-primary' : 'opacity-70'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTaskIds.has(index)}
                      onCheckedChange={() => handleTaskToggle(index)}
                      disabled={isAdding}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {task.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-secondary rounded">
                      Priority: {task.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isAdding}
          >
            Back to Generate
          </Button>
          <Button
            onClick={handleApprove}
            disabled={selectedCount === 0 || isAdding}
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Add {selectedCount} Task{selectedCount !== 1 ? 's' : ''} to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}