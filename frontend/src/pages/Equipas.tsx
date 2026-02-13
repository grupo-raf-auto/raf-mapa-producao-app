import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useModelContext } from '@/contexts/model-context';
import { Podium, type PodiumEntry } from '@/components/ui/podium';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ObjectivesTree } from '@/components/dashboard/objectives-tree';
import { Users, Trophy, Target, TrendingUp, BarChart3, FileStack, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { PageHeader } from '@/components/ui/page-header';
import { DashboardMetricCard } from '@/components/ui/dashboard-metric-card';

interface TeamRanking {
  id: string;
  name: string;
  description?: string;
  score: number;
  rank: number;
  modelType?: string;
  metricType?: 'value' | 'count' | 'submissions';
}

interface TeamMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  image?: string | null;
  teamRole?: string | null;
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

function EquipasContent() {
  const { activeModel } = useModelContext(); // Modelo ativo da navbar
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string; description?: string | null; myRole?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectivesTeamId, setObjectivesTeamId] = useState<string | null>(null);
  const [winningTeamMembers, setWinningTeamMembers] = useState<TeamMember[]>([]);
  const [allTeamsMembers, setAllTeamsMembers] = useState<Array<{ team: TeamRanking; members: TeamMember[] }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Carregar rankings baseado no modelo ativo
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Usar o modelo ativo do contexto (escolhido na navbar)
    const modelType = activeModel?.modelType;

    Promise.all([
      apiClient.teams.getRankings(modelType ? { modelType } : undefined),
      apiClient.teams.getMy().catch(() => null),
    ])
      .then(([rankingsList, team]) => {
        if (cancelled) return;
        setRankings(Array.isArray(rankingsList) ? rankingsList : []);
        setMyTeam(team && typeof team === 'object' && 'id' in team ? team as { id: string; name: string; description?: string | null; myRole?: string | null } : null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeModel]); // Atualiza quando o modelo muda na navbar

  // Fetch winning team members
  useEffect(() => {
    if (rankings.length === 0) return;
    const winningTeam = rankings[0];
    if (!winningTeam) return;

    let cancelled = false;
    apiClient.teams.getMembers(winningTeam.id)
      .then((members) => {
        if (cancelled) return;
        setWinningTeamMembers(Array.isArray(members) ? members : []);
      })
      .catch((err) => {
        console.error('Erro ao carregar membros da equipa vencedora:', err);
      });
    return () => { cancelled = true; };
  }, [rankings]);

  // Fetch all teams members
  useEffect(() => {
    if (rankings.length === 0) return;

    let cancelled = false;
    setLoadingMembers(true);

    Promise.all(
      rankings.map((team) =>
        apiClient.teams.getMembers(team.id)
          .then((members) => ({ team, members: Array.isArray(members) ? members : [] }))
          .catch(() => ({ team, members: [] }))
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
        if (!cancelled) setLoadingMembers(false);
      });
    return () => { cancelled = true; };
  }, [rankings]);

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

  const myTeamRank = myTeam ? rankings.find((r) => r.id === myTeam.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipas"
        description="Métricas e ranking da sua equipa e comparação com as restantes."
        icon={Users}
      />

      {/* Info do modelo ativo */}
      {activeModel && (
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default" className="text-xs font-semibold">
                Modelo Ativo: {activeModel.modelType === 'credito' ? 'Crédito' : activeModel.modelType === 'imobiliaria' ? 'Imobiliária' : 'Seguros'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Rankings baseados em{' '}
                <strong className="text-foreground">
                  {activeModel.modelType === 'credito' ? 'Valor de Produção (€)' : activeModel.modelType === 'imobiliaria' ? 'Valor de Vendas (€)' : 'Número de Apólices Ativas'}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {myTeam && myTeamRank && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <DashboardMetricCard
            title="Posição"
            value={`#${myTeamRank.rank}`}
            icon={Trophy}
            description={`de ${rankings.length}`}
            colorVariant="blue"
            variant="default"
            animationDelay={0}
          />
          <DashboardMetricCard
            title={
              myTeamRank.metricType === 'value'
                ? 'Valor Total'
                : myTeamRank.metricType === 'count'
                ? 'Apólices'
                : 'Submissões'
            }
            value={
              myTeamRank.metricType === 'value'
                ? `${myTeamRank.score.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : myTeamRank.score
            }
            icon={FileStack}
            colorVariant="teal"
            variant="default"
            animationDelay={0.08}
          />
          <DashboardMetricCard
            title="Equipas"
            value={rankings.length}
            icon={Users}
            colorVariant="green"
            variant="default"
            animationDelay={0.16}
          />
          <DashboardMetricCard
            title="Estado"
            value={myTeamRank.rank <= 3 ? 'Top 3' : 'Ativo'}
            icon={TrendingUp}
            trendType={myTeamRank.rank <= 3 ? 'up' : 'neutral'}
            trendChange={myTeamRank.rank <= 3 ? 'Destaque' : undefined}
            colorVariant="red"
            variant="default"
            animationDelay={0.24}
          />
        </div>
      )}

      <Tabs defaultValue="ranking" className="w-full mt-8">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Acompanhe o desempenho da sua equipa
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Rankings, objetivos e métricas detalhadas para impulsionar o sucesso da sua equipa.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted/50 p-1 gap-1">
            <TabsTrigger
              value="ranking"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors"
            >
              <Trophy className="h-4 w-4 shrink-0" />
              Ranking
            </TabsTrigger>
            <TabsTrigger
              value="objetivos"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors"
            >
              <Target className="h-4 w-4 shrink-0" />
              Objetivos
            </TabsTrigger>
            <TabsTrigger
              value="metricas"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors"
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              Métricas
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-xl border border-border/60 bg-slate-100/80 dark:bg-slate-800/50 p-6 lg:p-8 shadow-sm">
          <TabsContent value="ranking" className="space-y-6 mt-0">
            <div className="grid place-items-start gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="flex flex-col gap-4 order-2 lg:order-1 w-full">
                <h3 className="text-2xl font-semibold lg:text-3xl text-foreground">
                  Ranking de equipas
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeModel
                    ? `Ranking baseado em métricas do modelo ${activeModel.modelType === 'credito' ? 'Crédito (valor de produção)' : activeModel.modelType === 'imobiliaria' ? 'Imobiliária (valor de vendas)' : 'Seguros (apólices ativas)'}.`
                    : 'Veja como a sua equipa se posiciona em relação às outras. O ranking é baseado no número de submissões e desempenho geral.'
                  }
                </p>
                {myTeamRank && (
                  <div className="mt-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/50 p-4 border border-border/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={myTeamRank.rank <= 3 ? 'success' : 'secondary'} className="text-xs font-medium">
                        Posição #{myTeamRank.rank} de {rankings.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {myTeamRank.metricType === 'value'
                          ? `${myTeamRank.score.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`
                          : myTeamRank.metricType === 'count'
                          ? `${myTeamRank.score} ${myTeamRank.score === 1 ? 'apólice' : 'apólices'}`
                          : `${myTeamRank.score} ${myTeamRank.score === 1 ? 'submissão' : 'submissões'}`
                        }
                      </Badge>
                      {myTeamRank.rank > 1 && rankings[0] && (
                        <Badge variant="secondary" className="text-xs">
                          {rankings[0].score - myTeamRank.score} {rankings[0].score - myTeamRank.score === 1 ? 'submissão' : 'submissões'} do 1º lugar
                        </Badge>
                      )}
                      {myTeamRank.rank === 1 && (
                        <Badge variant="default" className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                          🏆 Líder
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Winning team members */}
                {rankings.length > 0 && winningTeamMembers.length > 0 && (
                  <div className="mt-4 rounded-lg bg-slate-200/60 dark:bg-slate-700/50 p-5 border border-border/50">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm">Equipa Vencedora</h4>
                        <p className="text-xs text-muted-foreground truncate">{rankings[0].name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {winningTeamMembers.map((member) => {
                        const displayName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sem nome';
                        const initials = displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                          <div key={member.id} className="rounded-md bg-background/60 border border-border/40 p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.image || undefined} alt={displayName} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                              {member.teamRole && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {member.teamRole === 'leader' ? 'Líder' : member.teamRole === 'coordinator' ? 'Coord.' : 'Membro'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="order-1 lg:order-2 w-full">
                {rankings.length === 0 ? (
                  <Card className="rounded-lg border border-border/50 bg-slate-100/70 dark:bg-slate-800/40">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      Ainda não há dados de ranking. As equipas aparecem aqui consoante as submissões.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg bg-slate-200/60 dark:bg-slate-700/50 p-6 border border-border/50">
                    <Podium
                      entries={podiumEntries}
                      title="Top equipas"
                      showScores
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="objetivos" className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10 mt-0">
            <div className="flex flex-col gap-4 order-2 lg:order-1">
              <h3 className="text-2xl font-semibold lg:text-3xl text-foreground">
                Objetivos da organização
              </h3>
              <p className="text-sm text-muted-foreground">
                Objetivos globais da organização ou da sua equipa. Acompanhe metas e monitore o progresso em tempo real.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Visualizar:</span>
                <Select 
                  value={objectivesTeamId === null ? '__global__' : (objectivesTeamId === myTeam?.id ? '__myteam__' : objectivesTeamId)} 
                  onValueChange={(v) => {
                    if (v === '__global__') {
                      setObjectivesTeamId(null);
                    } else if (v === '__myteam__') {
                      setObjectivesTeamId(myTeam?.id ?? null);
                    } else {
                      setObjectivesTeamId(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] rounded-xl">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__global__" className="rounded-lg">
                      Objetivos globais
                    </SelectItem>
                    {myTeam && (
                      <SelectItem value="__myteam__" className="rounded-lg">
                        Minha equipa ({myTeam.name})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="order-1 lg:order-2 w-full rounded-lg bg-slate-200/60 dark:bg-slate-700/50 p-6 border border-border/50">
              <ObjectivesTree teamId={objectivesTeamId} />
            </div>
          </TabsContent>

          <TabsContent value="metricas" className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10 mt-0">
            <div className="flex flex-col gap-4 order-2 lg:order-1">
              <h3 className="text-2xl font-semibold lg:text-3xl text-foreground">
                Métricas detalhadas
              </h3>
              <p className="text-sm text-muted-foreground">
                Métricas de desempenho, produtividade e progresso da sua equipa para decisões informadas.
              </p>
              {myTeamRank && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">
                      {myTeamRank.metricType === 'value' ? 'Valor Total' : myTeamRank.metricType === 'count' ? 'Apólices' : 'Submissões'}
                    </span>
                    <span className="font-medium tabular-nums">
                      {myTeamRank.metricType === 'value'
                        ? `${myTeamRank.score.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`
                        : myTeamRank.score
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">Posição</span>
                    <span className="font-medium tabular-nums">#{myTeamRank.rank}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">Total equipas</span>
                    <span className="font-medium tabular-nums">{rankings.length}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2 w-full">
              <div className="rounded-lg bg-slate-200/60 dark:bg-slate-700/50 p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Performance geral</h4>
                    <p className="text-sm text-muted-foreground">Visão consolidada</p>
                  </div>
                </div>
                {myTeamRank ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <span className="text-sm font-medium">Sua equipa</span>
                      <Badge variant={myTeamRank.rank <= 3 ? 'success' : 'secondary'} className="text-xs">
                        Top {myTeamRank.rank}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {myTeamRank.rank <= 3 
                        ? 'Parabéns! A sua equipa está no topo do ranking.'
                        : 'Continue trabalhando para subir no ranking!'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma métrica disponível no momento.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* All teams members section */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Todos os membros das equipas
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualize todos os utilizadores de todas as equipas e as suas métricas de desempenho.
          </p>
        </div>

        {loadingMembers ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : allTeamsMembers.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há dados de membros disponíveis.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {allTeamsMembers.map(({ team, members }) => (
              <Card key={team.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {team.name}
                          <Badge variant={team.rank === 1 ? 'default' : team.rank <= 3 ? 'secondary' : 'outline'} className="text-xs">
                            #{team.rank}
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {members.length} {members.length === 1 ? 'membro' : 'membros'} · {team.score} {team.score === 1 ? 'submissão' : 'submissões'}
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
                            {activeModel?.modelType === 'credito' && (
                              <>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Produção</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Clientes</th>
                              </>
                            )}
                            {activeModel?.modelType === 'imobiliaria' && (
                              <>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Vendas</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Imóveis</th>
                              </>
                            )}
                            {activeModel?.modelType === 'seguro' && (
                              <>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Prémios</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Apólices</th>
                              </>
                            )}
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Submissões</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aprovadas</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Pendentes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => {
                            const displayName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sem nome';
                            const initials = displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                            // Encontrar o modelo ativo do membro (se houver)
                            const memberActiveModel = activeModel
                              ? member.userModels?.find((um) => um.modelType === activeModel.modelType)
                              : member.userModels?.[0];

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
                                {activeModel?.modelType === 'credito' && (
                                  <>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                      {memberActiveModel?.creditoProfile
                                        ? `${Number(memberActiveModel.creditoProfile.totalProduction).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                                        : '-'
                                      }
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                                      {memberActiveModel?.creditoProfile?.activeClients ?? '-'}
                                    </td>
                                  </>
                                )}
                                {activeModel?.modelType === 'imobiliaria' && (
                                  <>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                      {memberActiveModel?.imobiliariaProfile
                                        ? `${Number(memberActiveModel.imobiliariaProfile.totalSales).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                                        : '-'
                                      }
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                                      {memberActiveModel?.imobiliariaProfile?.activeListings ?? '-'}
                                    </td>
                                  </>
                                )}
                                {activeModel?.modelType === 'seguro' && (
                                  <>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                                      {memberActiveModel?.seguroProfile
                                        ? `${Number(memberActiveModel.seguroProfile.totalPremiums).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                                        : '-'
                                      }
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                                      {memberActiveModel?.seguroProfile?.activePolicies ?? '-'}
                                    </td>
                                  </>
                                )}
                                <td className="py-3 px-4 text-sm text-right tabular-nums">
                                  {member.submissionsCount ?? '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-right tabular-nums">
                                  <span className="text-green-600 dark:text-green-500 font-medium">
                                    {member.approvedCount ?? '-'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-right tabular-nums">
                                  <span className="text-yellow-600 dark:text-yellow-500">
                                    {member.pendingCount ?? '-'}
                                  </span>
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
      </div>
    </div>
  );
}

export default function EquipasPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <EquipasContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
