'use client';

import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Loader2, Edit, Save, Camera, Phone, MessageCircle, Building, Truck, Users } from "lucide-react";
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { turkishCities } from '@/lib/cities';

function PortalPageContents() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { adminData, isLoading: isAdminLoading } = useAdmin();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States for Profile Editing
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // State for city filter
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [appliedCity, setAppliedCity] = useState<string>('all');

    // --- DATA FETCHING ---
    const adminDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
    const { data: currentAdminData, isLoading: isCurrentAdminLoading } = useDoc(adminDocRef);
    
    const loadsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'loads') : null, [firestore]);
    const { data: loads, isLoading: isLoadingLoads } = useCollection(loadsQuery);
    
    const firmsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'firms') : null, [firestore]);
    const { data: firms, isLoading: isLoadingFirms } = useCollection(firmsQuery);

    const allDriversQuery = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);
    const { data: allDrivers, isLoading: isLoadingAllDrivers } = useCollection(allDriversQuery);
    
    const availableDriversQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'drivers'), where('isAvailable', '==', true)) : null, [firestore]);
    const { data: availableDrivers, isLoading: isLoadingAvailableDrivers } = useCollection(availableDriversQuery);

    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    
    const isLoading = isAdminLoading || isCurrentAdminLoading || isLoadingLoads || isLoadingFirms || isLoadingAllDrivers || isLoadingAvailableDrivers || isLoadingPersonel;

    // --- MEMOIZED DATA & FILTERS ---
    const liveStats = useMemo(() => [
      { title: "Toplam Firma", value: firms?.length.toString() ?? "0", icon: Building, change: "Kayıtlı firmalar" },
      { title: "Toplam Şoför", value: allDrivers?.length.toString() ?? "0", icon: Truck, change: "Kayıtlı şoförler" },
      { title: "Aktif Yük İlanı", value: loads?.length.toString() ?? "0", icon: Briefcase, change: "Yayındaki ilanlar" },
      { title: "Personel Sayısı", value: personel?.length.toString() ?? "0", icon: Users, change: "Yönetim ekibi" },
    ], [firms, allDrivers, loads, personel]);

    const filteredLoads = useMemo(() => {
      if (appliedCity === 'all') return loads;
      return loads?.filter(load => load.originCity === appliedCity || load.destinationCity === appliedCity) || [];
    }, [loads, appliedCity]);
  
    const filteredAvailableDrivers = useMemo(() => {
      if (appliedCity === 'all') return availableDrivers;
      return availableDrivers?.filter(driver => driver.currentCity === appliedCity) || [];
    }, [availableDrivers, appliedCity]);

    const getFirmName = (firmId: string) => {
        const firm = firms?.find(f => f.id === firmId);
        return firm ? `${firm.firstName} ${firm.lastName}` : 'Bilinmeyen Firma';
    }

    const adminAvatar = placeholderImages.find(p => p.id === 'avatar-driver');

    // --- EFFECTS ---
    useEffect(() => {
        if (currentAdminData) {
            setEditData({
                firstName: currentAdminData.firstName || '',
                lastName: currentAdminData.lastName || '',
                phoneNumber: currentAdminData.phoneNumber || '',
            });
            setAvatarPreview(currentAdminData.profilePicture || null);
        }
    }, [currentAdminData]);

    // --- HANDLERS ---
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            let input = value.replace(/\D/g, '');
            if (input.startsWith('90')) input = input.substring(2);
            input = input.substring(0, 10);
            const size = input.length;
            let formattedValue = size === 0 ? '' : size < 4 ? `+90 (${input}` : size < 7 ? `+90 (${input.substring(0, 3)}) ${input.substring(3, 6)}` : `+90 (${input.substring(0, 3)}) ${input.substring(3, 6)} ${input.substring(6, 10)}`;
            setEditData(prev => ({ ...prev, phoneNumber: formattedValue }));
        } else {
            setEditData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const previewUrl = URL.createObjectURL(file);
          setAvatarPreview(previewUrl);
        }
    };
    
    const handleProfileUpdate = async () => {
        if (!adminDocRef) return;
        try {
          await updateDoc(adminDocRef, { ...editData, profilePicture: avatarPreview });
          toast({ title: 'Başarılı', description: 'Profil bilgileriniz güncellendi.' });
          setIsEditDialogOpen(false);
        } catch (error) {
          console.error('Profile update error:', error);
          toast({ variant: 'destructive', title: 'Hata', description: 'Profil güncellenemedi.' });
        }
    };

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                         <Avatar className="h-16 w-16">
                            {avatarPreview ? (
                                <AvatarImage src={avatarPreview} alt="Personel profili" />
                            ) : adminAvatar ? (
                                <AvatarImage src={adminAvatar.imageUrl} data-ai-hint={adminAvatar.imageHint} />
                            ) : null}
                            <AvatarFallback>
                                {currentAdminData?.firstName?.[0] || 'P'}
                                {currentAdminData?.lastName?.[0] || ''}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                             <CardTitle className="font-headline text-2xl">
                                Hoş Geldiniz, {currentAdminData?.firstName || adminData?.username || 'Personel'}!
                            </CardTitle>
                            <CardDescription>
                                Buradan tüm operasyonel işlemleri yönetebilirsiniz.
                            </CardDescription>
                        </div>
                    </div>
                     <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Profili Düzenle</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Profil Bilgilerini Düzenle</DialogTitle>
                            </DialogHeader>
                             <div className="flex justify-center">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        {avatarPreview && <AvatarImage src={avatarPreview} alt="Profil resmi" />}
                                        <AvatarFallback>
                                            {editData.firstName?.[0]}{editData.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                     <input
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleAvatarChange}
                                      className="hidden"
                                      accept="image/*"
                                    />
                                    <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={handleAvatarClick}>
                                        <Camera className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label htmlFor="firstName">Ad</Label><Input id="firstName" name="firstName" value={editData.firstName} onChange={handleEditInputChange} /></div>
                                    <div><Label htmlFor="lastName">Soyad</Label><Input id="lastName" name="lastName" value={editData.lastName} onChange={handleEditInputChange} /></div>
                                </div>
                                <div><Label htmlFor="phoneNumber">Telefon Numarası</Label><Input id="phoneNumber" name="phoneNumber" type="tel" value={editData.phoneNumber} onChange={handleEditInputChange} placeholder="+90 (___) ___ ____" /></div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleProfileUpdate}><Save className="mr-2 h-4 w-4" /> Kaydet</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
            </Card>

            {adminData?.permissions.canViewDashboard && (
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
                    <SelectTrigger id="city-filter" className="w-auto min-w-[200px]"><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şehirler</SelectItem>
                      {turkishCities.map(city => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setAppliedCity(selectedCity)}>Filtrele</Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Aktif Yük İlanları ({filteredLoads?.length || 0})</CardTitle>
                      <CardDescription>Firmalar tarafından oluşturulan tüm aktif yük talepleri.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                        <TableHeader><TableRow><TableHead>Firma</TableHead><TableHead>Yük</TableHead><TableHead>Güzergah</TableHead><TableHead>Tarih</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {isLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow>}
                          {!isLoading && filteredLoads?.map((load: any) => (
                            <TableRow key={load.id}>
                              <TableCell className="font-medium">{getFirmName(load.firmId)}</TableCell>
                              <TableCell>{load.loadType} - {load.tonnage} ton</TableCell>
                              <TableCell>{load.originCity} → {load.destinationCity}</TableCell>
                              <TableCell className="text-xs">{load.createdAt ? format(load.createdAt.toDate(), 'dd/MM/yy') : '-'}</TableCell>
                            </TableRow>
                          ))}
                          {!isLoading && (!filteredLoads || filteredLoads.length === 0) && (
                              <TableRow><TableCell colSpan={4} className="h-24 text-center">{appliedCity === 'all' ? 'Aktif yük ilanı bulunmuyor.' : 'Bu şehirde aktif yük ilanı bulunmuyor.'}</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-1">
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Müsait Şoförler ({filteredAvailableDrivers?.length || 0})</CardTitle>
                      <CardDescription>Şu anda yüke hazır olan şoförlerin listesi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                        <TableHeader><TableRow><TableHead>Ad Soyad</TableHead><TableHead>Anlık Şehir</TableHead><TableHead>Araç Bilgisi</TableHead></TableRow></TableHeader>
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
                               <TableRow><TableCell colSpan={3} className="h-24 text-center">{appliedCity === 'all' ? 'Müsait şoför bulunmuyor.' : 'Bu şehirde müsait şoför bulunmuyor.'}</TableCell></TableRow>
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

export default function PortalPage() {
    return (
        <Suspense fallback={<div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <PortalPageContents />
        </Suspense>
    )
}
