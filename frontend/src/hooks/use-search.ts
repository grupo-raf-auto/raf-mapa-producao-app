import { useState, useEffect } from "react";

interface UseSearchProps {
  enabled?: boolean;
  shortcut?: string; // Default: 'k' (with Ctrl/Cmd)
}

/**
 * Hook para gerenciar o estado da SearchBar com atalho de teclado global
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, open, close, toggle } = useSearch({ enabled: true });
 *
 *   return (
 *     <SearchBar
 *       data={data}
 *       isOpen={isOpen}
 *       onOpenChange={(open) => open ? open() : close()}
 *     />
 *   );
 * }
 * ```
 */
export function useSearch({ enabled = true, shortcut = "k" }: UseSearchProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcut) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcut]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}
