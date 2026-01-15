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
    const { output } = await ai.generate({
        prompt: `Senin adın MaçaZeka ve sen bir lojistik uzmanısın. Yalnızca lojistik, nakliye, taşımacılık ve ilgili konulardaki soruları yanıtla. Başka herhangi bir konuda soru sorulursa, kibarca sadece lojistik konularında yardımcı olabileceğini belirt.

Kullanıcının sorusu: ${prompt}`
    });
    return output ?? "Üzgünüm, şu an bir cevap veremiyorum.";
  }
);
