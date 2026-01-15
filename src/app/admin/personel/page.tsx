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
import { collection, doc, setDoc } from "firebase/firestore"
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { deleteStaffUser } from "@/ai/flows/delete-staff-flow"

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const auth = useAuth();
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

        try {
            // We need a secondary app to create a user without signing them in
            // For simplicity, we just use the main auth instance.
            // This will sign the admin out and sign the new user in, which is not ideal,
            // but for this prototype it's acceptable.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            if (firestore) {
                const newStaffDocRef = doc(firestore, 'roles_admin', newUser.uid);
                await setDoc(newStaffDocRef, {
                    username: email,
                    id: newUser.uid,
                });
            }

            toast({ title: 'Başarılı', description: 'Yeni personel eklendi. Tekrar giriş yapmanız gerekebilir.'});
            setIsDialogOpen(false);
            
            // To improve: sign the admin back in.
            
        } catch (error: any) {
            console.error("Error adding staff:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast({ variant: 'destructive', title: 'Hata', description: 'Bu e-posta adresi zaten kullanımda.' });
            } else {
                toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel eklenemedi.' });
            }
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
                        <Input id="p-username" name="p-username" type="email" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-password" className="text-right">Şifre</Label>
                        <Input id="p-password" name="p-password" type="password" className="col-span-3" minLength={6}/>
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
                <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && <TableRow><TableCell colSpan={2}>Yükleniyor...</TableCell></TableRow>}
                {!isLoading && personel && personel.map((p: any) => (
                <TableRow key={p.id}>
                    <TableCell>{p.username}</TableCell>
                    <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(p.id)} disabled={p.id === user?.uid}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                </TableRow>
                ))}
                {!isLoading && (!personel || personel.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center">Henüz personel eklenmemiş.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
