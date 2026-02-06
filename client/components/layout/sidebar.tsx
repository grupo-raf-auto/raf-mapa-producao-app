'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Search,
  FileStack,
  Brain,
  FileCheck,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarSupportChat } from './sidebar-support-chat';

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
];

// Ferramentas inteligentes
const intelligentTools = [
  {
    label: 'MyScanner',
    href: '/scanner',
    icon: FileCheck,
    description: 'Análise de fraudes em documentos',
  },
  {
    label: 'MySabichão',
    href: '/mysabichao',
    icon: Brain,
    description: 'Assistente IA',
  },
];

// General menu items
const generalNavigation = [
  {
    label: 'Definições',
    href: '/settings',
    icon: Settings,
    description: 'Configurações da conta',
  },
  {
    label: 'Ajuda',
    href: '/help',
    icon: HelpCircle,
    description: 'Centro de ajuda',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] flex-shrink-0 sidebar-donezo flex flex-col relative overflow-hidden">
      <div className="flex flex-col h-full relative z-10">
        {/* Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
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

        {/* User Badge - Top */}
        <div className="px-4 pt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Painel Utilizador</p>
                <p className="text-[11px] text-white/60">Mapa de Produção</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          {/* Main Navigation */}
          <nav className="space-y-1 px-4">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-3">
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

          {/* Intelligent Tools Section */}
          <nav className="space-y-1 px-4 mt-8">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-3">
              Ferramentas
            </p>
            {intelligentTools.map((item) => {
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

          {/* General Section */}
          <nav className="space-y-1 px-4 mt-8">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-3">
              Geral
            </p>
            {generalNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
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
