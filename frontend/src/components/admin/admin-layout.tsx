import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/router-compat';
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

function AdminTopBar() {
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
    <div className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={openSearch}
          className="w-72 h-10 flex items-center gap-2 pl-3.5 pr-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:bg-muted/80 hover:border-border transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Pesquisar no painel...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
            {mounted && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Reportar um problema"
          aria-label="Reportar um problema ou bug"
          onClick={() => setReportBugOpen(true)}
          className="relative p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        >
          <Bug className="w-5 h-5 text-muted-foreground" />
        </button>
        <NotificationsDropdown />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
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
    </div>

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
  return (
    <>
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-auto p-6 min-h-0">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </>
  );
}
