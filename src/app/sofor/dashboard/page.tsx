'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { LogOut, Phone, Truck, UserCircle, MapPin, LocateFixed, ToggleLeft, ToggleRight, Edit, Camera, Save } from 'lucide-react';
import Image from 'next/image';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SoforDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const driverDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'drivers', user.uid) : null),
    [firestore, user]
  );
  const { data: driverData, isLoading: isDriverLoading, error } = useDoc(driverDocRef);

  const [currentCity, setCurrentCity] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const driverAvatar = placeholderImages.find(p => p.id === 'avatar-driver');
  const vehicleImage = placeholderImages.find(p => p.id === 'vehicle-profile');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    vehicleType: '',
    vehiclePlate: '',
  });

  // Populate form when driverData is loaded
  useEffect(() => {
    if (driverData) {
      setCurrentCity(driverData.currentCity || '');
      setIsAvailable(driverData.isAvailable !== false); // Default to true if undefined
      setEditData({
          firstName: driverData.firstName || '',
          lastName: driverData.lastName || '',
          phoneNumber: driverData.phoneNumber || '',
          vehicleType: driverData.vehicleType || '',
          vehiclePlate: driverData.vehiclePlate || '',
      });
    }
  }, [driverData]);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleTypeChange = (value: string) => {
    setEditData(prev => ({ ...prev, vehicleType: value }));
  };

  const handleProfileUpdate = async () => {
    if (!driverDocRef) return;
    try {
      await updateDoc(driverDocRef, editData);
      toast({
        title: 'Başarılı',
        description: 'Profil bilgileriniz güncellendi.',
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Profiliniz güncellenemedi.',
      });
    }
  };


  // GPS Tracking Effect
  useEffect(() => {
    let watchId: number | null = null;
    if (isTracking && driverDocRef) {
      if (!navigator.geolocation) {
        setLocationError('GPS bu tarayıcıda desteklenmiyor.');
        setIsTracking(false);
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          updateDoc(driverDocRef, {
            latitude,
            longitude,
            lastLocationUpdate: serverTimestamp(),
          }).catch(error => {
            console.error('Konum güncellenirken hata oluştu:', error);
          });
          setLocationError(null);
        },
        error => {
          let message = 'Konum alınamadı. Lütfen konum servislerini kontrol edin.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
          }
          setLocationError(message);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, driverDocRef]);

  // Location Error Toast Effect
  useEffect(() => {
    if (locationError) {
      toast({
        variant: 'destructive',
        title: 'Konum Hatası',
        description: locationError,
      });
    }
  }, [locationError, toast]);
  
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && driverDocRef) {
      const file = event.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      // In a real app, you'd upload this file to Firebase Storage and save the URL.
      // For this example, we'll just save the temporary blob URL.
      try {
        await updateDoc(driverDocRef, {
          profilePicture: previewUrl
        });
        toast({ title: 'Başarılı', description: 'Profil resmi güncellendi.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Profil resmi güncellenemedi.' });
        console.error("Avatar update error:", error);
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };


  const handleStatusUpdate = async () => {
    if (!driverDocRef) return;
    try {
      await updateDoc(driverDocRef, {
        currentCity,
        isAvailable,
      });
      toast({
        title: 'Durum Güncellendi',
        description: 'Anlık durumunuz başarıyla sisteme kaydedildi.',
      });
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Durumunuz güncellenemedi.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/giris');
  };

  if (isUserLoading || isDriverLoading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (error) {
    // This can happen if the user is not a driver
    // router.push('/giris');
    return <div>Hata: Sürücü profili yüklenemedi.</div>
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Avatar className="h-12 w-12">
                  {driverData?.profilePicture ? (
                    <AvatarImage src={driverData.profilePicture} />
                  ) : (
                    driverAvatar && <AvatarImage src={driverAvatar.imageUrl} data-ai-hint={driverAvatar.imageHint} />
                  )}
                  <AvatarFallback>
                    {driverData?.firstName?.[0]}
                    {driverData?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                 <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
                <Button 
                  size="icon" 
                  className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                  onClick={handleAvatarClick}
                >
                  <Camera className="h-5 w-5 text-white"/>
                  <span className="sr-only">Profil resmini değiştir</span>
                </Button>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-headline">Şoför Panelim</h1>
              <p className="text-sm text-muted-foreground">
                Hoş geldiniz, {driverData?.firstName} {driverData?.lastName}!
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
             <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Edit className="w-6 h-6 text-primary" />
                Anlık Durumunu Güncelle
              </CardTitle>
              <CardDescription>
                Çağrı merkezinin size uygun yükleri bulabilmesi için mevcut durumunuzu güncel tutun.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentCity">Şu An Bulunduğunuz Şehir</Label>
                <Input 
                  id="currentCity" 
                  value={currentCity} 
                  onChange={(e) => setCurrentCity(e.target.value)} 
                  placeholder="Örn: Ankara"
                />
              </div>
              <div className="space-y-3">
                <Label>Araç Durumu</Label>
                <RadioGroup 
                  value={isAvailable ? 'available' : 'unavailable'} 
                  onValueChange={(value) => setIsAvailable(value === 'available')} 
                  className="flex gap-4"
                >
                  <Label htmlFor="available" className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer flex-1 justify-center data-[state=checked]:bg-green-100 data-[state=checked]:border-green-400">
                    <RadioGroupItem value="available" id="available" />
                    <ToggleRight className="w-5 h-5 text-green-600 mr-2"/>
                    <span>Araç Boş (Yüke Hazır)</span>
                  </Label>
                  <Label htmlFor="unavailable" className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer flex-1 justify-center data-[state=checked]:bg-red-100 data-[state=checked]:border-red-400">
                    <RadioGroupItem value="unavailable" id="unavailable" />
                     <ToggleLeft className="w-5 h-5 text-red-600 mr-2"/>
                    <span>Araç Dolu</span>
                  </Label>
                </RadioGroup>
              </div>
            </CardContent>
            <CardContent>
               <Button onClick={handleStatusUpdate} className="w-full">
                  Durumu Güncelle
                </Button>
            </CardContent>
          </Card>
           <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <LocateFixed className="w-6 h-6 text-primary" /> Konum Takibi
                </CardTitle>
                <CardDescription>
                  Konumunuzu paylaşarak size daha uygun yükler bulmamıza yardımcı olun.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Konum Paylaşımını Aktifleştir</p>
                    <p className="text-sm text-muted-foreground">
                      {isTracking ? 'Konumunuz anlık olarak paylaşılıyor.' : 'Konum takibi kapalı.'}
                    </p>
                  </div>
                  <Switch id="tracking-switch" checked={isTracking} onCheckedChange={setIsTracking} />
                </div>
                {isTracking && (
                   <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-green-500" />
                    GPS aktif. Konumunuz periyodik olarak güncelleniyor.
                  </p>
                )}
              </CardContent>
            </Card>

             <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Yük mü Arıyorsunuz?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Sistemimize kayıtlı yüzlerce yükten size en uygun olanını bulmak için tek yapmanız gereken çağrı
                  merkezimizi aramak. Uzman ekibimiz 7/24 hizmetinizde.
                </p>
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Phone className="mr-2 h-5 w-5" /> Çağrı Merkezini Ara (0850 123 45 67)
                </Button>
              </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-primary" /> Profil Bilgilerim
                </CardTitle>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <Edit className="w-5 h-5"/>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Profil Bilgilerini Düzenle</DialogTitle>
                        <DialogDescription>
                            Değişiklikleri yaptıktan sonra kaydet butonuna tıklayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Ad</Label>
                                <Input id="firstName" name="firstName" value={editData.firstName} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Soyad</Label>
                                <Input id="lastName" name="lastName" value={editData.lastName} onChange={handleEditInputChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                            <Input id="phoneNumber" name="phoneNumber" value={editData.phoneNumber} onChange={handleEditInputChange} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vehicleType">Araç Tipi</Label>
                                <Select value={editData.vehicleType} onValueChange={handleVehicleTypeChange}>
                                    <SelectTrigger id="vehicleType">
                                        <SelectValue placeholder="Araç tipini seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tir">Tır</SelectItem>
                                        <SelectItem value="kamyon">Kamyon</SelectItem>
                                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                                        <SelectItem value="treyler">Treyler</SelectItem>
                                        <SelectItem value="konteyner">Konteyner</SelectItem>
                                        <SelectItem value="swap-body">Swap Body</SelectItem>
                                        <SelectItem value="lowbed">Lowbed</SelectItem>
                                        <SelectItem value="panelvan">Panelvan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vehiclePlate">Araç Plakası</Label>
                                <Input id="vehiclePlate" name="vehiclePlate" value={editData.vehiclePlate} onChange={handleEditInputChange} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleProfileUpdate}><Save className="mr-2 h-4 w-4"/> Değişiklikleri Kaydet</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <strong className="text-muted-foreground w-24 inline-block">Ad Soyad:</strong> {driverData?.firstName}{' '}
                  {driverData?.lastName}
                </p>
                <p>
                  <strong className="text-muted-foreground w-24 inline-block">Telefon:</strong> {driverData?.phoneNumber}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Truck className="w-6 h-6 text-primary" /> Araç Bilgilerim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vehicleImage && (
                  <div className="rounded-lg overflow-hidden mb-4">
                    <Image
                      src={vehicleImage.imageUrl}
                      alt="Araç Profili"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                      data-ai-hint={vehicleImage.imageHint}
                    />
                  </div>
                )}
                <p className="text-sm">
                  <strong className="text-muted-foreground w-24 inline-block">Araç Tipi:</strong>{' '}
                  {driverData?.vehicleType}
                </p>
                <p className="text-sm">
                  <strong className="text-muted-foreground w-24 inline-block">Plaka:</strong> {driverData?.vehiclePlate}
                </p>
              </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}
