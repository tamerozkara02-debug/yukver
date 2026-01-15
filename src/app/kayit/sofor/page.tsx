'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SoforKayitPage() {
  const router = useRouter();
  const driverAvatar = placeholderImages.find(p => p.id === 'avatar-driver');

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Here you would handle form submission
      console.log("Şoför kayıt formu gönderildi");
      router.push('/sofor/dashboard');
  }

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
                {driverAvatar && <AvatarImage src={driverAvatar.imageUrl} alt="Şoför Profili" data-ai-hint={driverAvatar.imageHint} />}
                <AvatarFallback>ŞR</AvatarFallback>
              </Avatar>
              <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90">
                <Camera className="h-4 w-4"/>
                <span className="sr-only">Profil resmini değiştir</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Ad</Label>
              <Input id="ad" placeholder="Mehmet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Soyad</Label>
              <Input id="soyad" placeholder="Öztürk" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon Numarası</Label>
            <Input id="telefon" type="tel" placeholder="555 123 4567" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arac-tipi">Araç Tipi</Label>
              <Select>
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
              <Input id="arac-plaka" placeholder="34 ABC 123" required />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required />
            </div>
          <Button type="submit" className="w-full !mt-6">
            Kayıt Ol ve İşe Başla
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
