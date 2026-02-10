import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Ticket,
  Bug,
  Mail,
  User,
  CheckCircle2,
  RefreshCw,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';

type TicketStatus = 'open' | 'in_progress' | 'resolved';

interface TicketItem {
  id: string;
  title: string;
  description: string;
  status: string;
  readAt: string | null;
  createdAt: string;
  reportedBy: { id: string; name: string | null; email: string };
}

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em progresso',
  resolved: 'Resolvido',
};

const statusConfig: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  open: {
    label: 'Aberto',
    className:
      'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600/50',
    dotClassName: 'bg-slate-500',
  },
  in_progress: {
    label: 'Em progresso',
    className:
      'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50',
    dotClassName: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolvido',
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/50',
    dotClassName: 'bg-emerald-500',
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: statusLabels[status] ?? status,
    className: 'bg-muted text-muted-foreground border-border',
    dotClassName: 'bg-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums',
        config.className,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dotClassName)}
        aria-hidden
      />
      {config.label}
    </span>
  );
}

export function AdminTicketsContent() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketItem | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: { status?: string; unreadOnly?: boolean } = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (unreadOnly) params.unreadOnly = true;
      const data = await apiClient.tickets.getAll(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar tickets.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, unreadOnly]);

  const openDetail = async (id: string) => {
    try {
      const t = await apiClient.tickets.getById(id);
      const ticket = t as TicketItem;
      setDetailTicket(ticket);
      setDraftStatus(ticket.status);
    } catch {
      toast.error('Erro ao abrir ticket.');
    }
  };

  const handleMarkAsRead = async () => {
    if (!detailTicket) return;
    setMarkingRead(true);
    try {
      await apiClient.tickets.update(detailTicket.id, { readAt: true });
      setDetailTicket((prev) =>
        prev ? { ...prev, readAt: new Date().toISOString() } : null,
      );
      await fetchTickets();
      toast.success('Marcado como lido.');
    } catch {
      toast.error('Erro ao atualizar.');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!detailTicket || draftStatus === null) return;
    if (draftStatus === detailTicket.status) return;
    setSavingStatus(true);
    try {
      await apiClient.tickets.update(detailTicket.id, { status: draftStatus });
      setDetailTicket((prev) => (prev ? { ...prev, status: draftStatus } : null));
      await fetchTickets();
      toast.success('Estado guardado.');
    } catch {
      toast.error('Erro ao guardar estado.');
    } finally {
      setSavingStatus(false);
    }
  };

  const hasStatusChanged =
    detailTicket && draftStatus !== null && draftStatus !== detailTicket.status;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tickets de Suporte"
        description="Acompanhar e responder a pedidos de suporte."
        icon={Ticket}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 sm:gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0 touch-manipulation">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em progresso</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <div
          className={cn(
            'inline-flex rounded-lg border border-border bg-muted/40 p-0.5 w-full sm:w-auto',
          )}
          role="group"
          aria-label="Filtrar por leitura"
        >
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={cn(
              'flex-1 sm:flex-none rounded-md px-3 py-2.5 sm:py-1.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 touch-manipulation',
              !unreadOnly
                ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className={cn(
              'flex-1 sm:flex-none rounded-md px-3 py-2.5 sm:py-1.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 touch-manipulation',
              unreadOnly
                ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            Não lidos
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
          className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          {loading ? (
            <Spinner variant="bars" className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card min-w-0">
        <CardContent className="p-0 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16">
              <Spinner variant="bars" className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">A carregar tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-2xl bg-muted/50 p-5 mb-4">
                <Ticket className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhum ticket encontrado</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Os pedidos de suporte aparecerão aqui.</p>
            </div>
          ) : (
            <>
              {/* Mobile e tablet: lista em cards (até lg) */}
              <div className="lg:hidden divide-y divide-border/60 min-w-0">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openDetail(t.id)}
                    className="w-full text-left px-4 py-4 active:bg-muted/50 transition-colors touch-manipulation min-h-[44px] flex items-center gap-3"
                  >
                    <span className="shrink-0 mt-0.5">
                      {!t.readAt ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" title="Não lido" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground/70" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {t.reportedBy?.name || t.reportedBy?.email || '—'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={t.status} />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {new Date(t.createdAt).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                  </button>
                ))}
              </div>

              {/* Desktop (lg+): tabela com scroll horizontal se necessário */}
              <div className="hidden lg:block overflow-x-auto overscroll-x-contain min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="w-10 py-4 pl-6 font-semibold text-muted-foreground/90 whitespace-nowrap" />
                      <TableHead className="py-4 font-semibold text-muted-foreground/90 whitespace-nowrap">Assunto</TableHead>
                      <TableHead className="py-4 font-semibold text-muted-foreground/90 whitespace-nowrap">Reportado por</TableHead>
                      <TableHead className="py-4 font-semibold text-muted-foreground/90 whitespace-nowrap">Estado</TableHead>
                      <TableHead className="py-4 text-right font-semibold text-muted-foreground/90 whitespace-nowrap">Data</TableHead>
                      <TableHead className="w-14 py-4 pr-6 whitespace-nowrap" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40 active:bg-muted/50"
                        onClick={() => openDetail(t.id)}
                      >
                        <TableCell className="w-10 pl-6 py-3.5">
                          {!t.readAt ? (
                            <span className="inline-flex h-2 w-2 rounded-full bg-primary shrink-0" title="Não lido" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 font-medium text-foreground min-w-0 max-w-[220px] truncate">{t.title}</TableCell>
                        <TableCell className="py-3.5 text-muted-foreground whitespace-nowrap">{t.reportedBy?.name || t.reportedBy?.email || '—'}</TableCell>
                        <TableCell className="py-3.5 whitespace-nowrap"><StatusBadge status={t.status} /></TableCell>
                        <TableCell className="py-3.5 text-right text-muted-foreground text-sm tabular-nums whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="w-14 py-3.5 pr-6">
                          <ChevronRight className="h-4 w-4 text-muted-foreground/70 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog
        open={!!detailTicket}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTicket(null);
            setDraftStatus(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:max-w-[560px] px-4 sm:px-6">
          {detailTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                    <Bug className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg">
                      {detailTicket.title}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(detailTicket.createdAt).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {detailTicket.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {detailTicket.reportedBy?.name || '—'}
                  </span>
                  <a
                    href={`mailto:${detailTicket.reportedBy?.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {detailTicket.reportedBy?.email}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Select
                    value={draftStatus ?? detailTicket.status}
                    onValueChange={(v) => setDraftStatus(v)}
                    disabled={savingStatus}
                  >
                    <SelectTrigger className="w-full min-w-[160px] min-h-[44px] sm:min-h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
                {!detailTicket.readAt && (
                  <Button
                    variant="outline"
                    onClick={handleMarkAsRead}
                    disabled={markingRead || savingStatus}
                    className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {markingRead ? (
                      <Spinner variant="bars" className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Marcar como lido
                  </Button>
                )}
                {hasStatusChanged && (
                  <Button
                    onClick={handleSaveStatus}
                    disabled={savingStatus}
                    className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {savingStatus ? (
                      <Spinner variant="bars" className="h-4 w-4" />
                    ) : null}
                    Guardar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDetailTicket(null)}
                  disabled={savingStatus}
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
