'use client';

import { useState } from 'react';
import { NavbarWrapper } from './navbar-wrapper';
import { Sidebar } from './sidebar';
import { RetroGrid } from '@/components/ui/retro-grid';
import { PageAnimation } from '@/components/ui/page-animation';
import { Sidebar as SidebarBase, useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';

function MainContent({ children }: { children: React.ReactNode }) {
  const { open, animate } = useSidebar();

  return (
    <motion.div
      className="pt-16 sm:pt-20 pb-20 sm:pb-0 relative z-20 md:ml-[300px] transition-all duration-300"
      animate={{
        marginLeft: animate ? (open ? '300px' : '80px') : '300px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <main className="px-12 md:px-16 lg:px-20 py-16 max-w-[1600px] mx-auto">
        <PageAnimation>{children}</PageAnimation>
      </main>
    </motion.div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarBase open={sidebarOpen} setOpen={setSidebarOpen}>
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <RetroGrid className="fixed inset-0 -z-10" />
        <Sidebar />
        <NavbarWrapper />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarBase>
  );
}
