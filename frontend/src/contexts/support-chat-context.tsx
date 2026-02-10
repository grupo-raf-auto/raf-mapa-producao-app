import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SupportChatContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openChat: () => void;
  closeChat: () => void;
}

const SupportChatContext = createContext<SupportChatContextValue | null>(null);

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);

  return (
    <SupportChatContext.Provider value={{ open, setOpen, openChat, closeChat }}>
      {children}
    </SupportChatContext.Provider>
  );
}

export function useSupportChat() {
  const ctx = useContext(SupportChatContext);
  if (!ctx) return null;
  return ctx;
}
