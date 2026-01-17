'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Pencil, Users, Building, Truck } from 'lucide-react';


export default function ManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [editingEntity, setEditingEntity] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Data fetching
    const personelCollection = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);
    const { data: personel, isLoading: isLoadingPersonel } = useCollection(personelCollection);

    const firmsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'firms') : null, [firestore]);
    const { data: firmalar, isLoading: isLoadingFirms } = useCollection(firmsCollection);

    const driversCollection = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);
    const { data: soforler, isLoading: isLoadingDrivers } = useCollection(driversCollection);

    const isLoading = isLoadingPersonel || isLoadingFirms || isLoadingDrivers;

    // --- GENERIC HANDLERS ---
    const handleEditClick = (entity, type) => {
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
    
    const handleDelete = async (id, type) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, type, id));
            toast({ title: 'Başarılı', description: 'Kullanıcı başarıyla silindi.' });
        } catch (error) {
            console.error("Error deleting document:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Silme işlemi başarısız oldu.' });
        }
    };

    const handleDialogInputChange = (e) => {
        if (!editingEntity) return;
        const { name, value } = e.target;
        setEditingEntity(prev => ({ ...prev, [name]: value }));
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
                        <div className="space-y-2"><Label htmlFor="phoneNumber">Telefon</Label><Input name="phoneNumber" value={commonProps.value.phoneNumber || ''} onChange={commonProps.onChange}/></div>
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
                        <div className="space-y-2"><Label htmlFor="phoneNumber">Telefon</Label><Input name="phoneNumber" value={commonProps.value.phoneNumber || ''} onChange={commonProps.onChange}/></div>
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
                        <CardHeader><CardTitle>Personel Listesi</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Ad Soyad</TableHead><TableHead>Kullanıcı Adı (Email)</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingPersonel ? <TableRow><TableCell colSpan={3} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : personel?.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.firstName || '-'} {p.lastName || ''}</TableCell>
                                            <TableCell>{p.username}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(p, 'roles_admin')}><Pencil className="h-4 w-4" /></Button>
                                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu işlem, personelin yönetici rolünü kalıcı olarak kaldıracaktır.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id, 'roles_admin')}>Sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
                                    {isLoadingFirms ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : firmalar?.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.firstName} {f.lastName}</TableCell>
                                            <TableCell>{f.phoneNumber}</TableCell>
                                            <TableCell>{f.city}, {f.district}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(f, 'firms')}><Pencil className="h-4 w-4" /></Button>
                                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu işlem, firma profilini kalıcı olarak silecektir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(f.id, 'firms')}>Sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
                                    {isLoadingDrivers ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell></TableRow> : soforler?.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.firstName} {s.lastName}</TableCell>
                                            <TableCell>{s.phoneNumber}</TableCell>
                                            <TableCell>{s.vehicleType} - {s.vehiclePlate}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(s, 'drivers')}><Pencil className="h-4 w-4" /></Button>
                                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu işlem, şoför profilini kalıcı olarak silecektir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(s.id, 'drivers')}>Sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
        </div>
    );
}
