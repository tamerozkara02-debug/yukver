import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Building, ArrowRight, User, LogIn, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { MacazekaChat } from '@/components/macazeka-chat';

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === "hero-logistics");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">MAÇA LOJİSTİK MERKEZİ</h1>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/giris">Firma Girişi</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/giris">Şoför Girişi</Link>
          </Button>
          <Button asChild>
            <Link href="/kayit/firma">Hemen Başla <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </nav>
        <div className="md:hidden">
            <Button asChild size="sm">
                <Link href="/giris">Giriş Yap</Link>
            </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative py-20 md:py-32 bg-card">
            {heroImage && (
                 <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                    priority
                />
            )}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-foreground">Türkiye'nin Yükü Burada</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              İster yük veren bir firma, ister güvenilir bir şoför olun. MAÇA LOJİSTİK MERKEZİ, tüm taşıma ihtiyaçlarınız için modern ve hızlı çözümler sunar.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/kayit/firma">Firma Olarak Kayıt Ol</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/kayit/sofor">Şoför Olarak Kayıt Ol</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold font-headline">Nasıl Çalışır?</h3>
              <p className="mt-2 text-muted-foreground">Sadece 3 basit adımda lojistik operasyonlarınızı yönetin.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4">
                  <User className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold font-headline">1. Kayıt Olun</h4>
                <p className="mt-2 text-muted-foreground">Firma veya şoför olarak profilinizi saniyeler içinde oluşturun.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold font-headline">2. Bilgileri Girin</h4>
                <p className="mt-2 text-muted-foreground">Yükünüzün veya aracınızın detaylarını sistemimize kaydedin.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4">
                  <LogIn className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold font-headline">3. Çağrı Merkezini Arayın</h4>
                <p className="mt-2 text-muted-foreground">Size en uygun eşleştirmeyi yapmamız için çağrı merkezimizle iletişime geçin.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold font-headline">Aradığınız Her Şey Tek Platformda</h3>
                <p className="mt-4 text-muted-foreground">MAÇA LOJİSTİK MERKEZİ, yük veren firmalar ile nakliyecileri profesyonel bir çağrı merkezi operasyonuyla bir araya getirir. Güvenli, hızlı ve verimli taşımacılığın yeni adresi.</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                      <Building className="h-5 w-5"/>
                    </div>
                    <div>
                      <h4 className="font-semibold">Firmalar İçin</h4>
                      <p className="text-sm text-muted-foreground">Yüklerinizi güvenle ve zamanında taşıtın. Geniş şoför ağımızla tanışın.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                      <Truck className="h-5 w-5"/>
                    </div>
                    <div>
                      <h4 className="font-semibold">Şoförler İçin</h4>
                      <p className="text-sm text-muted-foreground">Aracınıza uygun yükleri kolayca bulun. Düzenli ve güvenilir iş fırsatları.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-4xl">+1,200</CardTitle>
                    <CardDescription>Mutlu Firma</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="mt-8">
                   <CardHeader>
                    <CardTitle className="font-headline text-4xl">+5,000</CardTitle>
                    <CardDescription>Kayıtlı Şoför</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                   <CardHeader>
                    <CardTitle className="font-headline text-4xl">+10,000</CardTitle>
                    <CardDescription>Tamamlanan Taşıma</CardDescription>
                  </CardHeader>
                </Card>
                 <Card className="mt-8">
                   <CardHeader>
                    <CardTitle className="font-headline text-4xl">7/24</CardTitle>
                    <CardDescription>Destek</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} MAÇA LOJİSTİK MERKEZİ. Tüm hakları saklıdır.</p>
          <div className="mt-2">
            <Link href="/admin/giris" className="hover:text-primary">
              Personel Girişi
            </Link>
          </div>
        </div>
      </footer>
      <MacazekaChat />
    </div>
  );
}
