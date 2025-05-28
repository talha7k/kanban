'use server';
/**
 * @fileOverview An AI agent to rewrite task descriptions.
 *
 * - rewriteTaskDescription - A function that rewrites a task description.
 * - RewriteTaskDescriptionInput - The input type for the rewriteTaskDescription function.
 * - RewriteTaskDescriptionOutput - The return type for the rewriteTaskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RewriteTaskDescriptionInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
  currentDescription: z.string().describe('The current description of the task.'),
});
export type RewriteTaskDescriptionInput = z.infer<typeof RewriteTaskDescriptionInputSchema>;

export const RewriteTaskDescriptionOutputSchema = z.object({
  rewrittenDescription: z.string().describe('The rewritten task description.'),
});
export type RewriteTaskDescriptionOutput = z.infer<typeof RewriteTaskDescriptionOutputSchema>;

export async function rewriteTaskDescription(input: RewriteTaskDescriptionInput): Promise<RewriteTaskDescriptionOutput> {
  return rewriteTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteTaskDescriptionPrompt',
  input: {schema: RewriteTaskDescriptionInputSchema},
  output: {schema: RewriteTaskDescriptionOutputSchema},
  prompt: `You are a helpful project assistant. Your goal is to rewrite the following task description to be clearer, more concise, or provide more actionable detail.
Consider the task title for context. If the current description is empty, try to generate a good starting description based on the title.

Task Title: {{{taskTitle}}}
Current Description:
{{{currentDescription}}}

Rewrite the description. Return only the rewritten description.
`,
});

const rewriteTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'rewriteTaskDescriptionFlow',
    inputSchema: RewriteTaskDescriptionInputSchema,
    outputSchema: RewriteTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
