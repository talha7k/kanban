
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NewProjectData } from '@/lib/types';
import { Loader2 } from "lucide-react"; // For loading indicator
import { useState } from "react";

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters long." }).max(50, { message: "Project name must be 50 characters or less." }),
  description: z.string().max(200, { message: "Description must be 200 characters or less." }).optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProject: (projectData: NewProjectData) => Promise<void> | void; // Can be async
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  onAddProject,
}: CreateProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      await onAddProject(data);
      // onOpenChange(false) and form.reset() are typically called by the parent (DashboardPage) on success
    } catch (error) {
      // Error toast is handled by parent (DashboardPage)
      console.error("Project creation submission failed in dialog:", error);
    } finally {
      setIsSubmitting(false);
      // Only reset and close if submission was truly successful,
      // which is better handled by the parent that controls `isOpen`
    }
  };
  
  const handleDialogClose = () => {
    if (!isSubmitting) { // Prevent closing if submitting
        form.reset();
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); else onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details for your new project. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., Q4 Marketing Campaign"
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="A brief overview of the project's goals."
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
