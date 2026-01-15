// This page is aliased by /app/giris/page.tsx which has a tab for staff login.
// This direct URL is for staff who know the direct path.

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
import { Truck } from "lucide-react";

export default function AdminGirisPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Link href="/" className="flex items-center gap-2">
                    <Truck className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground font-headline">Lojistik Merkezi</h1>
                </Link>
            </div>
          <CardTitle className="font-headline text-2xl">Personel Girişi</CardTitle>
          <CardDescription>
            Yönetim paneline erişmek için giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/admin/dashboard" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input id="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full !mt-6">
              Giriş Yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
