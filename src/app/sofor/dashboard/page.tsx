"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { LogOut, Phone, Truck, UserCircle } from "lucide-react";
import Image from "next/image";
import { useAuth, useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SoforDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const driverDocRef = (firestore && user) ? doc(firestore, 'drivers', user.uid) : null;
  const { data: driverData, isLoading: isDriverLoading } = useDoc(driverDocRef);

  const driverAvatar = placeholderImages.find(p => p.id === 'avatar-driver');
  const vehicleImage = placeholderImages.find(p => p.id === 'vehicle-profile');

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/giris');
  }

  if (isUserLoading || isDriverLoading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
                {driverData?.profilePicture ? <AvatarImage src={driverData.profilePicture} /> : (driverAvatar && <AvatarImage src={driverAvatar.imageUrl} data-ai-hint={driverAvatar.imageHint} />) }
                <AvatarFallback>{driverData?.firstName?.[0]}{driverData?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground font-headline">Şoför Panelim</h1>
              <p className="text-sm text-muted-foreground">Hoş geldiniz, {driverData?.firstName} {driverData?.lastName}!</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Çıkış Yap</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                 <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Yük Bulmaya Hazır Mısınız?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6">Sistemimize kayıtlı yüzlerce yükten size en uygun olanını bulmak için tek yapmanız gereken çağrı merkezimizi aramak. Uzman ekibimiz 7/24 hizmetinizde.</p>
                        <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                            <Phone className="mr-2 h-5 w-5" /> Çağrı Merkezini Ara (0850 123 45 67)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><UserCircle className="w-6 h-6 text-primary"/> Profil Bilgilerim</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                       <p><strong className="text-muted-foreground w-24 inline-block">Ad Soyad:</strong> {driverData?.firstName} {driverData?.lastName}</p>
                       <p><strong className="text-muted-foreground w-24 inline-block">Telefon:</strong> {driverData?.phoneNumber}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Truck className="w-6 h-6 text-primary"/> Araç Bilgilerim</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {vehicleImage && <div className="rounded-lg overflow-hidden mb-4">
                            <Image src={vehicleImage.imageUrl} alt="Araç Profili" width={400} height={300} className="w-full h-auto object-cover" data-ai-hint={vehicleImage.imageHint} />
                        </div>}
                       <p className="text-sm"><strong className="text-muted-foreground w-24 inline-block">Araç Tipi:</strong> {driverData?.vehicleType}</p>
                       <p className="text-sm"><strong className="text-muted-foreground w-24 inline-block">Plaka:</strong> {driverData?.vehiclePlate}</p>
                    </CardContent>
                </Card>
            </div>

        </div>
      </main>
    </div>
  );
}
