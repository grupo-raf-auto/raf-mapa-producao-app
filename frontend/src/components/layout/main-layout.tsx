'use client';

import { useState, useEffect } from 'react';
import { usePathname } from '@/lib/router-compat';
import { Sidebar } from './sidebar';
import { ModelSelector } from './model-selector';
import { SupportChatFab } from '@/components/support/support-chat-fab';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase } from '@/components/ui/sidebar';
import { Moon, Sun, Bug, Power, Users } from 'lucide-react';
import { useSession, authClient } from '@/lib/auth-client';
import { useRouter } from '@/lib/router-compat';
import { toast } from 'sonner';
import { useTheme } from 'next-themes'; // works in any React app
import { Link, Image } from '@/lib/router-compat';

// Top bar with search and action buttons
function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear client-side auth state BEFORE server call to prevent race conditions
      // This ensures the UI updates immediately even if server is slow
      localStorage.removeItem('activeModelId');
      sessionStorage.clear();

      // Sign out from Better Auth (clears server session + cookies)
      await authClient.signOut();

      // Force refresh to ensure session state is completely cleared
      // This also ensures middleware validation on next navigation
      toast.success('Sessão terminada com sucesso');

      // Use replace() instead of push() to prevent back button navigation to dashboard
      // This is more secure as it removes the dashboard from browser history
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao terminar sessão');

      // Even if logout fails, still redirect to sign-in for security
      // User should not see dashboard if logout fails
      router.replace('/sign-in');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleReportBug = () => {
    // Opens a bug report - could be a modal or external link
    toast.info('Funcionalidade de reportar bug em desenvolvimento');
  };

  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm dark:bg-card/40">
      {/* Logo RAF (esquerda) - visível no admin; spacer nas outras rotas */}
      {isAdminRoute ? (
        <Link to="/admin" className="flex items-center shrink-0 cursor-pointer">
          <Image
            src="/logo-raf.png"
            alt="Grupo RAF"
            width={80}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
      ) : (
        <div />
      )}

      {/* Right side - action buttons */}
      <div className="flex items-center gap-2">
        {/* Model Selector - only show for users (not admins) */}
        {!isAdminRoute && <ModelSelector />}

        {/* CRM MyCredit button */}
        <Link
          to="/crm"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium hover:bg-emerald-600 transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          CRM MyCredit
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-border bg-card hover:bg-muted transition-colors dark:bg-card/80 dark:hover:bg-muted/80 cursor-pointer"
          title="Alternar tema"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-foreground" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-foreground" />
          )}
        </button>

        {/* Reportar Bug button */}
        <button
          onClick={handleReportBug}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors dark:bg-warning/15 dark:text-warning dark:hover:bg-warning/25 cursor-pointer"
        >
          <Bug className="w-3.5 h-3.5" />
          Reportar Bug
        </button>

        {/* Sair button - icon only */}
        {user && (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors dark:bg-destructive/15 dark:hover:bg-destructive/25 cursor-pointer"
            title="Sair"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
  const isAdminPage = pathname === '/admin';
  const showSidebar = !isAdminPage;

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      {/* Background */}
      <div className="h-screen w-full p-4 md:p-6 lg:p-8 overflow-hidden bg-background">
        {/* Floating Dashboard Container */}
        <div className="floating-dashboard h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden relative">
          {/* Sidebar */}
          {showSidebar && <Sidebar />}

          {/* Main Content */}
          <MainContent>{children}</MainContent>

          {/* Support Chat FAB */}
          <div className="absolute bottom-6 right-6">
            <SupportChatFab />
          </div>
        </div>
      </div>
    </SidebarBase>
  );
}
