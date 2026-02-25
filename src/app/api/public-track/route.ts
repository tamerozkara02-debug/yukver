
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// IP bazlı basit rate limit
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
    if (!trackingNo || typeof trackingNo !== 'string') {
      return NextResponse.json({ error: 'Geçersiz takip numarası.' }, { status: 400 });
    }

    const normalizedNo = trackingNo.trim().toUpperCase();
    
    // Admin SDK kullanarak kural kısıtlamalarını baypas ediyoruz
    const shipmentRef = adminDb.collection('publicShipments').doc(normalizedNo);
    const shipmentSnap = await shipmentRef.get();

    if (!shipmentSnap.exists) {
      return NextResponse.json({ error: 'Yük bulunamadı. Lütfen numarayı kontrol edin.' }, { status: 404 });
    }

    const data = shipmentSnap.data();
    if (!data || !data.active) {
      return NextResponse.json({ error: 'Bu yük numarası için takip şu an kapalı.' }, { status: 404 });
    }

    return NextResponse.json({
      trackingNo: data.trackingNo,
      status: data.status,
      publicStatusText: data.publicStatusText,
      publicLastSeenArea: data.publicLastSeenArea,
      eta: data.eta ? (data.eta.toDate ? data.eta.toDate().toISOString() : data.eta) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : new Date().toISOString()
    });

  } catch (error) {
    console.error('Public track error:', error);
    return NextResponse.json({ error: 'Takip sistemi şu an yanıt vermiyor.' }, { status: 500 });
  }
}
