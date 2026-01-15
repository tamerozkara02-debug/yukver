"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, PlusCircle, Trash2, Phone, MessageCircle, Truck, Building } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function AdminUyelerPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const firmsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'firms') : null, [firestore, user]);
  const driversCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'drivers') : null, [firestore, user]);

  const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);
  const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

  const handleDeleteFirm = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'firms', id));
      // Also need to delete user from Auth, but that requires admin privileges and a backend function.
      // For now, just show a success message for the DB deletion.
      toast({ title: 'Başarılı', description: 'Firma veritabanından silindi. (Authentication kaydı duruyor)' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Firma silinemedi.' });
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'drivers', id));
       // Also need to delete user from Auth, but that requires admin privileges and a backend function.
      toast({ title: 'Başarılı', description: 'Şoför veritabanından silindi. (Authentication kaydı duruyor)' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Hata', description: 'Şoför silinemedi.' });
    }
  };

  const isLoading = isUserLoading || isLoadingFirms || isLoadingDrivers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Üye Yönetimi</h1>
          <p className="text-muted-foreground">Platforma kayıtlı firmaları ve şoförleri yönetin.</p>
        </div>
      </div>
      <Tabs defaultValue="firmalar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="firmalar" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Firmalar ({firmalar?.length || 0})
            </TabsTrigger>
          <TabsTrigger value="soforler" className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> Şoförler ({soforler?.length || 0})
            </TabsTrigger>
        </TabsList>
        <TabsContent value="firmalar">
          <Card>
            <CardHeader>
              <CardTitle>Firma Listesi</CardTitle>
              <CardDescription>Sisteme kayıtlı tüm firmalar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yetkili</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead className="text-right">İletişim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={4} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && firmalar?.map((firma: any) => (
                    <TableRow key={firma.id}>
                      <TableCell className="font-medium">{firma.firstName} {firma.lastName}</TableCell>
                      <TableCell>{firma.phoneNumber}</TableCell>
                      <TableCell>{firma.city}, {firma.district}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild><a href={`tel:${firma.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                        <Button variant="outline" size="sm" asChild><a href={`sms:${firma.phoneNumber}`}><MessageCircle className="mr-2 h-3 w-3"/> Mesaj</a></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && (!firmalar || firmalar.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Kayıtlı firma bulunmuyor.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="soforler">
          <Card>
            <CardHeader>
              <CardTitle>Şoför Listesi</CardTitle>
              <CardDescription>Sisteme kayıtlı tüm şoförler.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Anlık Şehir</TableHead>
                    <TableHead>Araç Bilgisi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İletişim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && soforler?.map((sofor: any) => (
                    <TableRow key={sofor.id}>
                      <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                      <TableCell>{sofor.currentCity || 'Belirtilmemiş'}</TableCell>
                      <TableCell>{sofor.vehicleType} - {sofor.vehiclePlate}</TableCell>
                      <TableCell>
                         <Badge variant={sofor.isAvailable ? 'default' : 'destructive'} className={sofor.isAvailable ? 'bg-green-600' : 'bg-red-600'}>
                            {sofor.isAvailable ? 'Boşta' : 'Dolu'}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right space-x-2">
                         <Button variant="outline" size="sm" asChild><a href={`tel:${sofor.phoneNumber}`}><Phone className="mr-2 h-3 w-3"/> Ara</a></Button>
                        <Button variant="outline" size="sm" asChild><a href={`sms:${sofor.phoneNumber}`}><MessageCircle className="mr-2 h-3 w-3"/> Mesaj</a></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && (!soforler || soforler.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Kayıtlı şoför bulunmuyor.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    