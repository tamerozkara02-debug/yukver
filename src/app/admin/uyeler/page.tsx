"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Truck, Building, Loader2, Trash2, ClipboardCheck } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore"
import { useAdmin } from "@/hooks/use-admin"
import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const CLAIM_DURATION_MINUTES = 30;

export default function AdminUyelerPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { adminData, isLoading: isAdminLoading } = useAdmin();
  const { toast } = useToast();

  const [_, setNow] = useState(new Date());

  // State for filters
  const [selectedFirmCity, setSelectedFirmCity] = useState<string>('all');
  const [selectedDriverCity, setSelectedDriverCity] = useState<string>('all');
  
  // State for delete confirmation
  const [entityToDelete, setEntityToDelete] = useState<{id: string; type: 'firma' | 'sofor'; name: string} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const firmsCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'firms') : null, [firestore, user, adminData]);
  const driversCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'drivers') : null, [firestore, user, adminData]);
  const personelCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'roles_admin') : null, [firestore, user, adminData]);

  const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);
  const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);
  const { data: personel } = useCollection(personelCollection);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Re-render every minute to update claim status
    return () => clearInterval(timer);
  }, []);

  const getStaffName = (staffId: string) => {
    if (!personel) return 'Bilinmeyen Personel';
    const staffMember = personel.find(p => p.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName?.[0] || ''}.` : 'Bilinmeyen';
  }

  const firmCities = useMemo(() => {
    if (!firmalar) return [];
    const cities = new Set(firmalar.map(f => f.city).filter(Boolean));
    return ['all', ...Array.from(cities).sort()];
  }, [firmalar]);

  const driverCities = useMemo(() => {
    if (!soforler) return [];
    const cities = new Set(soforler.map(s => s.currentCity).filter(Boolean));
    return ['all', ...Array.from(cities).sort()];
  }, [soforler]);

  const filteredFirmalar = useMemo(() => {
    if (!firmalar) return [];
    if (selectedFirmCity === 'all') return firmalar;
    return firmalar.filter(f => f.city === selectedFirmCity);
  }, [firmalar, selectedFirmCity]);

  const filteredSoforler = useMemo(() => {
    if (!soforler) return [];
    if (selectedDriverCity === 'all') return soforler;
    return soforler.filter(s => s.currentCity === selectedDriverCity);
  }, [soforler, selectedDriverCity]);


  const isLoading = isUserLoading || isLoadingFirms || isLoadingDrivers || isAdminLoading;
  const canManageMembers = adminData?.permissions?.canManageMembers;

  const handleClaimFirm = async (firmId: string) => {
    if (!firestore || !user) return;
    const firmDocRef = doc(firestore, 'firms', firmId);
    try {
        await updateDoc(firmDocRef, {
            claimedByStaffId: user.uid,
            claimedAt: serverTimestamp(),
        });
        toast({ title: "Firma İşleme Alındı", description: `Bu firma ${CLAIM_DURATION_MINUTES} dakikalığına sizin tarafınızdan yönetilecek.` });
    } catch (error) {
        console.error("Error claiming firm:", error);
        toast({ variant: "destructive", title: "Hata", description: "Firma işleme alınamadı." });
    }
  };

  const handleReleaseFirm = async (firmId: string) => {
      if (!firestore) return;
      const firmDocRef = doc(firestore, 'firms', firmId);
      try {
          await updateDoc(firmDocRef, {
              claimedByStaffId: deleteField(),
              claimedAt: deleteField(),
          });
          toast({ title: "Firma Serbest Bırakıldı", description: "Firma artık diğer personel tarafından işleme alınabilir." });
      } catch (error) {
          console.error("Error releasing firm:", error);
          toast({ variant: "destructive", title: "Hata", description: "Firma serbest bırakılamadı." });
      }
  };


  const handleDeleteConfirmed = async () => {
    if (!entityToDelete || !firestore) return;
    setIsDeleting(true);
    const memberType = entityToDelete.type;
    const collectionName = memberType === 'firma' ? 'firms' : 'drivers';
    const memberDocRef = doc(firestore, collectionName, entityToDelete.id);
    
    try {
        await deleteDoc(memberDocRef);
        toast({
            title: "Üye Silindi",
            description: `"${entityToDelete.name}" adlı ${memberType} sistemden kaldırıldı.`
        });
    } catch (error) {
        console.error(`Error deleting ${memberType}:`, error);
        toast({
            variant: "destructive",
            title: "Hata",
            description: `Üye silinirken bir hata oluştu.`
        });
    } finally {
        setIsDeleting(false);
        setEntityToDelete(null);
        setDeleteConfirmText('');
    }
  };

  if (isLoading) {
    return <div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!adminData?.permissions.canManageMembers) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Üye Yönetimi</h1>
          <p className="text-muted-foreground">Platforma kayıtlı firmaları ve şoförleri yönetin.</p>
        </div>
      </div>
      <Tabs defaultValue="firmalar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="firmalar" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Firmalar ({filteredFirmalar?.length || 0})
            </TabsTrigger>
          <TabsTrigger value="soforler" className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> Şoförler ({filteredSoforler?.length || 0})
            </TabsTrigger>
        </TabsList>
        <TabsContent value="firmalar">
          <Card>
            <CardHeader>
              <CardTitle>Firma Listesi</CardTitle>
              <CardDescription>Sisteme kayıtlı tüm firmalar.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Label htmlFor="firm-city-filter" className="text-sm">Şehre Göre Filtrele:</Label>
                <Select value={selectedFirmCity} onValueChange={setSelectedFirmCity}>
                  <SelectTrigger id="firm-city-filter" className="w-auto min-w-[180px]">
                    <SelectValue placeholder="Şehir seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {firmCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city === 'all' ? 'Tüm Şehirler' : city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>İşlem Durumu</TableHead>
                    <TableHead className="text-right">İletişim & Silme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && filteredFirmalar?.map((firma: any) => {
                    const isClaimed = firma.claimedAt && (new Date().getTime() - firma.claimedAt.toDate().getTime()) < CLAIM_DURATION_MINUTES * 60 * 1000;
                    const isClaimedByCurrentUser = isClaimed && firma.claimedByStaffId === user?.uid;
                    
                    return (
                        <TableRow key={firma.id}>
                          <TableCell className="font-medium">{firma.firstName} {firma.lastName}</TableCell>
                          <TableCell>{firma.phoneNumber}</TableCell>
                          <TableCell>{firma.city}, {firma.district}</TableCell>
                          <TableCell>
                            {isClaimed ? (
                                isClaimedByCurrentUser ? (
                                    <Button size="sm" variant="outline" onClick={() => handleReleaseFirm(firma.id)}>Bırak</Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" disabled>İşleme Alınmış</Button>
                                        <span className="text-xs text-muted-foreground">({getStaffName(firma.claimedByStaffId)})</span>
                                    </div>
                                )
                            ) : (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleClaimFirm(firma.id)}>
                                    <ClipboardCheck className="mr-2 h-4 w-4" /> İşleme Al
                                </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" asChild><a href={`tel:${firma.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                            <Button variant="outline" size="sm" asChild><a href={`sms:${firma.phoneNumber}`}><MessageCircle className="mr-2 h-3 w-3"/> Mesaj</a></Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" disabled={!canManageMembers} onClick={() => setEntityToDelete({id: firma.id, type: 'firma', name: `${firma.firstName} ${firma.lastName}`})}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                    )
                  })}
                   {!isLoading && (!filteredFirmalar || filteredFirmalar.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">{selectedFirmCity === 'all' ? 'Kayıtlı firma bulunmuyor.' : 'Bu şehirde kayıtlı firma bulunmuyor.'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="soforler">
          <Card>
            <CardHeader>
              <CardTitle>Şoför Listesi</CardTitle>
              <CardDescription>Sisteme kayıtlı tüm şoförler.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Label htmlFor="driver-city-filter" className="text-sm">Şehre Göre Filtrele:</Label>
                <Select value={selectedDriverCity} onValueChange={setSelectedDriverCity}>
                  <SelectTrigger id="driver-city-filter" className="w-auto min-w-[180px]">
                    <SelectValue placeholder="Şehir seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {driverCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city === 'all' ? 'Tüm Şehirler' : city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Anlık Şehir</TableHead>
                    <TableHead>Araç Bilgisi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && filteredSoforler?.map((sofor: any) => (
                    <TableRow key={sofor.id}>
                      <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                      <TableCell>{sofor.currentCity || 'Belirtilmemiş'}</TableCell>
                      <TableCell>{sofor.vehicleType} - {sofor.vehiclePlate}</TableCell>
                      <TableCell>
                         <Badge variant={sofor.isAvailable ? 'default' : 'destructive'} className={cn(sofor.isAvailable ? 'bg-green-600' : 'bg-red-600')}>
                            {sofor.isAvailable ? 'Boşta' : 'Dolu'}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right space-x-2">
                         <Button variant="outline" size="sm" asChild><a href={`tel:${sofor.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                        <Button variant="outline" size="sm" asChild><a href={`sms:${sofor.phoneNumber}`}><MessageCircle className="mr-2 h-3 w-3"/> Mesaj</a></Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" disabled={!canManageMembers} onClick={() => setEntityToDelete({id: sofor.id, type: 'sofor', name: `${sofor.firstName} ${sofor.lastName}`})}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && (!filteredSoforler || filteredSoforler.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">{selectedDriverCity === 'all' ? 'Kayıtlı şoför bulunmuyor.' : 'Bu şehirde kayıtlı şoför bulunmuyor.'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={!!entityToDelete} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setEntityToDelete(null);
              setDeleteConfirmText('');
          }
      }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Üyeyi Kalıcı Olarak Sil</DialogTitle>
                  <DialogDescription>
                      Bu işlem geri alınamaz. "{entityToDelete?.name}" adlı üyeyi silmek istediğinizden eminseniz, lütfen aşağıdaki alana <strong className="text-foreground">SİL</strong> yazarak onaylayın. (Not: Bu işlem yalnızca üye profilini siler, giriş kaydını kaldırmaz.)
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Input 
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder='Onaylamak için "SİL" yazın'
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }}>İptal</Button>
                  <Button 
                      variant="destructive"
                      disabled={deleteConfirmText !== 'SİL' || isDeleting}
                      onClick={handleDeleteConfirmed}
                  >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Silmeyi Onayla
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
    