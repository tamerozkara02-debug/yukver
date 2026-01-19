'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { LogOut, Phone, Truck, UserCircle, MapPin, LocateFixed, ToggleLeft, ToggleRight, Edit, Camera, Save, MessageSquare, Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function SoforDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicleFileInputRef = useRef<HTMLInputElement>(null);
  const watchIdRef = useRef<number | null>(null);

  const driverDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'drivers', user.uid) : null),
    [firestore, user]
  );
  const { data: driverData, isLoading: isDriverLoading, error } = useDoc(driverDocRef);

  const [currentCity, setCurrentCity] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [trackingOffWarning, setTrackingOffWarning] = useState(false);

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
  const [profileCompletionAlert, setProfileCompletionAlert] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);

  // State for review form
  const [allFirms, setAllFirms] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [selectedFirm, setSelectedFirm] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Fetch firms for the review dropdown
  useEffect(() => {
    if (!firestore) return;
    const fetchFirms = async () => {
      try {
        const firmsCollectionRef = collection(firestore, 'firms');
        const querySnapshot = await getDocs(firmsCollectionRef);
        const firmsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setAllFirms(firmsList as any);
      } catch(e) {
          console.error("Error fetching firms for review form: ", e);
      }
    };
    fetchFirms();
  }, [firestore]);


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
      setAvatarPreview(driverData.profilePicture || null);
      setVehicleImagePreview(driverData.vehiclePicture || null);
      // Sync tracking state with DB if location is present
      if (driverData.latitude && driverData.longitude) {
          setIsTracking(true);
      }
      
      const isProfileIncomplete = !driverData.phoneNumber || !driverData.vehicleType || !driverData.vehiclePlate;
      if (isProfileIncomplete) {
        setIsEditDialogOpen(true);
        setProfileCompletionAlert(true);
      }
    }
  }, [driverData]);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
        let input = value.replace(/\D/g, '');
        if (input.startsWith('90')) {
            input = input.substring(2);
        }
        input = input.substring(0, 10);
        const size = input.length;
        let formattedValue;
        if (size === 0) {
            formattedValue = '';
        } else if (size < 4) {
            formattedValue = '+90 (' + input;
        } else if (size < 7) {
            formattedValue = '+90 (' + input.substring(0, 3) + ') ' + input.substring(3, 6);
        } else {
            formattedValue = '+90 (' + input.substring(0, 3) + ') ' + input.substring(3, 6) + ' ' + input.substring(6, 10);
        }
        setEditData(prev => ({ ...prev, phoneNumber: formattedValue }));
    } else {
        setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVehicleTypeChange = (value: string) => {
    setEditData(prev => ({ ...prev, vehicleType: value }));
  };

  const handleProfileUpdate = async () => {
    if (!driverDocRef) return;

    if (!editData.phoneNumber || !editData.vehicleType || !editData.vehiclePlate) {
        toast({
            variant: 'destructive',
            title: 'Eksik Bilgi',
            description: 'Lütfen telefon numarası, araç tipi ve plaka alanlarını doldurun.',
        });
        return;
    }

    try {
      await updateDoc(driverDocRef, editData);
      toast({
        title: 'Başarılı',
        description: 'Profil bilgileriniz güncellendi.',
      });
      setIsEditDialogOpen(false);
      setProfileCompletionAlert(false);
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Profiliniz güncellenemedi.',
      });
    }
  };
  
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && driverDocRef) {
      const file = event.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      // In a real app, you'd upload this file to Firebase Storage and save the URL.
      try {
        await updateDoc(driverDocRef, {
          profilePicture: previewUrl
        });
        toast({ title: 'Başarılı', description: 'Profil resmi güncellendi.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Profil resmi güncellenemedi.' });
        console.error("Avatar update error:", error);
        setAvatarPreview(driverData?.profilePicture || null);
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleVehicleImageClick = () => {
    vehicleFileInputRef.current?.click();
  };

  const handleVehicleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0] && driverDocRef) {
        const file = event.target.files[0];
        const previewUrl = URL.createObjectURL(file);
        setVehicleImagePreview(previewUrl);
        try {
          await updateDoc(driverDocRef, {
            vehiclePicture: previewUrl
          });
          toast({ title: 'Başarılı', description: 'Araç resmi güncellendi.' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Hata', description: 'Araç resmi güncellenemedi.' });
          console.error("Vehicle image update error:", error);
          setVehicleImagePreview(driverData?.vehiclePicture || null);
        }
      }
  };


  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const handleTrackingToggle = (shouldTrack: boolean) => {
    setLocationError(null);
    setTrackingOffWarning(false);

    if (!shouldTrack) {
      if (driverData?.isAvailable === false) {
        setTrackingOffWarning(true);
      }
      stopTracking();
      return;
    }

    if (!navigator.geolocation) {
      const errorMsg = 'Konum servisleri bu tarayıcıda desteklenmiyor.';
      setLocationError(errorMsg);
      toast({ variant: 'destructive', title: 'Konum Hatası', description: errorMsg });
      return;
    }

    setIsTracking(true); 
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (driverDocRef) {
            updateDoc(driverDocRef, {
                latitude,
                longitude,
                lastLocationUpdate: serverTimestamp(),
            }).catch(dbError => {
                // Non-blocking update, but log error if it happens
                console.error("Initial location update failed:", dbError);
            });
        }
      },
      (error) => {
        let message = 'Konum alınamadı. Cihazınızın konum servislerinin açık olduğundan emin olun.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Konum izni reddedildi. Konum takibini kullanmak için lütfen tarayıcı veya cihaz ayarlarınızdan bu site için konum iznini etkinleştirin.';
        }
        setLocationError(message);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  
  useEffect(() => {
    if (isTracking && driverDocRef) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocationError(null);
          const { latitude, longitude } = position.coords;
          updateDoc(driverDocRef, {
            latitude,
            longitude,
            lastLocationUpdate: serverTimestamp(),
          }).catch((dbError) => {
            console.error('Firestore location update error:', dbError);
          });
        },
        (error) => {
          let message = 'Anlık konum alınamıyor. Lütfen konum servislerinizi kontrol edin.';
           if (error.code === error.PERMISSION_DENIED) {
            message = 'Konum izni iptal edildi. Takibi yeniden başlatmak için özelliği kapatıp açın ve izin verin.';
            setIsTracking(false);
          }
          setLocationError(message);
          stopTracking();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking, driverDocRef]);


  const handleStatusUpdate = async () => {
    if (!driverDocRef) return;
    if (isAvailable) {
        setTrackingOffWarning(false);
    }
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !selectedFirm || rating === 0 || !comment) {
        toast({
            variant: 'destructive',
            title: 'Eksik Bilgi',
            description: 'Lütfen firma seçimi, puanlama ve yorum alanlarının tümünü doldurun.',
        });
        return;
    }
    setIsReviewSubmitting(true);
    try {
        const reviewsCollectionRef = collection(firestore, 'reviews');
        await addDoc(reviewsCollectionRef, {
            reviewerId: user.uid,
            reviewerRole: 'sofor',
            revieweeId: selectedFirm,
            revieweeRole: 'firma',
            rating,
            comment,
            createdAt: serverTimestamp(),
        });
        toast({
            title: 'Başarılı',
            description: 'Değerlendirmeniz başarıyla gönderildi. Teşekkür ederiz!',
        });
        // Clear form
        setSelectedFirm('');
        setRating(0);
        setComment('');
    } catch (error) {
        console.error('Error submitting review:', error);
        toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Değerlendirme gönderilemedi. Lütfen daha sonra tekrar deneyin.',
        });
    } finally {
        setIsReviewSubmitting(false);
    }
}


  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/giris');
  };
  
  const handleDialogClose = (open: boolean) => {
      if (profileCompletionAlert && !open) {
          toast({ variant: 'destructive', title: 'Zorunlu Alanlar', description: 'Lütfen devam etmeden önce profilinizi tamamlayın.' });
          return;
      }
      setIsEditDialogOpen(open);
  }

  if (isUserLoading || isDriverLoading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (error) {
    return <div>Hata: Sürücü profili yüklenemedi. Lütfen tekrar giriş yapmayı deneyin.</div>
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Avatar className="h-12 w-12">
                   {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Şoför Profili" />
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
        {profileCompletionAlert && (
             <div className="md:col-span-3">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Profilinizi Tamamlayın!</AlertTitle>
                    <AlertDescription>
                        Platformu kullanmaya başlamadan önce lütfen araç ve iletişim bilgilerinizi eksiksiz doldurun.
                    </AlertDescription>
                </Alert>
            </div>
        )}
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
                      {isTracking && !locationError 
                        ? 'Konumunuz anlık olarak paylaşılıyor.' 
                        : 'Konum takibi kapalı.'}
                    </p>
                  </div>
                  <Switch id="tracking-switch" checked={isTracking} onCheckedChange={handleTrackingToggle} />
                </div>
                {trackingOffWarning && (
                    <Alert variant="destructive" className="mt-4">
                        <LocateFixed className="h-4 w-4" />
                        <AlertTitle>Uyarı: Konum Takibi Kapalı</AlertTitle>
                        <AlertDescription>
                            İş durumunuz "Araç Dolu" olarak ayarlı iken konumunuzu kapattınız. Lütfen işiniz bittiğinde durumu "Araç Boş" olarak güncellemeyi ve konumunuzu tekrar açmayı unutmayın.
                        </AlertDescription>
                    </Alert>
                )}
                 {locationError && (
                    <Alert variant="destructive" className="mt-4">
                        <LocateFixed className="h-4 w-4" />
                        <AlertTitle>Konum Erişimi Sorunu</AlertTitle>
                        <AlertDescription>{locationError}</AlertDescription>
                    </Alert>
                )}
                {isTracking && !locationError && (
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
                <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <Edit className="w-5 h-5"/>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Profil Bilgilerini Düzenle</DialogTitle>
                        <DialogDescription>
                            {profileCompletionAlert ? 'Lütfen platformu kullanmaya başlamadan önce tüm bilgilerinizi eksiksiz doldurun.' : 'Değişiklikleri yaptıktan sonra kaydet butonuna tıklayın.'}
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
                            <Input id="phoneNumber" name="phoneNumber" value={editData.phoneNumber} onChange={handleEditInputChange} placeholder="+90 (___) ___ ____" />
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
                <div className="relative group rounded-lg overflow-hidden mb-4">
                    <Image
                      src={vehicleImagePreview || vehicleImage?.imageUrl || 'https://picsum.photos/seed/vehicle/400/300'}
                      alt="Araç Profili"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                      data-ai-hint={vehicleImage?.imageHint || 'truck'}
                    />
                     <input
                      type="file"
                      ref={vehicleFileInputRef}
                      onChange={handleVehicleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div 
                      className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                      onClick={handleVehicleImageClick}
                      role="button"
                      aria-label="Araç resmini değiştir"
                    >
                      <Camera className="h-8 w-8 text-white"/>
                    </div>
                </div>
                <p className="text-sm">
                  <strong className="text-muted-foreground w-24 inline-block">Araç Tipi:</strong>{' '}
                  {driverData?.vehicleType}
                </p>
                <p className="text-sm">
                  <strong className="text-muted-foreground w-24 inline-block">Plaka:</strong> {driverData?.vehiclePlate}
                </p>
              </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Firma Değerlendir
                    </CardTitle>
                    <CardDescription>
                        İşbirliği yaptığınız firma hakkında geri bildirimde bulunun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTitle className="font-semibold">Gizlilik ve Amaç</AlertTitle>
                        <AlertDescription className="text-xs">
                            Paylaştığınız geri bildirimler, hizmet kalitemizi artırmak ve platformumuzdaki profesyonel iş ahlakını teşvik etmek amacıyla kullanılır. Yorumlarınız üçüncü taraflarla paylaşılmayacak olup, yalnızca şirket içi değerlendirme süreçlerimizde dikkate alınacaktır.
                        </AlertDescription>
                    </Alert>
                    <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="firm-select">Değerlendirilecek Firma</Label>
                            <Select value={selectedFirm} onValueChange={setSelectedFirm}>
                                <SelectTrigger id="firm-select">
                                    <SelectValue placeholder="Firma seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allFirms.map(firm => (
                                        <SelectItem key={firm.id} value={firm.id}>
                                            {firm.firstName} {firm.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Puanınız</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            'w-6 h-6 cursor-pointer transition-colors',
                                            rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-gray-400'
                                        )}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment-sofor">Yorumunuz</Label>
                            <Textarea id="comment-sofor" value={comment} onChange={e => setComment(e.target.value)} placeholder="Firmanın iletişimi, ödeme süreci ve genel tutumu hakkındaki düşüncelerinizi paylaşın." required/>
                        </div>
                        <Button type="submit" className="w-full" disabled={isReviewSubmitting}>
                            {isReviewSubmitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}
