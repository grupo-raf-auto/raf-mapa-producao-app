import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/lib/router-compat';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from './admin-sidebar';
import { ReportBugDialog } from '@/components/layout/report-bug-dialog';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown';
import { useSession, authClient } from '@/lib/auth-client';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchBar, type SearchItem } from '@/components/ui/search-bar';
import { useSearch } from '@/hooks/use-search';
import {
  Search,
  Bug,
  ChevronDown,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  LayoutGrid,
  Menu,
  X,
} from 'lucide-react';

// Dados de pesquisa apenas do contexto admin (secções do painel + ações)
const adminSearchData: SearchItem[] = [
  {
    id: 'admin/users',
    title: 'Utilizadores',
    description: 'Gerir utilizadores, aprovar contas e modelos',
    category: 'horizon',
    tags: ['Utilizadores', 'Contas', 'Aprovação'],
  },
  {
    id: 'admin/consultas',
    title: 'Consultas',
    description: 'Todas as submissões da plataforma',
    category: 'reports',
    tags: ['Consultas', 'Submissões', 'Filtros'],
  },
  {
    id: 'admin/equipas',
    title: 'Equipas',
    description: 'Gerir equipas e ver desempenho global',
    category: 'horizon',
    tags: ['Equipas', 'Ranking'],
  },
  {
    id: 'admin/performance',
    title: 'Desempenho',
    description: 'Métricas e análise de performance',
    category: 'reports',
    tags: ['Desempenho', 'Métricas', 'Estatísticas'],
  },
  {
    id: 'admin/templates',
    title: 'Templates',
    description: 'Criar e gerir templates de formulários',
    category: 'horizon',
    tags: ['Templates', 'Formulários'],
  },
  {
    id: 'admin/documents',
    title: 'Ficheiros',
    description: 'Documentos carregados pelos utilizadores',
    category: 'horizon',
    tags: ['Ficheiros', 'Documentos'],
  },
  {
    id: 'admin/tickets',
    title: 'Tickets de Suporte',
    description: 'Pedidos de problema e acompanhamento',
    category: 'actions',
    tags: ['Tickets', 'Suporte', 'Bugs'],
  },
  {
    id: 'admin/definicoes',
    title: 'Definições',
    description: 'Configurações da conta',
    category: 'horizon',
    tags: ['Definições', 'Configuração'],
  },
  {
    id: 'admin/ajuda',
    title: 'Ajuda',
    description: 'Centro de ajuda e FAQ',
    category: 'horizon',
    tags: ['Ajuda', 'FAQ'],
  },
  {
    id: 'action-report-bug',
    title: 'Reportar Bug',
    description: 'Reportar um problema no sistema',
    category: 'actions',
    tags: ['Bug', 'Suporte'],
  },
  {
    id: 'action-theme',
    title: 'Alternar Tema',
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

function AdminTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isOpen: isSearchOpen, open: openSearch, setIsOpen: setSearchOpen } = useSearch({
    enabled: true,
    shortcut: 'k',
  });

  useEffect(() => {
    // Intentional: set mounted for client-only rendering (theme, search) to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount guard
    setMounted(true);
  }, []);

  const handleSearchSelect = (item: SearchItem) => {
    const id = String(item.id);
    if (id === 'action-report-bug') {
      setReportBugOpen(true);
      setSearchOpen(false);
      return;
    }
    if (id === 'action-theme') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      setSearchOpen(false);
      return;
    }
    if (id === 'action-signout') {
      setSearchOpen(false);
      handleSignOut();
      return;
    }
    if (id.startsWith('admin/')) {
      router.push(`/${id}`);
      setSearchOpen(false);
    }
  };

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
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
    <header
      role="banner"
      className="flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2 min-h-[52px] sm:min-h-[56px] sm:px-4 md:px-5 lg:px-6 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0 min-w-0 overflow-x-hidden"
    >
      <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1 overflow-hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-muted/50 hover:bg-muted border border-border/50 text-foreground cursor-pointer touch-manipulation shrink-0"
          aria-label="Abrir menu do painel"
        >
          <Menu className="w-5 h-5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={openSearch}
          className="w-full max-w-56 min-w-0 min-h-[44px] h-9 sm:h-8 sm:min-h-0 flex items-center gap-1.5 sm:gap-2 pl-2.5 pr-2 sm:pl-3 sm:pr-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:bg-muted/80 hover:border-border transition-all cursor-pointer touch-manipulation overflow-hidden"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left truncate">Pesquisar no painel...</span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
            {mounted && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <a
          href={import.meta.env.VITE_CRM_MYCREDIT_URL || 'https://crm.my-credit.pt/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs transition-colors cursor-pointer shadow-sm touch-manipulation"
          title="CRM MyCredit"
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">CRM MyCredit</span>
        </a>
        <button
          type="button"
          title="Reportar um problema"
          aria-label="Reportar um problema ou bug"
          onClick={() => setReportBugOpen(true)}
          className="relative flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-9 sm:min-h-9 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer touch-manipulation"
        >
          <Bug className="w-5 h-5 text-muted-foreground" />
        </button>
        <NotificationsDropdown />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 pr-2 py-2 min-h-[44px] sm:min-h-0 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer touch-manipulation">
                <Avatar className="w-9 h-9 shadow-lg">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>
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
                {resolvedTheme === 'dark' ? (
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
                onClick={() => router.push('/admin/definicoes')}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Definições
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/admin/ajuda')}
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

    <SearchBar
      data={adminSearchData}
      placeholder="Pesquisar secções do painel..."
      onSelect={handleSearchSelect}
      isOpen={isSearchOpen}
      onOpenChange={setSearchOpen}
      emptyMessage="Nenhuma secção encontrada"
    />
    </>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Sidebar desktop: visível apenas em md+ */}
      <div className="hidden md:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Drawer mobile admin */}
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
              aria-label="Menu do painel administrativo"
            >
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden touch-manipulation">
                <AdminSidebar />
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

      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <AdminTopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto overflow-x-hidden px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-5 md:py-6 min-h-0 min-w-0" role="main">
          <div className="max-w-[1600px] mx-auto w-full min-w-0">{children}</div>
        </main>
      </div>
    </>
  );
}
