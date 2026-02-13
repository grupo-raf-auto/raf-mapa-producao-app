import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Euro } from 'lucide-react';

interface ByUserEntry {
  userId: string;
  name: string;
  count: number;
  totalValue: number;
  averageValue?: number;
}

interface SalesStats {
  byUser?: ByUserEntry[];
  averageValue?: number;
}

const RANK_STYLES = [
  'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  'bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function TicketMedioAgenteCard() {
  const [data, setData] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient.submissions
      .getStats({ detailed: true, scope: 'all' })
      .then((raw) => {
        if (cancelled) return;
        const stats = raw?.data ?? raw;
        setData(stats);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Card className="rounded-xl border border-border/60 overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Euro className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ticket Médio por Agente</h3>
              <p className="text-xs text-muted-foreground">Top 5 por valor médio</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="flex items-center justify-center py-8">
            <Spinner variant="bars" className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const byUser = data?.byUser ?? [];
  const top5 = [...byUser]
    .filter((u) => u.count > 0)
    .map((u) => ({
      ...u,
      avg: u.averageValue ?? (u.count > 0 ? u.totalValue / u.count : 0),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <Card className="rounded-xl border border-border/60 overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Euro className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ticket Médio por Agente</h3>
            <p className="text-xs text-muted-foreground">Top 5 por valor médio</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
        {top5.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem dados de ticket médio disponíveis.
          </p>
        ) : (
        <ul className="space-y-2">
          {top5.map((user, index) => {
            const rank = index + 1;
            const rankStyle = RANK_STYLES[index] ?? RANK_STYLES[5];
            const displayName = user.name || user.userId || 'Agente';
            return (
              <li
                key={user.userId}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankStyle}`}
                >
                  {rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.count} {user.count === 1 ? 'operação' : 'operações'}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(user.avg)}
                </span>
              </li>
            );
          })}
        </ul>
        )}
      </CardContent>
    </Card>
  );
}
