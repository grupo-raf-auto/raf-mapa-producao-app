'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { SupportChatFab } from '@/components/support/support-chat-fab';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase } from '@/components/ui/sidebar';
import { Moon, Sun, Bug, Power, Shield, Users } from 'lucide-react';
import { useSession, authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import Link from 'next/link';

// Top bar with search and action buttons
function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success('Sessão terminada com sucesso');
      router.push('/sign-in');
    } catch {
      toast.error('Erro ao terminar sessão');
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
    <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-white/50 backdrop-blur-sm">
      {/* Spacer */}
      <div />

      {/* Right side - action buttons */}
      <div className="flex items-center gap-2">
        {/* Administração button */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white rounded-full text-xs font-medium hover:bg-violet-600 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          Administração
        </Link>

        {/* CRM MyCredit button */}
        <Link
          href="/crm"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium hover:bg-emerald-600 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          CRM MyCredit
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-border bg-white hover:bg-muted transition-colors"
          title="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-foreground" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-foreground" />
          )}
        </button>

        {/* Reportar Bug button */}
        <button
          onClick={handleReportBug}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
        >
          <Bug className="w-3.5 h-3.5" />
          Reportar Bug
        </button>

        {/* Sair button - icon only */}
        {user && (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Sair"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function MainContent({
  children,
  showSidebar,
}: {
  children: React.ReactNode;
  showSidebar: boolean;
}) {
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
      <div
        className="h-screen w-full p-4 md:p-6 lg:p-8 overflow-hidden"
        style={{
          background: '#F4F8FE',
        }}
      >
        {/* Floating Dashboard Container */}
        <div className="floating-dashboard h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden">
          {/* Sidebar */}
          {showSidebar && <Sidebar />}

          {/* Main Content */}
          <MainContent showSidebar={showSidebar}>{children}</MainContent>
        </div>

        {/* Support Chat FAB */}
        <SupportChatFab />
      </div>
    </SidebarBase>
  );
}
