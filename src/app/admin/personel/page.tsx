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
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc } from "firebase/firestore"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAdmin } from "@/hooks/use-admin"
import { createStaffUser } from "@/ai/flows/staff-management-flow"

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);

    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Girdiğiniz şifreler eşleşmiyor.' });
            return;
        }

        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }

        setIsSubmitting(true);

        try {
            await createStaffUser({ email, password });

            toast({ title: 'Başarılı', description: `${email} adlı kullanıcı personel olarak eklendi.` });
            setIsDialogOpen(false);
            setEmail("");
            setPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            console.error("Error adding staff:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel eklenemedi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!firestore) return;
        if (id === user?.uid) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kendinizi silemezsiniz.' });
            return;
        }
        try {
            await deleteDoc(doc(firestore, 'roles_admin', id));
            // Note: This only removes the admin role from Firestore.
            // The user account still exists in Firebase Authentication.
            // Deleting from Auth requires Admin SDK and should be handled in a backend flow.
            // For now, this is sufficient to revoke admin privileges.
            toast({ title: 'Başarılı', description: 'Personel rolü kaldırıldı. Kullanıcının kimlik doğrulaması hala mevcuttur.' });
        } catch (error: any) {
            console.error("Error deleting staff role:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel rolü silinemedi.' });
        }
    }
    
    const canManage = adminData?.permissions.canManageStaff ?? false;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Personel Yönetimi</h1>
          <p className="text-muted-foreground">Yeni personel ekleyin veya mevcut personeli yönetin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!canManage}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Ekle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleAddStaff}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Yeni Personel Ekle</DialogTitle>
                    <DialogDescription>
                        Personel için bir e-posta ve şifre oluşturun. Bu işlem, kullanıcıyı sisteme kaydedecek ve varsayılan personel yetkilerini atayacaktır.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="personel@sirket.com" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Şifre (Tekrar)</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Şifreyi doğrulayın" required />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
                    </Button>
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
                {isLoadingPersonel && <TableRow><TableCell colSpan={3} className="text-center">Yükleniyor...</TableCell></TableRow>}
                {!isLoadingPersonel && personel && personel.map((p: any) => (
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
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(p.id)} disabled={p.id === user?.uid || !canManage}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                </TableRow>
                ))}
                {!isLoadingPersonel && (!personel || personel.length === 0) && (
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
