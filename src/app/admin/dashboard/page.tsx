'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Truck, Users, Briefcase } from "lucide-react";
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { adminData, isLoading: isAdminLoading } = useAdmin();

  // Query for all loads using a collection group query
  const loadsQuery = useMemoFirebase(
    () => (firestore ? collectionGroup(firestore, 'loads') : null),
    [firestore]
  );
  const { data: loads, isLoading: isLoadingLoads } = useCollection(loadsQuery);
  
  // Query for all firms to map firmId to firm name
  const firmsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'firms') : null),
    [firestore]
  );
  const { data: firms, isLoading: isLoadingFirms } = useCollection(firmsQuery);
  
  // Query for all drivers
  const driversQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'drivers') : null),
    [firestore]
  );
  const { data: drivers, isLoading: isLoadingAllDrivers } = useCollection(driversQuery);


  // Query for available drivers
  const availableDriversQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'drivers'), where('isAvailable', '==', true)) : null),
    [firestore]
  );
  const { data: availableDrivers, isLoading: isLoadingAvailableDrivers } = useCollection(availableDriversQuery);
  
  const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
  const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
  
  const isLoading = isAdminLoading || isLoadingLoads || isLoadingFirms || isLoadingAllDrivers || isLoadingAvailableDrivers || isLoadingPersonel;
  
  const getFirmName = (firmId: string) => {
    const firm = firms?.find(f => f.id === firmId);
    return firm ? `${firm.firstName} ${firm.lastName}` : 'Bilinmeyen Firma';
  }

  const isFullAdmin = adminData?.permissions?.canManageStaff;

  const liveStats = useMemo(() => [
    { title: "Toplam Firma", value: firms?.length.toString() ?? "0", icon: Building, change: "Kayıtlı firmalar" },
    { title: "Toplam Şoför", value: drivers?.length.toString() ?? "0", icon: Truck, change: "Kayıtlı şoförler" },
    { title: "Aktif Yük İlanı", value: loads?.length.toString() ?? "0", icon: Briefcase, change: "Yayındaki ilanlar" },
    { title: "Personel Sayısı", value: personel?.length.toString() ?? "0", icon: Users, change: "Yönetim ekibi" },
  ], [firms, drivers, loads, personel]);


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">
              {isFullAdmin ? 'Dashboard' : 'Aktif İlanlar'}
            </h1>
            <p className="text-muted-foreground">
              {isFullAdmin 
                ? 'İşte platformunuzun genel bir özeti.' 
                : 'Platformdaki tüm aktif yük ilanlarını ve müsait şoförleri buradan takip edebilirsiniz.'}
            </p>
        </div>

        {isFullAdmin && (
          isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[109px]" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {liveStats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )
        )}
        
        <div className={`grid gap-6 lg:grid-cols-2 ${isFullAdmin ? 'mt-8' : ''}`}>
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Aktif Yük İlanları ({loads?.length || 0})
                </CardTitle>
                <CardDescription>Firmalar tarafından oluşturulan tüm aktif yük talepleri.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Yük</TableHead>
                      <TableHead>Güzergah</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow>}
                    {!isLoading && loads?.map((load: any) => (
                      <TableRow key={load.id}>
                        <TableCell className="font-medium">{getFirmName(load.firmId)}</TableCell>
                        <TableCell>{load.loadType} - {load.tonnage} ton</TableCell>
                        <TableCell>{load.originCity} → {load.destinationCity}</TableCell>
                        <TableCell className="text-xs">{load.createdAt ? format(load.createdAt.toDate(), 'dd/MM/yy') : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!loads || loads.length === 0) && (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Aktif yük ilanı bulunmuyor.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Müsait Şoförler ({availableDrivers?.length || 0})
                </CardTitle>
                <CardDescription>Şu anda yüke hazır olan şoförlerin listesi.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Anlık Şehir</TableHead>
                      <TableHead>Araç Bilgisi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={3} className="h-24 text-center">Yükleniyor...</TableCell></TableRow>}
                    {!isLoading && availableDrivers?.map((sofor: any) => (
                      <TableRow key={sofor.id}>
                        <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                        <TableCell>{sofor.currentCity || 'Belirtilmemiş'}</TableCell>
                        <TableCell>{sofor.vehicleType}</TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!availableDrivers || availableDrivers.length === 0) && (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center">Müsait şoför bulunmuyor.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
      </div>

    </div>
  );
}
