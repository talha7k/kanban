"use server";

import { generateProjectTasks } from '@/ai/flows/generate-project-tasks';
import { addTaskToProject } from '@/lib/firebaseTask';
import { getProjectById } from '@/lib/firebaseProject';
import type { NewTaskData, Task } from '@/lib/types';
import { generateTaskDetails, type GenerateTaskDetailsInput, type GenerateTaskDetailsOutput } from '@/ai/flows/generate-task-details';

export async function generateTasksAction(projectId: string, brief: string, currentUserUid: string, taskCount: number = 3) {
  try {
    const generatedTasks = await generateProjectTasks(brief, taskCount);
    const project = await getProjectById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Return the generated tasks without adding them to the project
    return generatedTasks.map(taskData => ({
      title: taskData.title,
      description: taskData.description,
      priority: 'MEDIUM' as const,
      projectId,
      columnId: project.columns[0]?.id || 'todo',
      reporterId: currentUserUid,
      order: 0, // Will be set properly when adding to project
      assigneeUids: [],
      dueDate: null,
      tags: [],
      dependentTaskTitles: [],
    }));
  } catch (error) {
    console.error('Error in generateTasksAction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI project tasks. Please try again.');
  }
}

export async function addApprovedTasksAction(projectId: string, tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[], currentUserUid: string) {
  try {
    const project = await getProjectById(projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    let addedTasksCount = 0;
    for (const taskData of tasks) {
      try {
        await addTaskToProject(projectId, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          projectId: taskData.projectId,
          reporterId: taskData.reporterId,
          createdAt: new Date().toISOString(),
          order: project.tasks.length + addedTasksCount,
          assigneeUids: taskData.assigneeUids,
          dueDate: taskData.dueDate,
          tags: taskData.tags,
          dependentTaskTitles: taskData.dependentTaskTitles,
        }, taskData.columnId || project.columns[0]?.id || 'todo', currentUserUid);
        addedTasksCount++;
      } catch (error) {
        console.error('Error adding task:', error);
        // Continue with other tasks even if one fails
      }
    }

    // Fetch updated project
    const updatedProject = await getProjectById(projectId);

    return { 
      success: true, 
      addedTasksCount,
      updatedProject 
    };
  } catch (error) {
    console.error('Error in addApprovedTasksAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add tasks to project. Please try again.' 
    };
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