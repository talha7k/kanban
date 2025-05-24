
"use client";
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { Project, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProjectById, getAllUserProfiles } from '@/lib/firebaseService'; 
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null); 
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.projectId && currentUser) { 
      const fetchProjectData = async () => {
        setIsLoadingProject(true);
        setIsLoadingUsers(true);
        setError(null);
        try {
          // Fetch project and users in parallel
          const [fetchedProject, fetchedUsers] = await Promise.all([
            getProjectById(params.projectId),
            getAllUserProfiles()
          ]);

          if (fetchedProject) {
            // TODO: Add permission check here - is currentUser.uid part of project.memberIds or ownerId?
            setProject(fetchedProject);
          } else {
            setError(`Project with ID ${params.projectId} not found.`);
            setProject(null);
            toast({ variant: "destructive", title: "Project Not Found", description: `Could not load project ${params.projectId}.` });
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
        // User not loaded yet, or not logged in.
    }
  }, [params.projectId, currentUser, toast]);

  const isLoading = isLoadingProject || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading project data...</p>
      </div>
    );
  }

  if (error && !project) { // Show error only if project loading failed critically
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-8">
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Try Reloading
        </Button>
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
    <div className="h-full">
      {/* Pass users list which should now be populated before KanbanBoard renders */}
      <KanbanBoard project={project} users={users} />
    </div>
  );
}
