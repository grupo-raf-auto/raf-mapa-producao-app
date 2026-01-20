'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { SupportChatFab } from '@/components/support/support-chat-fab';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase, SIDEBAR_WIDTH_OPEN } from '@/components/ui/sidebar';
import { AdminButton } from './admin-button';

function MainContent({ children, showSidebar }: { children: React.ReactNode; showSidebar: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen bg-background"
      style={{ marginLeft: showSidebar ? SIDEBAR_WIDTH_OPEN : 0 }}
    >
      <main className="px-6 md:px-10 lg:px-12 py-8 max-w-[1400px] mx-auto">
        <AdminButton />
        <PageAnimation key={pathname}>{children}</PageAnimation>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';
  const showSidebar = !isAdminPage;

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      <div className="min-h-screen bg-background">
        {showSidebar && <Sidebar />}
        <MainContent showSidebar={showSidebar}>{children}</MainContent>
        <SupportChatFab />
      </div>
    </SidebarBase>
  );
}
