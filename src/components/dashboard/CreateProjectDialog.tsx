
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

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters long." }).max(50, { message: "Project name must be 50 characters or less." }),
  description: z.string().max(200, { message: "Description must be 200 characters or less." }).optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProject: (projectData: NewProjectData) => void;
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  onAddProject,
}: CreateProjectDialogProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    onAddProject(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { form.reset(); onOpenChange(open); }}>
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
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit">Save Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
