'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskDetailsInputSchema = z.object({
  briefInput: z.string().describe('A brief input or idea for the task.'),
});
export type GenerateTaskDetailsInput = z.infer<typeof GenerateTaskDetailsInputSchema>;

const GenerateTaskDetailsOutputSchema = z.object({
  title: z.string().describe('A concise and descriptive title for the task.'),
  description: z.string().describe('A detailed description for the task, elaborating on the brief input.'),
});
export type GenerateTaskDetailsOutput = z.infer<typeof GenerateTaskDetailsOutputSchema>;

export async function generateTaskDetails(input: GenerateTaskDetailsInput): Promise<GenerateTaskDetailsOutput> {
  return generateTaskDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskDetailsPrompt',
  input: {schema: GenerateTaskDetailsInputSchema},
  output: {schema: GenerateTaskDetailsOutputSchema},
  prompt: `You are an AI assistant that helps in generating detailed task titles and descriptions from a brief input.\n\nGiven the following brief input, generate a concise title and a detailed description for a task.\n\nBrief Input: {{{briefInput}}}`,
});

const generateTaskDetailsFlow = ai.defineFlow(
  {
    name: 'generateTaskDetailsFlow',
    inputSchema: GenerateTaskDetailsInputSchema,
    outputSchema: GenerateTaskDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);