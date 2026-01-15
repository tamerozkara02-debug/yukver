'use client';

import { useRef, useState } from "react";
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function SoforKayitPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const driverAvatar = placeholderImages.find(p => p.id === 'avatar-driver');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(driverAvatar?.imageUrl || null);
  const [vehicleType, setVehicleType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('ad') as string;
      const lastName = formData.get('soyad') as string;
      const phoneNumber = formData.get('telefon') as string;
      const vehiclePlate = formData.get('arac-plaka') as string;

      if (!email || !password || !firstName || !lastName || !phoneNumber || !vehicleType || !vehiclePlate) {
          toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen tüm alanları doldurun.' });
          return;
      }
      
      try {
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
        
        toast({ title: 'Başarılı', description: 'Şoför kaydı tamamlandı.' });
        router.push('/sofor/dashboard');

      } catch (error: any) {
        console.error("Şoför kayıt hatası:", error);
        toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: error.message });
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
          <div className="flex justify-center mb-4">
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
                />
              <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90" onClick={handleAvatarClick}>
                <Camera className="h-4 w-4"/>
                <span className="sr-only">Profil resmini değiştir</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Ad</Label>
              <Input id="ad" name="ad" placeholder="Mehmet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Soyad</Label>
              <Input id="soyad" name="soyad" placeholder="Öztürk" required />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="ornek@mail.com" required />
            </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon Numarası</Label>
            <Input id="telefon" name="telefon" type="tel" placeholder="555 123 4567" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arac-tipi">Araç Tipi</Label>
              <Select onValueChange={setVehicleType} required>
                <SelectTrigger id="arac-tipi">
                  <SelectValue placeholder="Araç tipini seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tir">Tır</SelectItem>
                  <SelectItem value="kamyon">Kamyon</SelectItem>
                  <SelectItem value="kamyonet">Kamyonet</SelectItem>
                  <SelectItem value="panelvan">Panelvan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arac-plaka">Araç Plakası</Label>
              <Input id="arac-plaka" name="arac-plaka" placeholder="34 ABC 123" required />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          <Button type="submit" className="w-full !mt-6">
            Kayıt Ol ve İşe Başla
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
