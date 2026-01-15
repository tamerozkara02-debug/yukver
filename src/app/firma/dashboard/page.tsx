"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building, LogOut, Send, PlusCircle, Package, Weight, MapPin, NotebookText, Edit, Trash2 } from "lucide-react";
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, doc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

export default function FirmaDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const firmDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'firms', user.uid) : null),
    [firestore, user]
  );
  const { data: firmData, isLoading: isFirmLoading } = useDoc(firmDocRef);

  const loadsCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'firms', user.uid, 'loads') : null),
    [firestore, user]
  );
  const { data: loads, isLoading: areLoadsLoading } = useCollection(loadsCollectionRef);

  const [loadType, setLoadType] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [requiredVehicleType, setRequiredVehicleType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
    setLoadType('');
    setTonnage('');
    setOriginCity('');
    setOriginDistrict('');
    setDestinationCity('');
    setRequiredVehicleType('');
    setNotes('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !loadsCollectionRef) return;
    setIsSubmitting(true);

    try {
      await addDoc(loadsCollectionRef, {
        firmId: user.uid,
        loadType,
        tonnage: Number(tonnage),
        originCity,
        originDistrict,
        destinationCity,
        requiredVehicleType,
        notes,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Yük Kaydedildi!', description: 'Yeni yük bilgileriniz başarıyla sisteme eklendi.' });
      clearForm();
    } catch (error) {
        console.error("Error adding load:", error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Yük kaydedilemedi. Lütfen tekrar deneyin.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteLoad = async (loadId: string) => {
    if (!firestore || !user) return;
    const loadDocRef = doc(firestore, 'firms', user.uid, 'loads', loadId);
    try {
      await deleteDoc(loadDocRef);
      toast({ title: 'Başarılı', description: 'Yük ilanı silindi.' });
    } catch (error) {
      console.error("Error deleting load:", error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Yük silinemedi.' });
    }
  };


  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/giris');
  }

  if (isUserLoading || isFirmLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground font-headline">Firma Panelim</h1>
              <p className="text-sm text-muted-foreground">Hoş geldiniz, {firmData?.firstName} {firmData?.lastName}!</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-primary"/>
                    Yeni Yük İlanı Oluştur
                </CardTitle>
                <CardDescription>Taşınacak yükünüzün detaylarını girerek hemen ilan verin.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="loadType" className="flex items-center gap-2"><Package className="w-4 h-4" /> Yük Cinsi</Label>
                      <Input id="loadType" placeholder="Örn: Paletli Gıda" required value={loadType} onChange={(e) => setLoadType(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="tonnage" className="flex items-center gap-2"><Weight className="w-4 h-4" /> Tonaj (Ton)</Label>
                      <Input id="tonnage" type="number" placeholder="Örn: 15" required value={tonnage} onChange={(e) => setTonnage(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                      <Label htmlFor="originCity" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Yükün Alınacağı Şehir</Label>
                      <Input id="originCity" placeholder="Kocaeli" required value={originCity} onChange={(e) => setOriginCity(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="originDistrict" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Yükün Alınacağı İlçe</Label>
                      <Input id="originDistrict" placeholder="Gebze" required value={originDistrict} onChange={(e) => setOriginDistrict(e.target.value)} />
                    </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="destinationCity" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Yükün Gideceği Şehir</Label>
                      <Input id="destinationCity" placeholder="İzmir" required value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredVehicleType">İstenen Araç Tipi</Label>
                    <Select required onValueChange={setRequiredVehicleType} value={requiredVehicleType}>
                      <SelectTrigger id="requiredVehicleType">
                        <SelectValue placeholder="Araç tipi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tir">Tır</SelectItem>
                        <SelectItem value="kamyon">Kamyon</SelectItem>
                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                        <SelectItem value="treyler">Treyler</SelectItem>
                        <SelectItem value="konteyner">Konteyner</SelectItem>
                        <SelectItem value="swap-body">Swap Body</SelectItem>
                        <SelectItem value="lowbed">Lowbed</SelectItem>
                        <SelectItem value="farketmez">Farketmez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2"><NotebookText className="w-4 h-4" /> Notlar</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ekstra talimatlar veya önemli bilgiler (isteğe bağlı)"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Kaydediliyor...' : 'Yük İlanını Yayınla'}
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Aktif Yük İlanlarım</CardTitle>
                    <CardDescription>Yayınladığınız ve henüz tamamlanmamış yük ilanlarınız.</CardDescription>
                </CardHeader>
                <CardContent>
                   {areLoadsLoading && <p>Yükleniyor...</p>}
                   {!areLoadsLoading && loads && loads.length > 0 ? (
                    <div className="space-y-4">
                        {loads.map((load: any) => (
                            <div key={load.id} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold">{load.loadType} - {load.tonnage} Ton</h4>
                                        <p className="text-sm text-muted-foreground">{load.originCity} → {load.destinationCity}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteLoad(load.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {load.notes && <p className="text-sm bg-blue-50 p-2 rounded-md border border-blue-200">{load.notes}</p>}
                                <p className="text-xs text-muted-foreground pt-2 border-t">
                                    İlan Tarihi: {load.createdAt ? format(load.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Bilinmiyor'}
                                </p>
                            </div>
                        ))}
                    </div>
                   ) : (
                    <p className="text-sm text-center text-muted-foreground py-8">Henüz aktif bir yük ilanınız bulunmuyor.</p>
                   )}
                </CardContent>
             </Card>
        </div>
      </main>
    </div>
  );
}
