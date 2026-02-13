import { useState, useEffect } from 'react';
import { apiClient, invalidateCache } from '@/lib/api-client';
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
  Users,
  Euro,
  FileCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { ObjectivesTree } from '@/components/dashboard/objectives-tree';
import { UserPlus, Target, Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

const TEAM_CARD_COLORS = [
  { bg: 'bg-blue-500', icon: 'text-white' },
  { bg: 'bg-violet-500', icon: 'text-white' },
  { bg: 'bg-emerald-500', icon: 'text-white' },
] as const;

type TeamRoleType = 'leader' | 'coordinator' | 'member';

interface TeamMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  image?: string | null;
  teamRole?: TeamRoleType | null;
  submissionsCount?: number;
  approvedCount?: number;
  pendingCount?: number;
  userModels?: Array<{
    id: string;
    modelType: string;
    creditoProfile?: {
      totalProduction: number;
      activeClients: number;
    } | null;
    imobiliariaProfile?: {
      totalSales: number;
      activeListings: number;
    } | null;
    seguroProfile?: {
      totalPremiums: number;
      activePolicies: number;
    } | null;
  }>;
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

const TEAM_ROLE_LABELS: Record<TeamRoleType, string> = {
  leader: 'Líder',
  coordinator: 'Coordenador',
  member: 'Membro',
};

type MembersModelType = 'credito' | 'imobiliaria' | 'seguro';

function getMemberModelMetric(member: TeamMember, model: MembersModelType): { primary: number; secondary?: number } {
  const um = member.userModels?.find((u) => u.modelType === model);
  if (!um) return { primary: 0 };
  if (model === 'credito' && um.creditoProfile) {
    return { primary: Number(um.creditoProfile.totalProduction) || 0, secondary: um.creditoProfile.activeClients };
  }
  if (model === 'imobiliaria' && um.imobiliariaProfile) {
    return { primary: Number(um.imobiliariaProfile.totalSales) || 0, secondary: um.imobiliariaProfile.activeListings };
  }
  if (model === 'seguro' && um.seguroProfile) {
    return { primary: um.seguroProfile.activePolicies || 0, secondary: Number(um.seguroProfile.totalPremiums) || 0 };
  }
  return { primary: 0 };
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
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [usersWithoutTeam, setUsersWithoutTeam] = useState<TeamMember[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');
  const [objectivesTeamId, setObjectivesTeamId] = useState<string | null>(null);
  const [allTeamsMembers, setAllTeamsMembers] = useState<Array<{ team: TeamRanking; members: TeamMember[] }>>([]);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('equipas');
  const [membersModelTab, setMembersModelTab] = useState<'credito' | 'imobiliaria' | 'seguro'>('credito');
  const [aggregateMetrics, setAggregateMetrics] = useState<{
    totalProducao: number;
    totalVendas: number;
    totalApolices: number;
    topTeamName: string;
    topTeamScore: number;
    topTeamIsValue: boolean;
  }>({ totalProducao: 0, totalVendas: 0, totalApolices: 0, topTeamName: '', topTeamScore: 0, topTeamIsValue: false });

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsList, rankingsList, metricsData] = await Promise.all([
        apiClient.teams.getList(true),
        apiClient.teams.getRankings(),
        apiClient.teams.getMetrics().catch(() => []),
      ]);
      const list = Array.isArray(teamsList) ? teamsList : [];
      setTeams(list as Team[]);
      setRankings(Array.isArray(rankingsList) ? rankingsList : []);

      const metrics = Array.isArray(metricsData) ? metricsData : [];
      let totalProducao = 0;
      let totalVendas = 0;
      let totalApolices = 0;
      let topTeamName = '';
      let topTeamScore = 0;
      let topTeamIsValue = true;
      for (const item of metrics) {
        const entry = item as { team?: { name?: string }; metrics?: Record<string, { totalValue?: number; primaryMetric?: number }> };
        const m = entry.metrics ?? {};
        const prod = Number(m.credito?.totalValue ?? 0) || 0;
        const vendas = Number(m.imobiliaria?.totalValue ?? 0) || 0;
        const apol = Number(m.seguro?.primaryMetric ?? 0) || 0;
        totalProducao += prod;
        totalVendas += vendas;
        totalApolices += apol;
        const teamValue = prod + vendas;
        if (teamValue > topTeamScore) {
          topTeamScore = teamValue;
          topTeamName = entry.team?.name ?? '';
          topTeamIsValue = true;
        }
      }
      if (topTeamScore === 0 && totalApolices > 0) {
        for (const item of metrics) {
          const entry = item as { team?: { name?: string }; metrics?: Record<string, { primaryMetric?: number }> };
          const apol = Number(entry.metrics?.seguro?.primaryMetric ?? 0) || 0;
          if (apol > topTeamScore) {
            topTeamScore = apol;
            topTeamName = entry.team?.name ?? '';
            topTeamIsValue = false;
          }
        }
      }
      if (topTeamName === '' && rankingsList?.[0]) {
        topTeamName = (rankingsList[0] as { name?: string }).name ?? '';
        topTeamScore = (rankingsList[0] as { score?: number }).score ?? 0;
        topTeamIsValue = false;
      }
      setAggregateMetrics({ totalProducao, totalVendas, totalApolices, topTeamName, topTeamScore, topTeamIsValue });
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

  // Fetch all teams members for the table (usa teams, não rankings, para incluir todas as equipas)
  useEffect(() => {
    if (teams.length === 0) return;

    let cancelled = false;
    setLoadingAllMembers(true);

    const rankByTeamId = new Map(rankings.map((r, i) => [r.id, { rank: i + 1, score: r.score }]));

    Promise.all(
      teams.map((team) =>
        apiClient.teams.getMembers(team.id)
          .then((members) => {
            const rankInfo = rankByTeamId.get(team.id);
            return {
              team: {
                id: team.id,
                name: team.name,
                rank: rankInfo?.rank ?? 0,
                score: rankInfo?.score ?? 0,
              },
              members: Array.isArray(members) ? members : [],
            };
          })
          .catch(() => ({
            team: {
              id: team.id,
              name: team.name,
              rank: rankByTeamId.get(team.id)?.rank ?? 0,
              score: rankByTeamId.get(team.id)?.score ?? 0,
            },
            members: [] as TeamMember[],
          }))
      )
    )
      .then((teamsWithMembers) => {
        if (cancelled) return;
        setAllTeamsMembers(teamsWithMembers);
      })
      .catch((err) => {
        console.error('Erro ao carregar membros das equipas:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingAllMembers(false);
      });
    return () => { cancelled = true; };
  }, [teams, rankings]);

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
    setSelectedUserIdToAdd('');
    setMembersLoading(true);
    try {
      const [members, withoutTeam] = await Promise.all([
        apiClient.teams.getMembers(team.id),
        apiClient.users.getAll({ withoutTeam: true }),
      ]);
      setMembersList(Array.isArray(members) ? members : []);
      const items = Array.isArray(withoutTeam) ? withoutTeam : (withoutTeam as { items?: unknown[] })?.items ?? [];
      setUsersWithoutTeam(items as TeamMember[]);
    } catch {
      toast.error('Erro ao carregar membros');
      setMembersList([]);
      setUsersWithoutTeam([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddUserToTeam = async () => {
    if (!membersTeam || !selectedUserIdToAdd) return;
    setAddMemberLoading(true);
    try {
      await apiClient.users.update(selectedUserIdToAdd, {
        teamId: membersTeam.id,
        teamRole: 'member',
      });
      toast.success('Utilizador adicionado à equipa');
      setSelectedUserIdToAdd('');
      const [members, withoutTeam] = await Promise.all([
        apiClient.teams.getMembers(membersTeam.id),
        apiClient.users.getAll({ withoutTeam: true }),
      ]);
      setMembersList(Array.isArray(members) ? members : []);
      const items = Array.isArray(withoutTeam) ? withoutTeam : (withoutTeam as { items?: unknown[] })?.items ?? [];
      setUsersWithoutTeam(items as TeamMember[]);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === membersTeam.id ? { ...t, _count: { members: (t._count?.members ?? t.members?.length ?? 0) + 1 } } : t
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleChangeTeamRole = async (userId: string, teamRole: TeamRoleType) => {
    setChangingTeamUserId(userId);
    console.log('Attempting to update team role for user:', userId, 'to role:', teamRole);
    try {
      // Optimistic update
      setMembersList((prev) =>
        prev.map((member) =>
          member.id === userId ? { ...member, teamRole } : member
        )
      );
      const response = await apiClient.users.update(userId, { teamRole });
      console.log('API update response:', response);
      toast.success('Papel na equipa atualizado');
      // Invalidate cache and refetch to ensure consistency, but allow optimistic update to show immediately
      if (membersTeam) {
        invalidateCache(`teams/${membersTeam.id}/members`);
        const members = await apiClient.teams.getMembers(membersTeam.id);
        console.log('Refetched members after role update:', members);
        setMembersList(Array.isArray(members) ? members : []);
      }
    } catch (err) {
      console.error('Error updating team role:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar papel');
      // Invalidate cache and revert optimistic update on error
      if (membersTeam) {
        invalidateCache(`teams/${membersTeam.id}/members`);
        const originalMembers = await apiClient.teams.getMembers(membersTeam.id);
        setMembersList(Array.isArray(originalMembers) ? originalMembers : []);
      }
    } finally {
      setChangingTeamUserId(null);
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
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === membersTeam?.id) return { ...t, _count: { members: Math.max(0, (t._count?.members ?? t.members?.length ?? 0) - 1) }, members: t.members?.filter((m) => m.id !== userId) ?? [] };
          if (t.id === newTeamId) return { ...t, _count: { members: (t._count?.members ?? t.members?.length ?? 0) + 1 } };
          return t;
        })
      );
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
      setTeams((prev) =>
        prev.map((t) =>
          t.id === membersTeam?.id ? { ...t, _count: { members: Math.max(0, (t._count?.members ?? t.members?.length ?? 0) - 1) }, members: t.members?.filter((m) => m.id !== userId) ?? [] } : t
        )
      );
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner variant="bars" className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">A carregar equipas...</p>
      </div>
    );
  }

  const totalMembers = teams.reduce((acc, t) => acc + (t._count?.members ?? t.members?.length ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Equipas"
          description="Gerir equipas da organização. Criar, editar, remover e ver membros."
          icon={UsersRound}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Button onClick={openCreate} className="shrink-0 rounded-xl bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Criar Equipa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BorderRotate gradientColors={{ primary: '#1e3a5f', secondary: '#3b82f6', accent: '#93c5fd' }} backgroundColor="var(--card)" borderRadius={12} borderWidth={2}>
          <Card className="rounded-xl border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Euro className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Produção</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {(aggregateMetrics.totalProducao + aggregateMetrics.totalVendas).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-[10px] text-muted-foreground">Crédito + Imobiliária</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BorderRotate>
        <BorderRotate gradientColors={{ primary: '#3b1f6e', secondary: '#8b5cf6', accent: '#c4b5fd' }} backgroundColor="var(--card)" borderRadius={12} borderWidth={2}>
          <Card className="rounded-xl border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Apólices</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{aggregateMetrics.totalApolices.toLocaleString('pt-PT')}</p>
                  <p className="text-[10px] text-muted-foreground">Seguros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BorderRotate>
        <BorderRotate gradientColors={{ primary: '#5c3d0e', secondary: '#f59e0b', accent: '#fcd34d' }} backgroundColor="var(--card)" borderRadius={12} borderWidth={2}>
          <Card className="rounded-xl border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Equipa</p>
                  <p className="text-lg font-bold text-foreground truncate">{aggregateMetrics.topTeamName || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {aggregateMetrics.topTeamName
                      ? aggregateMetrics.topTeamIsValue
                        ? `${aggregateMetrics.topTeamScore.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
                        : `${aggregateMetrics.topTeamScore.toLocaleString('pt-PT')} apólices`
                      : 'Sem dados'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BorderRotate>
        <BorderRotate gradientColors={{ primary: '#14532d', secondary: '#22c55e', accent: '#86efac' }} backgroundColor="var(--card)" borderRadius={12} borderWidth={2}>
          <Card className="rounded-xl border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Colaboradores</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{totalMembers}</p>
                  <p className="text-[10px] text-muted-foreground">{teams.length} equipas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BorderRotate>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
        <div className="flex justify-center mb-8">
          <AnimatedTabs
            tabs={[
              { label: 'Equipas', value: 'equipas' },
              { label: 'Membros', value: 'membros' },
              { label: 'Objetivos', value: 'objetivos' },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          />
        </div>

        <div className="mx-auto w-full max-w-[1600px] rounded-2xl bg-muted/70 p-6 lg:p-16">
        <TabsContent value="equipas" className="mt-0 space-y-8">
          {/* Card grid */}
          {teams.length === 0 ? (
            <Card className="rounded-2xl border border-border/60">
              <CardContent className="py-12 text-center text-muted-foreground">
                Ainda não há equipas. Crie uma para os utilizadores poderem escolher.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team, index) => {
                const color = TEAM_CARD_COLORS[index % TEAM_CARD_COLORS.length];
                const memberCount = team._count?.members ?? team.members?.length ?? 0;
                const members = team.members ?? [];
                return (
                  <Card
                    key={team.id}
                    className="rounded-xl border border-border/60 shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex shrink-0 w-8 h-8 rounded-lg ${color.bg} ${color.icon} items-center justify-center`}
                          >
                            <UsersRound className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{team.name}</h3>
                            {team.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5" />
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
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          {members.length > 0 && (
                            <div className="flex -space-x-1.5">
                              {members.slice(0, 4).map((m) => (
                                <Avatar key={m.id} className="h-6 w-6 rounded-full border-2 border-card">
                                  <AvatarImage src={m.image || undefined} alt={getDisplayName(m)} />
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                    {getInitials(m)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {memberCount > 4 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-card text-[10px] text-muted-foreground font-medium">
                                  +{memberCount - 4}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatDate(team.createdAt)}
                        </span>
                      </div>
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
        </TabsContent>

        <TabsContent value="membros" className="mt-0 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Todos os membros das equipas</h2>
            </div>
            <Select value={membersModelTab} onValueChange={(v) => setMembersModelTab(v as MembersModelType)}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credito" className="rounded-lg">Crédito</SelectItem>
                <SelectItem value="imobiliaria" className="rounded-lg">Imobiliária</SelectItem>
                <SelectItem value="seguro" className="rounded-lg">Seguros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingAllMembers ? (
            <div className="flex items-center justify-center py-12">
              <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : allTeamsMembers.length === 0 ? (
            <Card className="rounded-2xl border border-border/60">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há dados de membros disponíveis.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {allTeamsMembers.map(({ team, members }) => (
                <Card key={team.id} className="rounded-2xl border border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UsersRound className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {team.name}
                            {team.rank > 0 && (
                              <Badge variant={team.rank === 1 ? 'default' : team.rank <= 3 ? 'secondary' : 'outline'} className="text-xs">
                                #{team.rank}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {members.length} {members.length === 1 ? 'membro' : 'membros'}
                            {team.rank > 0 && ` · ${team.score} ${team.score === 1 ? 'submissão' : 'submissões'}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Esta equipa ainda não tem membros.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membro</th>
                              {membersModelTab === 'credito' && (
                                <>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Produção (€)</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Clientes ativos</th>
                                </>
                              )}
                              {membersModelTab === 'imobiliaria' && (
                                <>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Vendas (€)</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Listagens ativas</th>
                                </>
                              )}
                              {membersModelTab === 'seguro' && (
                                <>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Apólices</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Prémios (€)</th>
                                </>
                              )}
                              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Submissões</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Função</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((member) => {
                              const displayName = getDisplayName(member);
                              const initials = getInitials(member);
                              const metric = getMemberModelMetric(member, membersModelTab);

                              return (
                                <tr key={member.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9">
                                        <AvatarImage src={member.image || undefined} alt={displayName} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                          {initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">{displayName}</span>
                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  {membersModelTab === 'credito' && (
                                    <>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                        {metric.primary > 0 ? metric.primary.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €' : '-'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums">
                                        {metric.secondary != null && metric.secondary > 0 ? metric.secondary : '-'}
                                      </td>
                                    </>
                                  )}
                                  {membersModelTab === 'imobiliaria' && (
                                    <>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                        {metric.primary > 0 ? metric.primary.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €' : '-'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums">
                                        {metric.secondary != null && metric.secondary > 0 ? metric.secondary : '-'}
                                      </td>
                                    </>
                                  )}
                                  {membersModelTab === 'seguro' && (
                                    <>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                        {metric.primary > 0 ? metric.primary : '-'}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-right tabular-nums">
                                        {metric.secondary != null && metric.secondary > 0 ? metric.secondary.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €' : '-'}
                                      </td>
                                    </>
                                  )}
                                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                                    {member.submissionsCount ?? '-'}
                                  </td>
                                  <td className="py-3 px-4">
                                    {member.teamRole ? (
                                      <Badge variant="outline" className="text-xs">
                                        {TEAM_ROLE_LABELS[member.teamRole]}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="objetivos" className="mt-0">
          <div className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col gap-5 order-2 lg:order-1">
              <Badge variant="outline" className="w-fit bg-background">
                Planeamento
              </Badge>
              <h3 className="text-3xl font-semibold lg:text-5xl">
                Objetivos da organização
              </h3>
              <p className="text-muted-foreground lg:text-lg">
                Gerencie objetivos globais e por equipa. Defina metas claras e monitore o progresso em tempo real.
              </p>
            </div>
            <div className="order-1 lg:order-2 w-full">
              <div className="flex flex-wrap items-center gap-4 mb-4 p-4 rounded-xl bg-background/50">
                <span className="text-sm font-medium text-muted-foreground">Equipa:</span>
                <Select value={objectivesTeamId ?? '__global__'} onValueChange={(v) => setObjectivesTeamId(v === '__global__' ? null : v)}>
                  <SelectTrigger className="w-[200px] rounded-xl">
                    <SelectValue placeholder="Objetivos globais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__global__" className="rounded-lg">Objetivos globais</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="rounded-lg">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl bg-background/50 p-6">
                <ObjectivesTree teamId={objectivesTeamId} />
              </div>
            </div>
          </div>
        </TabsContent>
        </div>
      </Tabs>

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
        <DialogContent className="rounded-2xl w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 pb-4 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" />
              Membros {membersTeam ? `— ${membersTeam.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          {membersLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 py-4">
              {usersWithoutTeam.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Select value={selectedUserIdToAdd} onValueChange={setSelectedUserIdToAdd}>
                    <SelectTrigger className="w-full sm:min-w-[280px] sm:flex-1 rounded-xl h-10">
                      <SelectValue placeholder="Adicionar utilizador à equipa" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithoutTeam.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="rounded-lg">
                          {getDisplayName(u)} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="rounded-xl h-10 shrink-0"
                    disabled={!selectedUserIdToAdd || addMemberLoading}
                    onClick={handleAddUserToTeam}
                  >
                    {addMemberLoading ? <Spinner variant="bars" className="w-4 h-4" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Adicionar
                  </Button>
                </div>
              )}
              {membersList.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  {usersWithoutTeam.length === 0 ? 'Nenhum membro nesta equipa. Não há utilizadores disponíveis para adicionar.' : 'Nenhum membro nesta equipa.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {membersList.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-11 w-11 rounded-full shrink-0">
                          <AvatarImage src={member.image || undefined} alt={getDisplayName(member)} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground truncate">{getDisplayName(member)}</p>
                            {member.teamRole && (
                              <Badge
                                variant={member.teamRole === 'leader' ? 'warning' : member.teamRole === 'coordinator' ? 'default' : 'secondary'}
                                className="text-[10px] px-2 py-0.5 shrink-0"
                              >
                                {TEAM_ROLE_LABELS[member.teamRole]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pl-14 sm:pl-0">
                        <Select
                          value={member.teamRole ?? 'member'}
                          onValueChange={(v) => handleChangeTeamRole(member.id, v as TeamRoleType)}
                          disabled={changingTeamUserId === member.id}
                        >
                          <SelectTrigger className="w-full sm:w-[140px] rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['member', 'coordinator', 'leader'] as const).map((r) => (
                              <SelectItem key={r} value={r} className="rounded-lg">
                                {TEAM_ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={selectedNewTeamId[member.id] ?? ''}
                          onValueChange={(value) => setSelectedNewTeamId((prev) => ({ ...prev, [member.id]: value }))}
                        >
                          <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-10">
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
                          className="rounded-xl h-10 shrink-0"
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
