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

const firmalar = [
  { id: 1, yetkili: "Ahmet Yılmaz", telefon: "555 123 4567", sehir: "İstanbul", ilce: "Kadıköy", durum: "Aktif" },
  { id: 2, yetkili: "Ayşe Kaya", telefon: "555 987 6543", sehir: "Ankara", ilce: "Çankaya", durum: "Aktif" },
  { id: 3, yetkili: "Fatma Demir", telefon: "555 456 1234", sehir: "İzmir", ilce: "Bornova", durum: "Pasif" },
];

const soforler = [
  { id: 1, adSoyad: "Mehmet Öztürk", telefon: "555 789 0123", aracTipi: "Kamyon", plaka: "34 ABC 123", durum: "Boşta" },
  { id: 2, adSoyad: "Hasan Vural", telefon: "555 234 5678", aracTipi: "Tır", plaka: "06 DEF 456", durum: "Yolda" },
  { id: 3, adSoyad: "Ali Can", telefon: "555 678 9012", aracTipi: "Kamyonet", plaka: "35 GHI 789", durum: "Boşta" },
];

export default function AdminUyelerPage() {
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
                  {firmalar.map((firma) => (
                    <TableRow key={firma.id}>
                      <TableCell className="font-medium">{firma.yetkili}</TableCell>
                      <TableCell>{firma.telefon}</TableCell>
                      <TableCell>{firma.sehir}</TableCell>
                      <TableCell>{firma.ilce}</TableCell>
                      <TableCell>
                        <Badge variant={firma.durum === 'Aktif' ? 'default' : 'secondary'}>{firma.durum}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
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
                  {soforler.map((sofor) => (
                    <TableRow key={sofor.id}>
                      <TableCell className="font-medium">{sofor.adSoyad}</TableCell>
                      <TableCell>{sofor.telefon}</TableCell>
                      <TableCell>{sofor.aracTipi}</TableCell>
                      <TableCell>{sofor.plaka}</TableCell>
                      <TableCell>
                         <Badge variant={sofor.durum === 'Boşta' ? 'default' : sofor.durum === 'Yolda' ? 'destructive' : 'secondary'}>{sofor.durum}</Badge>
                      </TableCell>
                       <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
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
