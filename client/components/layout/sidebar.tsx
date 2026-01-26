'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Search, FileStack, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';

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

  const displayName =
    user?.name ||
    (user as { firstName?: string })?.firstName ||
    user?.email?.split('@')[0] ||
    'Utilizador';
  const initial = (displayName as string)?.[0]?.toUpperCase() || 'U';
  const userEmail = user?.email || '';

  return (
    <div className="w-[260px] flex-shrink-0 glass-sidebar flex flex-col relative overflow-hidden">
      {/* Decorative glass shapes */}
      <div className="glass-shape glass-shape-1" />
      <div className="glass-shape glass-shape-2" />

      <div className="flex flex-col h-full relative z-10">
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4 py-4">
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-auto">
              <Image
                src="/logo-raf.png"
                alt="MYCREDIT - Intermediários de Crédito"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          {/* Main Navigation */}
          <nav className="space-y-2 px-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
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
                    'sidebar-nav-link flex items-center gap-3 rounded-xl font-medium px-4 py-3.5',
                    isActive
                      ? 'active text-white'
                      : 'text-muted-foreground hover:text-foreground',
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
          <div className="mt-auto border-t border-white/10 px-4 py-5">
            <div className="flex items-center gap-3.5">
              {/* Avatar */}
              <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-primary/20 text-sm">
                {initial}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
