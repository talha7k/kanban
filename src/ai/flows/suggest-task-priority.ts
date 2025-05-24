'use server';

/**
 * @fileOverview An AI agent to suggest task priorities based on deadlines and dependencies.
 *
 * - suggestTaskPriority - A function that suggests task priorities.
 * - SuggestTaskPriorityInput - The input type for the suggestTaskPriority function.
 * - SuggestTaskPriorityOutput - The return type for the suggestTaskPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPriorityInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
  taskDescription: z.string().describe('The description of the task.'),
  taskDueDate: z.string().describe('The due date of the task (YYYY-MM-DD).'),
  dependentTaskTitles: z.array(z.string()).describe('Titles of tasks that must be completed before this task can start.'),
});
export type SuggestTaskPriorityInput = z.infer<typeof SuggestTaskPriorityInputSchema>;

const SuggestTaskPriorityOutputSchema = z.object({
  suggestedPriority: z
    .string()
    .describe(
      'The suggested priority for the task, which should be one of: HIGH, MEDIUM, LOW. Explain the reasoning for the suggestion.'
    ),
});
export type SuggestTaskPriorityOutput = z.infer<typeof SuggestTaskPriorityOutputSchema>;

export async function suggestTaskPriority(input: SuggestTaskPriorityInput): Promise<SuggestTaskPriorityOutput> {
  return suggestTaskPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPriorityPrompt',
  input: {schema: SuggestTaskPriorityInputSchema},
  output: {schema: SuggestTaskPriorityOutputSchema},
  prompt: `You are an AI assistant helping project managers determine task priorities.\n\nGiven the following task information, suggest a priority (HIGH, MEDIUM, or LOW) and explain your reasoning.\n\nTask Title: {{{taskTitle}}}\nTask Description: {{{taskDescription}}}\nTask Due Date: {{{taskDueDate}}}\nDependent Tasks: {{#each dependentTaskTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}\n\nConsider the due date and any dependent tasks when determining the priority. Tasks with earlier due dates and many dependencies should be prioritized higher.\n\nSuggested Priority:`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: SuggestTaskPriorityInputSchema,
    outputSchema: SuggestTaskPriorityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
