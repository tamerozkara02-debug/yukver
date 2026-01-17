'use client';

import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Truck, Users, Briefcase, MapPin, Loader2, Edit, Save, Camera, Phone, MessageCircle } from "lucide-react";
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function PortalPageContents() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const { adminData, isLoading: isAdminLoading } = useAdmin();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeTab = searchParams.get('tab') || 'ilanlar';

    // States for Profile Editing
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const adminDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
    const { data: currentAdminData, isLoading: isCurrentAdminLoading } = useDoc(adminDocRef);
    
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

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          // For a real app, upload to storage. For now, use a local URL.
          const previewUrl = URL.createObjectURL(file);
          setAvatarPreview(previewUrl);
        }
    };
    
    const handleProfileUpdate = async () => {
        if (!adminDocRef) return;
        try {
          await updateDoc(adminDocRef, {
              ...editData,
              profilePicture: avatarPreview
          });
          toast({
            title: 'Başarılı',
            description: 'Profil bilgileriniz güncellendi.',
          });
          setIsEditDialogOpen(false);
        } catch (error) {
          console.error('Profile update error:', error);
          toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Profil güncellenemedi.',
          });
        }
    };


    // Common data fetching for all tabs
    const loadsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'loads') : null, [firestore]);
    const { data: loads, isLoading: isLoadingLoads } = useCollection(loadsQuery);
    
    const firmsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'firms') : null, [firestore]);
    const { data: firms, isLoading: isLoadingFirms } = useCollection(firmsQuery);
    
    const driversQuery = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);
    const { data: drivers, isLoading: isLoadingAllDrivers } = useCollection(driversQuery);
    
    const availableDriversQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'drivers'), where('isAvailable', '==', true)) : null, [firestore]);
    const { data: availableDrivers, isLoading: isLoadingAvailableDrivers } = useCollection(availableDriversQuery);
    
    const isLoading = isAdminLoading || isLoadingLoads || isLoadingFirms || isLoadingAllDrivers || isLoadingAvailableDrivers || isCurrentAdminLoading;

    const getFirmName = (firmId: string) => {
        const firm = firms?.find(f => f.id === firmId);
        return firm ? `${firm.firstName} ${firm.lastName}` : 'Bilinmeyen Firma';
    }

    const activeDriversWithLocation = useMemo(() => {
        return drivers?.filter(driver => driver.latitude && driver.longitude) || [];
    }, [drivers]);

    const handleTabChange = (value: string) => {
        router.push(`/admin/portal?tab=${value}`);
    };

    const adminAvatar = placeholderImages.find(p => p.id === 'avatar-driver');

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
                                    <div>
                                        <Label htmlFor="firstName">Ad</Label>
                                        <Input id="firstName" name="firstName" value={editData.firstName} onChange={handleEditInputChange} />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Soyad</Label>
                                        <Input id="lastName" name="lastName" value={editData.lastName} onChange={handleEditInputChange} />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                                    <Input id="phoneNumber" name="phoneNumber" type="tel" value={editData.phoneNumber} onChange={handleEditInputChange} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleProfileUpdate}><Save className="mr-2 h-4 w-4" /> Kaydet</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="ilanlar"><Briefcase className="w-4 h-4 mr-2" />Aktif İlanlar</TabsTrigger>
                    {adminData?.permissions.canTrackLocations && <TabsTrigger value="konum"><MapPin className="w-4 h-4 mr-2" />Konum Takibi</TabsTrigger>}
                    {adminData?.permissions.canManageMembers && <TabsTrigger value="uyeler"><Users className="w-4 h-4 mr-2" />Üye Listesi</TabsTrigger>}
                </TabsList>

                <TabsContent value="ilanlar" className="mt-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="lg:col-span-1">
                          <CardHeader>
                            <CardTitle>Aktif Yük İlanları ({loads?.length || 0})</CardTitle>
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
                            <CardTitle>Müsait Şoförler ({availableDrivers?.length || 0})</CardTitle>
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
                </TabsContent>

                {adminData?.permissions.canTrackLocations && (
                    <TabsContent value="konum" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Harita</CardTitle>
                                <CardDescription>{isLoading ? 'Şoför konumları yükleniyor...' : `${activeDriversWithLocation.length} aktif şoför bulundu.`}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0" style={{ height: '60vh' }}>
                                {isLoading ? <Skeleton className="w-full h-full" /> : (
                                    <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
                                        <p className="text-muted-foreground">Harita özelliği geçici olarak devre dışıdır.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {adminData?.permissions.canManageMembers && (
                    <TabsContent value="uyeler" className="mt-4">
                       <div className="grid gap-6 lg:grid-cols-2">
                             <Card>
                                <CardHeader>
                                  <CardTitle>Firma Listesi ({firms?.length || 0})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Yetkili</TableHead>
                                        <TableHead>Konum</TableHead>
                                        <TableHead className="text-right">İletişim</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {isLoadingFirms && <TableRow><TableCell colSpan={3} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                                      {!isLoadingFirms && firms?.map((firma: any) => (
                                        <TableRow key={firma.id}>
                                          <TableCell className="font-medium">{firma.firstName} {firma.lastName}</TableCell>
                                          <TableCell>{firma.city}, {firma.district}</TableCell>
                                          <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" asChild><a href={`tel:${firma.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                               <Card>
                                <CardHeader>
                                  <CardTitle>Şoför Listesi ({drivers?.length || 0})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">İletişim</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {isLoadingAllDrivers && <TableRow><TableCell colSpan={3} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                                      {!isLoadingAllDrivers && drivers?.map((sofor: any) => (
                                        <TableRow key={sofor.id}>
                                          <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                                          <TableCell>
                                             <Badge variant={sofor.isAvailable ? 'default' : 'destructive'} className={sofor.isAvailable ? 'bg-green-600' : 'bg-red-600'}>
                                                {sofor.isAvailable ? 'Boşta' : 'Dolu'}
                                            </Badge>
                                          </TableCell>
                                           <TableCell className="text-right space-x-2">
                                             <Button variant="outline" size="sm" asChild><a href={`tel:${sofor.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                       </div>
                    </TabsContent>
                )}
            </Tabs>
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
