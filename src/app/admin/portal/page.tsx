
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Briefcase, Loader2, Building, Truck, Users, MapPin } from "lucide-react";
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

const LiveMap = dynamic(() => import("./LiveMap"), { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-full" />
});

function PortalPageContents() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { adminData } = useAdmin();
    const [stats, setStats] = useState({ firms: 0, drivers: 0, loads: 0, personnel: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const adminDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
    const { data: currentAdminData } = useDoc(adminDocRef);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (err) {
                console.error("Stats fetch error:", err);
            } finally {
                setIsLoadingStats(false);
            }
        };
        if (user && adminData) fetchStats();
    }, [user, adminData]);

    const statItems = [
      { title: "Toplam Firma", value: stats.firms, icon: Building },
      { title: "Toplam Şoför", value: stats.drivers, icon: Truck },
      { title: "Aktif Yük İlanı", value: stats.loads, icon: Briefcase },
      { title: "Personel Sayısı", value: stats.personnel, icon: Users },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-headline">Hoş Geldiniz, {currentAdminData?.firstName || 'Yönetici'}</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item, idx) => (
                    <Card key={idx}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoadingStats ? '...' : item.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {adminData?.permissions.canTrackLocations && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" /> Canlı Takip
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] p-0 overflow-hidden">
                        <LiveMap />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function PortalPage() {
    return (
        <Suspense fallback={<div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <PortalPageContents />
        </Suspense>
    )
}
