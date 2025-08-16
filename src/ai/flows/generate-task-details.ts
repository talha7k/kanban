"use server";

import { ai } from "@/ai/genkit";


import { z } from "zod";

const GenerateTaskDetailsInputSchema = z.object({
  briefInput: z.string().describe("A brief input or idea for the task."),
});
export type GenerateTaskDetailsInput = z.infer<
  typeof GenerateTaskDetailsInputSchema
>;

const GenerateTaskDetailsOutputSchema = z.object({
  title: z.string().describe("A concise and descriptive title for the task."),
  description: z
    .string()
    .describe(
      "A detailed description for the task, elaborating on the brief input."
    ),
});
export type GenerateTaskDetailsOutput = z.infer<
  typeof GenerateTaskDetailsOutputSchema
>;

export async function generateTaskDetails(
  input: GenerateTaskDetailsInput
): Promise<GenerateTaskDetailsOutput> {
  const prompt = `You are an AI assistant that helps in generating detailed task titles and descriptions from a brief input.

Given the following brief input, generate a concise title and a detailed description for a task.

Brief Input: ${input.briefInput}`;

  try {
    const llmResponse = await ai.generate({
      prompt: prompt,
      config: { temperature: 0.7 },
    });

    // Fallback to text parsing if structured output is not available
    const text = llmResponse.text || "";
    const parsedResult = JSON.parse(text);

    console.log("text:::::::::::", text);
    console.log("parsedResult:::::::::::", parsedResult);

    // Basic validation to ensure it has title and description
    if (!parsedResult.title || !parsedResult.description) {
      throw new Error(
        "Invalid JSON format from AI: Expected object with title and description."
      );
    }

    return {
      title: parsedResult.title,
      description: parsedResult.description,
    };
  } catch (e) {
    console.error("Failed to generate task details:", e);
    console.error("Error details:", {
      message: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : "No stack trace",
      type: typeof e,
      stringified: JSON.stringify(e, null, 2),
    });
    throw new Error("Failed to generate AI task details. Please try again.");
  }
}
