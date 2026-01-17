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
import { collection, doc, deleteDoc, setDoc } from "firebase/firestore"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAdmin } from "@/hooks/use-admin"

import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signOut as signOutTempUser, getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';


export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    

    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifreler eşleşmiyor.' });
            return;
        }

        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }

        setIsSubmitting(true);
        const tempAppName = `temp-staff-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            if (!firestore) throw new Error("Firestore is not available.");

            const userCredential = await createUserWithEmailAndPassword(tempAuth, username, password);
            const newStaffUser = userCredential.user;

            const adminRoleRef = doc(firestore, 'roles_admin', newStaffUser.uid);
            
            const defaultPermissions = {
                canViewDashboard: true,
                canTrackLocations: false,
                canManageMembers: false,
                canManageStaff: false,
            };

            await setDoc(adminRoleRef, {
                id: newStaffUser.uid,
                username: newStaffUser.email,
                permissions: defaultPermissions,
            });

            toast({ title: 'Başarılı', description: `${newStaffUser.email} adlı personel başarıyla oluşturuldu.` });
            
            setIsDialogOpen(false);
            setUsername('');
            setPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error("Error adding staff:", error);
            let description = 'Personel oluşturulamadı. Lütfen tekrar deneyin.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Bu e-posta adresi zaten kullanımda.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Geçersiz e-posta adresi formatı.';
            }
            toast({ variant: 'destructive', title: 'Hata', description });
        } finally {
            await signOutTempUser(tempAuth).catch(e => console.error("Failed to sign out temp user", e));
            await deleteApp(tempApp).catch(e => console.error("Failed to delete temp app", e));
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
          <p className="text-muted-foreground">Yeni personel hesapları oluşturun veya mevcutları yönetin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
                setUsername('');
                setPassword('');
                setConfirmPassword('');
            }
        }}>
            <DialogTrigger asChild>
                <Button disabled={!canManage}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Oluştur</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleAddStaff}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Yeni Personel Oluştur</DialogTitle>
                    <DialogDescription>
                       Yeni personel için giriş bilgilerini oluşturun. Bu işlem hem bir kullanıcı hesabı hem de personel rolü yaratacaktır.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Email</Label>
                        <Input 
                            id="username" 
                            type="email" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="personel@sirket.com" 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Şifre (Tekrar)</Label>
                        <Input 
                            id="confirmPassword" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Oluşturuluyor...' : 'Personel Oluştur'}
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
                        <TableCell colSpan={3} className="text-center">Henüz personel atanmamış.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
