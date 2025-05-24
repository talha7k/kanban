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
import { useEffect, useState } from "react";
import { AIPrioritySuggestor } from "./AIPrioritySuggestor";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'NONE']),
  assigneeUids: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dependentTaskTitles: z.array(z.string()).optional(),
});

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditTask: (taskId: string, taskData: TaskFormData) => void;
  taskToEdit: Task | null;
  users: UserProfile[];
  allTasksForDependencies: Pick<Task, 'id' | 'title'>[];
}

export function EditTaskDialog({
  isOpen,
  onOpenChange,
  onEditTask,
  taskToEdit,
  users,
  allTasksForDependencies
}: EditTaskDialogProps) {
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

  useEffect(() => {
    if (taskToEdit) {
      form.reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority,
        assigneeUids: taskToEdit.assigneeUids || [],
        dueDate: taskToEdit.dueDate,
        tags: taskToEdit.tags || [],
        dependentTaskTitles: taskToEdit.dependentTaskTitles || [],
      });
    }
  }, [taskToEdit, form, isOpen]);


  const onSubmit = (data: TaskFormData) => {
    if (!taskToEdit) return;
    onEditTask(taskToEdit.id, data);
    onOpenChange(false);
  };
  
  const handleAISuggestion = (suggestion: AIPrioritySuggestion) => {
    form.setValue('priority', suggestion.suggestedPriority);
  };

  const watchedValues = form.watch();

  if (!isOpen || !taskToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details for your task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TaskFormFields form={form} users={users} allTasksForDependencies={allTasksForDependencies.filter(t => t.id !== taskToEdit.id)} isEditing />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
