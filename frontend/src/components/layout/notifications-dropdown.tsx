import { useState, useEffect, useCallback } from 'react';
import { Bell, Bug, Euro, ArrowRight, Loader2, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { Link } from 'react-router-dom';

type NotificationPayload =
  | {
      kind: 'admin';
      unreadBugsCount: number;
      recentBugs: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        reporter: { name: string | null; email: string };
      }>;
    }
  | {
      kind: 'user';
      commissionsPaidCount: number;
      recentCommissions: Array<{
        id: string;
        submittedAt: string;
        templateTitle: string;
      }>;
    };

const STORAGE_KEY = 'notifications_commissions_seen_count';

function getStoredSeenCount(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = parseInt(v ?? '', 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  } catch {
    return 0;
  }
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffM < 1) return 'Agora';
  if (diffM < 60) return `Há ${diffM}min`;
  if (diffH < 24) return `Há ${diffH}h`;
  if (diffD < 7) return `Há ${diffD}d`;
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastSeenCommissionsCount, setLastSeenCommissionsCount] = useState(0);

  useEffect(() => {
    setLastSeenCommissionsCount(getStoredSeenCount());
  }, []);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    apiClient.notifications
      .get()
      .then((res: NotificationPayload) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const count = data
    ? data.kind === 'admin'
      ? data.unreadBugsCount
      : Math.max(0, data.commissionsPaidCount - lastSeenCommissionsCount)
    : 0;
  const showBadge = count > 0;

  const handleClear = useCallback(() => {
    if (!data || count === 0) return;
    if (data.kind === 'admin') {
      setClearing(true);
      const markAllRead = (data.recentBugs || []).map((b) =>
        apiClient.tickets.update(b.id, { readAt: true }),
      );
      Promise.all(markAllRead)
        .then(() => fetchNotifications())
        .finally(() => setClearing(false));
    } else {
      const newSeen = data.commissionsPaidCount;
      setLastSeenCommissionsCount(newSeen);
      try {
        localStorage.setItem(STORAGE_KEY, String(newSeen));
      } catch {
        // ignore storage errors
      }
    }
  }, [data, count, fetchNotifications]);

  const subtitle = data
    ? data.kind === 'admin'
      ? count === 0
        ? 'Reportes dos utilizadores'
        : `${count} por ler`
      : data.kind === 'user'
        ? count === 0
          ? 'Comissões pagas'
          : `${count} comissões`
        : ''
    : loading
      ? 'A carregar...'
      : '';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {showBadge && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ring-2 ring-background',
                count > 99 && 'px-1',
              )}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 rounded-xl border shadow-lg overflow-hidden"
        sideOffset={6}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Notificações
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {showBadge && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={handleClear}
                  disabled={clearing}
                  aria-label="Limpar notificações"
                  title="Limpar notificações"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
              {showBadge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[min(70vh,380px)] overflow-y-auto">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">A carregar...</p>
            </div>
          ) : data?.kind === 'admin' ? (
            <>
              {data.recentBugs.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhum reporte novo
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {data.recentBugs.map((b) => (
                    <li key={b.id}>
                      <Link
                        to="/admin/tickets"
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70"
                      >
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <Bug className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {b.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {b.reporter?.name || b.reporter?.email}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {formatTimeAgo(b.createdAt)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="p-3 border-t bg-muted/20">
                <Link
                  to="/admin/tickets"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-primary hover:text-primary/90 transition-colors"
                >
                  Ver todos no painel Admin
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          ) : data?.kind === 'user' ? (
            <>
              {data.recentCommissions.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Euro className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sem comissões pagas
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {data.recentCommissions.map((c) => (
                    <li key={c.id}>
                      <div className="flex gap-3 px-5 py-3.5">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Euro className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Comissão paga
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.templateTitle}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {formatTimeAgo(c.submittedAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {data.commissionsPaidCount > 0 && (
                <div className="px-5 py-3 border-t bg-muted/20">
                  <p className="text-xs text-muted-foreground text-center">
                    Total: {data.commissionsPaidCount} comissões pagas
                  </p>
                </div>
              )}
            </>
          ) : !data ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar
              </p>
            </div>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
