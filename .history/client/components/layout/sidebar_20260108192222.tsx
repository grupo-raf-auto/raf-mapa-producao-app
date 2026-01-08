'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, FileStack } from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Consultas', href: '/consultas', icon: Search },
  { name: 'Templates', href: '/templates', icon: FileStack },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-42 h-screen fixed top-0 flex items-center justify-center py-8 ml-24 overflow-visible z-50"
      style={{ backgroundColor: '#F5F5F7', left: 0 }}
    >
      <Dock
        orientation="vertical"
        magnification={72}
        distance={120}
        panelHeight={64}
        className="w-full px-3"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full flex justify-center"
              aria-label={item.name}
            >
              <DockItem
                className={cn(
                  'aspect-square rounded-full transition-all duration-200 cursor-pointer border-2',
                  isActive
                    ? 'bg-primary shadow-sm border-primary'
                    : 'bg-white hover:bg-gray-100 border-gray-200'
                )}
              >
                <DockLabel>{item.name}</DockLabel>
                <DockIcon>
                  <Icon
                    className={cn(
                      'h-full w-full',
                      isActive ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  />
                </DockIcon>
              </DockItem>
            </Link>
          );
        })}
      </Dock>
    </aside>
  );
}
