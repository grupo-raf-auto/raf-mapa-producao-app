import { useState, useEffect } from 'react';
import { usePathname } from '@/lib/router-compat';
import { Sidebar } from './sidebar';
import { ModelSelector } from './model-selector';
import { ReportBugDialog } from './report-bug-dialog';
import { NotificationsDropdown } from './notifications-dropdown';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase } from '@/components/ui/sidebar';
import { Search, Bug, ChevronDown, LayoutGrid } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from '@/lib/router-compat';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { SearchBar, type SearchItem } from '@/components/ui/search-bar';
import { useSearch } from '@/hooks/use-search';
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
  const { isOpen: isSearchOpen, open: openSearch, setIsOpen: setSearchOpen } = useSearch({ enabled: true, shortcut: 'k' });
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

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

  // Search data based on app routes & user role (admin items only when isAdmin)
  const searchData: SearchItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Visão geral e métricas principais do sistema',
      category: 'horizon',
      tags: ['Home', 'Principal', 'Visão Geral'],
    },
    ...(isAdmin
      ? [
          {
            id: 'templates',
            title: 'Templates',
            description: 'Gerenciar templates de documentos e formulários',
            category: 'horizon' as const,
            tags: ['Documentos', 'Modelos'],
          },
        ]
      : []),
    {
      id: 'formularios',
      title: 'Formulários',
      description: 'Criar e gerenciar formulários personalizados',
      category: 'horizon',
      tags: ['Forms', 'Cadastro'],
    },
    {
      id: 'consultas',
      title: 'Consultas',
      description: 'Realizar consultas e buscas no sistema',
      category: 'horizon',
      tags: ['Busca', 'Pesquisa'],
    },
    {
      id: 'scanner',
      title: 'Scanner de Documentos',
      description: 'Digitalizar e processar documentos',
      category: 'actions',
      tags: ['Scan', 'Documentos', 'Upload'],
    },
    {
      id: 'mysabichao',
      title: 'MySabichão',
      description: 'Assistente inteligente e gestão de documentos',
      category: 'knowledge',
      tags: ['IA', 'Documentos', 'Assistente'],
    },
    ...(isAdmin ? [
      {
        id: 'admin',
        title: 'Painel Administrativo',
        description: 'Área administrativa do sistema',
        category: 'horizon' as const,
        tags: ['Admin', 'Gestão'],
      },
      {
        id: 'admin/users',
        title: 'Gestão de Utilizadores',
        description: 'Gerenciar utilizadores e permissões',
        category: 'horizon' as const,
        tags: ['Utilizadores', 'Admin'],
      },
      {
        id: 'admin/consultas',
        title: 'Admin - Consultas',
        description: 'Visualizar todas as consultas do sistema',
        category: 'reports' as const,
        tags: ['Admin', 'Relatórios'],
      },
      {
        id: 'admin/performance',
        title: 'Performance de Utilizadores',
        description: 'Métricas e análise de performance',
        category: 'reports' as const,
        tags: ['Admin', 'Performance'],
      },
      {
        id: 'admin/templates',
        title: 'Gestão de Templates (Admin)',
        description: 'Administrar templates do sistema',
        category: 'horizon' as const,
        tags: ['Admin', 'Templates'],
      },
      {
        id: 'admin/documents',
        title: 'Gestão de Documentos (Admin)',
        description: 'Administrar documentos do sistema',
        category: 'horizon' as const,
        tags: ['Admin', 'Documentos'],
      },
    ] : []),
    {
      id: 'action-report-bug',
      title: 'Reportar Bug',
      description: 'Reportar um problema ou bug no sistema',
      category: 'actions',
      tags: ['Bug', 'Suporte'],
    },
    {
      id: 'action-theme',
      title: 'Alternar Tema (Claro / Escuro)',
      description: 'Mudar entre tema claro e escuro',
      category: 'actions',
      tags: ['Tema', 'Dark Mode'],
    },
    {
      id: 'action-signout',
      title: 'Terminar Sessão',
      description: 'Fazer logout do sistema',
      category: 'actions',
      tags: ['Logout', 'Sair'],
    },
  ];

  const handleSearchSelect = (item: SearchItem) => {
    if (item.id === 'action-report-bug') {
      setReportBugOpen(true);
      return;
    }
    if (item.id === 'action-theme') {
      toggleTheme();
      return;
    }
    if (item.id === 'action-signout') {
      handleSignOut();
      return;
    }
    // Segurança: rotas restritas a admin (admin/* e /templates)
    const path = String(item.id);
    const isAdminOnlyPath =
      path === 'admin' ||
      path.startsWith('admin/') ||
      path === 'templates';
    if (isAdminOnlyPath && !isAdmin) {
      toast.error('Acesso negado.');
      return;
    }
    router.push(`/${path}`);
  };

  return (
    <>
    <div className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/80 backdrop-blur-sm">
      {/* Left side - Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={openSearch}
          className="w-72 h-10 flex items-center gap-2 pl-3.5 pr-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:bg-muted/80 hover:border-border transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Pesquisar...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
            {mounted && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>
      </div>

      {/* Right side - Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Model Selector - only show for users (not admins) */}
        {!isAdminRoute && <ModelSelector />}

        {/* CRM MyCredit - link verde conforme referência */}
        {!isAdminRoute && (
          <a
            href={import.meta.env.VITE_CRM_MYCREDIT_URL || 'https://crm.my-credit.pt/'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs transition-colors cursor-pointer shadow-sm"
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

    {/* Global Search Modal - só mostramos itens admin se isAdmin; filtro defensivo extra */}
    <SearchBar
      data={searchData.filter((item) => {
        const id = String(item.id);
        if (id === 'admin' || id.startsWith('admin/') || id === 'templates')
          return isAdmin;
        return true;
      })}
      placeholder="Pesquisar páginas, ações, funcionalidades..."
      onSelect={handleSearchSelect}
      isOpen={isSearchOpen}
      onOpenChange={setSearchOpen}
      emptyMessage="Sem resultados"
    />
    </>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  // Admin has its own sidebar and layout - render directly without wrapper.
  if (isAdminRoute) {
    return (
      <PageAnimation key="/admin" className="flex-1 h-full flex">
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
