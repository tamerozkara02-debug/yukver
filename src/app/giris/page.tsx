'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'firma' | 'sofor' | 'admin';


export default function GirisPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [firmaEmail, setFirmaEmail] = useState('');
  const [firmaPassword, setFirmaPassword] = useState('');
  const [soforEmail, setSoforEmail] = useState('');
  const [soforPassword, setSoforPassword] = useState('');
  const [personelEmail, setPersonelEmail] = useState('');
  const [personelPassword, setPersonelPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkUserRole = async (userId: string, expectedRole: Role): Promise<boolean> => {
    if (!firestore) return false;
    
    let docPath: string;
    switch (expectedRole) {
        case 'firma':
            docPath = `firms/${userId}`;
            break;
        case 'sofor':
            docPath = `drivers/${userId}`;
            break;
        case 'admin':
            docPath = `roles_admin/${userId}`;
            break;
        default:
            return false;
    }

    const docRef = doc(firestore, docPath);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }


  const handleLogin = async (role: Role) => {
    let email, password;
    switch (role) {
        case 'firma':
            email = firmaEmail;
            password = firmaPassword;
            break;
        case 'sofor':
            email = soforEmail;
            password = soforPassword;
            break;
        case 'admin':
            email = personelEmail;
            password = personelPassword;
            break;
    }

    if (!email || !password) {
        toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Lütfen email ve şifrenizi girin.',
        });
        return;
    }
    
    setIsLoading(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const isRoleCorrect = await checkUserRole(user.uid, role);

        if (isRoleCorrect) {
            toast({
                title: 'Başarılı',
                description: 'Giriş yapıldı, yönlendiriliyorsunuz...',
            });
            router.push(`/${role}/dashboard`);
        } else {
             await auth.signOut();
             let roleName = '';
             if (role === 'firma') roleName = 'Firma';
             if (role === 'sofor') roleName = 'Şoför';
             if (role === 'admin') roleName = 'Personel';
             toast({
                variant: 'destructive',
                title: 'Hatalı Rol',
                description: `Bu hesap bir ${roleName} hesabı değil. Lütfen doğru sekmeden giriş yapın.`,
            });
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Giriş Başarısız',
            description: 'Email veya şifre hatalı.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="firma" className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline">
              Lojistik Merkezi
            </h1>
          </Link>
        </div>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="firma">Firma</TabsTrigger>
          <TabsTrigger value="sofor">Şoför</TabsTrigger>
          <TabsTrigger value="personel">Personel</TabsTrigger>
        </TabsList>
        <TabsContent value="firma">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Firma Girişi</CardTitle>
              <CardDescription>
                Yüklerinizi yönetmek için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firma-email">Email</Label>
                <Input
                  id="firma-email"
                  type="email"
                  placeholder="ornek@sirket.com"
                  required
                  value={firmaEmail}
                  onChange={(e) => setFirmaEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firma-password">Şifre</Label>
                <Input id="firma-password" type="password" required 
                    value={firmaPassword}
                    onChange={(e) => setFirmaPassword(e.target.value)}
                    disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                onClick={() => handleLogin('firma')}
                disabled={isLoading}
              >
                {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
              <div className="mt-4 text-center text-sm">
                Hesabınız yok mu?{' '}
                <Link href="/kayit/firma" className="underline">
                  Kayıt Olun
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sofor">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Şoför Girişi</CardTitle>
              <CardDescription>
                Yeni yük fırsatları için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sofor-email">Email</Label>
                <Input
                  id="sofor-email"
                  type="email"
                  placeholder="ornek@mail.com"
                  required
                  value={soforEmail}
                  onChange={(e) => setSoforEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sofor-password">Şifre</Label>
                <Input id="sofor-password" type="password" required 
                    value={soforPassword}
                    onChange={(e) => setSoforPassword(e.target.value)}
                    disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                onClick={() => handleLogin('sofor')}
                disabled={isLoading}
              >
                 {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
              <div className="mt-4 text-center text-sm">
                Hesabınız yok mu?{' '}
                <Link href="/kayit/sofor" className="underline">
                  Kayıt Olun
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="personel">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Personel Girişi</CardTitle>
              <CardDescription>
                Yönetim paneline erişmek için giriş yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personel-email">Kullanıcı Adı (Email)</Label>
                <Input id="personel-email" required type="email"
                    value={personelEmail}
                    onChange={(e) => setPersonelEmail(e.target.value)}
                    disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personel-password">Şifre</Label>
                <Input id="personel-password" type="password" required 
                    value={personelPassword}
                    onChange={(e) => setPersonelPassword(e.target.value)}
                    disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                onClick={() => handleLogin('admin')}
                disabled={isLoading}
              >
                {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
