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
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
      let description = 'Şifre sıfırlama e-postası gönderilemedi.';
      if (error.code === 'auth/user-not-found') {
        description = 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.';
      }
      toast({
        variant: 'destructive',
        title: 'Hata',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };


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

        // Super admin check
        if (user.email === 'tamerozkara02@gmail.com') {
            toast({
                title: 'Üst Yönetici Girişi Başarılı',
                description: 'Özel yönetim paneline yönlendiriliyorsunuz...',
            });
            router.push('/admin/management');
            return; // Stop further execution
        }

        const isRoleCorrect = await checkUserRole(user.uid, initialRole);

        if (isRoleCorrect) {
            toast({
                title: 'Başarılı',
                description: 'Giriş yapıldı, yönlendiriliyorsunuz...',
            });
            router.push(details.dashboard);
        } else {
            // Self-healing for admin accounts with missing roles.
            if (initialRole === 'admin' && firestore) {
                toast({
                    title: 'Hesap Yapılandırılıyor',
                    description: 'Eksik personel rolü algılandı ve şimdi oluşturuluyor. Lütfen bekleyin...',
                });
                try {
                    const adminRef = doc(firestore, 'roles_admin', user.uid);
                    await setDoc(adminRef, {
                        id: user.uid,
                        username: user.email,
                        permissions: { // Give full permissions to fix the lockout
                            canViewDashboard: true,
                            canTrackLocations: true,
                            canManageMembers: true,
                            canManageStaff: true
                        }
                    });
                    toast({
                        title: 'Başarılı',
                        description: 'Personel rolü başarıyla oluşturuldu. Yönlendiriliyorsunuz...',
                    });
                    router.push(details.dashboard);
                } catch (dbError) {
                    console.error("Failed to create admin role doc:", dbError);
                    await auth.signOut();
                    toast({
                        variant: 'destructive',
                        title: 'Yapılandırma Başarısız',
                        description: 'Personel rolü oluşturulamadı. Veritabanı yazma yetkisi sorunu olabilir.',
                    });
                }
                return; // Stop execution here after attempting self-heal
            }

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
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Super admin check
        if (user.email === 'tamerozkara02@gmail.com') {
            toast({
                title: 'Üst Yönetici Girişi Başarılı',
                description: 'Özel yönetim paneline yönlendiriliyorsunuz...',
            });
            router.push('/admin/management');
            return;
        }

        const hasCorrectRole = await checkUserRole(user.uid, initialRole);

        if (hasCorrectRole) {
            toast({ title: 'Başarılı', description: 'Giriş yapıldı, yönlendiriliyorsunuz...' });
            router.push(details.dashboard);
            return;
        }

        // Check if user exists with another role
        const otherRoles = (['firma', 'sofor', 'admin'] as Role[]).filter(r => r !== initialRole);
        for (const role of otherRoles) {
            if (await checkUserRole(user.uid, role)) {
                toast({
                    variant: 'destructive',
                    title: 'Hatalı Rol',
                    description: `Bu hesap bir ${roleDetails[role].name} hesabıdır. Lütfen doğru sekmeden giriş yapın.`
                });
                setIsLoading(false);
                return;
            }
        }
        
        // If we reach here, user is new. Create their profile.
        toast({ title: 'Hoş geldiniz!', description: `${details.name} profiliniz oluşturuluyor...` });

        const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ['', ''];
        const lastName = lastNameParts.join(' ');
        
        let profileData: any;
        let collectionName: string = '';

        if (initialRole === 'firma') {
            collectionName = 'firms';
            profileData = {
                id: user.uid,
                firstName: firstName || '',
                lastName: lastName || '',
                profilePicture: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                city: '',
                district: '',
                taxOffice: '',
                taxNumber: ''
            };
        } else if (initialRole === 'sofor') {
            collectionName = 'drivers';
            profileData = {
                id: user.uid,
                firstName: firstName || '',
                lastName: lastName || '',
                profilePicture: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                vehicleType: '',
                vehiclePlate: ''
            };
        } else {
             // This case should not be hit from the main login page for Google sign-in
             toast({ variant: 'destructive', title: 'Hata', description: 'Geçersiz rol.' });
             setIsLoading(false);
             return;
        }
        
        await setDoc(doc(firestore, collectionName, user.uid), profileData);
        toast({ title: 'Profil Oluşturuldu', description: 'Panele yönlendiriliyorsunuz.' });
        router.push(details.dashboard);

    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
            variant: 'destructive',
            title: 'Giriş Başarısız',
            description: 'Google ile giriş sırasında bir hata oluştu.',
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
                placeholder={initialRole === 'firma' ? "ornek@sirket.com" : "ornek@mail.com"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
            />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`${initialRole}-password`}>Şifre</Label>
                </div>
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
