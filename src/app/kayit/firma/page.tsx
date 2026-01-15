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

export default function FirmaKayitPage() {
    const router = useRouter();
    const companyAvatar = placeholderImages.find(p => p.id === 'avatar-company');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(companyAvatar?.imageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would handle form submission
        console.log("Firma kayıt formu gönderildi");
        router.push('/firma/dashboard');
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
              <Input id="ad" placeholder="Ahmet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Yetkili Soyadı</Label>
              <Input id="soyad" placeholder="Yılmaz" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon Numarası</Label>
            <Input id="telefon" type="tel" placeholder="555 123 4567" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sehir">Bulunduğu Şehir</Label>
              <Input id="sehir" placeholder="İstanbul" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ilce">İlçe</Label>
              <Input id="ilce" placeholder="Kadıköy" required />
            </div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required />
            </div>
          <Button type="submit" className="w-full !mt-6">
            Kayıt Ol
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
