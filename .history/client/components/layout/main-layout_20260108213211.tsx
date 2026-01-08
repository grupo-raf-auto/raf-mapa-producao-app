import { NavbarWrapper } from './navbar-wrapper';
import { RetroGrid } from '@/components/ui/retro-grid';
import { PageAnimation } from '@/components/ui/page-animation';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <RetroGrid className="fixed inset-0 -z-10" />
      <NavbarWrapper />
      <div className="pt-20 sm:pt-24 pb-20 sm:pb-0 relative z-20">
        <main className="px-12 md:px-16 lg:px-20 py-16 max-w-[1600px] mx-auto">
          <PageAnimation>{children}</PageAnimation>
        </main>
      </div>
    </div>
  );
}
