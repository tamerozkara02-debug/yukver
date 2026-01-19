import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Next.js, .env dosyasındaki değişkenleri otomatik olarak 'process.env' içine yükler.
// Bu yüzden ek bir pakete gerek yoktur.

export const ai = genkit({
  plugins: [googleAI({
    // LÜTFEN DİKKAT:
    // MaçaZeka'yı çalıştırmak için Google AI Studio'dan aldığınız API anahtarını
    // aşağıdaki tırnak işaretlerinin arasına yapıştırın.
    apiKey: "YAPI_ANAHTARINIZI_BURAYA_YAPISTIRIN",
  })],
});
