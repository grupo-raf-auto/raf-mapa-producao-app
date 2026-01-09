'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Search,
  FileStack,
  Brain,
  LogOut,
} from 'lucide-react';
import { SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navigation = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
    ),
  },
  {
    label: 'Consultas',
    href: '/consultas',
    icon: (
      <Search className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
    ),
  },
  {
    label: 'Templates',
    href: '/templates',
    icon: (
      <FileStack className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
    ),
  },
  {
    label: 'MySabichão',
    href: '/mysabichao',
    icon: (
      <Brain className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
    ),
  },
  {
    label: 'Sair',
    href: '/logout',
    icon: (
      <LogOut className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
    ),
  },
];

const Logo = () => {
  const { open } = useSidebar();
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{
          opacity: open ? 1 : 0,
          display: open ? 'inline-block' : 'none',
        }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        RAF Mapa
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
    </Link>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <SidebarBody className="justify-between gap-10">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className={cn(
            'mt-4 mb-12 flex items-center',
            open ? 'justify-start' : 'justify-center'
          )}
        >
          {open ? <Logo /> : <LogoIcon />}
        </div>
        <div className={cn('flex flex-col', open ? 'gap-2' : 'gap-3')}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarLink
                key={item.label}
                link={item}
                className={cn(
                  'rounded-lg py-2.5 flex items-center justify-center md:justify-start group transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-800',
                  open ? 'px-4' : 'px-4',
                  isActive && ' text-primary font-medium'
                )}
              />
            );
          })}
        </div>
      </div>
      <div className="pb-4">
        <SidebarLink
          link={{
            label: 'Usuário',
            href: '#',
            icon: (
              <div
                className={cn(
                  'h-7 w-7 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500 flex items-center justify-center text-white font-semibold text-xs',
                  !open && 'mx-auto'
                )}
              >
                <span className="leading-none flex items-center justify-center w-full h-full">
                  U
                </span>
              </div>
            ),
          }}
          className={cn(
            'rounded-lg py-2.5 flex items-center group transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-800',
            open ? 'justify-start px-3' : 'justify-center px-0'
          )}
        />
      </div>
    </SidebarBody>
  );
}
