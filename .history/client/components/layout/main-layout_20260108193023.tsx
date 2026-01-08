import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BGPattern } from '@/components/ui/bg-pattern';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <BGPattern
        variant="dots"
        mask="fade-center"
        size={20}
        fill="rgba(0, 0, 0, 0.2)"
        className="fixed inset-0"
      />
      <Sidebar />
      <div className="ml-32 pt-16 relative z-10">
        <Topbar />
        <main className="px-10 py-16 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
