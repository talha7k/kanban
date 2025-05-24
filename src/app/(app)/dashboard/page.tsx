
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewProjectData, Project, UserProfile } from '@/lib/types';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { PlusCircle, Users, FolderKanban, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { getProjectsForUser, getAllUserProfiles, createProject as createProjectInDb } from '@/lib/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      const fetchDashboardData = async () => {
        setIsLoadingProjects(true);
        setIsLoadingUsers(true);
        try {
          const userProjects = await getProjectsForUser(currentUser.uid);
          setProjects(userProjects);
        } catch (error) {
          console.error("Error fetching projects:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load projects." });
        } finally {
          setIsLoadingProjects(false);
        }

        try {
          const fetchedUsers = await getAllUserProfiles();
          setAllUsers(fetchedUsers);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load users." });
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchDashboardData();
    }
  }, [currentUser, toast]);

  const handleAddProject = async (projectData: NewProjectData) => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a project." });
      return;
    }
    try {
      const newProject = await createProjectInDb(projectData, currentUser.uid);
      setProjects(prevProjects => [...prevProjects, newProject]);
      toast({ title: "Project Created!", description: `"${newProject.name}" has been successfully created.` });
      setIsCreateProjectDialogOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not create project.";
      toast({ variant: "destructive", title: "Creation Failed", description: errorMessage });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        {currentUser && (
          <Button onClick={() => setIsCreateProjectDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects Section */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FolderKanban className="mr-3 h-7 w-7 text-primary" />
              Projects ({isLoadingProjects ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : projects.length})
            </CardTitle>
            <CardDescription>Manage your ongoing and upcoming projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : projects.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 h-[40px]">{project.description || 'No description available.'}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}`}>View Board</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No projects yet. Click "Create New Project" to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Users Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Users className="mr-3 h-7 w-7 text-accent" />
              Users ({isLoadingUsers ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : allUsers.length})
            </CardTitle>
            <CardDescription>Overview of team members.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
               <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-32" /></div>
                <div className="flex items-center space-x-3 p-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-24" /></div>
                <div className="flex items-center space-x-3 p-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-28" /></div>
              </div>
            ) : allUsers.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <ul className="space-y-3">
                  {allUsers.map((user) => (
                    <li key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || user.email?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium text-foreground">{user.name}</span>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No users found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {currentUser && (
        <CreateProjectDialog
          isOpen={isCreateProjectDialogOpen}
          onOpenChange={setIsCreateProjectDialogOpen}
          onAddProject={handleAddProject}
        />
      )}
    </div>
  );
}
