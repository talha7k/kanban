"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NewProjectData, Project, UserProfile } from "@/lib/types";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { ManageProjectMembersDialog } from "@/components/dashboard/ManageProjectMembersDialog";
import {
  PlusCircle,
  FolderKanban,
  Loader2,
  Briefcase,
  Settings2,
  Eye,
  Crown,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useAuth } from "@/hooks/useAuth";
import { getProjectsForTeam } from "@/lib/firebaseProject";

import { deleteProject as deleteProjectFromDb } from "@/lib/firebaseProject";
import { updateProjectDetails } from "@/lib/firebaseProject";
import { createProject as createProjectInDb } from "@/lib/firebaseProject";
import { getTeamMembers, getTeam } from "@/lib/firebaseTeam";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EditProjectDialog } from "@/components/project/EditProjectDialog";

import { TeamId, Team } from "@/lib/types";
import TeamSelection from "@/components/teams/TeamSelection";
import { LazyTeamUsersCard } from "@/components/teams/LazyTeamUsersCard";
import { DeleteProjectAlertDialog } from "@/components/dashboard/DeleteProjectAlertDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] =
    useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] =
    useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmittingProjectEdit, setIsSubmittingProjectEdit] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<TeamId | null>(null);
  const [isLoadingTeamId, setIsLoadingTeamId] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Load selected team from localStorage on mount
  useEffect(() => {
    const loadTeamId = () => {
      const storedTeamId = localStorage.getItem("selectedTeamId");
      if (storedTeamId) {
        setSelectedTeamId(storedTeamId as TeamId);
      }
      setIsLoadingTeamId(false);
    };

    // Add a small delay to ensure localStorage is available
    setTimeout(loadTeamId, 50);
  }, []);

  const handleTeamSelected = useCallback((teamId: TeamId) => {
    setSelectedTeamId(teamId);
    localStorage.setItem("selectedTeamId", teamId);
  }, []);

  const handleTeamCreated = useCallback((teamId: TeamId) => {
    setSelectedTeamId(teamId);
    localStorage.setItem("selectedTeamId", teamId);
  }, []);

  // Fetch projects first for immediate display
  const fetchProjects = async () => {
    if (!currentUser?.uid || !selectedTeamId) return;
    setIsLoadingProjects(true);

    try {
      const teamProjects = await getProjectsForTeam(selectedTeamId);
      setProjects(teamProjects);

      if (selectedProjectForMembers) {
        const updatedSelectedProject = teamProjects.find(
          (p: Project) => p.id === selectedProjectForMembers.id
        );
        if (updatedSelectedProject) {
          setSelectedProjectForMembers(updatedSelectedProject);
        } else {
          setIsManageMembersDialogOpen(false);
          setSelectedProjectForMembers(null);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load projects.",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch team details for the header (minimal data)
  const fetchTeamDetails = async () => {
    if (!currentUser?.uid || !selectedTeamId) return;

    try {
      const team = await getTeam(selectedTeamId);
      setSelectedTeam(team);
    } catch (error) {
      console.error("Error fetching team details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load team details.",
      });
    }
  };

  // Legacy function for backward compatibility
  const fetchDashboardData = async () => {
    await Promise.all([fetchProjects(), fetchTeamDetails()]);
  };

  useEffect(() => {
    if (currentUser?.uid && selectedTeamId) {
      // Load projects immediately for better perceived performance
      fetchProjects();
      
      // Load team details with a slight delay to prioritize projects
      const timer = setTimeout(() => {
        fetchTeamDetails();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser?.uid, selectedTeamId]);

  const handleAddProject = async (projectData: NewProjectData) => {
    if (!currentUser?.uid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a project.",
      });
      return;
    }
    if (!selectedTeamId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a team before creating a project.",
      });
      return;
    }
    try {
      const newProject = await createProjectInDb(
        projectData,
        currentUser.uid,
        selectedTeamId
      );

      setProjects((prevProjects) =>
        [newProject, ...prevProjects].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setIsCreateProjectDialogOpen(false);

      toast({
        title: "Project Created!",
        description: `"${newProject.name}" has been successfully created.`,
      });

      // No need to call fetchDashboardData immediately due to optimistic update
      // await fetchDashboardData();
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Could not create project.";
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: errorMessage,
      });
    }
  };

  const handleEditProjectSubmit = async (data: {
    name: string;
    description?: string;
    teamId?: TeamId | null;
  }) => {
    if (
      !projectToEdit ||
      !currentUser ||
      currentUser.uid !== projectToEdit.ownerId
    ) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only the project owner can edit details.",
      });
      return;
    }
    setIsSubmittingProjectEdit(true);
    try {
      await updateProjectDetails(projectToEdit.id, data);
      toast({
        title: "Project Updated",
        description: `"${data.name}" has been successfully updated.`,
      });
      setIsEditProjectDialogOpen(false);
      setProjectToEdit(null);
      await fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Could not update project.";
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      });
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
    if (
      !projectToDelete ||
      !currentUser ||
      currentUser.uid !== projectToDelete.ownerId
    ) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only the project owner can delete projects.",
      });
      setProjectToDelete(null);
      return;
    }
    setIsDeletingProject(true);
    try {
      await deleteProjectFromDb(projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" has been successfully deleted.`,
      });
      setProjectToDelete(null);
      await fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Could not delete project.";
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: errorMessage,
      });
    } finally {
      setIsDeletingProject(false);
    }
  };

  const openManageMembersDialog = (project: Project) => {
    if (!project || !project.id) {
      console.error(
        "Attempted to manage members for an invalid project:",
        project
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot manage members for this project.",
      });
      return;
    }
    setSelectedProjectForMembers(project);
    setIsManageMembersDialogOpen(true);
  };

  const openViewMembersDialog = (project: Project) => {
    setSelectedProjectForMembers(project);
  };

  const onMembersUpdated = async () => {
    if (currentUser?.uid) {
      // Refresh projects when members are updated
      await fetchProjects();
    }
  };

  // Show loading while checking for selectedTeamId
  if (isLoadingTeamId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (!selectedTeamId) {
    return (
      <TeamSelection
        onTeamSelected={handleTeamSelected}
        onTeamCreated={handleTeamCreated}
      />
    );
  }

  return (
    <div className="mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-row flex-wrap  justify-between items-center mb-8 gap-4">
        <div className="flex">
          <h1 className="text-3xl font-bold">
            {selectedTeam?.name || "Dashboard"}
          </h1>
        </div>
        <div className="flex flex-row items-center  gap-4 mx-auto md:mx-0">
          {currentUser && (
            <Button onClick={() => setIsCreateProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Project
            </Button>
          )}{" "}
          <Link href="/teams">
            <Button variant="secondary">
              <Users className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FolderKanban className="mr-3 h-7 w-7 text-primary" />
              Projects (
              {isLoadingProjects ? (
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
              ) : (
                projects.length
              )}
              )
            </CardTitle>
            <CardDescription>
              Manage your ongoing and upcoming projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : projects.length > 0 ? (
              <ScrollArea className="h-auto max-h-[450px] md:max-h-[500px] overflow-y-auto overflow-x-auto">
                <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:space-y-0">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUserUid={currentUser?.uid}
                      allUsers={allUsers}
                      openEditProjectDialog={openEditProjectDialog}
                      openManageMembersDialog={openManageMembersDialog}
                      openDeleteProjectDialog={openDeleteProjectDialog}
                      openViewMembersDialog={openViewMembersDialog}
                     />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No projects yet. Click "Create New Project" to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <LazyTeamUsersCard
          selectedTeamId={selectedTeamId}
          selectedProject={selectedProjectForMembers}
          onClearSelectedProject={() => setSelectedProjectForMembers(null)}
          onUsersLoaded={setAllUsers}
        />
      </div>

      {currentUser && (
        <CreateProjectDialog
          isOpen={isCreateProjectDialogOpen}
          onOpenChange={setIsCreateProjectDialogOpen}
          onAddProject={handleAddProject}
        />
      )}
      {selectedProjectForMembers &&
        currentUser?.uid === selectedProjectForMembers.ownerId && (
          <ManageProjectMembersDialog
            key={
              selectedProjectForMembers.id +
              (selectedProjectForMembers.memberIds?.join("") || "") +
              JSON.stringify(selectedProjectForMembers.memberRoles || {})
            }
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
          onDeleteProject={openDeleteProjectDialog}
        />
      )}
      <DeleteProjectAlertDialog
        projectToDelete={projectToDelete}
        isDeletingProject={isDeletingProject}
        setProjectToDelete={setProjectToDelete}
        confirmDeleteProject={confirmDeleteProject}
      />
    </div>
  );
}
