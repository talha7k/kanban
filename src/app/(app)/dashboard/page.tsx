
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewProjectData, Project, UserProfile } from '@/lib/types';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { ManageProjectMembersDialog } from '@/components/dashboard/ManageProjectMembersDialog';
import { PlusCircle, Users, FolderKanban, Loader2, Briefcase, Settings2, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { getProjectsForUser, getAllUserProfiles, createProject as createProjectInDb } from '@/lib/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) return;
    setIsLoadingProjects(true);
    setIsLoadingUsers(true);
    try {
      const userProjects = await getProjectsForUser(currentUser.uid);
      setProjects(userProjects);

      // If the manage members dialog is open, update its project data
      if (selectedProjectForMembers) {
        const updatedSelectedProject = userProjects.find(p => p.id === selectedProjectForMembers.id);
        if (updatedSelectedProject) {
          setSelectedProjectForMembers(updatedSelectedProject);
        } else {
          // Project might have been deleted or user lost access
          setIsManageMembersDialogOpen(false);
          setSelectedProjectForMembers(null);
        }
      }
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

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser?.uid]);

  const handleAddProject = async (projectData: NewProjectData) => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a project." });
      return;
    }
    try {
      const newProject = await createProjectInDb(projectData, currentUser.uid);
      // Re-fetch to get the most consistent data including the new project
      await fetchDashboardData(); 
      toast({ title: "Project Created!", description: `"${newProject.name}" has been successfully created.` });
      setIsCreateProjectDialogOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not create project.";
      toast({ variant: "destructive", title: "Creation Failed", description: errorMessage });
    }
  };

  const openManageMembersDialog = (project: Project) => {
    if (!project || !project.id) {
        console.error("Attempted to manage members for an invalid project:", project);
        toast({ variant: "destructive", title: "Error", description: "Cannot manage members for this project." });
        return;
    }
    setSelectedProjectForMembers(project);
    setIsManageMembersDialogOpen(true);
  };

  const onMembersUpdated = async () => {
    // This will re-fetch projects and users, and also update selectedProjectForMembers if dialog is open
    if (currentUser?.uid) {
      await fetchDashboardData(); 
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        {currentUser && (
          <Button onClick={() => setIsCreateProjectDialogOpen(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <Card className="lg:col-span-2 shadow-lg">
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
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : projects.length > 0 ? (
              <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-4"> {/* Adjusted max-height */}
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            {currentUser?.uid === project.ownerId && (
                                <Badge variant="outline" className="ml-2 border-accent text-accent">
                                    <Crown className="mr-1.5 h-3.5 w-3.5" /> Owner
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2 h-[40px] break-words">{project.description || 'No description available.'}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col items-start space-y-3">
                        <div className="flex items-center space-x-2 mb-1">
                            {(project.memberIds || []).slice(0, 3).map(memberId => {
                                const member = allUsers.find(u => u.id === memberId);
                                return member ? (
                                    <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="profile small"/>
                                        <AvatarFallback>{member.name?.substring(0,1).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                ) : null;
                            })}
                            {(project.memberIds?.length || 0) > 3 && (
                                <Avatar className="h-6 w-6 border-2 border-card">
                                    <AvatarFallback>+{(project.memberIds?.length || 0) - 3}</AvatarFallback>
                                </Avatar>
                            )}
                            <span className="text-xs text-muted-foreground">{(project.memberIds?.length || 0)} Member(s)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/projects/${project.id}`}>View Board</Link>
                            </Button>
                            {currentUser?.uid === project.ownerId && (
                              <Button variant="outline" size="sm" onClick={() => openManageMembersDialog(project)}>
                                  <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage Members
                              </Button>
                            )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No projects yet. Click "Create New Project" to get started.</p>
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
              <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-4"> {/* Adjusted max-height */}
                <ul className="space-y-3">
                  {allUsers.map((user) => (
                    <li key={user.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || user.email?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0"> {/* Added min-w-0 for text truncation */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground truncate" title={user.name}>{user.name}</span>
                            <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="capitalize text-xs flex-shrink-0">
                                {user.role}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
                        {user.title && (
                            <p className="text-xs text-muted-foreground flex items-center mt-0.5 truncate" title={user.title}>
                                <Briefcase className="h-3 w-3 mr-1.5 flex-shrink-0" /> {user.title}
                            </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found.</p>
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
      {selectedProjectForMembers && currentUser?.uid === selectedProjectForMembers.ownerId && (
        <ManageProjectMembersDialog
          // Ensure the dialog gets a key that changes if critical project aspects change, forcing re-initialization
          key={selectedProjectForMembers.id + (selectedProjectForMembers.memberIds?.join('') || '') + JSON.stringify(selectedProjectForMembers.memberRoles || {})}
          project={selectedProjectForMembers}
          allUsers={allUsers}
          isOpen={isManageMembersDialogOpen}
          onOpenChange={(isOpen) => {
            setIsManageMembersDialogOpen(isOpen);
            if (!isOpen) setSelectedProjectForMembers(null);
          }}
          onMembersUpdate={onMembersUpdated}
        />
      )}
    </div>
  );
}
