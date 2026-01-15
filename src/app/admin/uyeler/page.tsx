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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

// const firmalar = [
//   { id: 1, yetkili: "Ahmet Yılmaz", telefon: "555 123 4567", sehir: "İstanbul", ilce: "Kadıköy", durum: "Aktif" },
//   { id: 2, yetkili: "Ayşe Kaya", telefon: "555 987 6543", sehir: "Ankara", ilce: "Çankaya", durum: "Aktif" },
//   { id: 3, yetkili: "Fatma Demir", telefon: "555 456 1234", sehir: "İzmir", ilce: "Bornova", durum: "Pasif" },
// ];

// const soforler = [
//   { id: 1, adSoyad: "Mehmet Öztürk", telefon: "555 789 0123", aracTipi: "Kamyon", plaka: "34 ABC 123", durum: "Boşta" },
//   { id: 2, adSoyad: "Hasan Vural", telefon: "555 234 5678", aracTipi: "Tır", plaka: "06 DEF 456", durum: "Yolda" },
//   { id: 3, adSoyad: "Ali Can", telefon: "555 678 9012", aracTipi: "Kamyonet", plaka: "35 GHI 789", durum: "Boşta" },
// ];

export default function AdminUyelerPage() {
  const firestore = useFirestore();
  const firmsCollection = useMemoFirebase(() => collection(firestore, 'firms'), [firestore]);
  const driversCollection = useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]);

  const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);
  const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

  const handleDeleteFirm = (id: string) => {
    const firmDoc = doc(firestore, 'firms', id);
    deleteDocumentNonBlocking(firmDoc);
  };

  const handleDeleteDriver = (id: string) => {
    const driverDoc = doc(firestore, 'drivers', id);
    deleteDocumentNonBlocking(driverDoc);
  };


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
                  {isLoadingFirms && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
                  {firmalar && firmalar.map((firma: any) => (
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
                  {isLoadingDrivers && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
                  {soforler && soforler.map((sofor: any) => (
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
