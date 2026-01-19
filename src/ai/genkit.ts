import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    // 1. ADIM: API Anahtarınızı aşağıdaki tırnak işaretlerinin arasına yapıştırın.
    apiKey: "YAPI_ANAHTARINIZI_BURAYA_YAPISTIRIN",
    // 2. ADIM: Dosyayı kaydedin. Hepsi bu kadar!

    // Specify the API version.
    apiVersion: 'v1beta',
  })],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
