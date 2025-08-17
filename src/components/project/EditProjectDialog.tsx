
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project, Team, TeamId } from '@/lib/types';
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { getTeamsForUser } from '@/lib/firebaseTeam';

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters long." }).max(50, { message: "Project name must be 50 characters or less." }),
  description: z.string().max(200, { message: "Description must be 200 characters or less." }).optional(),
  teamId: z.string().nullable().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project;
  onEditProject: (data: ProjectFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  onDeleteProject: (project: Project) => void;
}


export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
  onEditProject,
  isSubmitting,
  onDeleteProject,
}: EditProjectDialogProps) {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      teamId: project.teamId || null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: project.name,
        description: project.description || "",
        teamId: project.teamId || null,
      });
    }
  }, [isOpen, project, form]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (currentUser?.uid) {
        setIsLoadingTeams(true);
        try {
          const userTeams = await getTeamsForUser(currentUser.uid);
          setTeams(userTeams);
        } catch (error) {
          console.error('Error fetching teams for project edit:', error);
        } finally {
          setIsLoadingTeams(false);
        }
      }
    };
    fetchTeams();
  }, [currentUser?.uid]);

  const onSubmit = async (data: ProjectFormData) => {
    await onEditProject(data);
    // Dialog closing and form reset are handled by parent (ProjectPage) on success
  };
  
  const handleDialogClose = () => {
    if (!isSubmitting) {
        // form.reset() will be called by useEffect when isOpen changes
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); else onOpenChange(open); }}>
      <DialogContent  >
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>
            Update your project&apos;s name, description, and team association. Click save when you&apos;re done.
          </DialogDescription>
     
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input
              id="edit-project-name"
              {...form.register("name")}
              placeholder="e.g., Q1 Redesign"
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-project-description">Description (Optional)</Label>
            <Textarea
              id="edit-project-description"
              {...form.register("description")}
              placeholder="A brief overview of the project."
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-project-team">Team</Label>
            <Select
              onValueChange={(value) => form.setValue("teamId", value === "null" ? null : value)}
              value={form.watch("teamId") || "null"}
              disabled={isSubmitting || isLoadingTeams}
            >
              <SelectTrigger id="edit-project-team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teamId && (
              <p className="text-xs text-destructive">{form.formState.errors.teamId.message}</p>
            )}
          </div>
          <DialogFooter>
             <Button
              variant="destructive"
              className="my-4 sm:my-0 sm:mr-[15%]"
              onClick={() => {
                onOpenChange(false); // Close edit dialog first
                onDeleteProject(project); // Then open delete dialog
              }}
              disabled={isSubmitting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-6" /> Delete
            </Button>
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
              Cancel
            </Button>
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
