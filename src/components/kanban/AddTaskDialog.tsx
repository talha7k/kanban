
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task, UserProfile, AIPrioritySuggestion } from '@/lib/types';
import { TaskFormFields, type TaskFormData } from './TaskFormFields';
import { AIPrioritySuggestor } from "./AIPrioritySuggestor";
import { useState, useEffect } from "react"; 
import { Loader2 } from "lucide-react";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less."),
  description: z.string().max(500, "Description must be 500 characters or less.").optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'NONE']),
  assigneeUids: z.array(z.string()).optional(),
  dueDate: z.string().optional(), 
  tags: z.array(z.string()).optional(),
  dependentTaskTitles: z.array(z.string()).optional(),
});

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTask: (taskData: TaskFormData, columnId: string) => Promise<void> | void; 
  columnId: string | null;
  assignableUsers: UserProfile[]; // Changed from 'users'
  allTasksForDependencies: Pick<Task, 'id' | 'title'>[];
  isSubmitting?: boolean; 
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  onAddTask,
  columnId,
  assignableUsers, // Changed from 'users'
  allTasksForDependencies,
  isSubmitting
}: AddTaskDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 'NONE',
      assigneeUids: [],
      dependentTaskTitles: [],
      tags: [],
      dueDate: undefined,
    },
  });
  
  const [currentTaskDataForAI, setCurrentTaskDataForAI] = useState<Partial<TaskFormData>>({});

  const onSubmit = async (data: TaskFormData) => {
    if (!columnId) return; 
    try {
      await onAddTask(data, columnId); 
      form.reset(); 
      setCurrentTaskDataForAI({}); 
      onOpenChange(false); 
    } catch (error) {
      console.error("Error submitting task from dialog:", error);
    }
  };

  const handleDialogClose = () => {
    if (!isSubmitting) { 
        form.reset();
        setCurrentTaskDataForAI({});
        onOpenChange(false);
    }
  };

  const handleAISuggestion = (suggestion: AIPrioritySuggestion) => {
    form.setValue('priority', suggestion.suggestedPriority);
  };

  const watchedValues = form.watch();
  useEffect(() => { 
    setCurrentTaskDataForAI({
        title: watchedValues.title,
        description: watchedValues.description,
        dueDate: watchedValues.dueDate,
        dependentTaskTitles: watchedValues.dependentTaskTitles,
    });
  }, [watchedValues.title, watchedValues.description, watchedValues.dueDate, watchedValues.dependentTaskTitles]);


  if (!isOpen || !columnId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); else onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for your new task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TaskFormFields form={form} assignableUsers={assignableUsers} allTasksForDependencies={allTasksForDependencies} />
          <AIPrioritySuggestor 
            task={{
              title: currentTaskDataForAI.title || '', 
              description: currentTaskDataForAI.description || '',
              dueDate: currentTaskDataForAI.dueDate,
              dependentTaskTitles: currentTaskDataForAI.dependentTaskTitles,
            }}
            onSuggestion={handleAISuggestion}
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    