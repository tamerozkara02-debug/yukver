import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Next.js, .env dosyasındaki değişkenleri otomatik olarak 'process.env' içine yükler.
// Bu yüzden ek bir pakete gerek yoktur.

export const ai = genkit({
  plugins: [googleAI({
    // API anahtarı, projenin ana dizinindeki .env dosyasından okunur.
    // Eğer anahtarı doğrudan buraya yazmak isterseniz, aşağıdaki satırı kullanabilirsiniz:
    // apiKey: "SIZIN_API_ANAHTARINIZ"
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
