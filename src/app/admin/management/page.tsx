'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Pencil, Users, Building, Truck, PlusCircle } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signOut as signOutTempUser, getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Switch } from '@/components/ui/switch';
import { useAdmin, type AdminPermissions } from '@/hooks/use-admin';


export default function ManagementPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [editingEntity, setEditingEntity] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New state for adding staff
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAddSubmitting, setIsAddSubmitting] = useState(false);
    const [newStaffData, setNewStaffData] = useState({ email: '', password: '', confirmPassword: '' });
    
    // New states for delete confirmation
    const [entityToDelete, setEntityToDelete] = useState<{id: string; type: string; name: string} | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const defaultPermissions: AdminPermissions = {
        canViewDashboard: true,
        canTrackLocations: false,
        canManageMembers: true,
        canManageStaff: false,
    };
    const [newStaffPermissions, setNewStaffPermissions] = useState<AdminPermissions>(defaultPermissions);

    // Data fetching
    const personelCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'roles_admin') : null, [firestore, user, adminData]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);

    const firmsCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'firms') : null, [firestore, user, adminData]);
    const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);

    const driversCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'drivers') : null, [firestore, user, adminData]);
    const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

    const isLoading = isLoadingPersonel || isLoadingFirms || isLoadingDrivers;

    const handleNewStaffPermissionChange = (permissionKey: keyof AdminPermissions, value: boolean) => {
        setNewStaffPermissions(prev => ({
            ...prev,
            [permissionKey]: value,
        }));
    };

    // --- NEW HANDLER for adding staff ---
    const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { email, password, confirmPassword } = newStaffData;

        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifreler eşleşmiyor.' });
            return;
        }
        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }

        setIsAddSubmitting(true);
        const tempAppName = `temp-staff-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            if (!firestore) throw new Error("Firestore is not available.");

            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newStaffUser = userCredential.user;

            const adminRoleRef = doc(firestore, 'roles_admin', newStaffUser.uid);
            await setDoc(adminRoleRef, {
                id: newStaffUser.uid,
                username: newStaffUser.email,
                permissions: newStaffPermissions,
                firstName: '',
                lastName: '',
            });

            toast({ title: 'Başarılı', description: `${newStaffUser.email} adlı personel başarıyla oluşturuldu.` });
            setIsAddDialogOpen(false);
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
            setIsAddSubmitting(false);
        }
    };


    // --- GENERIC HANDLERS ---
    const handleEditClick = (entity: any, type: string) => {
        setEditingEntity({ ...entity, type });
    };

    const handleSave = async () => {
        if (!firestore || !editingEntity) return;
        setIsSubmitting(true);
        try {
            const { id, type, ...dataToUpdate } = editingEntity;
            const docRef = doc(firestore, type, id);
            await updateDoc(docRef, dataToUpdate);
            toast({ title: 'Başarılı', description: 'Kullanıcı bilgileri güncellendi.' });
            setEditingEntity(null);
        } catch (error) {
            console.error("Error updating document:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme başarısız oldu.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirmed = async () => {
        if (!entityToDelete || !firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, entityToDelete.type, entityToDelete.id));
            toast({ title: 'Başarılı', description: `${entityToDelete.name} başarıyla silindi.` });
        } catch (error) {
            console.error("Error deleting document:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Silme işlemi başarısız oldu.' });
        } finally {
            setIsDeleting(false);
            setEntityToDelete(null);
            setDeleteConfirmText('');
        }
    };

    const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingEntity) return;
        const { name, value } = e.target;
        
        if (name === 'phoneNumber') {
            let input = value.replace(/\D/g, '');
            if (input.startsWith('90')) {
                input = input.substring(2);
            }
            input = input.substring(0, 10);
            const size = input.length;
            let formattedValue;
            if (size === 0) {
                formattedValue = '';
            } else if (size < 4) {
                formattedValue = '+90 (' + input;
            } else if (size < 7) {
                formattedValue = '+90 (' + input.substring(0, 3) + ') ' + input.substring(3, 6);
            } else {
                formattedValue = '+90 (' + input.substring(0, 3) + ') ' + input.substring(3, 6) + ' ' + input.substring(6, 10);
            }
            setEditingEntity((prev: any) => ({ ...prev, [name]: formattedValue }));
        } else {
            setEditingEntity((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const renderEditDialogContent = () => {
        if (!editingEntity) return null;

        const commonProps = {
            value: editingEntity,
            onChange: handleDialogInputChange,
            disabled: isSubmitting,
        };

        switch (editingEntity.type) {
            case 'roles_admin':
                return (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email</Label>
                            <Input id="username" name="username" value={commonProps.value.username || ''} onChange={commonProps.onChange} disabled={true} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Ad</Label>
                            <Input id="firstName" name="firstName" value={commonProps.value.firstName || ''} onChange={commonProps.onChange} disabled={commonProps.disabled} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad</Label>
                            <Input id="lastName" name="lastName" value={commonProps.value.lastName || ''} onChange={commonProps.onChange} disabled={commonProps.disabled} />
                        </div>
                    </div>
                );
            case 'firms':
                return (
                     <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="firstName">Yetkili Adı</Label><Input name="firstName" value={commonProps.value.firstName || ''} onChange={commonProps.onChange}/></div>
                            <div className="space-y-2"><Label htmlFor="lastName">Yetkili Soyadı</Label><Input name="lastName" value={commonProps.value.lastName || ''} onChange={commonProps.onChange}/></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="phoneNumber">Telefon</Label><Input name="phoneNumber" value={commonProps.value.phoneNumber || ''} onChange={commonProps.onChange} placeholder="+90 (___) ___ ____" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="city">Şehir</Label><Input name="city" value={commonProps.value.city || ''} onChange={commonProps.onChange}/></div>
                            <div className="space-y-2"><Label htmlFor="district">İlçe</Label><Input name="district" value={commonProps.value.district || ''} onChange={commonProps.onChange}/></div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="taxOffice">Vergi Dairesi</Label><Input name="taxOffice" value={commonProps.value.taxOffice || ''} onChange={commonProps.onChange}/></div>
                            <div className="space-y-2"><Label htmlFor="taxNumber">Vergi Numarası</Label><Input name="taxNumber" value={commonProps.value.taxNumber || ''} onChange={commonProps.onChange}/></div>
                        </div>
                    </div>
                );
            case 'drivers':
                return (
                     <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="firstName">Ad</Label><Input name="firstName" value={commonProps.value.firstName || ''} onChange={commonProps.onChange}/></div>
                            <div className="space-y-2"><Label htmlFor="lastName">Soyad</Label><Input name="lastName" value={commonProps.value.lastName || ''} onChange={commonProps.onChange}/></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="phoneNumber">Telefon</Label><Input name="phoneNumber" value={commonProps.value.phoneNumber || ''} onChange={commonProps.onChange} placeholder="+90 (___) ___ ____" /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2"><Label htmlFor="vehicleType">Araç Tipi</Label><Input name="vehicleType" value={commonProps.value.vehicleType || ''} onChange={commonProps.onChange}/></div>
                           <div className="space-y-2"><Label htmlFor="vehiclePlate">Plaka</Label><Input name="vehiclePlate" value={commonProps.value.vehiclePlate || ''} onChange={commonProps.onChange}/></div>
                        </div>
                         <div className="space-y-2"><Label htmlFor="currentCity">Anlık Şehir</Label><Input name="currentCity" value={commonProps.value.currentCity || ''} onChange={commonProps.onChange}/></div>
                    </div>
                );
            default: return null;
        }
    }
    
    if (isLoading) {
        return <div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Üst Düzey Yönetim Paneli</h1>
                <p className="text-muted-foreground">Tüm platform kullanıcılarını buradan yönetin.</p>
            </div>
            <Tabs defaultValue="personel">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personel"><Users className="mr-2 h-4 w-4"/> Personel ({personel?.length || 0})</TabsTrigger>
                    <TabsTrigger value="firmalar"><Building className="mr-2 h-4 w-4"/> Firmalar ({firmalar?.length || 0})</TabsTrigger>
                    <TabsTrigger value="soforler"><Truck className="mr-2 h-4 w-4"/> Şoförler ({soforler?.length || 0})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personel">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Personel Listesi</CardTitle>
                            <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
                                setIsAddDialogOpen(isOpen);
                                if (!isOpen) {
                                    setNewStaffData({ email: '', password: '', confirmPassword: '' });
                                    setNewStaffPermissions(defaultPermissions);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4"/> Yeni Personel</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddStaff}>
                                        <DialogHeader>
                                            <DialogTitle>Yeni Personel Oluştur</DialogTitle>
                                            <DialogDescription>
                                                Yeni personel için bir e-posta, şifre ve başlangıç yetkilerini oluşturun.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-email">Email</Label>
                                                <Input
                                                    id="new-email"
                                                    type="email"
                                                    value={newStaffData.email}
                                                    onChange={(e) => setNewStaffData(p => ({ ...p, email: e.target.value }))}
                                                    required
                                                    disabled={isAddSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="new-password">Şifre</Label>
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    value={newStaffData.password}
                                                    onChange={(e) => setNewStaffData(p => ({ ...p, password: e.target.value }))}
                                                    required
                                                    disabled={isAddSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="new-confirm-password">Şifre (Tekrar)</Label>
                                                <Input
                                                    id="new-confirm-password"
                                                    type="password"
                                                    value={newStaffData.confirmPassword}
                                                    onChange={(e) => setNewStaffData(p => ({ ...p, confirmPassword: e.target.value }))}
                                                    required
                                                    disabled={isAddSubmitting}
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
                                                        disabled={isAddSubmitting}
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
                                                        disabled={isAddSubmitting}
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
                                                        disabled={isAddSubmitting}
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
                                                        disabled={isAddSubmitting}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isAddSubmitting}>
                                                {isAddSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Oluştur
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Ad Soyad</TableHead><TableHead>Kullanıcı Adı (Email)</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingPersonel ? <TableRow><TableCell colSpan={3} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : personel?.map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.firstName || '-'} {p.lastName || ''}</TableCell>
                                            <TableCell>{p.username}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(p, 'roles_admin')}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setEntityToDelete({ id: p.id, type: 'roles_admin', name: p.username })}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="firmalar">
                     <Card>
                        <CardHeader><CardTitle>Firma Listesi</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Yetkili</TableHead><TableHead>Telefon</TableHead><TableHead>Konum</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingFirms ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : firmalar?.map((f: any) => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.firstName} {f.lastName}</TableCell>
                                            <TableCell>{f.phoneNumber}</TableCell>
                                            <TableCell>{f.city}, {f.district}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(f, 'firms')}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setEntityToDelete({ id: f.id, type: 'firms', name: `${f.firstName} ${f.lastName}` })}><Trash2 className="h-4 w-4"/></Button>
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
                        <CardHeader><CardTitle>Şoför Listesi</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Ad Soyad</TableHead><TableHead>Telefon</TableHead><TableHead>Araç Bilgisi</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingDrivers ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : soforler?.map((s: any) => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.firstName} {s.lastName}</TableCell>
                                            <TableCell>{s.phoneNumber}</TableCell>
                                            <TableCell>{s.vehicleType} - {s.vehiclePlate}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(s, 'drivers')}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setEntityToDelete({ id: s.id, type: 'drivers', name: `${s.firstName} ${s.lastName}` })}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={!!editingEntity} onOpenChange={(isOpen) => !isOpen && setEditingEntity(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEntity?.type === 'roles_admin' ? 'Personel' : editingEntity?.type === 'firms' ? 'Firma' : 'Şoför'} Düzenle</DialogTitle>
                        <DialogDescription>
                            Kullanıcı bilgilerini güncelleyin. Değişiklikler anında yansıtılacaktır.
                        </DialogDescription>
                    </DialogHeader>
                    {renderEditDialogContent()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingEntity(null)}>İptal</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!entityToDelete} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setEntityToDelete(null);
                    setDeleteConfirmText('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Üyeyi Kalıcı Olarak Sil</DialogTitle>
                        <DialogDescription>
                            Bu işlem geri alınamaz. "{entityToDelete?.name}" adlı üyeyi silmek istediğinizden eminseniz, lütfen aşağıdaki alana <strong className="text-foreground">SİL</strong> yazarak onaylayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder='Onaylamak için "SİL" yazın'
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }}>İptal</Button>
                        <Button 
                            variant="destructive"
                            disabled={deleteConfirmText !== 'SİL' || isDeleting}
                            onClick={handleDeleteConfirmed}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Silmeyi Onayla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
