import { config } from 'dotenv';
import { generateTaskDetails } from '@/ai/flows/generate-task-details';
import { generateProjectTasksFlow } from '@/ai/flows/generate-project-tasks';

// Genkit AI flows are defined and registered within their respective files.
// The 'configure' function is not directly exported or used in this manner for flow registration.
// Ensure that your Genkit setup correctly registers these flows, typically via a Genkit CLI command or a main Genkit entry point.