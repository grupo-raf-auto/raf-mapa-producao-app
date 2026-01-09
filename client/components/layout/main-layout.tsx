'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { AdminButton } from './admin-button';
import { RetroGrid } from '@/components/ui/retro-grid';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase, useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';

function MainContent({ children, showSidebar }: { children: React.ReactNode; showSidebar: boolean }) {
  const { open, animate } = useSidebar();
  const pathname = usePathname();

  return (
    <motion.div
      className="pt-8 pb-20 sm:pb-0 relative z-20 transition-all duration-300"
      animate={{
        marginLeft: showSidebar ? (animate ? (open ? '300px' : '80px') : '300px') : '0',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <main className="px-12 md:px-16 lg:px-20 py-16 max-w-[1600px] mx-auto">
        <PageAnimation key={pathname}>{children}</PageAnimation>
      </main>
    </motion.div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';
  const showSidebar = !isAdminPage;

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <RetroGrid className="fixed inset-0 -z-10" />
        <AdminButton />
        {showSidebar && <Sidebar />}
        <MainContent showSidebar={showSidebar}>{children}</MainContent>
      </div>
    </SidebarBase>
  );
}
