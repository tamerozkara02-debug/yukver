
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Basit IP bazlı rate limit için bellek içi saklama (Production'da Redis önerilir)
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();
const LIMIT = 20;
const WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const userLimit = rateLimitMap.get(ip);
  if (userLimit) {
    if (now - userLimit.timestamp < WINDOW_MS) {
      if (userLimit.count >= LIMIT) {
        return NextResponse.json({ error: 'Çok fazla deneme yaptınız. Lütfen 1 dakika bekleyin.' }, { status: 429 });
      }
      userLimit.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
  }

  try {
    const { trackingNo } = await request.json();
    if (!trackingNo) {
      return NextResponse.json({ error: 'Takip numarası gerekli.' }, { status: 400 });
    }

    const normalizedNo = trackingNo.trim().toUpperCase();
    const { firestore } = initializeFirebase();
    const shipmentRef = doc(firestore, 'publicShipments', normalizedNo);
    const shipmentSnap = await getDoc(shipmentRef);

    if (!shipmentSnap.exists()) {
      return NextResponse.json({ error: 'Yük bulunamadı.' }, { status: 404 });
    }

    const data = shipmentSnap.data();
    if (!data.active) {
      return NextResponse.json({ error: 'Yük bulunamadı veya takip kapalı.' }, { status: 404 });
    }

    // Sadece public alanları döndür
    return NextResponse.json({
      trackingNo: data.trackingNo,
      status: data.status,
      publicStatusText: data.publicStatusText,
      publicLastSeenArea: data.publicLastSeenArea,
      eta: data.eta,
      updatedAt: data.updatedAt
    });

  } catch (error) {
    console.error('Public track error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
