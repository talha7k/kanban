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
import { useState } from "react";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'NONE']),
  assigneeUids: z.array(z.string()).optional(),
  dueDate: z.string().optional(), // Stored as YYYY-MM-DD string
  tags: z.array(z.string()).optional(),
  dependentTaskTitles: z.array(z.string()).optional(),
});

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTask: (taskData: TaskFormData, columnId: string) => void;
  columnId: string | null;
  users: UserProfile[];
  allTasksForDependencies: Pick<Task, 'id' | 'title'>[];
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  onAddTask,
  columnId,
  users,
  allTasksForDependencies
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
    },
  });
  
  const [currentTaskDataForAI, setCurrentTaskDataForAI] = useState<Partial<TaskFormData>>({});

  const onSubmit = (data: TaskFormData) => {
    if (!columnId) return; // Should not happen if dialog is open
    onAddTask(data, columnId);
    form.reset();
    onOpenChange(false);
  };

  const handleAISuggestion = (suggestion: AIPrioritySuggestion) => {
    form.setValue('priority', suggestion.suggestedPriority);
  };

  // Update currentTaskDataForAI when form values change for AI suggestor
  const watchedValues = form.watch();
  useState(() => { // useEffect might be better but useState for simplicity with current form structure
    setCurrentTaskDataForAI({
        title: watchedValues.title,
        description: watchedValues.description,
        dueDate: watchedValues.dueDate,
        dependentTaskTitles: watchedValues.dependentTaskTitles,
    });
  });


  if (!isOpen || !columnId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { form.reset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for your new task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TaskFormFields form={form} users={users} allTasksForDependencies={allTasksForDependencies} />
          <AIPrioritySuggestor 
            task={{
              title: watchedValues.title || '',
              description: watchedValues.description || '',
              dueDate: watchedValues.dueDate,
              dependentTaskTitles: watchedValues.dependentTaskTitles,
            }}
            onSuggestion={handleAISuggestion}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit">Save Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
