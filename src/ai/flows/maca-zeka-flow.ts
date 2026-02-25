
'use server';
/**
 * @fileOverview MaçaZeka AI Chat Flow.
 * Handles tracking queries using strict tool-based data retrieval.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';

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
    description: 'Veritabanından gerçek yük bilgilerini getirir. Sadece yük numarası varsa kullanılır.',
    inputSchema: z.object({ trackingNo: z.string() }),
    outputSchema: z.any(),
  },
  async ({ trackingNo }) => {
    const normalized = trackingNo.trim().toUpperCase();
    // Admin SDK kullanımı
    const snap = await adminDb.collection('publicShipments').doc(normalized).get();
    
    if (snap.exists && snap.data()?.active) {
      const d = snap.data();
      return {
        found: true,
        status: d?.publicStatusText,
        location: d?.publicLastSeenArea,
        eta: d?.eta ? (d.eta.toDate ? d.eta.toDate().toLocaleString('tr-TR') : d.eta) : 'Bilinmiyor'
      };
    }
    return { found: false };
  }
);

const prompt = ai.definePrompt({
  name: 'macaZekaPrompt',
  input: { schema: MacaZekaInputSchema },
  output: { schema: MacaZekaOutputSchema },
  tools: [getShipmentTool],
  prompt: `Sen MAÇA LOJİSTİK MERKEZİ'nin yapay zeka asistanı MaçaZeka'sın.
  
Kullanıcı mesajı: "{{{message}}}"

GÖREVLERİN:
1. Kullanıcı bir yük numarası (YUK-XXXX-YYYY formatında) verdiyse veya sorduysa, MUTLAKA getShipmentData aracını kullan.
2. Eğer yük bulunursa, sadece araçtan gelen bilgileri (durum, konum, ETA) nazikçe Türkçe olarak metinleştir.
3. KESİNLİKLE VERİ UYDURMA. Eğer araç "found: false" dönerse, yükün bulunamadığını ve numarayı kontrol etmesini söyle.
4. Eğer kullanıcı yük numarası yazmadıysa veya birşeyler sorduysa, nazikçe yük takibi için numarasını (Örn: YUK-2026-ABCD-1234) yazmasını iste.
5. Cevapların kısa, profesyonel ve sadece gerçek verilere dayalı olsun.

ÇIKTI FORMATI: { "reply": "Cevabınız buraya", "detectedTrackingNo": "Tespit edilen numara" }`,
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
