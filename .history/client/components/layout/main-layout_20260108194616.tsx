import { Sidebar } from './sidebar';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { RetroGrid } from '@/components/ui/retro-grid';
import { LayoutDashboard, Search, FileStack } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', url: '/', icon: LayoutDashboard },
  { name: 'Consultas', url: '/consultas', icon: Search },
  { name: 'Templates', url: '/templates', icon: FileStack },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <RetroGrid className="fixed inset-0 -z-10" />
      <NavBar items={navigation} />
      <Sidebar />
      <div className="ml-32 pt-20 sm:pt-24 pb-20 sm:pb-0 relative z-10">
        <main className="px-10 py-16 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
