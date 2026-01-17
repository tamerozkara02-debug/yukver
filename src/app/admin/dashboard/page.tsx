'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building, Truck, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


const stats = [
    { title: "Toplam Firma", value: "1,254", icon: Building, change: "+20.1% from last month" },
    { title: "Toplam Şoför", value: "5,832", icon: Truck, change: "+180.1% from last month" },
    { title: "Aktif Yük Talebi", value: "452", icon: Briefcase, change: "+19% from last month" },
    { title: "Personel Sayısı", value: "12", icon: Users, change: "+2 since last month" },
];

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleMakeAdmin = async () => {
    if (user && firestore) {
      try {
        const adminRef = doc(firestore, 'roles_admin', user.uid);
        await setDoc(adminRef, {
            id: user.uid,
            username: user.email,
            permissions: {
                canViewDashboard: true,
                canTrackLocations: true,
                canManageMembers: true,
                canManageStaff: true
            }
        });
        toast({
          title: "Yetkilendirme Başarılı!",
          description: "Mevcut hesabınız tam yönetici olarak ayarlandı. Değişikliklerin yansıması için sayfayı yenileyin veya çıkış yapıp tekrar girin."
        });
      } catch (error: any) {
        console.error("Make admin error:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Yönetici atama işlemi başarısız oldu: " + error.message,
        });
      }
    } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kullanıcı bilgileri bulunamadı. Lütfen giriş yaptığınızdan emin olun."
        });
    }
  }


  return (
    <div className="space-y-6">
        <Card className="bg-yellow-50 border-yellow-300">
            <CardHeader>
                <CardTitle>Yönetici Hesabı Oluşturma</CardTitle>
                <CardDescription>
                    Sunucu tarafındaki bir yetkilendirme sorunu nedeniyle yeni personel eklenemiyor. Bu sorunu çözmek için aşağıdaki butona tıklayarak mevcut, giriş yapmış olduğunuz hesabınızı tam yetkili bir yönetici olarak atayabilirsiniz. Bu işlemi yaptıktan sonra personel ekleme özelliği düzelecektir.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleMakeAdmin} disabled={isUserLoading}>
                  {isUserLoading ? "Kullanıcı doğrulanıyor..." : "Mevcut Hesabımı Yönetici Yap"}
                </Button>
            </CardContent>
        </Card>
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
            <p className="text-muted-foreground">İşte platformunuzun genel bir özeti.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div>
            <h2 className="text-xl font-bold tracking-tight font-headline mt-8">Son Aktiviteler</h2>
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">Son aktivite verileri burada gösterilecek.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
