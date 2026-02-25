
import { NextResponse } from 'node-server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const adminDoc = await adminDb.collection('roles_admin').doc(uid).get();
    if (!adminDoc.exists && decodedToken.email !== 'tamerozkara02@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('publicShipments').orderBy('updatedAt', 'desc').get();
    const shipments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        eta: data.eta?.toDate ? data.eta.toDate().toISOString() : data.eta,
      };
    });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Admin shipments API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
