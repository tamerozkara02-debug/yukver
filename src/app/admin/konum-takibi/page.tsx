'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';

export default function KonumTakibiPage() {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { adminData, isLoading: isAdminLoading } = useAdmin();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const driversCollection = useMemoFirebase(
    () => (firestore && user && adminData ? collection(firestore, 'drivers') : null),
    [firestore, user, adminData]
  );
  const { data: drivers, isLoading: isLoadingDrivers } = useCollection(driversCollection);

  const activeDrivers = useMemo(() => {
    return drivers?.filter(driver => driver.latitude && driver.longitude) || [];
  }, [drivers]);

  const isLoading = isAuthLoading || isLoadingDrivers || isAdminLoading;

  const initMap = () => {
    if (typeof window === 'undefined' || !(window as any).L || mapRef.current) return;
    
    const L = (window as any).L;

    // Leaflet marker simgelerinin düzgün görünmesi için gerekli ayar
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Haritayı Türkiye merkezli olarak başlat
    mapRef.current = L.map('map').setView([39.0, 35.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);
  };

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined' || !(window as any).L) return;
    const L = (window as any).L;

    // Eski markerları temizle
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Yeni markerları ekle
    activeDrivers.forEach((driver: any) => {
      const marker = L.marker([driver.latitude, driver.longitude])
        .addTo(mapRef.current)
        .bindPopup(`<b>${driver.firstName} ${driver.lastName}</b><br>${driver.vehiclePlate}<br>${driver.vehicleType}`);
      markersRef.current.push(marker);
    });
  }, [activeDrivers]);

  if (isLoading) {
    return <div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!adminData?.permissions.canTrackLocations) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center p-4">
            <h1 className="text-2xl font-bold text-destructive">Erişim Reddedildi</h1>
            <p className="text-muted-foreground">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</p>
            </div>
        </div>
    );
  }

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
             <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg overflow-hidden">
                <div id="map" style={{ height: '100%', width: '100%' }}></div>
                <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
                <Script 
                  src="https://unpkg.com/leaflet/dist/leaflet.js" 
                  strategy="afterInteractive"
                  onLoad={initMap}
                />
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