'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const GenerateProjectTasksInputSchema = z.object({
  brief: z.string().describe('A brief description or list of requirements for the project tasks.'),
});
export type GenerateProjectTasksInput = z.infer<
  typeof GenerateProjectTasksInputSchema
>;
const GenerateProjectTasksOutputSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().describe('The title of the task.'),
    description: z.string().describe('A detailed description for the task.'),
  })).describe('An array of generated tasks.'),
});

const prompt = ai.definePrompt({
  name: 'generateProjectTasksPrompt',
  input: {schema: GenerateProjectTasksInputSchema},
  output: {schema: GenerateProjectTasksOutputSchema},
  prompt: `Based on the following brief, generate a list of distinct tasks for a project. Each task should have a concise title and a detailed description.\n\nBrief: {{{brief}}}\n`,
});

export const generateProjectTasksFlow = ai.defineFlow(
  {
    name: 'generateProjectTasks',
    inputSchema: GenerateProjectTasksInputSchema,
    outputSchema: GenerateProjectTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateProjectTasks(brief: string) {
  const result = await generateProjectTasksFlow({ brief });
  return result.tasks;
}