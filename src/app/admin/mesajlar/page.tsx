'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User as UserIcon, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAdmin } from '@/hooks/use-admin';

export default function MesajlarPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { adminData } = useAdmin();

    const [selectedPersonel, setSelectedPersonel] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Fetch all personnel
    const personelCollection = useMemoFirebase(() => (firestore && user && adminData) ? collection(firestore, 'roles_admin') : null, [firestore, user, adminData]);
    const { data: personelList, isLoading: isLoadingPersonel } = useCollection(personelCollection);
    
    // Fetch all messages for the current user
    const messagesQuery = useMemoFirebase(() => {
      if (!firestore || !user || !adminData) return null;
      // This query now correctly uses a security-rule-allowed filter
      return query(
        collection(firestore, 'messages'),
        where('participantIds', 'array-contains', user.uid),
        orderBy('createdAt', 'asc')
      );
    }, [firestore, user, adminData]);
    const { data: allMessages, isLoading: isLoadingMessages } = useCollection(messagesQuery);

    // Filter messages for the selected chat
    const chatMessages = useMemo(() => {
        if (!allMessages || !selectedPersonel) return [];
        return allMessages.filter(msg => 
            (msg.senderId === user?.uid && msg.receiverId === selectedPersonel.id) ||
            (msg.senderId === selectedPersonel.id && msg.receiverId === user?.uid)
        );
    }, [allMessages, selectedPersonel, user]);
    
    // Scroll to the bottom of the chat when a new message arrives
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [chatMessages]);


    const handleSendMessage = async () => {
        if (!message.trim() || !user || !selectedPersonel || !firestore) return;

        setIsSending(true);
        try {
            const messagesCollectionRef = collection(firestore, 'messages');
            await addDoc(messagesCollectionRef, {
                senderId: user.uid,
                receiverId: selectedPersonel.id,
                participantIds: [user.uid, selectedPersonel.id].sort(),
                content: message,
                createdAt: serverTimestamp(),
            });
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };
    
    const otherPersonel = useMemo(() => {
        if (!personelList || !user) return [];
        return personelList.filter(p => p.id !== user.uid);
    }, [personelList, user]);

    // This logic correctly derives conversations from messages the user is part of.
    const conversations = useMemo(() => {
        if (!allMessages || !personelList || !user) return [];

        const otherUsers = personelList.filter(p => p.id !== user.uid);
        const latestMessages: Record<string, any> = {};

        // Find the last message for each conversation
        for (const msg of allMessages) {
            const otherParticipantId = msg.participantIds.find((pId: string) => pId !== user.uid);
            if (otherParticipantId) {
                if (!latestMessages[otherParticipantId] || (msg.createdAt && latestMessages[otherParticipantId].createdAt && msg.createdAt.toMillis() > latestMessages[otherParticipantId].createdAt.toMillis())) {
                    latestMessages[otherParticipantId] = msg;
                }
            }
        }

        // Map other users to their last message
        return otherUsers.map(p => ({
            personel: p,
            lastMessage: latestMessages[p.id] || null
        })).sort((a, b) => {
            if (!a.lastMessage?.createdAt) return 1;
            if (!b.lastMessage?.createdAt) return -1;
            return b.lastMessage.createdAt.toMillis() - a.lastMessage.createdAt.toMillis();
        });

    }, [allMessages, personelList, user]);


    return (
        <div className="h-[calc(100vh-theme(spacing.28))] flex gap-6">
            <Card className="w-1/3 flex flex-col">
                <CardHeader>
                    <CardTitle>Personel</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent>
                        {isLoadingPersonel ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {conversations.map(({ personel: p, lastMessage }) => (
                                    <Button
                                        key={p.id}
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 p-2 h-auto text-left",
                                            selectedPersonel?.id === p.id && "bg-accent"
                                        )}
                                        onClick={() => setSelectedPersonel(p)}
                                    >
                                        <Avatar className="h-9 w-9">
                                            {p.profilePicture && <AvatarImage src={p.profilePicture} />}
                                            <AvatarFallback>
                                                {p.firstName?.[0] || 'P'}
                                                {p.lastName?.[0] || ''}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-sm truncate">{p.firstName} {p.lastName}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {lastMessage ? lastMessage.content : 'Henüz mesaj yok'}
                                            </p>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>

            <Card className="w-2/3 flex flex-col">
                {selectedPersonel ? (
                    <>
                        <header className="p-4 border-b flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                {selectedPersonel.profilePicture && <AvatarImage src={selectedPersonel.profilePicture} />}
                                <AvatarFallback>
                                    {selectedPersonel.firstName?.[0] || 'P'}
                                    {selectedPersonel.lastName?.[0] || ''}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold">{selectedPersonel.firstName} {selectedPersonel.lastName}</h3>
                                <p className="text-xs text-muted-foreground">Personel</p>
                            </div>
                        </header>
                        
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
                                {(isLoadingMessages || isLoadingPersonel) && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> }
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                        {msg.senderId !== user?.uid && (
                                            <Avatar className="h-8 w-8">
                                                {selectedPersonel.profilePicture && <AvatarImage src={selectedPersonel.profilePicture} />}
                                                <AvatarFallback>
                                                    {selectedPersonel.firstName?.[0] || 'P'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className="max-w-[70%]">
                                            <div className={cn("rounded-lg px-3 py-2 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                                {msg.content}
                                            </div>
                                             <p className={cn("text-xs text-muted-foreground mt-1", msg.senderId === user?.uid ? "text-right" : "text-left")}>
                                                {msg.createdAt ? format(msg.createdAt.toDate(), 'd MMM, HH:mm', { locale: tr }) : ''}
                                            </p>
                                        </div>
                                        {msg.senderId === user?.uid && (
                                            <Avatar className="h-8 w-8">
                                               {user?.photoURL && <AvatarImage src={user.photoURL} />}
                                                <AvatarFallback><UserIcon className="h-5 w-5"/></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {!isLoadingMessages && chatMessages.length === 0 && (
                                     <div className="text-center text-sm text-muted-foreground p-8">
                                        Bu sohbet için henüz mesaj yok.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <footer className="p-4 border-t">
                            <div className="relative">
                                <Input 
                                    placeholder="Mesajınızı yazın..." 
                                    className="pr-12"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                                    disabled={isSending}
                                />
                                <Button 
                                    size="icon" 
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10"
                                    onClick={handleSendMessage}
                                    disabled={isSending || !message.trim()}
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <MessageSquare className="h-16 w-16 mb-4" />
                        <h2 className="text-xl font-semibold">Mesajlaşmaya Başlayın</h2>
                        <p>Sohbet etmek için soldaki listeden bir personel seçin.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
