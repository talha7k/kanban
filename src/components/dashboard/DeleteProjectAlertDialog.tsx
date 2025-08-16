import React from "react";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "../ui/alert-dialog";

interface DeleteProjectAlertDialogProps {
  projectToDelete: { name: string } | null;
  isDeletingProject: boolean;
  setProjectToDelete: (project: { name: string } | null) => void;
  confirmDeleteProject: () => void;
}

export function DeleteProjectAlertDialog({
  projectToDelete,
  isDeletingProject,
  setProjectToDelete,
  confirmDeleteProject,
}: DeleteProjectAlertDialogProps) {
  return (
    <AlertDialog
      open={!!projectToDelete}
      onOpenChange={(open) => !open && setProjectToDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this project?  <div className="mt-4">
              <p className="text-red-400 text-lg">This will delete all tasks of the project.</p>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            project "{projectToDelete?.name}" and all its tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setProjectToDelete(null)}
            disabled={isDeletingProject}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteProject}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeletingProject}
          >
            {isDeletingProject ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}