'use client';

import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border fixed top-0 left-64 right-0 z-10 flex items-center px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar..."
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
