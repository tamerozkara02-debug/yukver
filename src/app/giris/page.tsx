"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GirisPage() {
    const router = useRouter();

    const handleLogin = (role: 'firma' | 'sofor' | 'admin') => {
        // Mock login logic
        router.push(`/${role}/dashboard`);
    }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="firma" className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
                <Truck className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground font-headline">Lojistik Merkezi</h1>
            </Link>
        </div>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="firma">Firma</TabsTrigger>
          <TabsTrigger value="sofor">Şoför</TabsTrigger>
          <TabsTrigger value="personel">Personel</TabsTrigger>
        </TabsList>
        <TabsContent value="firma">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Firma Girişi</CardTitle>
              <CardDescription>
                Yüklerinizi yönetmek için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firma-email">Email</Label>
                <Input id="firma-email" type="email" placeholder="ornek@sirket.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firma-password">Şifre</Label>
                <Input id="firma-password" type="password" required />
              </div>
              <Button type="submit" className="w-full" onClick={() => handleLogin('firma')}>
                Giriş Yap
              </Button>
               <div className="mt-4 text-center text-sm">
                Hesabınız yok mu?{" "}
                <Link href="/kayit/firma" className="underline">
                  Kayıt Olun
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sofor">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Şoför Girişi</CardTitle>
              <CardDescription>
                Yeni yük fırsatları için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sofor-tel">Telefon Numarası</Label>
                <Input id="sofor-tel" type="tel" placeholder="555 123 4567" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sofor-password">Şifre</Label>
                <Input id="sofor-password" type="password" required />
              </div>
              <Button type="submit" className="w-full" onClick={() => handleLogin('sofor')}>
                Giriş Yap
              </Button>
              <div className="mt-4 text-center text-sm">
                Hesabınız yok mu?{" "}
                <Link href="/kayit/sofor" className="underline">
                  Kayıt Olun
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="personel">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Personel Girişi</CardTitle>
              <CardDescription>
                Yönetim paneline erişmek için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personel-username">Kullanıcı Adı</Label>
                <Input id="personel-username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personel-password">Şifre</Label>
                <Input id="personel-password" type="password" required />
              </div>
              <Button type="submit" className="w-full" onClick={() => router.push('/admin/dashboard')}>
                Giriş Yap
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
