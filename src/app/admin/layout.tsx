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
import { Truck, LayoutDashboard, Users, UserCog, LogOut, Map, Loader2, Briefcase, Shield, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useAdmin } from "@/hooks/use-admin"
import { useToast } from "@/hooks/use-toast"

type PermissionKey = 'canViewDashboard' | 'canTrackLocations' | 'canManageMembers' | 'canManageStaff';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { isAdmin, adminData, isLoading: isAdminLoading } = useAdmin();
  const { toast } = useToast();

  const isActive = (path: string) => pathname.startsWith(path);

  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/giris');
  }
  
  if (pathname === '/admin/giris') {
    return <>{children}</>;
  }

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

  if (!isAdmin) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-4">
           <h1 className="text-2xl font-bold text-destructive">Erişim Reddedildi</h1>
          <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <Button onClick={() => router.replace('/giris')}>Giriş Sayfasına Dön</Button>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Truck className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground font-headline">YÜKVER MERKEZİ</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             {user?.email === 'tamerozkara02@gmail.com' && (
               <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/management")}>
                    <Link href="/admin/management">
                      <Shield />
                      <span>Üst Yönetim</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/portal")}>
                  <Link href="/admin/portal">
                    <LayoutDashboard />
                    <span>Portal</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/mesajlar")}>
                  <Link href="/admin/mesajlar">
                    <MessageSquare />
                    <span>Mesajlar</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>

            {adminData?.permissions.canTrackLocations && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/konum-takibi")}>
                  <Link href="/admin/konum-takibi">
                    <Map />
                    <span>Konum Takibi</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin/uyeler")}>
                <Link href="/admin/uyeler">
                  <Users />
                  <span>Üyeler</span>
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