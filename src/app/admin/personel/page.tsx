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
import { Edit, PlusCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createStaffUser, deleteStaffUser } from "@/ai/flows/staff-management-flow"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const personelCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'roles_admin') : null, [firestore, user]);
    const { data: personel, isLoading } = useCollection(personelCollection);
    
    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = formData.get('p-username') as string;
        const password = formData.get('p-password') as string;

        if (!email || !password) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen tüm alanları doldurun.' });
            return;
        }

        const permissions = {
            canViewDashboard: (event.currentTarget.elements.namedItem('p-canViewDashboard') as HTMLInputElement)?.checked,
            canTrackLocations: (event.currentTarget.elements.namedItem('p-canTrackLocations') as HTMLInputElement)?.checked,
            canManageMembers: (event.currentTarget.elements.namedItem('p-canManageMembers') as HTMLInputElement)?.checked,
            canManageStaff: (event.currentTarget.elements.namedItem('p-canManageStaff') as HTMLInputElement)?.checked,
        };

        try {
            const newUser = await createStaffUser({ email, password, permissions });
            toast({ title: 'Başarılı', description: `Yeni personel (${newUser.email}) eklendi.`});
            setIsDialogOpen(false);
            
        } catch (error: any) {
            console.error("Error adding staff:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel eklenemedi.' });
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!id) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Geçersiz kullanıcı ID.' });
            return;
        }
        if (id === user?.uid) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kendinizi silemezsiniz.' });
            return;
        }
        try {
            const result = await deleteStaffUser({ userId: id });
            if (result.success) {
                toast({ title: 'Başarılı', description: result.message });
            } else {
                 toast({ variant: 'destructive', title: 'Hata', description: result.message });
            }
        } catch (error: any) {
            console.error("Error deleting staff:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel silinemedi.' });
        }
    }


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Personel Yönetimi</h1>
          <p className="text-muted-foreground">Admin ve operatörleri yönetin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Ekle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleAddStaff}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Yeni Personel Ekle</DialogTitle>
                    <DialogDescription>
                        Yeni personel için kullanıcı bilgilerini ve yetkilerini belirleyin. Şifre en az 6 karakter olmalıdır.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-username" className="text-right">Kullanıcı Adı (Email)</Label>
                        <Input id="p-username" name="p-username" type="email" defaultValue="tamerozkara02@gmail.com" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-password" className="text-right">Şifre</Label>
                        <Input id="p-password" name="p-password" type="password" defaultValue="tamernecla2362" className="col-span-3" minLength={6}/>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Yetkiler</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canViewDashboard" name="p-canViewDashboard" defaultChecked={true} />
                                <Label htmlFor="p-canViewDashboard" className="font-normal">Dashboard Görüntüleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canTrackLocations" name="p-canTrackLocations" />
                                <Label htmlFor="p-canTrackLocations" className="font-normal">Konum Takibi</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canManageMembers" name="p-canManageMembers" />
                                <Label htmlFor="p-canManageMembers" className="font-normal">Üye Yönetimi</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="p-canManageStaff" name="p-canManageStaff" />
                                <Label htmlFor="p-canManageStaff" className="font-normal">Personel Yönetimi</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Kaydet</Button>
                </DialogFooter>
                </form>
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
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Yetkiler</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && <TableRow><TableCell colSpan={3}>Yükleniyor...</TableCell></TableRow>}
                {!isLoading && personel && personel.map((p: any) => (
                <TableRow key={p.id}>
                    <TableCell>{p.username}</TableCell>
                    <TableCell className="space-x-1">
                      {p.permissions?.canViewDashboard && <Badge variant="outline">Dashboard</Badge>}
                      {p.permissions?.canTrackLocations && <Badge variant="outline">Konum</Badge>}
                      {p.permissions?.canManageMembers && <Badge variant="outline">Üyeler</Badge>}
                      {p.permissions?.canManageStaff && <Badge variant="outline" className="bg-destructive text-destructive-foreground border-destructive">Personel</Badge>}
                      {!p.permissions && <Badge variant="secondary">Yetki Yok</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(p.id)} disabled={p.id === user?.uid}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                </TableRow>
                ))}
                {!isLoading && (!personel || personel.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">Henüz personel eklenmemiş.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
