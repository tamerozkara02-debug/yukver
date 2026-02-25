
'use server';
/**
 * @fileOverview MaçaZeka AI Chat Flow.
 * Handles tracking queries and operational assistance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const MacaZekaInputSchema = z.object({
  message: z.string().describe('The user message.'),
  userContext: z.object({
    uid: z.string().optional(),
    role: z.string().optional(),
    isLoggedIn: z.boolean()
  }).optional(),
});

const MacaZekaOutputSchema = z.object({
  reply: z.string().describe('The AI reply text.'),
  detectedTrackingNo: z.string().optional().describe('Detected YUK- pattern tracking number.'),
});

const getShipmentTool = ai.defineTool(
  {
    name: 'getShipmentData',
    description: 'Yük numarasını (YUK-...) kullanarak yük bilgilerini getirir.',
    inputSchema: z.object({ trackingNo: z.string() }),
    outputSchema: z.any(),
  },
  async ({ trackingNo }) => {
    const { firestore } = initializeFirebase();
    const normalized = trackingNo.trim().toUpperCase();
    const snap = await getDoc(doc(firestore, 'publicShipments', normalized));
    if (snap.exists() && snap.data().active) {
      const d = snap.data();
      return {
        status: d.publicStatusText,
        location: d.publicLastSeenArea,
        eta: d.eta ? new Date(d.eta.seconds * 1000).toLocaleString('tr-TR') : 'Bilinmiyor'
      };
    }
    return null;
  }
);

const prompt = ai.definePrompt({
  name: 'macaZekaPrompt',
  input: { schema: MacaZekaInputSchema },
  output: { schema: MacaZekaOutputSchema },
  tools: [getShipmentTool],
  prompt: `Sen MAÇA LOJİSTİK MERKEZİ'nin yapay zeka asistanı MaçaZeka'sın.
  
Kullanıcı mesajı: "{{{message}}}"
Kullanıcı Durumu: {{#if userContext.isLoggedIn}}Giriş Yapmış (Rol: {{userContext.role}}){{else}}Giriş Yapmamış{{/if}}

GÖREVLERİN:
1. Kullanıcı bir yük numarası (YUK-XXXX-YYYY formatında) paylaştıysa getShipmentData aracını kullan.
2. Eğer yük bilgisi bulunursa, nazikçe durumu, konumu ve tahmini varış süresini Türkçe olarak bildir.
3. Eğer yük numarası yoksa ve kullanıcı giriş yapmamışsa, takip için yük numarasını yazmasını iste.
4. SADECE sana verilen araçlardan gelen verilere dayanarak konuş. Veri uydurma.
5. Cevapların kısa, profesyonel ve yardımcı olsun.

ÇIKTI: JSON formatında { "reply": "...", "detectedTrackingNo": "..." }`,
});

export async function chatWithMacaZeka(input: z.infer<typeof MacaZekaInputSchema>) {
  return macaZekaFlow(input);
}

const macaZekaFlow = ai.defineFlow(
  {
    name: 'macaZekaFlow',
    inputSchema: MacaZekaInputSchema,
    outputSchema: MacaZekaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
