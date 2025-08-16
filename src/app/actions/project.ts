"use server";

import { generateProjectTasks } from '@/ai/flows/generate-project-tasks';
import { addTaskToProject } from '@/lib/firebaseTask';
import { getProjectById } from '@/lib/firebaseProject';
import type { NewTaskData } from '@/lib/types';
import { generateTaskDetails, type GenerateTaskDetailsInput, type GenerateTaskDetailsOutput } from '@/ai/flows/generate-task-details';

export async function generateTasksAction(projectId: string, brief: string, currentUserUid: string) {
  try {
    const generatedTasks = await generateProjectTasks(brief);
    const project = await getProjectById(projectId);

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    for (const task of generatedTasks) {
      const defaultColumnId = project.columns[0]?.id;
      if (defaultColumnId) {
        const newTaskPayload: NewTaskData = {
          title: task.title,
          description: task.description,
          projectId: project.id,
          reporterId: currentUserUid,
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          order: 0,
        };
        await addTaskToProject(project.id, newTaskPayload, defaultColumnId);
      }
    }

    // Re-fetch project data to update the UI with new tasks
    const updatedProject = await getProjectById(projectId);
    return { success: true, generatedTasksCount: generatedTasks.length, updatedProject };
  } catch (error) {
    console.error("Error generating tasks in server action:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during task generation." };
  }
}

export async function generateTaskDetailsAction(input: GenerateTaskDetailsInput): Promise<{ success: boolean; details?: GenerateTaskDetailsOutput; error?: string }> {
  try {
    const details = await generateTaskDetails(input);
    console.log("Generated task details:", details);
    return { success: true, details };
  } catch (error) {
    console.error("Error generating AI task details in server action:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}