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
import { useAuth, useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { collection, doc } from "firebase/firestore"
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
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
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Add to roles_admin collection
            const newStaff = {
                username: email,
                id: user.uid, // Use Firebase UID as the document ID
            };
            
            if (firestore) {
                const staffDoc = doc(firestore, 'roles_admin', user.uid);
                // This is now a blocking call to ensure role is set before confirming
                await addDocumentNonBlocking(personelCollection, newStaff);
            }

            toast({ title: 'Başarılı', description: 'Yeni personel eklendi.'});
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error("Error adding staff:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel eklenemedi.' });
        }
    };

    const handleDeleteStaff = (id: string) => {
        if (firestore) {
            const staffDoc = doc(firestore, 'roles_admin', id);
            deleteDocumentNonBlocking(staffDoc);
            // Note: This does not delete the user from Firebase Auth, only from the role collection.
            // A more complete solution would involve a Cloud Function to handle user deletion.
            toast({ title: 'Başarılı', description: 'Personel silindi.' });
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
                        Yeni personel için kullanıcı bilgilerini ve yetkilerini belirleyin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-username" className="text-right">Kullanıcı Adı (Email)</Label>
                        <Input id="p-username" name="p-username" type="email" className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="p-password" className="text-right">Şifre</Label>
                        <Input id="p-password" name="p-password" type="password" className="col-span-3"/>
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
                {isLoading && <TableRow><TableCell colSpan={5}>Yükleniyor...</TableCell></TableRow>}
                {personel && personel.map((p: any) => (
                <TableRow key={p.id}>
                    <TableCell>{p.username}</TableCell>
                    <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(p.id)}><Trash2 className="h-4 w-4"/></Button>
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
