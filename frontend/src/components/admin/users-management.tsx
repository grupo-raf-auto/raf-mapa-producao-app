import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  ChevronDown,
  MailCheck,
  MailX,
  Shield,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { UserModelsModal } from './user-models-modal';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  _id: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  image?: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  rejectionReason?: string | null;
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [modelsModalOpen, setModelsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(
    null,
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        api.users.getAll(),
        api.users.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData.stats);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await api.users.approve(userId);
      toast.success('Utilizador aprovado com sucesso');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao aprovar utilizador: ' + error.message);
    }
  };

  const openRejectModal = (userId: string) => {
    setRejectUserId(userId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const confirmRejectUser = async () => {
    if (!rejectUserId) return;
    if (!rejectReason.trim()) {
      toast.error('Indique o motivo da rejeição');
      return;
    }
    setRejectSubmitting(true);
    try {
      await api.users.reject(rejectUserId, rejectReason.trim());
      toast.success('Utilizador rejeitado');
      setRejectModalOpen(false);
      setRejectUserId(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao rejeitar utilizador: ' + error.message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const changeRole = async (userId: string, newRole: 'admin' | 'user') => {
    setRoleUpdatingUserId(userId);
    try {
      await api.users.update(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId ? { ...u, role: newRole } : u,
        ),
      );
      toast.success('Role atualizado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao atualizar role: ' + error.message);
    } finally {
      setRoleUpdatingUserId(null);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete({
      id: user._id || user.id,
      name: getUserDisplayName(user),
    });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteSubmitting(true);
    try {
      await api.users.delete(userToDelete.id);
      toast.success('Utilizador eliminado com sucesso');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao eliminar utilizador: ' + error.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openModelsModal = (user: User) => {
    setSelectedUserId(user._id || user.id);
    setSelectedUserName(getUserDisplayName(user));
    setModelsModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName?.toLowerCase() || '').includes(
          searchQuery.toLowerCase(),
        ) ||
        (user.lastName?.toLowerCase() || '').includes(
          searchQuery.toLowerCase(),
        ) ||
        (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' || user.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user.name) return user.name;
    return user.email.split('@')[0];
  };

  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user);
    if (name.includes(' ')) return name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return (name.slice(0, 2) || 'U').toUpperCase();
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="flex items-center justify-center py-12 sm:py-16">
          <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Utilizadores"
        description="Gerir contas e modelos de produção."
        icon={Users}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />

      {/* Stats Cards — mobile-first: 2 col grid, depois 4 col */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums">{stats?.totalUsers ?? 0}</p>
              </div>
              <div className="w-10 h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/30 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats?.pendingUsers ?? 0}</p>
              </div>
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/30 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aprovados</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats?.approvedUsers ?? 0}</p>
              </div>
              <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-red-200/80 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/30 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Rejeitados</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 tabular-nums">{stats?.rejectedUsers ?? 0}</p>
              </div>
              <div className="w-10 h-10 shrink-0 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter — touch-friendly */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Pesquisar por email ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border min-h-[44px]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'approved', label: 'Aprovados' },
                { value: 'rejected', label: 'Rejeitados' },
              ] as const
            ).map((filter) => (
              <Button
                key={filter.value}
                variant={filterStatus === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(filter.value)}
                className="rounded-full min-h-[44px] px-4 touch-manipulation"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile: lista em cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <Card className="rounded-2xl border border-border/60">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Nenhum utilizador encontrado
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user._id || user.id}
              className="rounded-2xl border border-border/60 shadow-sm overflow-hidden"
            >
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0 rounded-full border-2 border-border/60">
                    <AvatarImage src={user.image ?? undefined} alt={getUserDisplayName(user)} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{getUserDisplayName(user)}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      user.status === 'approved'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : user.status === 'pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    }
                  >
                    {user.status === 'approved' ? 'Aprovado' : user.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                  </Badge>
                  {user.emailVerified ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <MailCheck className="w-3.5 h-3.5" /> Verificado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MailX className="w-3.5 h-3.5" /> Não verificado
                    </span>
                  )}
                </div>
                {roleUpdatingUserId === (user._id || user.id) ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 min-h-[44px]">
                    <Spinner variant="bars" className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">A atualizar...</span>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full justify-between min-h-[44px] rounded-xl ${
                          user.role === 'admin'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                            : 'bg-muted/50 border-border text-foreground'
                        }`}
                      >
                        <span>{user.role === 'admin' ? 'ADMIN' : 'USER'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuItem onClick={() => changeRole(user._id || user.id, 'user')} disabled={user.role === 'user'}>
                        USER
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeRole(user._id || user.id, 'admin')} disabled={user.role === 'admin'}>
                        ADMIN
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
                  {user.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => approveUser(user._id || user.id)} className="flex-1 min-w-[120px] min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700">
                        Aprovar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openRejectModal(user._id || user.id)} className="flex-1 min-w-[120px] min-h-[44px] rounded-xl">
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModelsModal(user)}
                    className="min-h-[44px] rounded-xl gap-2.5 border-border/80 bg-muted/10 hover:bg-muted/40 hover:border-muted-foreground/25 font-medium text-foreground/95 shadow-sm"
                  >
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    Gerir modelos
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(user)} className="min-w-[44px] min-h-[44px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <Card className="hidden md:block rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">UTILIZADOR</TableHead>
                <TableHead className="font-semibold">EMAIL VERIFICADO</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
                <TableHead className="font-semibold">ROLE</TableHead>
                <TableHead className="text-right font-semibold">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum utilizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id || user.id} className="border-border/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0 rounded-full border border-border/60">
                          <AvatarImage src={user.image ?? undefined} alt={getUserDisplayName(user)} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{getUserDisplayName(user)}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <MailCheck className="w-4 h-4" />
                          <span className="text-sm">Verificado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MailX className="w-4 h-4" />
                          <span className="text-sm">Não verificado</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : user.status === 'pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        }
                      >
                        {user.status === 'approved' ? 'Aprovado' : user.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {roleUpdatingUserId === (user._id || user.id) ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-muted bg-muted/40 px-3 py-1.5 min-w-28">
                          <Spinner variant="bars" className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">A atualizar...</span>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`gap-1 rounded-full ${user.role === 'admin' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-muted/50 border-border'}`}
                            >
                              {user.role === 'admin' ? 'ADMIN' : 'USER'}
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => changeRole(user._id || user.id, 'user')} disabled={user.role === 'user'}>USER</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(user._id || user.id, 'admin')} disabled={user.role === 'admin'}>ADMIN</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {user.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => approveUser(user._id || user.id)} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg">Aprovar</Button>
                            <Button variant="outline" size="sm" onClick={() => openRejectModal(user._id || user.id)} className="rounded-lg">Rejeitar</Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModelsModal(user)}
                          className="gap-2 rounded-xl border-border/80 bg-muted/10 hover:bg-muted/40 hover:border-muted-foreground/25 font-medium text-foreground/95 shadow-sm"
                        >
                          <Layers className="w-4 h-4 text-muted-foreground" />
                          Gerir modelos
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(user)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* User Models Modal */}
      {selectedUserId && (
        <UserModelsModal
          open={modelsModalOpen}
          onOpenChange={setModelsModalOpen}
          userId={selectedUserId}
          userName={selectedUserName}
        />
      )}

      {/* Reject user modal - motivo obrigatório */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar utilizador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O motivo da rejeição será mostrado ao utilizador. (obrigatório, máx.
            500 caracteres)
          </p>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={rejectSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectUser}
              disabled={rejectSubmitting || !rejectReason.trim()}
            >
              {rejectSubmitting ? 'A rejeitar...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar utilizador — modal de confirmação */}
      <AlertDialog open={deleteModalOpen} onOpenChange={(open) => { setDeleteModalOpen(open); if (!open) setUserToDelete(null); }}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl border-border/80 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2 pt-0.5">
                <AlertDialogTitle className="text-left text-lg">
                  Eliminar utilizador
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left text-muted-foreground">
                  Tem a certeza que deseja eliminar <span className="font-semibold text-foreground">{userToDelete?.name ?? 'este utilizador'}</span>? Esta ação não pode ser desfeita e todos os dados associados serão removidos.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 sm:justify-end mt-6">
            <AlertDialogCancel disabled={deleteSubmitting} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteSubmitting}
              onClick={confirmDeleteUser}
            >
              {deleteSubmitting ? (
                <>
                  <Spinner variant="bars" className="w-4 h-4 mr-2" />
                  A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
