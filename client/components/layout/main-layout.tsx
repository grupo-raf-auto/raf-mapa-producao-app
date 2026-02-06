'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { ModelSelector } from './model-selector';
import { ReportBugDialog } from './report-bug-dialog';
import { NotificationsDropdown } from './notifications-dropdown';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase } from '@/components/ui/sidebar';
import { Search, Bug, ChevronDown, LayoutGrid } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authClient } from '@/lib/auth-client';
import { Settings, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';

// Top bar with search, notifications and user profile
function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reportBugOpen, setReportBugOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    user?.name ||
    (user as { firstName?: string })?.firstName ||
    user?.email?.split('@')[0] ||
    'Utilizador';
  const initial = (displayName as string)?.[0]?.toUpperCase() || 'U';
  const userEmail = user?.email || '';

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('activeModelId');
      sessionStorage.clear();
      await authClient.signOut();
      toast.success('Sessão terminada com sucesso');
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao terminar sessão');
      router.replace('/sign-in');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/80 backdrop-blur-sm">
      {/* Left side - Search bar */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-64 h-10 pl-10 pr-12 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background border border-border rounded">
            ⌘F
          </kbd>
        </div>
      </div>

      {/* Right side - Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Model Selector - only show for users (not admins) */}
        {!isAdminRoute && <ModelSelector />}

        {/* CRM MyCredit - link para o CRM */}
        {!isAdminRoute && (
          <a
            href={
              process.env.NEXT_PUBLIC_CRM_MYCREDIT_URL ||
              'https://crm.my-credit.pt/'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-accent-foreground hover:opacity-90 font-medium text-xs transition-colors cursor-pointer shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>CRM MyCredit</span>
          </a>
        )}

        {/* Report bug - abre modal para utilizador reportar */}
        <button
          type="button"
          title="Reportar um problema"
          aria-label="Reportar um problema ou bug"
          onClick={() => setReportBugOpen(true)}
          className="relative p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        >
          <Bug className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Notifications - contexto: admin = bugs; user = comissões pagas */}
        <NotificationsDropdown />

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                {/* Avatar */}
                <Avatar className="w-9 h-9 shadow-lg">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white font-semibold text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {/* Name & Email */}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {userEmail}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {mounted && theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Modo Escuro
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Definições
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/help')}
                className="cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ReportBugDialog open={reportBugOpen} onOpenChange={setReportBugOpen} />
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  // Admin has its own sidebar and layout - render directly without wrapper
  if (isAdminRoute) {
    return (
      <PageAnimation key={pathname} className="flex-1 h-full flex">
        {children}
      </PageAnimation>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto">
          <PageAnimation key={pathname}>{children}</PageAnimation>
        </div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      {/* Background */}
      <div className="h-screen w-full p-4 md:p-6 lg:p-8 overflow-hidden bg-background">
        {/* Floating Dashboard Container */}
        <div
          id="dashboard-container"
          className="floating-dashboard h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden relative"
        >
          {/* Sidebar - only show user sidebar for non-admin routes */}
          {!isAdminRoute && <Sidebar />}

          {/* Main Content */}
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </SidebarBase>
  );
}
