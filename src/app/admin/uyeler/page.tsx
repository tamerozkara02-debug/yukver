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
import { Edit, PlusCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc } from "firebase/firestore"

export default function AdminUyelerPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Wait until user is authenticated to create the queries
  const firmsCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'firms') : null, [firestore, user]);
  const driversCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'drivers') : null, [firestore, user]);

  const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);
  const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

  const handleDeleteFirm = (id: string) => {
    if (!firestore) return;
    const firmDoc = doc(firestore, 'firms', id);
    deleteDoc(firmDoc);
  };

  const handleDeleteDriver = (id: string) => {
    if (!firestore) return;
    const driverDoc = doc(firestore, 'drivers', id);
    deleteDoc(driverDoc);
  };

  const isLoading = isUserLoading || isLoadingFirms || isLoadingDrivers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Üye Yönetimi</h1>
          <p className="text-muted-foreground">Firmaları ve şoförleri yönetin.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Yeni Üye Ekle</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Üye Ekle</DialogTitle>
                    <DialogDescription>
                        Yeni firma veya şoför bilgilerini girin.
                    </DialogDescription>
                </DialogHeader>
                {/* Form could be more complex here */}
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Ad Soyad</Label>
                        <Input id="name" className="col-span-3"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="firmalar">
        <TabsList>
          <TabsTrigger value="firmalar">Firmalar</TabsTrigger>
          <TabsTrigger value="soforler">Şoförler</TabsTrigger>
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
                    <TableHead>Şehir</TableHead>
                    <TableHead>İlçe</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && firmalar && firmalar.map((firma: any) => (
                    <TableRow key={firma.id}>
                      <TableCell className="font-medium">{firma.firstName} {firma.lastName}</TableCell>
                      <TableCell>{firma.phoneNumber}</TableCell>
                      <TableCell>{firma.city}</TableCell>
                      <TableCell>{firma.district}</TableCell>
                      <TableCell>
                        <Badge variant={'default'}>Aktif</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteFirm(firma.id)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead>Telefon</TableHead>
                    <TableHead>Araç Tipi</TableHead>
                    <TableHead>Plaka</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
                  {!isLoading && soforler && soforler.map((sofor: any) => (
                    <TableRow key={sofor.id}>
                      <TableCell className="font-medium">{sofor.firstName} {sofor.lastName}</TableCell>
                      <TableCell>{sofor.phoneNumber}</TableCell>
                      <TableCell>{sofor.vehicleType}</TableCell>
                      <TableCell>{sofor.vehiclePlate}</TableCell>
                      <TableCell>
                         <Badge variant={'default'}>Boşta</Badge>
                      </TableCell>
                       <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteDriver(sofor.id)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
