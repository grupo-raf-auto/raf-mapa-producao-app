import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" style={{ backgroundColor: '#F6F7F9' }}>
      <Sidebar />
      <div className="ml-64 pt-16">
        <Topbar />
        <main className="px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
