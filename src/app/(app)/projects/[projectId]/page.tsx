
"use client";
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { Project, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProjectById, getAllUserProfiles, updateProjectDetails } from '@/lib/firebaseService'; 
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EditProjectDialog } from '@/components/project/EditProjectDialog'; 

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null); 
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isSubmittingProjectEdit, setIsSubmittingProjectEdit] = useState(false);

  useEffect(() => {
    const projectId = params.projectId; // Capture projectId for stable dependency
    if (projectId && currentUser) { 
      const fetchProjectData = async () => {
        setIsLoadingProject(true);
        setIsLoadingUsers(true);
        setError(null);
        try {
          const [fetchedProject, fetchedUsers] = await Promise.all([
            getProjectById(projectId),
            getAllUserProfiles()
          ]);

          if (fetchedProject) {
            const isMember = fetchedProject.memberIds?.includes(currentUser.uid) || fetchedProject.ownerId === currentUser.uid;
            if (isMember) {
              setProject(fetchedProject);
            } else {
              setError(`You do not have access to project ${projectId}.`);
              setProject(null);
              toast({ variant: "destructive", title: "Access Denied", description: `You do not have permission to view this project.` });
            }
          } else {
            setError(`Project with ID ${projectId} not found.`);
            setProject(null);
            toast({ variant: "destructive", title: "Project Not Found", description: `Could not load project ${projectId}.` });
          }
          setUsers(fetchedUsers);

        } catch (err) {
          console.error("Error fetching project data:", err);
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Error Loading Project", description: errorMessage });
        } finally {
          setIsLoadingProject(false);
          setIsLoadingUsers(false);
        }
      };
      fetchProjectData();
    } else if (!currentUser) {
        setIsLoadingProject(false);
        setIsLoadingUsers(false);
    }
  }, [params.projectId, currentUser, toast]); // Keep params.projectId as dependency

  const handleEditProjectSubmit = async (data: { name: string; description?: string }) => {
    if (!project || !currentUser || currentUser.uid !== project.ownerId) {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only the project owner can edit details."});
      return;
    }
    setIsSubmittingProjectEdit(true);
    try {
      const updatedProject = await updateProjectDetails(project.id, data);
      setProject(updatedProject);
      toast({ title: "Project Updated", description: `"${updatedProject.name}" has been successfully updated.` });
      setIsEditProjectDialogOpen(false);
    } catch (error) {
      console.error("Error updating project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not update project.";
      toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
    } finally {
      setIsSubmittingProjectEdit(false);
    }
  };


  const isLoading = isLoadingProject || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading project data...</p>
      </div>
    );
  }

  if (error && !project) { 
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-8">
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Try Reloading
        </Button>
         <Link href="/dashboard" passHref>
            <Button variant="link" className="mt-2">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  if (!project) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <p className="text-lg">Project not found or you do not have access.</p>
         <Link href="/dashboard" passHref>
            <Button variant="link" className="mt-2">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b bg-card">
        <div className="container mx-auto">
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row">
                <div className="flex-1 mb-2 sm:mb-0">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-card-foreground flex items-center">
                            {project.name}
                        </h1>
                        {currentUser?.uid === project.ownerId && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditProjectDialogOpen(true)} className="ml-3" disabled={isSubmittingProjectEdit}>
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Edit Project Details</span>
                        </Button>
                        )}
                    </div>
                    {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    )}
                </div>
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        </div>
      </div>
      <div className="flex-1 min-h-0"> {/* Allows KanbanBoard to take remaining height */}
        <KanbanBoard project={project} users={users} />
      </div>
      {currentUser?.uid === project.ownerId && project && (
        <EditProjectDialog
          isOpen={isEditProjectDialogOpen}
          onOpenChange={setIsEditProjectDialogOpen}
          project={project}
          onEditProject={handleEditProjectSubmit}
          isSubmitting={isSubmittingProjectEdit}
        />
      )}
    </div>
  );
}
