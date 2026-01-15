"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building, LogOut, Phone, Send, CheckCircle } from "lucide-react";

export default function FirmaDashboard() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to submit load info would go here
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground font-headline">Firma Panelim</h1>
              <p className="text-sm text-muted-foreground">Hoş geldiniz, Ahmet Yılmaz!</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Çıkış Yap</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <Card className="text-center bg-green-50 border-green-200">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="font-headline text-2xl mt-4 text-green-900">Yükünüz Kaydedildi!</CardTitle>
                    <CardDescription className="text-green-700">
                        Yük bilgileriniz başarıyla sistemimize kaydedilmiştir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">Size en uygun aracı bulmak için lütfen çağrı merkezimizle iletişime geçin.</p>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                        <Phone className="mr-2 h-4 w-4" /> Çağrı Merkezini Ara (0850 123 45 67)
                    </Button>
                    <div className="mt-6">
                        <Button variant="outline" onClick={() => setSubmitted(false)}>
                            Yeni Yük Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Yeni Yük Bilgisi Girin</CardTitle>
                <CardDescription>Taşınacak yükünüzün detaylarını belirtin.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="yuk-bilgisi">Yük Bilgisi (Açıklama)</Label>
                    <Textarea
                      id="yuk-bilgisi"
                      placeholder="Örn: 10 ton paletli gıda malzemesi"
                      required
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nereden">Yükün Bulunduğu Şehir</Label>
                      <Input id="nereden" placeholder="Kocaeli" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nereye">Yükün Gideceği Şehir</Label>
                      <Input id="nereye" placeholder="İzmir" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arac-bilgisi">İstenen Araç Tipi</Label>
                    <Select required>
                      <SelectTrigger id="arac-bilgisi">
                        <SelectValue placeholder="Araç tipi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tir">Tır</SelectItem>
                        <SelectItem value="kamyon">Kamyon</SelectItem>
                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                        <SelectItem value="farketmez">Farketmez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Yükü Sisteme Kaydet
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
