import {genkit} from 'genkit';
import deepseek, { deepseekChat } from 'genkitx-deepseek';

export const ai = genkit({
  plugins: [deepseek({ apiKey: process.env.DEEPSEEK_API_KEY })],
  model: deepseekChat,
});
