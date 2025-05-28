import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-task-priority.ts';
import '@/ai/flows/rewrite-task-description.ts';
import '@/ai/flows/rewrite-comment.ts';
