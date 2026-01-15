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
import { Badge } from "@/components/ui/badge"
import { Edit, PlusCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const personel = [
  { id: 1, adSoyad: "Zeynep Korkmaz", kullaniciAdi: "zeynep.k", rol: "Admin", durum: "Aktif" },
  { id: 2, adSoyad: "Barış Arslan", kullaniciAdi: "baris.a", rol: "Operatör", durum: "Aktif" },
  { id: 3, adSoyad: "Deniz Efe", kullaniciAdi: "deniz.e", rol: "Operatör", durum: "Pasif" },
];

export default function AdminPersonelPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Personel Yönetimi</h1>
          <p className="text-muted-foreground">Admin ve operatörleri yönetin.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Ekle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">Yeni Personel Ekle</DialogTitle>
                    <DialogDescription>
                        Yeni personel için kullanıcı bilgilerini ve yetkilerini belirleyin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-adsoyad" className="text-right">Ad Soyad</Label>
                        <Input id="p-adsoyad" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-username" className="text-right">Kullanıcı Adı</Label>
                        <Input id="p-username" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-password" className="text-right">Şifre</Label>
                        <Input id="p-password" type="password" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-rol" className="text-right">Rol</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Rol Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="operator">Operatör</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>Sistemdeki tüm personel hesapları.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {personel.map((p) => (
                <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.adSoyad}</TableCell>
                    <TableCell>{p.kullaniciAdi}</TableCell>
                    <TableCell>
                        <Badge variant={p.rol === 'Admin' ? 'destructive' : 'secondary'}>{p.rol}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={p.durum === 'Aktif' ? 'default' : 'outline'}>{p.durum}</Badge>
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
    </div>
  );
}
