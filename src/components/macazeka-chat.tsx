'use client';

import { askMacazeka, type MacazekaInput } from '@/ai/flows/macazeka-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Bot, User, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export function MacazekaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          text: 'Merhaba! Ben MaçaZeka. Lojistikle ilgili sorularınızı yanıtlamak için buradayım. Size nasıl yardımcı olabilirim?',
          sender: 'bot',
        },
      ]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MacazekaInput = input;
    const newMessages: Message[] = [...messages, { text: userMessage, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await askMacazeka(userMessage);
      setMessages([...newMessages, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      console.error('Error calling MaçaZeka:', error);
      setMessages([
        ...newMessages,
        { text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          aria-label="Open chat"
        >
          {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[350px] sm:w-[400px] h-[500px] p-0 flex flex-col mr-4 mb-2"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevents focus on first element
      >
        <header className="p-4 bg-primary text-primary-foreground rounded-t-lg flex items-center gap-3">
          <Avatar>
            <div className="bg-white rounded-full p-1">
             <Bot className="text-primary h-6 w-6" />
            </div>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg font-headline">MaçaZeka</h3>
            <p className="text-xs">Lojistik Asistanınız</p>
          </div>
        </header>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-end gap-2',
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <div className="bg-primary rounded-full p-1 flex items-center justify-center h-full w-full">
                      <Bot className="text-primary-foreground h-5 w-5" />
                    </div>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {msg.text}
                </div>
                 {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-8 w-8">
                  <div className="bg-primary rounded-full p-1 flex items-center justify-center h-full w-full">
                    <Bot className="text-primary-foreground h-5 w-5" />
                  </div>
                </Avatar>
                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Bir soru sorun..."
              className="pr-12"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
