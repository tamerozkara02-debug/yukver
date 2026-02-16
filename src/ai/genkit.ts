'use server';
import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Next.js, .env dosyasındaki değişkenleri otomatik olarak 'process.env' içine yükler.
// Bu yüzden ek bir pakete gerek yoktur.
// API anahtarınız artık projenizin ana dizinindeki .env dosyasından okunacaktır.

const plugins: GenkitPlugin[] = [];

if (process.env.GEMINI_API_KEY) {
    plugins.push(googleAI({
        // LÜTFEN DİKKAT:
        // API anahtarınız artık doğrudan kodun içinde değil, .env dosyasındaki
        // GEMINI_API_KEY değişkeninden alınıyor. Bu çok daha güvenli bir yöntemdir.
        apiKey: process.env.GEMINI_API_KEY,
    }));
} else {
    // Projenin .env dosyasında bir anahtar olmadığında geliştirici konsolunda bir uyarı göster.
    // Bu, uygulamanın çökmesini önler.
    console.warn("\n!!! UYARI: GEMINI_API_KEY bulunamadı. !!!");
    console.warn("Yapay zeka (MaçaZeka) özellikleri devre dışı bırakıldı.");
    console.warn("Bu özellikleri etkinleştirmek için lütfen projenizin ana dizinindeki '.env' dosyasına GEMINI_API_KEY='YOUR_API_KEY' satırını ekleyin.");
    console.warn("Google AI Studio'dan bir anahtar alabilirsiniz: https://aistudio.google.com/app/apikey\n");
}


export const ai = genkit({
  plugins,
});
