'use client';

import { cn } from '@/lib/utils';
import { Link, type LinkProps } from '@/lib/router-compat';
import React, { useState, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Image } from '@/lib/router-compat';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<'div'>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

// Larguras fixas para a sidebar
const SIDEBAR_WIDTH_OPEN = 260;
const SIDEBAR_WIDTH_CLOSED = 72;

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn(
        'h-screen hidden md:flex md:flex-col fixed left-0 top-0 z-40 overflow-hidden',
        className,
      )}
      style={{ width: SIDEBAR_WIDTH_OPEN }}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          'h-16 px-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-border w-full fixed top-0 left-0 z-40',
        )}
        {...props}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="relative h-8 w-auto">
            <Image
              src="/logo-raf.png"
              alt="MYCREDIT - Intermediários de Crédito"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2.5 hover:bg-primary/10 rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'fixed left-0 top-0 h-full w-[280px] bg-sidebar border-r border-border z-50 flex flex-col md:hidden shadow-lg',
                className,
              )}
            >
              <button
                className="absolute right-4 top-5 p-2 hover:bg-primary/10 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={link.href}
      className={cn('flex items-center gap-3 transition-colors', className)}
      {...props}
    >
      <span className="shrink-0">{link.icon}</span>
      <AnimatePresence mode="wait">
        {(open || !animate) && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm whitespace-nowrap overflow-hidden"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export { SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED };
