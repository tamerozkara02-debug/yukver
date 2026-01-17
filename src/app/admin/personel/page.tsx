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
import { PlusCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdmin } from "@/hooks/use-admin"

interface UserToPromote {
    id: string;
    name: string;
    email: string;
    role: 'Firma' | 'Şoför';
}

export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
    const [permissions, setPermissions] = useState({
        canViewDashboard: true,
        canTrackLocations: false,
        canManageMembers: false,
        canManageStaff: false,
    });
    
    // Fetch all collections needed
    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const firmsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'firms') : null, [firestore]);
    const driversCollection = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);

    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);
    const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

    // Combine firms and drivers into a single list of users who can be promoted
    const promotableUsers = useMemo<UserToPromote[]>(() => {
        const firmUsers = firmalar?.map(f => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, email: `Firma`, role: 'Firma' as const })) || [];
        const driverUsers = soforler?.map(d => ({ id: d.id, name: `${d.firstName} ${d.lastName}`, email: `${d.vehiclePlate}`, role: 'Şoför' as const })) || [];
        
        // Filter out users who are already staff
        const staffIds = new Set(personel?.map(p => p.id));
        const allUsers = [...firmUsers, ...driverUsers];
        
        return allUsers.filter(u => !staffIds.has(u.id));

    }, [firmalar, soforler, personel]);

    const handlePermissionChange = (key: keyof typeof permissions, checked: boolean) => {
        setPermissions(prev => ({ ...prev, [key]: checked }));
    };

    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !selectedUser) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen bir kullanıcı seçin.' });
            return;
        }

        const userToPromote = promotableUsers.find(u => u.id === selectedUser);
        if (!userToPromote) {
             toast({ variant: 'destructive', title: 'Hata', description: 'Seçilen kullanıcı bulunamadı.' });
            return;
        }

        try {
            const adminRoleRef = doc(firestore, 'roles_admin', userToPromote.id);
            await setDoc(adminRoleRef, {
                id: userToPromote.id,
                username: userToPromote.name, // Using name as username for display
                permissions: permissions,
            });

            toast({ title: 'Başarılı', description: `${userToPromote.name} adlı kullanıcıya personel rolü verildi.` });
            setIsDialogOpen(false);
            setSelectedUser(undefined);

        } catch (error: any) {
            console.error("Error adding staff role:", error);
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Personel rolü atanamadı. Güvenlik kurallarını veya bağlantınızı kontrol edin.' });
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
    const isLoading = isLoadingPersonel || isLoadingFirms || isLoadingDrivers;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Personel Yönetimi</h1>
          <p className="text-muted-foreground">Mevcut kullanıcılara yönetici veya operatör yetkileri atayın.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!canManage}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel Yetkilendir</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleAddStaff}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Kullanıcıyı Personel Olarak Yetkilendir</DialogTitle>
                    <DialogDescription>
                        Sistemde kayıtlı bir kullanıcıyı seçin ve ona personel yetkileri atayın. Bu işlem kullanıcı hesabı oluşturmaz, sadece mevcut bir kullanıcıyı yetkilendirir.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="user-select" className="text-right">Kullanıcı</Label>
                         <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger id="user-select" className="col-span-3">
                                <SelectValue placeholder="Yetkilendirilecek kullanıcıyı seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading && <SelectItem value="loading" disabled>Kullanıcılar yükleniyor...</SelectItem>}
                                {!isLoading && promotableUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.role} - {user.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {!isLoading && promotableUsers.length === 0 && <SelectItem value="none" disabled>Yetkilendirilecek kullanıcı bulunmuyor.</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Yetkiler</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canViewDashboard" checked={permissions.canViewDashboard} onCheckedChange={(c) => handlePermissionChange('canViewDashboard', c as boolean)} defaultChecked={true} />
                                <Label htmlFor="p-canViewDashboard" className="font-normal">Dashboard Görüntüleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canTrackLocations" checked={permissions.canTrackLocations} onCheckedChange={(c) => handlePermissionChange('canTrackLocations', c as boolean)} />
                                <Label htmlFor="p-canTrackLocations" className="font-normal">Konum Takibi</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="p-canManageMembers" checked={permissions.canManageMembers} onCheckedChange={(c) => handlePermissionChange('canManageMembers', c as boolean)} />
                                <Label htmlFor="p-canManageMembers" className="font-normal">Üye Yönetimi</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="p-canManageStaff" checked={permissions.canManageStaff} onCheckedChange={(c) => handlePermissionChange('canManageStaff', c as boolean)} />
                                <Label htmlFor="p-canManageStaff" className="font-normal">Personel Yönetimi</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Yetkilendir</Button>
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
                {isLoadingPersonel && <TableRow><TableCell colSpan={3}>Yükleniyor...</TableCell></TableRow>}
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
