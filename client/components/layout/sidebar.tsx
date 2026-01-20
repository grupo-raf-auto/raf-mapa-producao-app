'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Search,
  FileStack,
  Brain,
  LogOut,
  Layers,
} from 'lucide-react';
import { SidebarBody } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useSession, authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Navegação principal - visível para todos
const mainNavigation = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Métricas e visão geral',
  },
  {
    label: 'Consultas',
    href: '/consultas',
    icon: Search,
    description: 'Pesquisar dados',
  },
  {
    label: 'Formulários',
    href: '/formularios',
    icon: FileStack,
    description: 'Gestão de formulários',
  },
  {
    label: 'MySabichão',
    href: '/mysabichao',
    icon: Brain,
    description: 'Assistente IA',
  },
];



export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const displayName =
    user?.name ||
    (user as { firstName?: string })?.firstName ||
    user?.email?.split('@')[0] ||
    'Utilizador';
  const initial = (displayName as string)?.[0]?.toUpperCase() || 'U';
  const userEmail = user?.email || '';

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success('Sessão terminada com sucesso');
      router.push('/sign-in');
    } catch {
      toast.error('Erro ao terminar sessão');
    }
  };

  return (
    <SidebarBody className="glass-sidebar">
      {/* Decorative glass shapes */}
      <div className="glass-shape glass-shape-1" />
      <div className="glass-shape glass-shape-2" />

      <div className="flex flex-col h-full relative z-10">
        {/* Logo Header */}
        <div className="h-20 flex items-center px-5 justify-start border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 transition-all">
              <Layers className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title font-bold text-lg text-primary tracking-tight">
                MYCREDIT
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase truncate">
                Intermediários de Crédito
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          {/* Main Navigation */}
          <nav className="space-y-1 px-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Menu
            </p>
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.description}
                  className={cn(
                    'sidebar-nav-link flex items-center gap-3 rounded-xl font-medium px-4 py-3',
                    isActive
                      ? 'active text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="shrink-0 h-5 w-5 transition-all" />
                  <span className="text-sm whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>


        </div>

        {/* User Profile */}
        {user && (
          <div className="mt-auto border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-primary/20 text-sm">
                {initial}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
                title="Terminar sessão"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarBody>
  );
}
