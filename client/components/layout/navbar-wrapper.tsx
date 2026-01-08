'use client';

import { NavBar } from '@/components/ui/tubelight-navbar';
import { LayoutDashboard, Search, FileStack } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', url: '/', icon: LayoutDashboard },
  { name: 'Consultas', url: '/consultas', icon: Search },
  { name: 'Templates', url: '/templates', icon: FileStack },
];

export function NavbarWrapper() {
  return <NavBar items={navigation} />;
}
