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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] h-full flex-shrink-0 sidebar-donezo flex flex-col relative overflow-hidden">
      <div className="flex flex-col h-full relative z-10">
        {/* Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link
            to="/admin"
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Image
                src="/logo-raf-favicon.png"
                alt="RAF"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Grupo RAF
            </span>
          </Link>
        </div>

        {/* Admin Badge - Top */}
        <div className="px-4 pt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Painel Admin</p>
                <p className="text-[11px] text-white/60">Acesso completo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          {/* Admin Navigation */}
          <nav className="space-y-1 px-4">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-3">
              Administração
            </p>
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
                    'w-full flex items-center gap-3 rounded-xl font-medium px-4 py-3 cursor-pointer transition-all duration-200',
                    isActive
                      ? 'bg-white text-red-900 shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="shrink-0 h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* General Section */}
          <nav className="space-y-1 px-4 mt-8">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-3">
              Geral
            </p>
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
                    'flex items-center gap-3 rounded-xl font-medium px-4 py-3 cursor-pointer transition-all duration-200',
                    isActive
                      ? 'bg-white text-red-900 shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="shrink-0 h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Chat */}
        <SidebarSupportChat />
      </div>
    </div>
  );
}
