import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { RetroGrid } from '@/components/ui/retro-grid';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <RetroGrid className="fixed inset-0 -z-10" />
      <Sidebar />
      <div className="ml-32 pt-16 relative z-10">
        <Topbar />
        <main className="px-10 py-16 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
