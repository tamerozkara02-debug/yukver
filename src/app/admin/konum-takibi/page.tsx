'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function KonumTakibiPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const driversCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'drivers') : null),
    [firestore, user]
  );
  const { data: drivers, isLoading: isLoadingDrivers } = useCollection(driversCollection);

  const activeDrivers = useMemo(() => {
    return drivers?.filter(driver => driver.latitude && driver.longitude) || [];
  }, [drivers]);

  const isLoading = isUserLoading || isLoadingDrivers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Şoför Konum Takibi</h1>
        <p className="text-muted-foreground">Aktif şoförlerin anlık konumlarını harita üzerinden izleyin.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Harita</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Şoför konumları yükleniyor...'
              : `${activeDrivers.length} aktif şoför bulundu.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0" style={{ height: '70vh' }}>
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
             <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
              <p className="text-muted-foreground">Harita özelliği geçici olarak devre dışıdır.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Aktif Şoförler ({activeDrivers.length})</CardTitle>
          <CardDescription>Şu anda konumunu paylaşan şoförlerin listesi.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Yükleniyor...</p>}
          {!isLoading && activeDrivers.length === 0 && <p>Şu anda konum paylaşan aktif şoför bulunmuyor.</p>}
          <ul className="space-y-2">
            {activeDrivers.map((driver: any) => (
              <li key={driver.id} className="text-sm">
                {driver.firstName} {driver.lastName} - {driver.vehiclePlate} (Lat: {driver.latitude}, Lng: {driver.longitude})
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
