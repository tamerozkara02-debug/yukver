import Link from 'next/link';
import { Truck } from 'lucide-react';

export default function KayitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline">MAÇA LOJİSTİK MERKEZİ</h1>
          </Link>
        </div>
        {children}
         <div className="mt-4 text-center text-sm text-muted-foreground">
          Zaten bir hesabınız var mı?{' '}
          <Link href="/giris" className="font-semibold text-primary hover:underline">
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
