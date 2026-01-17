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
import { PlusCircle, Trash2, Loader2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAdmin, type AdminPermissions } from "@/hooks/use-admin"
import { Switch } from "@/components/ui/switch"

import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signOut as signOutTempUser, getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

const defaultPermissions: AdminPermissions = {
    canViewDashboard: true,
    canTrackLocations: false,
    canManageMembers: false,
    canManageStaff: false,
};


export default function AdminPersonelPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newStaffPermissions, setNewStaffPermissions] = useState<AdminPermissions>(defaultPermissions);


    const [editingStaff, setEditingStaff] = useState<any | null>(null);
    const [permissionsToUpdate, setPermissionsToUpdate] = useState<AdminPermissions | null>(null);

    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    
    const handleNewStaffPermissionChange = (permissionKey: keyof AdminPermissions, value: boolean) => {
        setNewStaffPermissions(prev => ({
            ...prev,
            [permissionKey]: value,
        }));
    };

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

            await setDoc(adminRoleRef, {
                id: newStaffUser.uid,
                username: newStaffUser.email,
                permissions: newStaffPermissions,
            });

            toast({ title: 'Başarılı', description: `${newStaffUser.email} adlı personel başarıyla oluşturuldu.` });
            
            setIsAddDialogOpen(false);
            // Reset form states in onOpenChange

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

    // --- Permission Editing Logic ---

    const openEditDialog = (staff: any) => {
        setEditingStaff(staff);
        setPermissionsToUpdate(staff.permissions || defaultPermissions);
    };

    const closeEditDialog = () => {
        setEditingStaff(null);
        setPermissionsToUpdate(null);
    };

    const handlePermissionChange = (permissionKey: keyof AdminPermissions, value: boolean) => {
        if (permissionsToUpdate) {
            setPermissionsToUpdate({
                ...permissionsToUpdate,
                [permissionKey]: value,
            });
        }
    };

    const handleSavePermissions = async () => {
        if (!firestore || !editingStaff || !permissionsToUpdate) return;
        if (editingStaff.id === user?.uid && !permissionsToUpdate.canManageStaff) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kendi personel yönetimi yetkinizi kaldıramazsınız.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const staffDocRef = doc(firestore, 'roles_admin', editingStaff.id);
            await updateDoc(staffDocRef, {
                permissions: permissionsToUpdate,
            });
            toast({ title: 'Başarılı', description: `${editingStaff.username} adlı personelin yetkileri güncellendi.` });
            closeEditDialog();
        } catch (error) {
            console.error("Error updating permissions:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yetkiler güncellenemedi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const grantSelfStaffManagementPermission = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kullanıcı doğrulaması başarısız oldu.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const selfAdminDocRef = doc(firestore, 'roles_admin', user.uid);
            await updateDoc(selfAdminDocRef, {
                'permissions.canManageStaff': true,
            });
            toast({ title: 'Başarılı!', description: 'Personel yönetimi yetkisi etkinleştirildi. Değişikliklerin yansıması için sayfa yenileniyor...' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error("Error granting permission:", error);
            toast({ variant: 'destructive', title: 'Hata', description: `Yetki verilemedi: ${error.message}. Güvenlik kurallarını kontrol edin.` });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <div>
      {adminData && !adminData.permissions.canManageStaff && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Eksik Yetki: Personel Yönetimi</CardTitle>
                <CardDescription>
                    Yönetici hesabınız var ancak yeni personel eklemek veya mevcut personeli yönetmek için gerekli olan "Personel Yönetimi" yetkiniz aktif değil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Bu yetkiyi etkinleştirmek için aşağıdaki butona tıklayın. Bu işlem, mevcut yönetici hesabınıza personel yönetme kabiliyeti ekleyecektir.
                </p>
                <Button onClick={grantSelfStaffManagementPermission} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Personel Yönetim Yetkisini Etkinleştir
                </Button>
            </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Personel Yönetimi</h1>
            <p className="text-muted-foreground">Yeni personel hesapları oluşturun veya mevcutları yönetin.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
              setIsAddDialogOpen(isOpen);
              if (!isOpen) {
                  setUsername('');
                  setPassword('');
                  setConfirmPassword('');
                  setNewStaffPermissions(defaultPermissions);
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
                        Yeni personel için giriş bilgilerini ve başlangıç yetkilerini belirleyin.
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
                      <div className="space-y-4 pt-4">
                          <h4 className="font-medium text-sm">Başlangıç Yetkileri</h4>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="new-perm-dashboard">Dashboard Görüntüleme</Label>
                              </div>
                              <Switch
                                  id="new-perm-dashboard"
                                  checked={newStaffPermissions.canViewDashboard}
                                  onCheckedChange={(value) => handleNewStaffPermissionChange('canViewDashboard', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="new-perm-location">Konum Takibi</Label>
                              </div>
                              <Switch
                                  id="new-perm-location"
                                  checked={newStaffPermissions.canTrackLocations}
                                  onCheckedChange={(value) => handleNewStaffPermissionChange('canTrackLocations', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="new-perm-members">Üye Yönetimi</Label>
                              </div>
                              <Switch
                                  id="new-perm-members"
                                  checked={newStaffPermissions.canManageMembers}
                                  onCheckedChange={(value) => handleNewStaffPermissionChange('canManageMembers', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="new-perm-staff">Personel Yönetimi</Label>
                              </div>
                              <Switch
                                  id="new-perm-staff"
                                  checked={newStaffPermissions.canManageStaff}
                                  onCheckedChange={(value) => handleNewStaffPermissionChange('canManageStaff', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
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
              <CardDescription>Sistemdeki tüm personel hesapları ve yetkileri.</CardDescription>
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
                        {p.permissions?.canManageStaff && <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary">Personel</Badge>}
                        {!p.permissions && <Badge variant="secondary">Yetki Yok</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(p)} disabled={!canManage}>
                              <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(p.id)} disabled={p.id === user?.uid || !canManage}>
                              <Trash2 className="h-4 w-4"/>
                          </Button>
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
          
          <Dialog open={!!editingStaff} onOpenChange={(isOpen) => !isOpen && closeEditDialog()}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle className="font-headline">Yetkileri Düzenle: {editingStaff?.username}</DialogTitle>
                      <DialogDescription>
                          Personelin erişebileceği modülleri buradan yönetebilirsiniz.
                      </DialogDescription>
                  </DialogHeader>
                  {permissionsToUpdate && (
                      <div className="grid gap-4 py-4">
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="perm-dashboard">Dashboard Görüntüleme</Label>
                                  <p className="text-xs text-muted-foreground">Ana paneli ve istatistikleri görebilir.</p>
                              </div>
                              <Switch
                                  id="perm-dashboard"
                                  checked={permissionsToUpdate.canViewDashboard}
                                  onCheckedChange={(value) => handlePermissionChange('canViewDashboard', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="perm-location">Konum Takibi</Label>
                                  <p className="text-xs text-muted-foreground">Şoförlerin anlık konumlarını haritada izleyebilir.</p>
                              </div>
                              <Switch
                                  id="perm-location"
                                  checked={permissionsToUpdate.canTrackLocations}
                                  onCheckedChange={(value) => handlePermissionChange('canTrackLocations', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="perm-members">Üye Yönetimi</Label>
                                  <p className="text-xs text-muted-foreground">Firma ve şoför hesaplarını yönetebilir.</p>
                              </div>
                              <Switch
                                  id="perm-members"
                                  checked={permissionsToUpdate.canManageMembers}
                                  onCheckedChange={(value) => handlePermissionChange('canManageMembers', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="perm-staff">Personel Yönetimi</Label>
                                  <p className="text-xs text-muted-foreground">Yeni personel ekleyebilir ve yetkilerini düzenleyebilir.</p>
                              </div>
                              <Switch
                                  id="perm-staff"
                                  checked={permissionsToUpdate.canManageStaff}
                                  onCheckedChange={(value) => handlePermissionChange('canManageStaff', value)}
                                  disabled={isSubmitting}
                              />
                          </div>
                      </div>
                  )}
                  <DialogFooter>
                      <Button variant="outline" onClick={closeEditDialog}>İptal</Button>
                      <Button onClick={handleSavePermissions} disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmitting ? 'Kaydediliyor...' : 'Yetkileri Kaydet'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}
    