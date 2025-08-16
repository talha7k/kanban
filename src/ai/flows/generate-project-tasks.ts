import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateProjectTasksInputSchema = z.object({
  brief: z.string().describe('A brief description or list of requirements for the project tasks.'),
});

const GenerateProjectTasksOutputSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().describe('The title of the task.'),
    description: z.string().describe('A detailed description for the task.'),
  })).describe('An array of generated tasks.'),
});

export const generateProjectTasksFlow = ai.defineFlow(
  {
    name: 'generateProjectTasks',
    inputSchema: GenerateProjectTasksInputSchema,
    outputSchema: GenerateProjectTasksOutputSchema,
  },
  async input => {
    const prompt = `Based on the following brief, generate a list of distinct tasks for a project. Each task should have a concise title and a detailed description. Provide the output as a JSON array of objects with 'title' and 'description' keys.

Brief: ${input.brief}

Example Output:
[
  {
    "title": "Setup project environment",
    "description": "Initialize a new project, configure dependencies, and set up version control."
  },
  {
    "title": "Design database schema",
    "description": "Create an ER diagram and define tables, relationships, and data types for the project's database."
  }
]

Generated Tasks:`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'deepseek/deepseek-chat',
      config: { temperature: 0.7 },
    });

    const text = llmResponse.text;
    try {
      const parsedTasks = JSON.parse(text);
      // Basic validation to ensure it's an array of objects with title and description
      if (!Array.isArray(parsedTasks) || !parsedTasks.every(task => typeof task === 'object' && task !== null && 'title' in task && 'description' in task)) {
        throw new Error('Invalid JSON format from AI: Expected an array of objects with title and description.');
      }
      return { tasks: parsedTasks };
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', text, e);
      throw new Error('Failed to parse AI response for tasks. Please try again.');
    }
  }
);

export async function generateProjectTasks(brief: string) {
  const result = await generateProjectTasksFlow({ brief });
  return result.tasks;
}