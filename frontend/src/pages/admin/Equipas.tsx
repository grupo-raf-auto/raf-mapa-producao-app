import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Podium, type PodiumEntry } from '@/components/ui/podium';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  MoreVertical,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TEAM_CARD_COLORS = [
  { bg: 'bg-blue-500', icon: 'text-white' },
  { bg: 'bg-violet-500', icon: 'text-white' },
  { bg: 'bg-emerald-500', icon: 'text-white' },
] as const;

interface TeamMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  members?: TeamMember[];
  _count?: { members: number };
}

interface TeamRanking {
  id: string;
  name: string;
  description?: string;
  score: number;
  rank: number;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getInitials(m: TeamMember): string {
  if (m.firstName && m.lastName) return `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
  if (m.name) return m.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (m.email) return m.email.slice(0, 2).toUpperCase();
  return '?';
}

function getDisplayName(m: TeamMember): string {
  if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`.trim();
  if (m.name) return m.name;
  return m.email;
}

export default function AdminEquipasPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);
  const [membersList, setMembersList] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [changingTeamUserId, setChangingTeamUserId] = useState<string | null>(null);
  const [selectedNewTeamId, setSelectedNewTeamId] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsList, rankingsList] = await Promise.all([
        apiClient.teams.getList(true),
        apiClient.teams.getRankings(),
      ]);
      const list = Array.isArray(teamsList) ? teamsList : [];
      setTeams(list as Team[]);
      setRankings(Array.isArray(rankingsList) ? rankingsList : []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingTeam(null);
    setFormName('');
    setFormDescription('');
    setDialogOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormDescription(team.description ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error('Nome da equipa é obrigatório');
      return;
    }
    setSaving(true);
    try {
      if (editingTeam) {
        await apiClient.teams.update(editingTeam.id, {
          name,
          description: formDescription.trim() || undefined,
        });
        toast.success('Equipa atualizada');
      } else {
        await apiClient.teams.create({
          name,
          description: formDescription.trim() || undefined,
        });
        toast.success('Equipa criada');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (team: Team) => {
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setDeleteSubmitting(true);
    try {
      await apiClient.teams.delete(teamToDelete.id);
      toast.success('Equipa removida');
      setDeleteModalOpen(false);
      setTeamToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openMembersModal = async (team: Team) => {
    setMembersTeam(team);
    setMembersModalOpen(true);
    setMembersList([]);
    setSelectedNewTeamId({});
    setMembersLoading(true);
    try {
      const members = await apiClient.teams.getMembers(team.id);
      setMembersList(Array.isArray(members) ? members : []);
    } catch {
      toast.error('Erro ao carregar membros');
      setMembersList([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleChangeUserTeam = async (userId: string, newTeamId: string) => {
    if (!newTeamId) return;
    setChangingTeamUserId(userId);
    try {
      await apiClient.users.update(userId, { teamId: newTeamId });
      toast.success('Utilizador movido de equipa');
      setSelectedNewTeamId((prev) => ({ ...prev, [userId]: '' }));
      if (membersTeam) {
        const members = await apiClient.teams.getMembers(membersTeam.id);
        setMembersList(Array.isArray(members) ? members : []);
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar equipa');
    } finally {
      setChangingTeamUserId(null);
    }
  };

  const handleRemoveUserFromTeam = async (userId: string) => {
    setChangingTeamUserId(userId);
    try {
      await apiClient.users.update(userId, { teamId: null });
      toast.success('Utilizador removido da equipa');
      if (membersTeam) {
        const members = await apiClient.teams.getMembers(membersTeam.id);
        setMembersList(Array.isArray(members) ? members : []);
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover da equipa');
    } finally {
      setChangingTeamUserId(null);
    }
  };

  const podiumEntries: PodiumEntry[] = rankings.slice(0, 5).map((r) => ({
    id: r.id,
    name: r.name,
    score: r.score,
    rank: r.rank,
    badge: r.rank === 1 ? 'Campeão' : r.rank === 2 ? 'Prata' : r.rank === 3 ? 'Bronze' : undefined,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner variant="bars" className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipas</h1>
          <p className="text-muted-foreground mt-1">
            Gerir equipas da organização. Criar, editar, remover e ver membros.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 rounded-xl bg-foreground hover:bg-foreground/90 text-background">
          <Plus className="w-4 h-4 mr-2" />
          Criar Equipa
        </Button>
      </div>

      {/* Card grid */}
      {teams.length === 0 ? (
        <Card className="rounded-2xl border border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground">
            Ainda não há equipas. Crie uma para os utilizadores poderem escolher.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, index) => {
            const color = TEAM_CARD_COLORS[index % TEAM_CARD_COLORS.length];
            const memberCount = team._count?.members ?? team.members?.length ?? 0;
            const members = team.members ?? [];
            return (
              <Card
                key={team.id}
                className="rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col"
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex shrink-0 w-12 h-12 rounded-xl ${color.bg} ${color.icon} flex items-center justify-center`}
                      >
                        <UsersRound className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{team.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {team.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          className="rounded-lg gap-2"
                          onClick={() => openMembersModal(team)}
                        >
                          <User className="w-4 h-4" />
                          Ver membros
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg gap-2"
                          onClick={() => openEdit(team)}
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="rounded-lg gap-2"
                          onClick={() => openDeleteModal(team)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/60">
                    <span className="flex items-center gap-1.5">
                      <UsersRound className="w-4 h-4" />
                      Membros {memberCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Criada em {formatDate(team.createdAt)}
                    </span>
                  </div>
                  {members.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {members.slice(0, 5).map((m) => (
                        <Avatar key={m.id} className="h-8 w-8 rounded-full border-2 border-background">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {getInitials(m)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {memberCount > 5 && (
                        <span className="flex h-8 items-center text-xs text-muted-foreground">
                          +{memberCount - 5}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Desempenho global por equipa</h2>
        </div>
        {rankings.length === 0 ? (
          <Card className="rounded-2xl border border-border/60">
            <CardContent className="py-12 text-center text-muted-foreground">
              Ainda não há dados de ranking.
            </CardContent>
          </Card>
        ) : (
          <Podium entries={podiumEntries} title="Top equipas" showScores />
        )}
      </section>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Editar equipa' : 'Nova equipa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Equipa Norte"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve descrição da equipa"
                rows={2}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? <Spinner variant="bars" className="w-4 h-4" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members modal */}
      <Dialog open={membersModalOpen} onOpenChange={setMembersModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Membros {membersTeam ? `— ${membersTeam.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          {membersLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : membersList.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">Nenhum membro nesta equipa.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {membersList.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60"
                >
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{getDisplayName(member)}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={selectedNewTeamId[member.id] ?? ''}
                      onValueChange={(value) => setSelectedNewTeamId((prev) => ({ ...prev, [member.id]: value }))}
                    >
                      <SelectTrigger className="w-[160px] rounded-lg h-9">
                        <SelectValue placeholder="Mudar equipa" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .filter((t) => t.id !== membersTeam?.id)
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id} className="rounded-lg">
                              {t.name}
                            </SelectItem>
                          ))}
                        <SelectItem value="__none__" className="rounded-lg">
                          Sem equipa
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      disabled={
                        changingTeamUserId === member.id ||
                        (!selectedNewTeamId[member.id] || selectedNewTeamId[member.id] === '')
                      }
                      onClick={() => {
                        const v = selectedNewTeamId[member.id];
                        if (v === '__none__') handleRemoveUserFromTeam(member.id);
                        else if (v) handleChangeUserTeam(member.id, v);
                      }}
                    >
                      {changingTeamUserId === member.id ? (
                        <Spinner variant="bars" className="w-4 h-4" />
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete team confirmation */}
      <AlertDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setTeamToDelete(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl border-border/80 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2 pt-0.5">
                <AlertDialogTitle className="text-left text-lg">
                  Remover equipa
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left text-muted-foreground">
                  Tem a certeza que deseja remover a equipa{' '}
                  <span className="font-semibold text-foreground">{teamToDelete?.name ?? ''}</span>? Os
                  utilizadores ficarão sem equipa atribuída e poderão escolher outra depois.
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
              onClick={confirmDeleteTeam}
            >
              {deleteSubmitting ? (
                <>
                  <Spinner variant="bars" className="w-4 h-4 mr-2" />
                  A remover...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover equipa
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
