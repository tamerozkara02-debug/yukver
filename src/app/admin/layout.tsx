"use client"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Truck, LayoutDashboard, Users, UserCog, LogOut, Map, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useAdmin } from "@/hooks/use-admin"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter();
  const auth = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { toast } = useToast();

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    // If the admin check is complete and the user is NOT an admin, redirect them.
    if (!isAdminLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Erişim Reddedildi',
        description: 'Bu sayfaya erişim yetkiniz bulunmuyor.',
      });
      router.replace('/giris');
    }
  }, [isAdmin, isAdminLoading, router, toast]);

  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/giris');
  }

  // While the admin check is loading, show a loading screen.
  // This prevents a flash of the admin content or a premature redirect.
  if (isAdminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yetkiniz kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // If loading is finished and the user is not an admin, they will have been redirected.
  // We can also return null or a message here to prevent rendering the admin layout for non-admins.
  if (!isAdmin) {
    return null; 
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Truck className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground font-headline">Lojistik Merkezi</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin/dashboard")}>
                <Link href="/admin/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin/konum-takibi")}>
                <Link href="/admin/konum-takibi">
                  <Map />
                  <span>Konum Takibi</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin/uyeler")}>
                <Link href="/admin/uyeler">
                  <Users />
                  <span>Üyeler</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin/personel")}>
                <Link href="/admin/personel">
                  <UserCog />
                  <span>Personel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut}>
                        <LogOut />
                        <span>Çıkış Yap</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
                <h1 className="font-semibold text-lg font-headline">Yönetim Paneli</h1>
            </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
