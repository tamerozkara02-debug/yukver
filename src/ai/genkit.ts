import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Next.js, .env dosyasındaki değişkenleri otomatik olarak 'process.env' içine yükler.
// Bu yüzden ek bir pakete gerek yoktur.
// API anahtarınız artık projenizin ana dizinindeki .env dosyasından okunacaktır.

export const ai = genkit({
  plugins: [googleAI({
    // LÜTFEN DİKKAT:
    // API anahtarınız artık doğrudan kodun içinde değil, .env dosyasındaki
    // GEMINI_API_KEY değişkeninden alınıyor. Bu çok daha güvenli bir yöntemdir.
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
