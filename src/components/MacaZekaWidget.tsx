
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { chatWithMacaZeka } from '@/ai/flows/maca-zeka-flow';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';

type Message = {
  role: 'bot' | 'user';
  text: string;
};

export function MacaZekaWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Merhaba! Ben MaçaZeka. Yük durumunuzu öğrenmek için "Yük No: YUK-XXXX-YYYY" şeklinde yazabilir veya bana sorularınızı sorabilirsiniz.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      let role = 'guest';
      if (user && firestore) {
        // Rolü kontrol et (Basitlik için admin veya user)
        const adminSnap = await getDoc(doc(firestore, 'roles_admin', user.uid));
        if (adminSnap.exists()) role = 'admin';
      }

      const result = await chatWithMacaZeka({
        message: userMsg,
        userContext: {
          uid: user?.uid,
          role: role,
          isLoggedIn: !!user
        }
      });

      setMessages(prev => [...prev, { role: 'bot', text: result.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Üzgünüm, şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-80 sm:w-96 h-[500px] mb-4 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-4">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <CardTitle className="text-lg font-headline">MaçaZeka</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/10 text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'bot' ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-lg text-sm",
                      m.role === 'bot' ? "bg-card border" : "bg-primary text-primary-foreground shadow-md"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t bg-card">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Mesajınızı yazın..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      <Button 
        size="lg" 
        className={cn("rounded-full h-14 w-14 shadow-xl transition-all hover:scale-110", isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
}
