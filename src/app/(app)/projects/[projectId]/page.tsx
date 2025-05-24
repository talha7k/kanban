
"use client";
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { Project, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProjectById, getAllUserProfiles } from '@/lib/firebaseService'; // Using Firestore service
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; // For loading indicator

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null); // null for not found or initial
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.projectId && currentUser) { // Ensure user is available for potential permission checks later
      const fetchProjectData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedProject = await getProjectById(params.projectId);
          if (fetchedProject) {
            // TODO: Add permission check here - is currentUser.uid part of project.memberIds or ownerId?
            // For now, assuming public access or owner is viewing.
            setProject(fetchedProject);
          } else {
            setError(`Project with ID ${params.projectId} not found.`);
            setProject(null);
          }

          // Fetch all users for assignee pickers etc.
          // In a real app, you might only fetch project members.
          const fetchedUsers = await getAllUserProfiles();
          setUsers(fetchedUsers);

        } catch (err) {
          console.error("Error fetching project data:", err);
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Error Loading Project", description: errorMessage });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjectData();
    } else if (!currentUser) {
        setIsLoading(false);
        // User not loaded yet, or not logged in. KanbanBoard might not render correctly.
        // Or redirect via AuthProvider if this page should be strictly protected.
    }
  }, [params.projectId, currentUser, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading project data...</p>
      </div>
    );
  }

  if (error) {
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

  // Ensure users are loaded before rendering KanbanBoard if it strictly depends on them for assignees
  // For now, passing potentially empty users array if that fetch fails or is slow.
  return (
    <div className="h-full">
      <KanbanBoard project={project} users={users} />
    </div>
  );
}

// Need to add Button and Link imports if not already present from error display
import { Button } from '@/components/ui/button';
import Link from 'next/link';
