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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, setDoc } from "firebase/firestore"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAdmin } from "@/hooks/use-admin"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PromotableUser = {
  id: string;
  name: string;
  type: 'Firma' | 'Şoför';
}

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    
    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    
    const firmsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'firms') : null, [firestore]);
    const { data: firms, isLoading: isLoadingFirms } = useCollection(firmsCollection);

    const driversCollection = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);
    const { data: drivers, isLoading: isLoadingDrivers } = useCollection(driversCollection);

    const promotableUsers = useMemo<PromotableUser[]>(() => {
        if (!firms || !drivers) return [];
        
        const existingStaffIds = new Set(personel?.map(p => p.id) || []);

        const allUsers: PromotableUser[] = [
            ...firms.map(f => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, type: 'Firma' as const })),
            ...drivers.map(d => ({ id: d.id, name: `${d.firstName} ${d.lastName}`, type: 'Şoför' as const }))
        ];
        
        return allUsers.filter(u => u.id && !existingStaffIds.has(u.id));

    }, [firms, drivers, personel]);

    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!selectedUserId) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen personel rolü atanacak bir kullanıcı seçin.' });
            return;
        }

        const userToPromote = promotableUsers.find(u => u.id === selectedUserId);
        if (!userToPromote) {
             toast({ variant: 'destructive', title: 'Hata', description: 'Seçilen kullanıcı bulunamadı.' });
            return;
        }

        setIsSubmitting(true);

        try {
            if (!firestore) throw new Error("Firestore is not available.");

            const adminRoleRef = doc(firestore, 'roles_admin', userToPromote.id);
            
            const defaultPermissions = {
                canViewDashboard: true,
                canTrackLocations: false,
                canManageMembers: false,
                canManageStaff: false,
            };

            await setDoc(adminRoleRef, {
                id: userToPromote.id,
                username: userToPromote.name,
                permissions: defaultPermissions,
            });

            toast({ title: 'Başarılı', description: `${userToPromote.name} adlı kullanıcıya personel rolü atandı.` });
            setIsDialogOpen(false);
            setSelectedUserId(null);

        } catch (error: any) {
            console.error("Error adding staff role:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel rolü atanamadı.' });
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
          <p className="text-muted-foreground">Mevcut kullanıcıları personel olarak atayın veya yönetin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!canManage}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Ata</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleAddStaff}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Yeni Personel Ata</DialogTitle>
                    <DialogDescription>
                       Sistemde kayıtlı bir firmayı veya şoförü seçerek onlara personel yetkileri verin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user-select">Kullanıcı</Label>
                        <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
                            <SelectTrigger id="user-select">
                                <SelectValue placeholder="Personel yapılacak kullanıcıyı seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingFirms || isLoadingDrivers ? (
                                    <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                                ) : promotableUsers.length > 0 ? (
                                    promotableUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name} ({u.type})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>Atanacak kullanıcı bulunamadı.</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting || !selectedUserId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Atanıyor...' : 'Personel Olarak Ata'}
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
