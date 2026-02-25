
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Search, MapPin, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PublicTrackingPage() {
  const [trackingNo, setTrackingNo] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNo.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/public-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNo: trackingNo.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center p-4 pt-12 md:pt-24">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline uppercase">MAÇA LOJİSTİK MERKEZİ</h1>
          </Link>
          <h2 className="text-3xl font-bold font-headline">Yük Takibi</h2>
          <p className="text-muted-foreground">Size SMS veya WhatsApp ile iletilen yük numarasını girerek durumu sorgulayın.</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="trackingNo" className="sr-only">Yük Numarası</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="trackingNo"
                    placeholder="Örn: YUK-2026-8H3K-92QF" 
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className="pl-10 h-12 uppercase"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading || !trackingNo.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sorgula'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-t-4 border-t-primary shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-headline">Yük Durumu: {result.publicStatusText}</CardTitle>
                  <CardDescription>Takip No: {result.trackingNo}</CardDescription>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {result.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-lg"><MapPin className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Son Görüldüğü Yer</p>
                  <p className="font-semibold">{result.publicLastSeenArea || 'Henüz bilgi yok'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-lg"><Calendar className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Tahmini Teslim</p>
                  <p className="font-semibold">
                    {result.eta ? format(new Date(result.eta), 'PPP', { locale: tr }) : 'Hesaplanıyor...'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-lg"><Clock className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Son Güncelleme</p>
                  <p className="text-sm">
                    {format(new Date(result.updatedAt), 'd MMMM, HH:mm', { locale: tr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
