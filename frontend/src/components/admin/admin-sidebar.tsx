import { usePathname, Link, Image } from '@/lib/router-compat';
import {
  Search,
  TrendingUp,
  FileStack,
  FileText,
  Ticket,
  Settings,
  HelpCircle,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarSupportChat } from '@/components/layout/sidebar-support-chat';

// Admin navigation — each item maps to /admin/{tab}
const adminNavigation = [
  {
    label: 'Utilizadores',
    tab: 'users',
    icon: Users,
    description: 'Gestão de utilizadores',
  },
  {
    label: 'Consultas',
    tab: 'consultas',
    icon: Search,
    description: 'Todas as consultas',
  },
  {
    label: 'Desempenho',
    tab: 'performance',
    icon: TrendingUp,
    description: 'Métricas e análise',
  },
  {
    label: 'Templates',
    tab: 'templates',
    icon: FileStack,
    description: 'Gestão de templates',
  },
  {
    label: 'Ficheiros',
    tab: 'documents',
    icon: FileText,
    description: 'Documentos do sistema',
  },
  {
    label: 'Tickets',
    tab: 'tickets',
    icon: Ticket,
    description: 'Suporte e tickets',
  },
];

// General menu items
const generalNavigation = [
  {
    label: 'Definições',
    href: '/admin/definicoes',
    icon: Settings,
    description: 'Configurações da conta',
  },
  {
    label: 'Ajuda',
    href: '/admin/ajuda',
    icon: HelpCircle,
    description: 'Centro de ajuda',
  },
];

const navLinkBase =
  'flex items-center gap-3 rounded-xl font-medium px-4 py-3 min-h-[44px] cursor-pointer transition-all duration-200 touch-manipulation';
const sectionLabel =
  'text-xs font-semibold text-white/50 uppercase tracking-wider px-3 mb-3';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-full min-w-[200px] max-w-[220px] lg:min-w-[240px] lg:max-w-[260px] h-full shrink-0 sidebar-donezo flex flex-col relative overflow-hidden"
      aria-label="Navegação do painel administrativo"
    >
      <div className="flex flex-col h-full relative z-10">
        {/* Logo Header — touch-friendly */}
        <div className="flex items-center h-16 sm:h-20 px-4 sm:px-5 border-b border-white/10 shrink-0">
          <Link
            to="/admin"
            className="flex items-center gap-3 min-h-[44px] py-2 -my-2 cursor-pointer rounded-lg active:bg-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Image
                src="/logo-raf-favicon.png"
                alt="RAF"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              Grupo RAF
            </span>
          </Link>
        </div>

        {/* Admin Badge */}
        <div className="px-3 sm:px-4 pt-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">Painel Admin</p>
                <p className="text-xs text-white/60">Acesso completo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation — mobile-first padding and spacing */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6">
          <nav className="space-y-1 px-3 sm:px-4" aria-label="Administração">
            <p className={sectionLabel}>Administração</p>
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const href = `/admin/${item.tab}`;
              const isActive =
                pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={item.tab}
                  to={href}
                  title={item.description}
                  className={cn(
                    'w-full',
                    navLinkBase,
                    isActive
                      ? 'bg-white text-red-900 shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="shrink-0 h-5 w-5" aria-hidden />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <nav className="space-y-1 px-3 sm:px-4 mt-6 sm:mt-8" aria-label="Geral">
            <p className={sectionLabel}>Geral</p>
            {generalNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  title={item.description}
                  className={cn(
                    navLinkBase,
                    isActive
                      ? 'bg-white text-red-900 shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="shrink-0 h-5 w-5" aria-hidden />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <SidebarSupportChat />
      </div>
    </aside>
  );
}
