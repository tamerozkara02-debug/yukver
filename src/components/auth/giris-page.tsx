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
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'firma' | 'sofor' | 'admin';

const roleDetails = {
    firma: {
        name: 'Firma',
        description: 'Yüklerinizi yönetmek için giriş yapın.',
        registerLink: '/kayit/firma',
        registerText: 'Kayıt Olun',
        dashboard: '/firma/dashboard',
    },
    sofor: {
        name: 'Şoför',
        description: 'Yeni yük fırsatları için giriş yapın.',
        registerLink: '/kayit/sofor',
        registerText: 'Kayıt Olun',
        dashboard: '/sofor/dashboard',
    },
    admin: {
        name: 'Personel',
        description: 'Yönetim paneline erişmek için giriş yapın.',
        registerLink: null,
        registerText: null,
        dashboard: '/admin/dashboard',
    }
}


export function GirisPage({ initialRole }: { initialRole: Role}) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const details = roleDetails[initialRole];

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

    try {
        const docRef = doc(firestore, docPath);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error(`Error checking role '${expectedRole}' for user ${userId}:`, error);
        return false;
    }
  }


  const handleLogin = async () => {
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

        const isRoleCorrect = await checkUserRole(user.uid, initialRole);

        if (isRoleCorrect) {
            toast({
                title: 'Başarılı',
                description: 'Giriş yapıldı, yönlendiriliyorsunuz...',
            });
            router.push(details.dashboard);
        } else {
             await auth.signOut();
             
             let attemptedRoleName = details.name;
             let existingRoleName: string | null = null;
             
             const isFirma = await checkUserRole(user.uid, 'firma');
             if (isFirma) {
                existingRoleName = "Firma";
             }
             const isSofor = await checkUserRole(user.uid, 'sofor');
             if (isSofor) {
                existingRoleName = "Şoför";
             }
             const isAdmin = await checkUserRole(user.uid, 'admin');
               if (isAdmin) {
                existingRoleName = "Personel";
             }

            if (existingRoleName) {
                 toast({ variant: 'destructive', title: 'Hatalı Rol', description: `Bu hesap bir ${existingRoleName} hesabıdır. Lütfen doğru sekmeden giriş yapın.` });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: `Bu kimlik bilgileriyle bir '${attemptedRoleName}' hesabı bulunamadı.`,
                });
            }
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
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">{details.name} Girişi</CardTitle>
            <CardDescription>
            {details.description}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor={`${initialRole}-email`}>Email</Label>
            <Input
                id={`${initialRole}-email`}
                type="email"
                placeholder={initialRole === 'firma' ? "ornek@sirket.com" : "ornek@mail.com"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor={`${initialRole}-password`}>Şifre</Label>
            <Input id={`${initialRole}-password`} type="password" required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />
            </div>
            <Button
            type="submit"
            className="w-full"
            onClick={handleLogin}
            disabled={isLoading}
            >
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
            {details.registerLink && (
            <div className="mt-4 text-center text-sm">
                Hesabınız yok mu?{' '}
                <Link href={details.registerLink} className="underline">
                {details.registerText}
                </Link>
            </div>
            )}
        </CardContent>
    </Card>
  );
}
