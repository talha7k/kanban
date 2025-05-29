
'use server';
/**
 * @fileOverview An AI agent to rewrite comments for tasks.
 *
 * - rewriteComment - A function that rewrites a comment.
 * - RewriteCommentInput - The input type for the rewriteComment function.
 * - RewriteCommentOutput - The return type for the rewriteComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RewriteCommentInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task the comment belongs to.'),
  currentCommentText: z.string().describe('The current text of the comment.'),
});
export type RewriteCommentInput = z.infer<typeof RewriteCommentInputSchema>;

const RewriteCommentOutputSchema = z.object({
  rewrittenComment: z.string().describe('The rewritten comment text.'),
});
export type RewriteCommentOutput = z.infer<typeof RewriteCommentOutputSchema>;

export async function rewriteComment(input: RewriteCommentInput): Promise<RewriteCommentOutput> {
  return rewriteCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteCommentPrompt',
  input: {schema: RewriteCommentInputSchema},
  output: {schema: RewriteCommentOutputSchema},
  prompt: `You are a helpful team member. Your goal is to rewrite the following comment to be more professional, constructive, or clearer.
Consider the task title for context.

Task Title: {{{taskTitle}}}
Current Comment Text:
{{{currentCommentText}}}

Rewrite the comment. Return only the rewritten comment text.
`,
});

const rewriteCommentFlow = ai.defineFlow(
  {
    name: 'rewriteCommentFlow',
    inputSchema: RewriteCommentInputSchema,
    outputSchema: RewriteCommentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
