'use client';

import Link from 'next/link';
import { Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GirisPage } from '@/components/auth/giris-page';

export default function GirisTabs() {

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
           <GirisPage initialRole="firma" />
        </TabsContent>
        <TabsContent value="sofor">
           <GirisPage initialRole="sofor" />
        </TabsContent>
        <TabsContent value="personel">
            <GirisPage initialRole="admin" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
