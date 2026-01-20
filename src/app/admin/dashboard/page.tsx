'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, collectionGroup, query, where, doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Truck, Users, Briefcase, ClipboardCheck } from "lucide-react";
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { turkishCities } from '@/lib/cities';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CLAIM_DURATION_MINUTES = 30;

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { adminData, isLoading: isAdminLoading } = useAdmin();
  const { user } = useUser();
  const { toast } = useToast();
  const [_, setNow] = useState(new Date());

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [appliedCity, setAppliedCity] = useState<string>('all');

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
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Re-render every minute to update claim status
    return () => clearInterval(timer);
  }, []);

  const isLoading = isAdminLoading || isLoadingLoads || isLoadingFirms || isLoadingAllDrivers || isLoadingAvailableDrivers || isLoadingPersonel;
  
  const getStaffName = (staffId: string) => {
    if (!personel) return 'Bilinmeyen';
    const staffMember = personel.find(p => p.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName?.[0] || ''}.` : 'Bilinmeyen';
  }
  
  const getFirmName = (firmId: string) => {
    const firm = firms?.find(f => f.id === firmId);
    return firm ? `${firm.firstName} ${firm.lastName}` : 'Bilinmeyen Firma';
  }
  
  const handleClaimLoad = async (load: any) => {
    if (!firestore || !user || !load.firmId || !load.id) return;
    const loadDocRef = doc(firestore, 'firms', load.firmId, 'loads', load.id);
    try {
        await updateDoc(loadDocRef, {
            claimedByStaffId: user.uid,
            claimedAt: serverTimestamp(),
        });
        toast({ title: "İlan İşleme Alındı", description: `Bu ilan ${CLAIM_DURATION_MINUTES} dakikalığına sizin tarafınızdan yönetilecek.` });
    } catch (error) {
        console.error("Error claiming load:", error);
        toast({ variant: "destructive", title: "Hata", description: "İlan işleme alınamadı." });
    }
  };

  const handleReleaseLoad = async (load: any) => {
      if (!firestore || !load.firmId || !load.id) return;
      const loadDocRef = doc(firestore, 'firms', load.firmId, 'loads', load.id);
      try {
          await updateDoc(loadDocRef, {
              claimedByStaffId: deleteField(),
              claimedAt: deleteField(),
          });
          toast({ title: "İlan Serbest Bırakıldı", description: "İlan artık diğer personel tarafından işleme alınabilir." });
      } catch (error) {
          console.error("Error releasing load:", error);
          toast({ variant: "destructive", title: "Hata", description: "İlan serbest bırakılamadı." });
      }
  };


  const filteredLoads = useMemo(() => {
    if (appliedCity === 'all') return loads;
    return loads?.filter(load => load.originCity === appliedCity || load.destinationCity === appliedCity) || [];
  }, [loads, appliedCity]);

  const filteredAvailableDrivers = useMemo(() => {
    if (appliedCity === 'all') return availableDrivers;
    return availableDrivers?.filter(driver => driver.currentCity === appliedCity) || [];
  }, [availableDrivers, appliedCity]);

  const isFullAdmin = adminData?.permissions?.canViewDashboard;

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
        
        <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
                <Label htmlFor="city-filter" className="text-sm font-medium">Şehre Göre Filtrele:</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city-filter" className="w-auto min-w-[200px]">
                    <SelectValue placeholder="Şehir seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şehirler</SelectItem>
                    {turkishCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setAppliedCity(selectedCity)}>Filtrele</Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Aktif Yük İlanları ({filteredLoads?.length || 0})
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
                          <TableHead>İşlem Durumu</TableHead>
                          <TableHead>Tarih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">Yükleniyor...</TableCell></TableRow>}
                        {!isLoading && filteredLoads?.map((load: any) => {
                          const isClaimed = load.claimedAt && (new Date().getTime() - load.claimedAt.toDate().getTime()) < CLAIM_DURATION_MINUTES * 60 * 1000;
                          const isClaimedByCurrentUser = isClaimed && load.claimedByStaffId === user?.uid;

                          return (
                          <TableRow key={load.id}>
                            <TableCell className="font-medium">{getFirmName(load.firmId)}</TableCell>
                            <TableCell>{load.loadType} - {load.tonnage} ton</TableCell>
                            <TableCell>{load.originCity} → {load.destinationCity}</TableCell>
                            <TableCell>
                              {isClaimed ? (
                                  isClaimedByCurrentUser ? (
                                      <Button size="sm" variant="outline" onClick={() => handleReleaseLoad(load)}>Bırak</Button>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          <Button size="sm" disabled>İşlemde</Button>
                                          <span className="text-xs text-muted-foreground">({getStaffName(load.claimedByStaffId)})</span>
                                      </div>
                                  )
                              ) : (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleClaimLoad(load)}>
                                      <ClipboardCheck className="mr-2 h-4 w-4" /> İşleme Al
                                  </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{load.createdAt ? format(load.createdAt.toDate(), 'dd/MM/yy') : '-'}</TableCell>
                          </TableRow>
                          )
                        })}
                        {!isLoading && (!filteredLoads || filteredLoads.length === 0) && (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">
                                {appliedCity === 'all' ? 'Aktif yük ilanı bulunmuyor.' : 'Bu şehirde aktif yük ilanı bulunmuyor.'}
                            </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        Müsait Şoförler ({filteredAvailableDrivers?.length || 0})
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
                        {!isLoading && filteredAvailableDrivers?.map((sofor: any) => (
                          <TableRow key={sofor.id}>
                            <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                            <TableCell>{sofor.currentCity || 'Belirtilmemiş'}</TableCell>
                            <TableCell>{sofor.vehicleType}</TableCell>
                          </TableRow>
                        ))}
                        {!isLoading && (!filteredAvailableDrivers || filteredAvailableDrivers.length === 0) && (
                             <TableRow><TableCell colSpan={3} className="h-24 text-center">
                                {appliedCity === 'all' ? 'Müsait şoför bulunmuyor.' : 'Bu şehirde müsait şoför bulunmuyor.'}
                            </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
          </div>
        </div>
    </div>
  );
}
