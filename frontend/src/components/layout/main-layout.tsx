import { useState, useEffect } from 'react';
import { usePathname } from '@/lib/router-compat';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { ModelSelector } from './model-selector';
import { SupportChatProvider } from '@/contexts/support-chat-context';
import { SupportChatPanel } from './support-chat-panel';
import { ReportBugDialog } from './report-bug-dialog';
import { NotificationsDropdown } from './notifications-dropdown';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { Search, Bug, ChevronDown, LayoutGrid, Menu, X, UsersRound } from 'lucide-react';
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
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';

// Top bar with search, notifications and user profile
function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setOpen: setSidebarOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const [myTeam, setMyTeam] = useState<{ name: string } | null>(null);
  const { isOpen: isSearchOpen, open: openSearch, setIsOpen: setSearchOpen } = useSearch({ enabled: true, shortcut: 'k' });
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || isAdminRoute) return;
    apiClient.teams
      .getMy()
      .then((data: { name?: string }) => (data?.name ? setMyTeam({ name: data.name }) : setMyTeam(null)))
      .catch(() => setMyTeam(null));
  }, [user, isAdminRoute]);

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
        id: 'admin/equipas',
        title: 'Admin - Equipas',
        description: 'Gerir equipas e desempenho global',
        category: 'reports' as const,
        tags: ['Admin', 'Equipas'],
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
    {/* Top bar: igual ao painel admin — search bar completa com placeholder visível */}
    <header
      role="banner"
      className="flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2 min-h-[52px] sm:min-h-[56px] sm:px-4 md:px-5 lg:px-6 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0 min-w-0 overflow-x-hidden"
    >
      {/* Left: hamburger (mobile) + search — mesma estrutura do admin */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 overflow-hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-muted/50 hover:bg-muted border border-border/50 text-foreground cursor-pointer touch-manipulation shrink-0"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-5 h-5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={openSearch}
          className="flex-1 min-w-0 max-w-72 min-h-[44px] h-11 sm:h-10 sm:min-h-0 flex items-center gap-2 pl-3.5 pr-2 sm:pr-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:bg-muted/80 hover:border-border transition-all cursor-pointer touch-manipulation overflow-hidden"
          aria-label="Pesquisar"
          title="Pesquisar (Ctrl+K)"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left truncate">Pesquisar...</span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
            {mounted && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>
      </div>

      {/* Right side - Team badge, Model selector, CRM, Bug, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Equipa do utilizador - à esquerda do seletor de modelos */}
        {!isAdminRoute && myTeam && (
          <Badge
            variant="secondary"
            className="gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-xs border border-violet-200 dark:border-violet-800/80 bg-violet-500/15 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 shrink-0"
            title={`Equipa: ${myTeam.name}`}
          >
            <UsersRound className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span className="max-w-[120px] sm:max-w-[160px] truncate">{myTeam.name}</span>
          </Badge>
        )}
        {/* Model Selector - only show for users (not admins) */}
        {!isAdminRoute && <ModelSelector />}

        {/* CRM MyCredit - só ícone em mobile */}
        {!isAdminRoute && (
          <a
            href={import.meta.env.VITE_CRM_MYCREDIT_URL || 'https://crm.my-credit.pt/'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center shrink-0 w-10 h-10 sm:w-auto sm:min-h-0 sm:px-3 sm:py-2 min-h-[44px] rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs transition-colors cursor-pointer shadow-sm touch-manipulation"
            title="CRM MyCredit"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline ml-1">CRM MyCredit</span>
          </a>
        )}

        {/* Report bug */}
        <button
          type="button"
          title="Reportar um problema"
          aria-label="Reportar um problema ou bug"
          onClick={() => setReportBugOpen(true)}
          className="relative flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px] sm:min-w-9 sm:min-h-9 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer touch-manipulation"
        >
          <Bug className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Notifications - contexto: admin = bugs; user = comissões pagas */}
        <NotificationsDropdown />

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-3 pr-2 py-2 min-h-[44px] sm:min-h-0 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer touch-manipulation shrink-0">
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
    </header>

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
      <PageAnimation key="/admin" className="flex-1 min-w-0 h-full flex overflow-hidden">
        {children}
      </PageAnimation>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <TopBar />

      {/* Main: mobile-first padding; generous spacing from 320px up */}
      <main className="flex-1 overflow-auto overflow-x-hidden p-4 sm:p-5 md:p-6 min-w-0" role="main">
        <div className="max-w-[1600px] mx-auto w-full min-w-0">
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

  // Fechar drawer ao mudar de rota (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      <SupportChatProvider>
        {/* Mobile-first outer padding: 12px → 16px → 24px → 32px */}
        <div className="h-screen w-full max-w-full p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-hidden bg-background">
          {/* Floating Dashboard Container — min-height safe for 320px; min-w-0 so flex children can shrink */}
          <div
            id="dashboard-container"
            className="floating-dashboard min-h-[280px] min-w-0 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3rem)] xl:h-[calc(100vh-4rem)] flex overflow-hidden relative w-full"
          >
          {/* Sidebar desktop: visível apenas em md+ */}
          {!isAdminRoute && (
            <div className="hidden md:flex shrink-0">
              <Sidebar />
            </div>
          )}

          {/* Drawer mobile: overlay + painel lateral (apenas user, não admin) */}
          {!isAdminRoute && (
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="fixed left-0 top-0 h-full w-[min(280px,calc(100vw-2rem))] max-w-[280px] sidebar-donezo border-r-0 z-50 flex flex-col md:hidden shadow-xl"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu de navegação"
                  >
                    <div className="relative flex-1 overflow-y-auto overflow-x-hidden touch-manipulation">
                      <Sidebar />
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-3 right-3 z-100 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer touch-manipulation"
                        aria-label="Fechar menu"
                      >
                        <X className="w-5 h-5 pointer-events-none" />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {/* Main Content */}
          <MainContent>{children}</MainContent>
          </div>
          <SupportChatPanel />
        </div>
      </SupportChatProvider>
    </SidebarBase>
  );
}
