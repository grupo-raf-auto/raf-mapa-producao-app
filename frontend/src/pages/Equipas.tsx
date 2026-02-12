import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
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
import { Users, Trophy, Target, TrendingUp, BarChart3, FileStack } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { DashboardMetricCard } from '@/components/ui/dashboard-metric-card';

interface TeamRanking {
  id: string;
  name: string;
  description?: string;
  score: number;
  rank: number;
}

function EquipasContent() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string; description?: string | null; myRole?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectivesTeamId, setObjectivesTeamId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.teams.getRankings(),
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
  }, []);

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

  const myTeamRank = myTeam ? rankings.find((r) => r.id === myTeam.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipas"
        description="Métricas e ranking da sua equipa e comparação com as restantes."
        icon={Users}
      />

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
            title="Submissões"
            value={myTeamRank.score}
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
          <TabsContent value="ranking" className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10 mt-0">
            <div className="flex flex-col gap-4 order-2 lg:order-1">
              <h3 className="text-2xl font-semibold lg:text-3xl text-foreground">
                Ranking de equipas
              </h3>
              <p className="text-sm text-muted-foreground">
                Veja como a sua equipa se posiciona em relação às outras. O ranking é baseado no número de submissões e desempenho geral.
              </p>
              {myTeamRank && (
                <div className="mt-2.5">
                  <Badge variant={myTeamRank.rank <= 3 ? 'success' : 'secondary'} className="text-xs">
                    Posição #{myTeamRank.rank} de {rankings.length}
                  </Badge>
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
                    <span className="text-sm text-muted-foreground">Submissões</span>
                    <span className="font-medium tabular-nums">{myTeamRank.score}</span>
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
