
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // 1. Yetkilendirme kontrolü (Bearer Token)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Admin rolü kontrolü
    const adminDoc = await adminDb.collection('roles_admin').doc(uid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
    }

    // 3. Verileri getir
    const snapshot = await adminDb.collection('publicShipments').orderBy('updatedAt', 'desc').get();
    const shipments = snapshot.docs.map(doc => ({
      ...doc.data(),
      // Firestore Timestamp nesnelerini string'e çevir
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
      eta: doc.data().eta?.toDate().toISOString() || null,
    }));

    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Admin shipments API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
