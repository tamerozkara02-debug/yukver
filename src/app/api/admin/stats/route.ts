
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const adminDoc = await adminDb.collection('roles_admin').doc(decodedToken.uid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [firms, drivers, loads, personnel] = await Promise.all([
      adminDb.collection('firms').count().get(),
      adminDb.collection('drivers').count().get(),
      adminDb.collectionGroup('loads').count().get(),
      adminDb.collection('roles_admin').count().get(),
    ]);

    return NextResponse.json({
      firms: firms.data().count,
      drivers: drivers.data().count,
      loads: loads.data().count,
      personnel: personnel.data().count,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
