'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  Ticket,
  Bug,
  Mail,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

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

export function AdminTicketsContent() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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
      setDetailTicket(t as TicketItem);
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

  const handleStatusChange = async (status: TicketStatus) => {
    if (!detailTicket) return;
    setUpdatingStatus(true);
    try {
      await apiClient.tickets.update(detailTicket.id, { status });
      setDetailTicket((prev) => (prev ? { ...prev, status } : null));
      await fetchTickets();
      toast.success('Estado atualizado.');
    } catch {
      toast.error('Erro ao atualizar estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em progresso</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={unreadOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUnreadOnly((v) => !v)}
        >
          {unreadOnly ? 'Apenas não lidos' : 'Mostrar todos'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum ticket encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Assunto</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(t.id)}
                  >
                    <TableCell className="w-8">
                      {!t.readAt ? (
                        <Circle className="h-4 w-4 text-primary fill-primary" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {t.reportedBy?.name || t.reportedBy?.email || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === 'resolved'
                            ? 'success'
                            : t.status === 'in_progress'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {statusLabels[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(t.createdAt).toLocaleString('pt-PT')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(t.id);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog
        open={!!detailTicket}
        onOpenChange={(open) => !open && setDetailTicket(null)}
      >
        <DialogContent className="sm:max-w-[560px]">
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
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Select
                    value={detailTicket.status}
                    onValueChange={(v) => handleStatusChange(v as TicketStatus)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-[160px]">
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
              <DialogFooter>
                {!detailTicket.readAt && (
                  <Button
                    variant="outline"
                    onClick={handleMarkAsRead}
                    disabled={markingRead}
                  >
                    {markingRead ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Marcar como lido
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailTicket(null)}>
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
