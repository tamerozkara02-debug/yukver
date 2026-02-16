'use server';
/**
 * @fileOverview A logistics-focused AI assistant named MaçaZeka.
 *
 * - askMacazeka - A function that handles the chat interaction.
 * - MacazekaInput - The input type for the askMacazeka function.
 * - MacazekaOutput - The return type for the askMacazeka function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MacazekaInputSchema = z.string();
export type MacazekaInput = z.infer<typeof MacazekaInputSchema>;

const MacazekaOutputSchema = z.string();
export type MacazekaOutput = z.infer<typeof MacazekaOutputSchema>;


// Use a lazy-initialized variable for the flow. This will act as a cache.
let _macazekaFlow: any = null;

/**
 * Initializes and returns the Genkit flow.
 * The flow is only defined once and only if the API key is present.
 * This prevents the app from crashing on startup.
 */
function getInitializedFlow() {
  // If flow is already initialized, return it from the cache.
  if (_macazekaFlow) {
    return _macazekaFlow;
  }

  // If the API key is not set, we cannot initialize the flow.
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  // Define the flow and cache it.
  _macazekaFlow = ai.defineFlow(
    {
      name: 'macazekaFlow',
      inputSchema: MacazekaInputSchema,
      outputSchema: MacazekaOutputSchema,
    },
    async (prompt) => {
      try {
        const response = await ai.generate({
          model: 'gemini-1.0-pro',
          prompt: `Senin adın MaçaZeka ve sen bir lojistik uzmanısın. Yalnızca lojistik, nakliye, taşımacılık ve ilgili konulardaki soruları yanıtla. Başka herhangi bir konuda soru sorulursa, kibarca sadece lojistik konularında yardımcı olabileceğini belirt.

Kullanıcının sorusu: ${prompt}`
        });
        return response.text ?? "Üzgünüm, modelden bir cevap alamadım.";
      } catch (e: any) {
        console.error("MaçaZeka flow error:", e);
        // Return the error message to the user to help diagnose API key or configuration issues.
        return `Bir hata oluştu: ${e.message}`;
      }
    }
  );
  
  return _macazekaFlow;
}


export async function askMacazeka(input: MacazekaInput): Promise<MacazekaOutput> {
    const flow = getInitializedFlow();

    // If the flow is not available (e.g., API key is missing), return an informative message.
    if (!flow) {
        console.warn("MaçaZeka called, but GEMINI_API_KEY is not set.");
        return "Üzgünüm, MaçaZeka özelliği şu anda etkin değil. Lütfen site yöneticisiyle iletişime geçin (API Anahtarı eksik).";
    }

    // Execute the flow.
    return await flow(input);
}
