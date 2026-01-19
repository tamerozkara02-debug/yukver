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


export async function askMacazeka(input: MacazekaInput): Promise<MacazekaOutput> {
    return await macazekaFlow(input);
}

const macazekaFlow = ai.defineFlow(
  {
    name: 'macazekaFlow',
    inputSchema: MacazekaInputSchema,
    outputSchema: MacazekaOutputSchema,
  },
  async (prompt) => {
    try {
        const response = await ai.generate({
            model: 'gemini-pro',
            prompt: `Senin adın MaçaZeka ve sen bir lojistik uzmanısın. Yalnızca lojistik, nakliye, taşımacılık ve ilgili konulardaki soruları yanıtla. Başka herhangi bir konuda soru sorulursa, kibarca sadece lojistik konularında yardımcı olabileceğini belirt.

Kullanıcının sorusu: ${prompt}`
        });
        return response.text ?? "Üzgünüm, modelden bir cevap alamadım.";
    } catch (e: any) {
        console.error("MaçaZeka flow error:", e);
        // Hata mesajını kullanıcıya göstermek için döndür.
        // Bu, API anahtarı veya yapılandırma sorunlarını teşhis etmeye yardımcı olabilir.
        return `Bir hata oluştu: ${e.message}`;
    }
  }
);
