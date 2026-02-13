import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  Sparkles,
  FileText,
  Layers,
  BookOpen,
  Zap,
  BarChart3,
  ArrowDownUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SearchItem {
  id: string | number;
  title: string;
  description?: string;
  tags?: string[];
  category?: 'horizon' | 'knowledge' | 'actions' | 'reports';
  timestamp?: string;
  icon?: React.ReactNode;
}

export type FilterType =
  | 'all'
  | 'horizon'
  | 'knowledge'
  | 'actions'
  | 'reports';
export type SortType = 'relevant' | 'recent' | 'alphabetical';

interface SearchBarProps {
  data: SearchItem[];
  placeholder?: string;
  onSelect?: (item: SearchItem) => void;
  emptyMessage?: string;
  onAskAI?: (query: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const filterConfig: Record<FilterType, { icon: typeof Layers; label: string }> =
  {
    all: { icon: Layers, label: 'Todos' },
    horizon: { icon: Layers, label: 'Páginas' },
    knowledge: { icon: BookOpen, label: 'Conhecimento' },
    actions: { icon: Zap, label: 'Ações' },
    reports: { icon: BarChart3, label: 'Relatórios' },
  };

const sortConfig: Record<SortType, string> = {
  relevant: 'Mais Relevante',
  recent: 'Mais Recente',
  alphabetical: 'A-Z',
};

export function SearchBar({
  data,
  placeholder = 'Pesquisar...',
  onSelect,
  emptyMessage = 'Sem resultados',
  onAskAI,
  isOpen = false,
  onOpenChange,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('relevant');
  const [filteredData, setFilteredData] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter and sort
  useEffect(() => {
    let results = [...data];

    if (activeFilter !== 'all') {
      results = results.filter((item) => item.category === activeFilter);
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      );
    }

    if (sortBy === 'alphabetical') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'recent') {
      results.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.localeCompare(a.timestamp);
      });
    }

    setFilteredData(results);
    setSelectedIndex(0);
  }, [query, activeFilter, sortBy, data]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredData.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredData[selectedIndex]) {
            handleSelect(filteredData[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredData, selectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    if (resultsRef.current) {
      const el = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      onSelect?.(item);
      handleClose();
    },
    [onSelect],
  );

  const handleClose = () => {
    setQuery('');
    setActiveFilter('all');
    setSelectedIndex(0);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const getCategoryCount = (category: FilterType) => {
    if (category === 'all') return data.length;
    return data.filter((item) => item.category === category).length;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'horizon':
        return <Layers className="w-4 h-4 text-purple-500" />;
      case 'knowledge':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'actions':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'reports':
        return <BarChart3 className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi',
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;
    return date.toLocaleDateString('pt-PT');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Search Modal */}
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[75vh] z-[101] animate-in slide-in-from-top-2 fade-in duration-200">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
          {/* Search Header */}
          <div className="border-b border-border/40 shrink-0">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  Limpar
                </button>
              )}
              {onAskAI && query && (
                <button
                  onClick={() => {
                    onAskAI(query);
                    handleClose();
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI &ldquo;{query.slice(0, 12)}
                  {query.length > 12 ? '...' : ''}&rdquo;
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Filters */}
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1.5 px-5 pb-3 w-max min-w-full">
                {(Object.keys(filterConfig) as FilterType[]).map((filter) => {
                  const config = filterConfig[filter];
                  const Icon = config.icon;
                  const count = getCategoryCount(filter);

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                        activeFilter === filter
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                      {count > 0 && (
                        <span className="opacity-60 text-[10px]">{count}</span>
                      )}
                    </button>
                  );
                })}
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      const sorts: SortType[] = [
                        'relevant',
                        'recent',
                        'alphabetical',
                      ];
                      const idx = sorts.indexOf(sortBy);
                      setSortBy(sorts[(idx + 1) % sorts.length]);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowDownUp className="w-3 h-3" />
                    {sortConfig[sortBy]}
                  </button>
                </div>
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>

          {/* Results */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div ref={resultsRef} className="p-2">
              {query && filteredData.length > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                  {activeFilter === 'all'
                    ? 'Resultados'
                    : filterConfig[activeFilter].label}{' '}
                  ({filteredData.length})
                </div>
              )}

              {filteredData.length > 0 ? (
                <div className="space-y-0.5">
                  {filteredData.map((item, index) => (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                        selectedIndex === index
                          ? 'bg-muted text-foreground'
                          : 'hover:bg-muted',
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.icon || getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm leading-tight">
                            {highlightMatch(item.title)}
                          </h3>
                          {item.timestamp && (
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {highlightMatch(item.description)}
                          </p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 font-medium bg-primary/10 text-primary border border-primary/20 dark:bg-primary/25 dark:text-red-300 dark:border-primary/40"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 font-medium border-primary/30 text-muted-foreground dark:border-primary/40 dark:text-red-200/90"
                              >
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {query
                      ? `${emptyMessage} para "${query}"`
                      : 'Comece a escrever para pesquisar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {query
                      ? 'Tente ajustar os termos de pesquisa'
                      : 'Pesquise em todas as páginas e funcionalidades'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer - keyboard shortcuts */}
          <div className="border-t border-border/40 bg-muted/30 px-5 py-2.5 shrink-0">
            <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  ↓
                </kbd>
                <span>Navegar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  ↵
                </kbd>
                <span>Selecionar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  esc
                </kbd>
                <span>Fechar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
