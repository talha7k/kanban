"use client";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { Project, UserProfile, NewTaskData, Task } from "@/lib/types";
import { useEffect, useState } from "react";
import { getAllUserProfiles } from "@/lib/firebaseUser";
import { getProjectById, updateProjectDetails } from "@/lib/firebaseProject";
import { addTaskToProject } from "@/lib/firebaseTask";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditProjectDialog } from "@/components/project/EditProjectDialog";
import { DeleteProjectAlertDialog } from "@/components/dashboard/DeleteProjectAlertDialog";
import { GenerateTasksDialog } from "@/components/project/GenerateTasksDialog";
import {
  generateTasksAction,
  addApprovedTasksAction,
} from "@/app/actions/project";
import { useParams } from "next/navigation";
export default function ProjectPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isSubmittingProjectEdit, setIsSubmittingProjectEdit] = useState(false);
  const [isGenerateTasksDialogOpen, setIsGenerateTasksDialogOpen] =
    useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  useEffect(() => {
    if (projectId && currentUser) {
      const fetchProjectData = async () => {
        setIsLoadingProject(true);
        setIsLoadingUsers(true);
        setError(null);
        try {
          const [fetchedProject, fetchedUsers] = await Promise.all([
            getProjectById(projectId as string),
            getAllUserProfiles(),
          ]);

          if (fetchedProject) {
            const isMember =
              fetchedProject.memberIds?.includes(currentUser.uid) ||
              fetchedProject.ownerId === currentUser.uid;
            if (isMember) {
              setProject(fetchedProject);
            } else {
              setError(`You do not have access to project ${projectId}.`);
              setProject(null);
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: `You do not have permission to view this project.`,
              });
            }
          } else {
            setError(`Project with ID ${projectId} not found.`);
            setProject(null);
            toast({
              variant: "destructive",
              title: "Project Not Found",
              description: `Could not load project ${projectId}.`,
            });
          }
          setUsers(fetchedUsers);
        } catch (err) {
          console.error("Error fetching project data:", err);
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred.";
          setError(errorMessage);
          toast({
            variant: "destructive",
            title: "Error Loading Project",
            description: errorMessage,
          });
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
  }, [projectId, currentUser, toast]); // Keep params.projectId as dependency

  const openDeleteProjectDialog = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !currentUser || currentUser.uid !== projectToDelete.ownerId) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only the project owner can delete a project.",
      });
      return;
    }

    setIsDeletingProject(true);
    try {
      // Assuming you have a deleteProject function in firebaseProject.ts
      // await deleteProject(projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" has been successfully deleted.`, 
      });
      // Redirect to dashboard or appropriate page after deletion
      // router.push('/team-dashboard'); // You might need to import useRouter from 'next/navigation'
    } catch (error) {
      console.error("Error deleting project:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Could not delete project.";
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: errorMessage,
      });
    } finally {
      setIsDeletingProject(false);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleEditProjectSubmit = async (data: {
    name: string;
    description?: string;
    teamId?: string | null;
  }) => {
    if (!project || !currentUser || currentUser.uid !== project.ownerId) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only the project owner can edit details.",
      });
      return;
    }
    setIsSubmittingProjectEdit(true);
    try {
      const updatedProject = await updateProjectDetails(project.id, data);
      setProject(updatedProject);
      toast({
        title: "Project Updated",
        description: `"${updatedProject.name}" has been successfully updated.`,
      });
      setIsEditProjectDialogOpen(false);
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

  const handleGenerateTasks = async (brief: string, taskCount: number) => {
    if (!project) return [];
    setIsGeneratingTasks(true);
    try {
      const generatedTasks = await generateTasksAction(
        project.id,
        brief,
        currentUser!.uid,
        taskCount
      );
      return generatedTasks;
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Tasks",
        description:
          error instanceof Error ? error.message : "Could not generate tasks.",
      });
      return [];
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleAddTasks = async (
    tasks: Omit<Task, "id" | "projectId" | "createdAt" | "updatedAt">[]
  ) => {
    if (!project) return;
    setIsAddingTasks(true);
    try {
      // Add projectId to each task
      const tasksWithProjectId = tasks.map((task) => ({
        ...task,
        projectId: project.id,
      }));
      const result = await addApprovedTasksAction(
        project.id,
        tasksWithProjectId,
        currentUser!.uid
      );

      if (result.success) {
        if (result.updatedProject) {
          setProject(result.updatedProject);
        }
        toast({
          title: "Tasks Added",
          description: `Successfully added ${result.addedTasksCount} task${
            result.addedTasksCount !== 1 ? "s" : ""
          } to your project.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error adding tasks:", error);
      toast({
        variant: "destructive",
        title: "Error Adding Tasks",
        description:
          error instanceof Error
            ? error.message
            : "Could not add tasks to project.",
      });
    } finally {
      setIsAddingTasks(false);
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
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Try Reloading
        </Button>
        <Link href="/team-dashboard" passHref>
          <Button variant="link" className="mt-2">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <p className="text-lg">Project not found or you do not have access.</p>
        <Link href="/team-dashboard" passHref>
          <Button variant="link" className="mt-2">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-card">
        <div className="container mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link href="/team-dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex flex-col ">
                <h1 className="text-2xl font-bold text-card-foreground">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {currentUser?.uid === project.ownerId && (
                  <>
                    <Button
                      variant="yellow"
                      onClick={() => setIsEditProjectDialogOpen(true)}
                      className="md:mr-2 mb-2 sm:mb-0"
                      disabled={isSubmittingProjectEdit}
                    >
                      <Settings className="h-5 w-5" />
                      Edit Project
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setIsGenerateTasksDialogOpen(true)}
                      className="mb-2 sm:mb-0"
                      disabled={isSubmittingProjectEdit}
                    >
                      <Sparkles className="h-5 w-5" /> Generate Tasks
                    </Button>
                  </>
                )}
              </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {" "}
        {/* Allows KanbanBoard to take remaining height */}
        <KanbanBoard project={project} users={users} />
      </div>
      {currentUser?.uid === project.ownerId && project && (
        <EditProjectDialog
          isOpen={isEditProjectDialogOpen}
          onOpenChange={setIsEditProjectDialogOpen}
          project={project}
          onEditProject={handleEditProjectSubmit}
          onDeleteProject={openDeleteProjectDialog}
          isSubmitting={isSubmittingProjectEdit}
        />
      )}

      {projectToDelete && (
        <DeleteProjectAlertDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          projectName={projectToDelete.name}
          onConfirmDelete={handleDeleteProject}
          isDeleting={isDeletingProject}
        />
      )}

      {project && (
        <GenerateTasksDialog
          isOpen={isGenerateTasksDialogOpen}
          onOpenChange={setIsGenerateTasksDialogOpen}
          onGenerate={handleGenerateTasks}
          onAddTasks={handleAddTasks}
          isGenerating={isGeneratingTasks}
          isAddingTasks={isAddingTasks}
        />
      )}
    </div>
  );
}
