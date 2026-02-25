'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil, PackageCheck } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';

export default function ManagementPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { adminData } = useAdmin();

    const [editingEntity, setEditingEntity] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Server-side fetched data
    const [shipments, setShipments] = useState<any[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
    const [newShipment, setNewShipment] = useState({
        trackingNo: '',
        phone: '',
        publicStatusText: 'Yük kaydı oluşturuldu.',
        status: 'created',
        publicLastSeenArea: ''
    });

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoadingData(true);
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [shipRes, persRes] = await Promise.all([
                fetch('/api/admin/shipments', { headers }),
                fetch('/api/admin/personnel', { headers })
            ]);
            
            if (shipRes.ok) setShipments(await shipRes.json());
            if (persRes.ok) setPersonnel(await persRes.json());
            
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && adminData) fetchData();
    }, [user, adminData, fetchData]);

    const generateTrackingNo = () => {
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const year = new Date().getFullYear();
        return `YUK-${year}-${rand()}-${rand()}`;
    };

    const handleAddShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            const trackNo = newShipment.trackingNo || generateTrackingNo();
            await setDoc(doc(firestore, 'publicShipments', trackNo), {
                trackingNo: trackNo,
                status: newShipment.status,
                publicStatusText: newShipment.publicStatusText,
                publicLastSeenArea: newShipment.publicLastSeenArea,
                active: true,
                updatedAt: serverTimestamp(),
                eta: null
            });
            toast({ title: 'Başarılı', description: 'Yük kaydı oluşturuldu.' });
            setIsAddShipmentOpen(false);
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Yük kaydı oluşturulamadı.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (entity: any, type: string) => setEditingEntity({ ...entity, type });

    const handleSave = async () => {
        if (!firestore || !editingEntity) return;
        setIsSubmitting(true);
        try {
            const { id, type, ...dataToUpdate } = editingEntity;
            const targetId = id || editingEntity.trackingNo;
            const docRef = doc(firestore, type, targetId);
            
            const cleanData = { ...dataToUpdate };
            delete cleanData.updatedAt;
            delete cleanData.eta;

            await updateDoc(docRef, { ...cleanData, updatedAt: serverTimestamp() });
            toast({ title: 'Başarılı', description: 'Güncellendi.' });
            setEditingEntity(null);
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Hata oluştu.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Üst Düzey Yönetim Paneli</h1>
                    <p className="text-muted-foreground">Tüm platform verilerini güvenli bir şekilde yönetin.</p>
                </div>
                <Button onClick={() => setIsAddShipmentOpen(true)} variant="outline">
                    <PackageCheck className="mr-2 h-4 w-4"/> Yeni Takip Kaydı
                </Button>
            </div>

            <Tabs defaultValue="takip">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="takip">Yük Takip Kayıtları ({shipments.length})</TabsTrigger>
                    <TabsTrigger value="personel">Sistem Personeli ({personnel.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="takip">
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Takip No</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Son Bölge</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingData ? (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                                    ) : shipments.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                                    ) : (
                                        shipments.map((s: any) => (
                                            <TableRow key={s.id || s.trackingNo}>
                                                <TableCell className="font-mono font-medium">{s.trackingNo}</TableCell>
                                                <TableCell><Badge variant="outline">{s.publicStatusText}</Badge></TableCell>
                                                <TableCell>{s.publicLastSeenArea || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" onClick={() => handleEditClick(s, 'publicShipments')}><Pencil className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="personel">
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kullanıcı</TableHead>
                                        <TableHead>Yetkiler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingData ? (
                                        <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                                    ) : personnel.map((p:any) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.username}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(p.permissions || {}).map(([key, val]) => (
                                                        val ? <Badge key={key} variant="secondary" className="text-[10px] uppercase">{key}</Badge> : null
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isAddShipmentOpen} onOpenChange={setIsAddShipmentOpen}>
                <DialogContent>
                    <form onSubmit={handleAddShipment} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Yeni Takip Kaydı Oluştur</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label>Takip Numarası (Boş bırakılırsa otomatik üretilir)</Label>
                            <Input 
                                placeholder="YUK-2026-..." 
                                value={newShipment.trackingNo} 
                                onChange={e => setNewShipment({...newShipment, trackingNo: e.target.value.toUpperCase()})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Güncel Durum Metni</Label>
                            <Input 
                                placeholder="Yük yola çıktı" 
                                value={newShipment.publicStatusText} 
                                onChange={e => setNewShipment({...newShipment, publicStatusText: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bulunduğu Bölge</Label>
                            <Input 
                                placeholder="İstanbul / Tuzla" 
                                value={newShipment.publicLastSeenArea} 
                                onChange={e => setNewShipment({...newShipment, publicLastSeenArea: e.target.value})} 
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <PackageCheck className="mr-2 h-4 w-4"/>}
                            Kaydı Oluştur
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingEntity} onOpenChange={() => setEditingEntity(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kaydı Düzenle</DialogTitle>
                    </DialogHeader>
                    {editingEntity && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Durum Açıklaması</Label>
                                <Input 
                                    value={editingEntity.publicStatusText} 
                                    onChange={e => setEditingEntity({...editingEntity, publicStatusText: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bölge</Label>
                                <Input 
                                    value={editingEntity.publicLastSeenArea} 
                                    onChange={e => setEditingEntity({...editingEntity, publicLastSeenArea: e.target.value})} 
                                />
                            </div>
                            <Button className="w-full" onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : 'Güncelle'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}