
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
import { Phone, MessageCircle, Truck, Building, Loader2, Trash2, ClipboardCheck, Search } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { doc, deleteDoc, updateDoc, serverTimestamp, deleteField, collection, getDocs } from "firebase/firestore"
import { useAdmin } from "@/hooks/use-admin"
import { useState, useMemo, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const CLAIM_DURATION_MINUTES = 30;

export default function AdminUyelerPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { adminData } = useAdmin();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [soforler, setSoforler] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);

  // State for filters
  const [selectedFirmCity, setSelectedFirmCity] = useState<string>('all');
  const [selectedDriverCity, setSelectedDriverCity] = useState<string>('all');
  const [searchTerm, setSearchName] = useState('');
  
  // State for delete confirmation
  const [entityToDelete, setEntityToDelete] = useState<{id: string; type: 'firma' | 'sofor'; name: string} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!firestore || !user) return;
    setIsLoading(true);
    try {
        const [firmsSnap, driversSnap, staffSnap] = await Promise.all([
            getDocs(collection(firestore, 'firms')),
            getDocs(collection(firestore, 'drivers')),
            getDocs(collection(firestore, 'roles_admin'))
        ]);

        setFirmalar(firmsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSoforler(driversSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPersonel(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
        console.error("Fetch members error:", error);
        toast({ variant: "destructive", title: "Hata", description: "Üye listesi yüklenemedi." });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, user, toast]);

  useEffect(() => {
    if (user && adminData) fetchMembers();
  }, [user, adminData, fetchMembers]);

  const getStaffName = (staffId: string) => {
    const staffMember = personel.find(p => p.id === staffId);
    return staffMember ? `${staffMember.firstName || 'Personel'} ${staffMember.lastName?.[0] || ''}.` : 'Bilinmeyen';
  }

  const firmCities = useMemo(() => {
    const cities = new Set(firmalar.map(f => f.city).filter(Boolean));
    return ['all', ...Array.from(cities).sort()];
  }, [firmalar]);

  const driverCities = useMemo(() => {
    const cities = new Set(soforler.map(s => s.currentCity).filter(Boolean));
    return ['all', ...Array.from(cities).sort()];
  }, [soforler]);

  const filteredFirmalar = useMemo(() => {
    let filtered = firmalar;
    if (selectedFirmCity !== 'all') filtered = filtered.filter(f => f.city === selectedFirmCity);
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(f => `${f.firstName} ${f.lastName}`.toLowerCase().includes(lower));
    }
    return filtered;
  }, [firmalar, selectedFirmCity, searchTerm]);

  const filteredSoforler = useMemo(() => {
    let filtered = soforler;
    if (selectedDriverCity !== 'all') filtered = filtered.filter(s => s.currentCity === selectedDriverCity);
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(lower));
    }
    return filtered;
  }, [soforler, selectedDriverCity, searchTerm]);

  const canManageMembers = adminData?.permissions?.canManageMembers;

  const handleClaimFirm = async (firmId: string) => {
    if (!firestore || !user) return;
    const firmDocRef = doc(firestore, 'firms', firmId);
    try {
        await updateDoc(firmDocRef, {
            claimedByStaffId: user.uid,
            claimedAt: serverTimestamp(),
        });
        toast({ title: "Firma İşleme Alındı", description: "Müşteri ile iletişime geçebilirsiniz." });
        fetchMembers();
    } catch (error) {
        toast({ variant: "destructive", title: "Hata", description: "İşlem başarısız." });
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
          toast({ title: "Firma Bırakıldı", description: "Diğer personel işleme alabilir." });
          fetchMembers();
      } catch (error) {
          toast({ variant: "destructive", title: "Hata", description: "İşlem başarısız." });
      }
  };

  const handleDeleteConfirmed = async () => {
    if (!entityToDelete || !firestore) return;
    setIsDeleting(true);
    const collectionName = entityToDelete.type === 'firma' ? 'firms' : 'drivers';
    try {
        await deleteDoc(doc(firestore, collectionName, entityToDelete.id));
        toast({ title: "Başarılı", description: "Üye sistemden silindi." });
        fetchMembers();
    } catch (error) {
        toast({ variant: "destructive", title: "Hata", description: "Silme işlemi başarısız." });
    } finally {
        setIsDeleting(false);
        setEntityToDelete(null);
        setDeleteConfirmText('');
    }
  };

  if (!adminData?.permissions.canManageMembers) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center p-4">
                <h1 className="text-2xl font-bold text-destructive font-headline">ERİŞİM REDDEDİLDİ</h1>
                <p className="text-muted-foreground">Üye yönetimi yetkiniz bulunmuyor.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Üye Yönetimi</h1>
          <p className="text-muted-foreground">Platforma kayıtlı tüm paydaşları izleyin.</p>
        </div>
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="İsimle ara..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchName(e.target.value)}
            />
        </div>
      </div>

      <Tabs defaultValue="firmalar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="firmalar" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Firmalar ({filteredFirmalar.length})
            </TabsTrigger>
          <TabsTrigger value="soforler" className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> Şoförler ({filteredSoforler.length})
            </TabsTrigger>
        </TabsList>

        <TabsContent value="firmalar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Firma Listesi</CardTitle>
                    <CardDescription>Sisteme kayıtlı tüm firmalar.</CardDescription>
                </div>
                <Select value={selectedFirmCity} onValueChange={setSelectedFirmCity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tüm Şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    {firmCities.map(city => (
                      <SelectItem key={city} value={city}>{city === 'all' ? 'Tüm Şehirler' : city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>İşlem Durumu</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                  ) : filteredFirmalar.map((firma: any) => {
                    const isClaimed = firma.claimedAt && (new Date().getTime() - (firma.claimedAt?.toDate?.() || 0).getTime()) < CLAIM_DURATION_MINUTES * 60 * 1000;
                    const isClaimedByMe = isClaimed && firma.claimedByStaffId === user?.uid;
                    
                    return (
                        <TableRow key={firma.id}>
                          <TableCell className="font-medium">{firma.firstName} {firma.lastName}</TableCell>
                          <TableCell>{firma.phoneNumber}</TableCell>
                          <TableCell>{firma.city}, {firma.district}</TableCell>
                          <TableCell>
                            {isClaimed ? (
                                isClaimedByMe ? (
                                    <Button size="sm" variant="outline" onClick={() => handleReleaseFirm(firma.id)}>Bırak</Button>
                                ) : (
                                    <Badge variant="secondary">İşlemde ({getStaffName(firma.claimedByStaffId)})</Badge>
                                )
                            ) : (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleClaimFirm(firma.id)}>
                                    <ClipboardCheck className="mr-2 h-4 w-4" /> İşleme Al
                                </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" asChild><a href={`tel:${firma.phoneNumber}`}><Phone className="h-4 w-4"/></a></Button>
                            <Button variant="destructive" size="icon" onClick={() => setEntityToDelete({id: firma.id, type: 'firma', name: `${firma.firstName} ${firma.lastName}`})}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soforler">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Şoför Listesi</CardTitle>
                    <CardDescription>Sisteme kayıtlı tüm şoförler.</CardDescription>
                </div>
                <Select value={selectedDriverCity} onValueChange={setSelectedDriverCity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tüm Şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    {driverCities.map(city => (
                      <SelectItem key={city} value={city}>{city === 'all' ? 'Tüm Şehirler' : city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
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
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                  ) : filteredSoforler.map((sofor: any) => (
                    <TableRow key={sofor.id}>
                      <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                      <TableCell>{sofor.currentCity || '-'}</TableCell>
                      <TableCell>{sofor.vehicleType} / {sofor.vehiclePlate}</TableCell>
                      <TableCell>
                         <Badge variant={sofor.isAvailable ? 'default' : 'destructive'} className={cn(sofor.isAvailable ? 'bg-green-600' : 'bg-red-600')}>
                            {sofor.isAvailable ? 'Boşta' : 'Dolu'}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right space-x-2">
                         <Button variant="outline" size="icon" asChild><a href={`tel:${sofor.phoneNumber}`}><Phone className="h-4 w-4"/></a></Button>
                        <Button variant="destructive" size="icon" onClick={() => setEntityToDelete({id: sofor.id, type: 'sofor', name: `${sofor.firstName} ${sofor.lastName}`})}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!entityToDelete} onOpenChange={() => setEntityToDelete(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Üyeyi Kalıcı Olarak Sil</DialogTitle>
                  <DialogDescription>
                      "{entityToDelete?.name}" adlı üyeyi silmek istediğinizden eminseniz "SİL" yazın.
                  </DialogDescription>
              </DialogHeader>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="SİL" />
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEntityToDelete(null)}>İptal</Button>
                  <Button variant="destructive" disabled={deleteConfirmText !== 'SİL' || isDeleting} onClick={handleDeleteConfirmed}>
                      {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null} Onayla
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
