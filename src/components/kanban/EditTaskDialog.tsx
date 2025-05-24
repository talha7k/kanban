
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

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditTask: (taskId: string, taskData: TaskFormData) => Promise<void> | void; // Can be async
  taskToEdit: Task | null;
  users: UserProfile[];
  allTasksForDependencies: Pick<Task, 'id' | 'title'>[];
  isSubmitting?: boolean; // Passed from parent
}

export function EditTaskDialog({
  isOpen,
  onOpenChange,
  onEditTask,
  taskToEdit,
  users,
  allTasksForDependencies,
  isSubmitting
}: EditTaskDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    // Default values will be set by useEffect when taskToEdit is available
  });
  
  const [currentTaskDataForAI, setCurrentTaskDataForAI] = useState<Partial<TaskFormData>>({});

  useEffect(() => {
    if (taskToEdit && isOpen) { // Reset form only when dialog opens with a task
      const defaultValues: TaskFormData = {
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority,
        assigneeUids: taskToEdit.assigneeUids || [],
        dueDate: taskToEdit.dueDate,
        tags: taskToEdit.tags || [],
        dependentTaskTitles: taskToEdit.dependentTaskTitles || [],
      };
      form.reset(defaultValues);
      setCurrentTaskDataForAI(defaultValues); // Initialize AI data
    } else if (!isOpen) {
      form.reset({ // Clear form when dialog closes
        title: "",
        description: "",
        priority: 'NONE',
        assigneeUids: [],
        dependentTaskTitles: [],
        tags: [],
        dueDate: undefined,
      });
      setCurrentTaskDataForAI({});
    }
  }, [taskToEdit, form, isOpen]);

  const onSubmit = async (data: TaskFormData) => {
    if (!taskToEdit) return;
    await onEditTask(taskToEdit.id, data);
    // Dialog closing and form reset handled by useEffect or parent on success
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
  }, [watchedValues.title, watchedValues.description, watchedValues.dueDate, watchedValues.dependentTaskTitles, isOpen]); // re-run if isOpen changes to ensure AI data is fresh


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
          <TaskFormFields 
            form={form} 
            users={users} 
            allTasksForDependencies={allTasksForDependencies.filter(t => t.id !== taskToEdit.id)} 
            isEditing 
          />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
