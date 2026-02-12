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
    <div className="space-y-8">
      <PageHeader
        title="Equipas"
        description="Métricas e ranking da sua equipa e comparação com as restantes."
        icon={Users}
        decoratorIcon={<Trophy className="w-5 h-5" />}
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
            animationDelay={0}
          />
          <DashboardMetricCard
            title="Submissões"
            value={myTeamRank.score}
            icon={FileStack}
            colorVariant="teal"
            animationDelay={0.08}
          />
          <DashboardMetricCard
            title="Equipas"
            value={rankings.length}
            icon={Users}
            colorVariant="green"
            animationDelay={0.16}
          />
          <DashboardMetricCard
            title="Estado"
            value={myTeamRank.rank <= 3 ? 'Top 3' : 'Ativo'}
            icon={TrendingUp}
            trendType={myTeamRank.rank <= 3 ? 'up' : 'neutral'}
            trendChange={myTeamRank.rank <= 3 ? 'Destaque' : undefined}
            colorVariant="red"
            animationDelay={0.24}
          />
        </div>
      )}

      <Tabs defaultValue="ranking" className="w-full mt-8">
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <Badge variant="outline" className="bg-background">
            Equipas & Performance
          </Badge>
          <h2 className="max-w-2xl text-3xl font-semibold md:text-4xl">
            Acompanhe o desempenho da sua equipa
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Visualize rankings, objetivos e métricas detalhadas para impulsionar o sucesso da sua equipa.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <TabsList className="flex flex-col items-center justify-center gap-4 sm:flex-row md:gap-10 bg-transparent p-0">
            <TabsTrigger
              value="ranking"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary transition-all"
            >
              <Trophy className="h-auto w-4 shrink-0" />
              Ranking
            </TabsTrigger>
            <TabsTrigger
              value="objetivos"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary transition-all"
            >
              <Target className="h-auto w-4 shrink-0" />
              Objetivos
            </TabsTrigger>
            <TabsTrigger
              value="metricas"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary transition-all"
            >
              <BarChart3 className="h-auto w-4 shrink-0" />
              Métricas
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl rounded-2xl bg-muted/70 p-6 lg:p-16">
          <TabsContent value="ranking" className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10 mt-0">
            <div className="flex flex-col gap-5 order-2 lg:order-1">
              <Badge variant="outline" className="w-fit bg-background">
                Classificação
              </Badge>
              <h3 className="text-3xl font-semibold lg:text-5xl">
                Ranking de equipas
              </h3>
              <p className="text-muted-foreground lg:text-lg">
                Veja como a sua equipa se posiciona em relação às outras. O ranking é baseado no número de submissões e desempenho geral.
              </p>
              {myTeamRank && (
                <div className="mt-2.5">
                  <Badge variant={myTeamRank.rank <= 3 ? 'success' : 'secondary'} className="text-base px-4 py-2">
                    Posição #{myTeamRank.rank} de {rankings.length}
                  </Badge>
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2 w-full">
              {rankings.length === 0 ? (
                <Card className="rounded-xl">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Ainda não há dados de ranking. As equipas aparecem aqui consoante as submissões.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-xl bg-background/50 p-6">
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
            <div className="flex flex-col gap-5 order-2 lg:order-1">
              <Badge variant="outline" className="w-fit bg-background">
                Planeamento
              </Badge>
              <h3 className="text-3xl font-semibold lg:text-5xl">
                Objetivos da organização
              </h3>
              <p className="text-muted-foreground lg:text-lg">
                Visualize objetivos globais da organização ou os objetivos específicos da sua equipa. Acompanhe metas e monitore o progresso em tempo real.
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
            <div className="order-1 lg:order-2 w-full rounded-xl bg-background/50 p-6">
              <ObjectivesTree teamId={objectivesTeamId} />
            </div>
          </TabsContent>

          <TabsContent value="metricas" className="grid place-items-center gap-10 lg:grid-cols-2 lg:gap-10 mt-0">
            <div className="flex flex-col gap-5 order-2 lg:order-1">
              <Badge variant="outline" className="w-fit bg-background">
                Análise
              </Badge>
              <h3 className="text-3xl font-semibold lg:text-5xl">
                Métricas detalhadas
              </h3>
              <p className="text-muted-foreground lg:text-lg">
                Acompanhe métricas detalhadas de desempenho, produtividade e progresso da sua equipa para tomar decisões informadas.
              </p>
              {myTeamRank && (
                <div className="mt-2.5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-sm text-muted-foreground">Submissões</span>
                    <span className="text-lg font-semibold">{myTeamRank.score}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-sm text-muted-foreground">Posição</span>
                    <span className="text-lg font-semibold">#{myTeamRank.rank}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-sm text-muted-foreground">Total equipas</span>
                    <span className="text-lg font-semibold">{rankings.length}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2 w-full">
              <div className="rounded-xl bg-background/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Performance geral</h4>
                    <p className="text-sm text-muted-foreground">Visão consolidada</p>
                  </div>
                </div>
                {myTeamRank ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Sua equipa</span>
                      <Badge variant={myTeamRank.rank <= 3 ? 'success' : 'secondary'}>
                        Top {myTeamRank.rank}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {myTeamRank.rank <= 3 
                        ? 'Parabéns! A sua equipa está no topo do ranking.'
                        : 'Continue trabalhando para subir no ranking!'}
                    </div>
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
