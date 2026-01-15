"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building, LogOut, Phone, Send, CheckCircle } from "lucide-react";
import { useAuth, useDoc, useFirestore, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, doc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function FirmaDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const firmDocRef = (firestore && user) ? doc(firestore, 'firms', user.uid) : null;
  const { data: firmData, isLoading: isFirmLoading } = useDoc(firmDocRef);

  const [submitted, setSubmitted] = useState(false);
  const [loadInfo, setLoadInfo] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    const loadsCollection = collection(firestore, 'firms', user.uid, 'loads');
    addDoc(loadsCollection, {
        firmId: user.uid,
        loadInformation: loadInfo,
        originCity,
        destinationCity,
        requiredVehicleType: vehicleType,
    }).then(() => {
        setSubmitted(true);
        toast({ title: 'Yük Kaydedildi!', description: 'Yük bilgileriniz başarıyla sisteme kaydedildi.' });
    }).catch((error) => {
        console.error("Error adding load:", error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Yük kaydedilemedi.' });
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/giris');
  }

  if (isUserLoading || isFirmLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground font-headline">Firma Panelim</h1>
              <p className="text-sm text-muted-foreground">Hoş geldiniz, {firmData?.firstName} {firmData?.lastName}!</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Çıkış Yap</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <Card className="text-center bg-green-50 border-green-200">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="font-headline text-2xl mt-4 text-green-900">Yükünüz Kaydedildi!</CardTitle>
                    <CardDescription className="text-green-700">
                        Yük bilgileriniz başarıyla sistemimize kaydedilmiştir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">Size en uygun aracı bulmak için lütfen çağrı merkezimizle iletişime geçin.</p>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                        <Phone className="mr-2 h-4 w-4" /> Çağrı Merkezini Ara (0850 123 45 67)
                    </Button>
                    <div className="mt-6">
                        <Button variant="outline" onClick={() => setSubmitted(false)}>
                            Yeni Yük Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Yeni Yük Bilgisi Girin</CardTitle>
                <CardDescription>Taşınacak yükünüzün detaylarını belirtin.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="yuk-bilgisi">Yük Bilgisi (Açıklama)</Label>
                    <Textarea
                      id="yuk-bilgisi"
                      placeholder="Örn: 10 ton paletli gıda malzemesi"
                      required
                      rows={4}
                      value={loadInfo}
                      onChange={(e) => setLoadInfo(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nereden">Yükün Bulunduğu Şehir</Label>
                      <Input id="nereden" placeholder="Kocaeli" required value={originCity} onChange={(e) => setOriginCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nereye">Yükün Gideceği Şehir</Label>
                      <Input id="nereye" placeholder="İzmir" required value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arac-bilgisi">İstenen Araç Tipi</Label>
                    <Select required onValueChange={setVehicleType}>
                      <SelectTrigger id="arac-bilgisi">
                        <SelectValue placeholder="Araç tipi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tir">Tır</SelectItem>
                        <SelectItem value="kamyon">Kamyon</SelectItem>
                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                        <SelectItem value="farketmez">Farketmez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Yükü Sisteme Kaydet
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
