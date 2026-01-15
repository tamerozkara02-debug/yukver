'use client';

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";

export default function FirmaKayitPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const companyAvatar = placeholderImages.find(p => p.id === 'avatar-company');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(companyAvatar?.imageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('ad') as string;
        const lastName = formData.get('soyad') as string;
        const phoneNumber = formData.get('telefon') as string;
        const city = formData.get('sehir') as string;
        const district = formData.get('ilce') as string;

        if (!email || !password || !firstName || !lastName || !phoneNumber || !city || !district) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen tüm alanları doldurun.' });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if(firestore) {
                const firmRef = doc(firestore, 'firms', user.uid);
                await setDoc(firmRef, {
                    id: user.uid,
                    firstName,
                    lastName,
                    phoneNumber,
                    city,
                    district,
                    profilePicture: avatarPreview || '',
                });
            }

            toast({ title: 'Başarılı', description: 'Firma kaydı tamamlandı.' });
            router.push('/firma/dashboard');

        } catch (error: any) {
            console.error("Firma kayıt hatası:", error);
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
        <CardTitle className="font-headline text-2xl">Firma Kayıt</CardTitle>
        <CardDescription>Firma bilgilerinizi girerek kaydınızı tamamlayın.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
                 <div className="relative">
                    <Avatar className="h-24 w-24">
                        {avatarPreview && <AvatarImage src={avatarPreview} alt="Firma Profili" />}
                        <AvatarFallback>FM</AvatarFallback>
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
              <Label htmlFor="ad">Yetkili Adı</Label>
              <Input id="ad" name="ad" placeholder="Ahmet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Yetkili Soyadı</Label>
              <Input id="soyad" name="soyad" placeholder="Yılmaz" required />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
            </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon Numarası</Label>
            <Input id="telefon" name="telefon" type="tel" placeholder="555 123 4567" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sehir">Bulunduğu Şehir</Label>
              <Input id="sehir" name="sehir" placeholder="İstanbul" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ilce">İlçe</Label>
              <Input id="ilce" name="ilce" placeholder="Kadıköy" required />
            </div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          <Button type="submit" className="w-full !mt-6">
            Kayıt Ol
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
