
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
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'firma' | 'sofor' | 'admin';

const SUPER_ADMIN_EMAIL = 'tamerozkara02@gmail.com';

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
        dashboard: '/admin/portal',
    }
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
        <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.58 2.03-4.8 2.03-3.87 0-7-3.13-7-7s3.13-7 7-7c2.25 0 3.67.92 4.5 1.75l2.5-2.5C18.13 1.9 15.62 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.1 0 12.03-4.92 12.03-12.03 0-.78-.08-1.56-.22-2.32H12.48z"
        />
    </svg>
);


export function GirisPage({ initialRole }: { initialRole: Role}) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const details = roleDetails[initialRole];

  /**
   * Sadece Super Admin için ilk kurulum (Bootstrap) mantığı.
   * Client tarafında rol oluşturma sadece super admin UID'si için kurallar tarafından izinlidir.
   */
  const setupSuperAdminDocIfMissing = async (user: User) => {
    if (!firestore || user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) return;
    
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    try {
        const docSnap = await getDoc(adminRef);
        if (!docSnap.exists()) {
            await setDoc(adminRef, {
                id: user.uid,
                username: user.email,
                permissions: {
                    canViewDashboard: true,
                    canTrackLocations: true,
                    canManageMembers: true,
                    canManageStaff: true
                },
                firstName: 'Üst',
                lastName: 'Yönetici'
            });
            console.log("Super admin doc created via bootstrap.");
        }
    } catch (e: any) {
        console.error("Bootstrap error (Super Admin):", e.code, e.message);
    }
  }
  
  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'E-posta Gerekli',
        description: 'Şifre sıfırlama bağlantısı göndermek için lütfen e-posta adresinizi girin.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'E-posta Gönderildi',
        description: 'Şifre sıfırlama talimatları için lütfen e-posta kutunuzu kontrol edin.',
      });
    } catch (error: any) {
      console.error("Password reset error:", error.code, error.message);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: `Şifre sıfırlama e-postası gönderilemedi: ${error.code}`,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const checkUserRole = async (userId: string, expectedRole: Role): Promise<boolean> => {
    if (!firestore) return false;
    
    try {
        if (expectedRole === 'admin') {
            const adminSnap = await getDoc(doc(firestore, 'roles_admin', userId));
            return adminSnap.exists();
        }

        const docPath = expectedRole === 'firma' ? `firms/${userId}` : `drivers/${userId}`;
        const docSnap = await getDoc(doc(firestore, docPath));
        return docSnap.exists();
    } catch (error: any) {
        console.error("Role check error:", error.code, error.message);
        return false;
    }
  }


  const handleLogin = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen email ve şifrenizi girin.' });
        return;
    }
    
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;

    try {
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        } catch (authError: any) {
            console.error("Auth Login error:", authError.code, authError.message);
            // Super admin için otomatik hesap oluşturma (eğer henüz yoksa)
            if (isSuperAdmin && (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email')) {
                try {
                    userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                } catch (createError: any) {
                    throw authError;
                }
            } else {
                throw authError;
            }
        }

        const user = userCredential.user;
        
        // Super admin ise her zaman içeri al ve dokümanı kontrol et
        if (isSuperAdmin) {
            await setupSuperAdminDocIfMissing(user);
            toast({ title: 'Hoş Geldiniz', description: 'Üst Yönetici girişi yapıldı.' });
            router.push('/admin/portal');
            return;
        }

        // Diğer roller için doğrulama
        const isRoleCorrect = await checkUserRole(user.uid, initialRole);

        if (isRoleCorrect) {
            toast({ title: 'Başarılı', description: 'Yönlendiriliyorsunuz...' });
            router.push(details.dashboard);
        } else {
             await auth.signOut();
             toast({ 
                variant: 'destructive', 
                title: 'Erişim Engellendi', 
                description: `Bu hesap için ${details.name} yetkisi bulunamadı.` 
             });
        }
    } catch (error: any) {
         console.error("General Login Error:", error.code, error.message);
         toast({ 
            variant: 'destructive', 
            title: 'Giriş Başarısız', 
            description: `Hata: ${error.code} - ${error.message}` 
         });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        const normalizedEmail = user.email?.toLowerCase() || '';
        const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;

        if (isSuperAdmin) {
            await setupSuperAdminDocIfMissing(user);
            toast({ title: 'Hoş Geldiniz', description: 'Üst Yönetici girişi yapıldı.' });
            router.push('/admin/portal');
            return;
        }

        const hasCorrectRole = await checkUserRole(user.uid, initialRole);

        if (hasCorrectRole) {
            toast({ title: 'Başarılı', description: 'Giriş yapıldı.' });
            router.push(details.dashboard);
            return;
        }

        if (initialRole === 'admin') {
             toast({ 
                variant: 'destructive', 
                title: 'Yetki Hatası', 
                description: 'Personel hesabı bulunamadı. Lütfen yöneticinizle iletişime geçin.' 
             });
             await auth.signOut();
             setIsLoading(false);
             return;
        }

        // Firma/Şoför için profil eksikse yönlendirmeden önce hata ver (Kayıtlı olmaları gerekir)
        toast({ variant: 'destructive', title: 'Hesap Bulunamadı', description: 'Lütfen önce kayıt olun.' });
        await auth.signOut();

    } catch (error: any) {
        console.error("Google Sign-In Error:", error.code, error.message);
        toast({ variant: 'destructive', title: 'Giriş Başarısız', description: `Google hatası: ${error.code}` });
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
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google ile Giriş Yap
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Veya e-posta ile
                    </span>
                </div>
            </div>
            <div className="space-y-2">
            <Label htmlFor={`${initialRole}-email`}>Email</Label>
            <Input
                id={`${initialRole}-email`}
                type="email"
                placeholder="ornek@mail.com"
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
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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
            <div className="mt-6 flex items-center justify-center gap-x-4 text-sm">
                <Button
                    variant="link"
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isLoading || !email}
                    className="px-0 font-semibold text-foreground hover:underline"
                >
                    Şifremi Unuttum
                </Button>
                {details.registerLink && (
                    <>
                        <span className="text-muted-foreground">|</span>
                        <Link href={details.registerLink} className="font-semibold text-primary hover:underline">
                            {details.registerText}
                        </Link>
                    </>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
