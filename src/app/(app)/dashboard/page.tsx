
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewProjectData, Project, UserProfile } from '@/lib/types';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { ManageProjectMembersDialog } from '@/components/dashboard/ManageProjectMembersDialog';
import { PlusCircle, Users, FolderKanban, Loader2, Briefcase, Settings2,Eye, Crown, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { getProjectsForUser, getAllUserProfiles, createProject as createProjectInDb, updateProjectDetails as updateProjectDetailsInDb, deleteProject as deleteProjectFromDb } from '@/lib/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EditProjectDialog } from '@/components/project/EditProjectDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmittingProjectEdit, setIsSubmittingProjectEdit] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);


  const fetchDashboardData = async () => {
    if (!currentUser?.uid) return;
    setIsLoadingProjects(true);
    setIsLoadingUsers(true);
    try {
      const userProjects = await getProjectsForUser(currentUser.uid);
      setProjects(userProjects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      if (selectedProjectForMembers) {
        const updatedSelectedProject = userProjects.find(p => p.id === selectedProjectForMembers.id);
        if (updatedSelectedProject) {
          setSelectedProjectForMembers(updatedSelectedProject);
        } else {
          // Project was deleted or user lost access
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
      // Optimistic update
      setProjects(prevProjects => [newProject, ...prevProjects].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsCreateProjectDialogOpen(false);
      toast({ title: "Project Created!", description: `"${newProject.name}" has been successfully created.` });
      // No need to call fetchDashboardData() here due to optimistic update,
      // but if there were complex server-side changes, you might.
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not create project.";
      toast({ variant: "destructive", title: "Creation Failed", description: errorMessage });
    }
  };

  const handleEditProjectSubmit = async (data: { name: string; description?: string }) => {
    if (!projectToEdit || !currentUser || currentUser.uid !== projectToEdit.ownerId) {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only the project owner can edit details."});
      return;
    }
    setIsSubmittingProjectEdit(true);
    try {
      await updateProjectDetailsInDb(projectToEdit.id, data);
      toast({ title: "Project Updated", description: `"${data.name}" has been successfully updated.` });
      setIsEditProjectDialogOpen(false);
      setProjectToEdit(null);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error updating project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not update project.";
      toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
    } finally {
      setIsSubmittingProjectEdit(false);
    }
  };

  const openEditProjectDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsEditProjectDialogOpen(true);
  };

  const openDeleteProjectDialog = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete || !currentUser || currentUser.uid !== projectToDelete.ownerId) {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only the project owner can delete projects."});
      setProjectToDelete(null);
      return;
    }
    setIsDeletingProject(true);
    try {
      await deleteProjectFromDb(projectToDelete.id);
      toast({ title: "Project Deleted", description: `"${projectToDelete.name}" has been successfully deleted.` });
      setProjectToDelete(null);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error deleting project:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not delete project.";
      toast({ variant: "destructive", title: "Delete Failed", description: errorMessage });
    } finally {
      setIsDeletingProject(false);
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
              <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-2"> {/* Reduced pr slightly */}
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="bg-primary/5 hover:shadow-lg transition-shadow">
                      <CardHeader className="px-4 py-3 sm:px-4 sm:py-4 pb-3"> {/* Responsive padding */}
                        <div className="flex items-center w-full"> {/* Use items-center for vertical alignment if title wraps */}
                            <CardTitle className="text-lg min-w-0 break-words mr-2 flex-1"> {/* flex-1 makes title greedy */}
                                {project.name}
                            </CardTitle>
                            {currentUser?.uid === project.ownerId && (
                                <Badge variant="outline" className="ml-auto border-accent text-accent flex-shrink-0 whitespace-nowrap">
                                    <Crown className="mr-1.5 h-3.5 w-3.5" /> Owner
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2 min-h-[40px] break-words pt-1">{project.description || 'No description available.'}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col items-start space-y-3 px-4 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-2"> {/* Responsive padding */}
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
                        <div className="flex w-full flex-col sm:flex-row sm:flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/projects/${project.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" />View Board</Link>
                            </Button>
                            {currentUser?.uid === project.ownerId && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => openEditProjectDialog(project)}>
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openManageMembersDialog(project)}>
                                    <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Members
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => openDeleteProjectDialog(project)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
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
              <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-2 overflow-y-auto"> {/* Reduced pr slightly */}
                <ul className="space-y-3">
                  {allUsers.map((user) => (
                    <li key={user.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || user.email?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
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
      {projectToEdit && currentUser?.uid === projectToEdit.ownerId && (
        <EditProjectDialog
          isOpen={isEditProjectDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditProjectDialogOpen(isOpen);
            if (!isOpen) setProjectToEdit(null);
          }}
          project={projectToEdit}
          onEditProject={handleEditProjectSubmit}
          isSubmitting={isSubmittingProjectEdit}
        />
      )}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{projectToDelete?.name}" and all its tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)} disabled={isDeletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingProject}
            >
              {isDeletingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

