
/**
 * @fileOverview Genkit configuration and initialization.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI plugin.
// This ai object should be imported by flows.
export const ai = genkit({
  plugins: [googleAI()],
});
