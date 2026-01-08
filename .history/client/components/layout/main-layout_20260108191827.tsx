import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" style={{ backgroundColor: '#F5F5F7' }}>
      <Sidebar />
      <div className="ml-32 pt-16">
        <Topbar />
        <main className="px-10 py-10 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
