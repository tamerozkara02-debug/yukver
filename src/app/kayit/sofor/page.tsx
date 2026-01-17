'use client';

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { debounce } from 'lodash';

export default function SoforKayitPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const driverAvatar = placeholderImages.find(p => p.id === 'avatar-driver');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(driverAvatar?.imageUrl || null);
  const [vehicleType, setVehicleType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const checkEmail = async (email: string) => {
    if (!email) {
      setEmailError(null);
      return;
    }
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setEmailError("Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      setEmailError(null);
    }
  };

  const debouncedCheckEmail = useCallback(debounce(checkEmail, 500), [auth]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedCheckEmail(e.target.value);
  };
  
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('90')) {
            value = value.substring(2);
        }
        value = value.substring(0, 10);
        const size = value.length;
        let formattedValue;
        if (size === 0) {
            formattedValue = '';
        } else if (size < 4) {
            formattedValue = '+90 (' + value;
        } else if (size < 7) {
            formattedValue = '+90 (' + value.substring(0, 3) + ') ' + value.substring(3, 6);
        } else {
            formattedValue = '+90 (' + value.substring(0, 3) + ') ' + value.substring(3, 6) + ' ' + value.substring(6, 10);
        }
        setPhoneNumber(formattedValue);
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (emailError) {
          toast({ variant: 'destructive', title: 'Hata', description: emailError });
          return;
      }

      setIsSubmitting(true);

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('ad') as string;
      const lastName = formData.get('soyad') as string;
      const vehiclePlate = formData.get('arac-plaka') as string;

      if (!email || !password || !firstName || !lastName || !phoneNumber || !vehicleType || !vehiclePlate) {
          toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen tüm zorunlu alanları doldurun.' });
          setIsSubmitting(false);
          return;
      }
      
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: 'Bu e-posta adresi zaten kullanımda.' });
          setIsSubmitting(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (firestore) {
            const driverRef = doc(firestore, 'drivers', user.uid);
            await setDoc(driverRef, {
                id: user.uid,
                firstName,
                lastName,
                phoneNumber,
                vehicleType,
                vehiclePlate,
                profilePicture: avatarPreview || ''
            });
        }
        
        toast({ title: 'Başarılı', description: 'Şoför kaydı tamamlandı. Panele yönlendiriliyorsunuz.' });
        router.push('/sofor/dashboard');

      } catch (error: any) {
        console.error("Şoför kayıt hatası:", error);
        if (error.code === 'auth/email-already-in-use') {
             toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: 'Bu e-posta adresi zaten kullanımda.' });
        } else if (error.code === 'auth/invalid-email') {
             toast({ variant: 'destructive', title: 'Geçersiz E-posta', description: 'Lütfen geçerli ve gerçek bir e-posta adresi girin. Sistem, sahte veya geçersiz formatlı adresleri kabul etmemektedir.' });
        } else {
            toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
        }
      } finally {
        setIsSubmitting(false);
      }
  }

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Şoför Kayıt</CardTitle>
        <CardDescription>Sürücü ve araç bilgilerinizi girerek sisteme katılın.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt="Şoför Profili" />}
                  <AvatarFallback>ŞR</AvatarFallback>
                </Avatar>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/*"
                      disabled={isSubmitting}
                  />
                <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90" onClick={handleAvatarClick} disabled={isSubmitting}>
                  <Camera className="h-4 w-4"/>
                  <span className="sr-only">Profil resmini değiştir</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground px-4">
                Doğrulama işlemleri için, lütfen araç plakanızın net olarak göründüğü bir fotoğraf yükleyiniz.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Ad</Label>
              <Input id="ad" name="ad" placeholder="Mehmet" required disabled={isSubmitting}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Soyad</Label>
              <Input id="soyad" name="soyad" placeholder="Öztürk" required disabled={isSubmitting}/>
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="ornek@mail.com" required onChange={handleEmailChange} disabled={isSubmitting}/>
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon Numarası</Label>
            <Input id="telefon" name="telefon" type="tel" placeholder="+90 (___) ___ ____" required disabled={isSubmitting} value={phoneNumber} onChange={handlePhoneChange}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arac-tipi">Araç Tipi</Label>
              <Select onValueChange={setVehicleType} required disabled={isSubmitting}>
                <SelectTrigger id="arac-tipi">
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
              <Label htmlFor="arac-plaka">Araç Plakası</Label>
              <Input id="arac-plaka" name="arac-plaka" placeholder="34 ABC 123" required disabled={isSubmitting}/>
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" name="password" type="password" required disabled={isSubmitting}/>
            </div>
          <Button type="submit" className="w-full !mt-6" disabled={isSubmitting || !!emailError}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol ve İşe Başla'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
