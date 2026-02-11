import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { Podium, type PodiumEntry } from '@/components/ui/podium';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Users, Trophy } from 'lucide-react';

interface TeamRanking {
  id: string;
  name: string;
  description?: string;
  score: number;
  rank: number;
}

function EquipasContent() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string; description?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setMyTeam(team && typeof team === 'object' && 'id' in team ? team as { id: string; name: string; description?: string | null } : null);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipas</h1>
        <p className="text-muted-foreground mt-1">
          Métricas e ranking da sua equipa e comparação com as restantes.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {myTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Sua equipa</CardTitle>
                <CardDescription>{myTeam.name}</CardDescription>
                {myTeam.description && (
                  <p className="text-sm text-muted-foreground mt-1">{myTeam.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Ranking de equipas</h2>
        </div>
        {rankings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Ainda não há dados de ranking. As equipas aparecem aqui consoante as submissões.
            </CardContent>
          </Card>
        ) : (
          <Podium
            entries={podiumEntries}
            title="Top equipas"
            showScores
          />
        )}
      </section>
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
