
'use client';

/**
 * @fileOverview Production-safe Client Component for Leaflet Live Tracking.
 * Handles Firestore real-time updates for driver locations.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

// Fix for Leaflet default marker icons not appearing in Next.js/Webpack
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

interface LiveMapProps {
  driverId?: string; // Optional: Track a specific driver or all active ones
}

export default function LiveMap({ driverId }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const firestore = useFirestore();

  // Env control for the map (default to enabled if not explicitly 'false')
  const isMapEnabled = process.env.NEXT_PUBLIC_MAP_ENABLED !== 'false';

  useEffect(() => {
    if (!isMapEnabled || !mapContainerRef.current || mapInstance.current) return;

    fixLeafletIcons();

    // Initialize map
    mapInstance.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView([39.0, 35.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isMapEnabled]);

  useEffect(() => {
    if (!isMapEnabled || !mapInstance.current || !firestore) return;

    let unsubscribe: () => void;

    if (driverId) {
      // TRACKING SINGLE DRIVER
      const driverRef = doc(firestore, 'drivers', driverId);
      unsubscribe = onSnapshot(driverRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.latitude && data.longitude) {
          const pos: L.LatLngExpression = [data.latitude, data.longitude];
          
          if (markers.current[driverId]) {
            markers.current[driverId].setLatLng(pos);
          } else {
            markers.current[driverId] = L.marker(pos)
              .addTo(mapInstance.current!)
              .bindPopup(`<b>${data.firstName} ${data.lastName}</b>`);
          }
          // Optional: Center on the driver if tracking one
          // mapInstance.current?.setView(pos, mapInstance.current.getZoom());
        }
      });
    } else {
      // TRACKING ALL ACTIVE DRIVERS
      // We listen to all drivers that have location data
      const q = query(collection(firestore, 'drivers'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const id = change.doc.id;
          const data = change.doc.data();

          if (change.type === 'removed' || !data.latitude || !data.longitude) {
            if (markers.current[id]) {
              markers.current[id].remove();
              delete markers.current[id];
            }
          } else {
            const pos: L.LatLngExpression = [data.latitude, data.longitude];
            if (markers.current[id]) {
              markers.current[id].setLatLng(pos);
            } else {
              markers.current[id] = L.marker(pos)
                .addTo(mapInstance.current!)
                .bindPopup(`<b>${data.firstName} ${data.lastName}</b><br>${data.vehiclePlate || ''}`);
            }
          }
        });
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isMapEnabled, firestore, driverId]);

  if (!isMapEnabled) {
      return (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground rounded-lg">
              Harita özelliği devre dışıdır.
          </div>
      );
  }

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
