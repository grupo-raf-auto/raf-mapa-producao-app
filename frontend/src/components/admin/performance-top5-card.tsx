import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
import { Landmark, Home, Shield } from 'lucide-react';

interface UserModelProfile {
  id: string;
  modelType: string;
  creditoProfile?: { totalProduction: number; activeClients: number } | null;
  imobiliariaProfile?: { totalSales: number; activeListings: number } | null;
  seguroProfile?: { totalPremiums: number; activePolicies: number } | null;
}

interface TeamMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  image?: string | null;
  userModels?: UserModelProfile[];
  submissionsCount?: number;
}

type ModelType = 'credito' | 'imobiliaria' | 'seguro';

const MODELS: {
  type: ModelType;
  label: string;
  icon: typeof Landmark;
  gradientColors: { primary: string; secondary: string; accent: string };
}[] = [
  { type: 'credito', label: 'Crédito', icon: Landmark, gradientColors: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#93c5fd' } },
  { type: 'imobiliaria', label: 'Imobiliária', icon: Home, gradientColors: { primary: '#14532d', secondary: '#22c55e', accent: '#86efac' } },
  { type: 'seguro', label: 'Seguros', icon: Shield, gradientColors: { primary: '#3b1f6e', secondary: '#8b5cf6', accent: '#c4b5fd' } },
];

function getDisplayName(m: TeamMember): string {
  if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`.trim();
  if (m.name) return m.name;
  return m.email?.split('@')[0] ?? 'Utilizador';
}

function getInitials(m: TeamMember): string {
  if (m.firstName && m.lastName) return `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
  if (m.name) return m.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (m.email) return m.email.slice(0, 2).toUpperCase();
  return '?';
}

function getMetricForModel(member: TeamMember, modelType: ModelType): number {
  if (modelType === 'seguro') {
    return member.submissionsCount ?? 0;
  }
  const um = member.userModels?.find((u) => u.modelType === modelType);
  if (!um) return 0;
  if (modelType === 'credito' && um.creditoProfile) return Number(um.creditoProfile.totalProduction) || 0;
  if (modelType === 'imobiliaria' && um.imobiliariaProfile) return Number(um.imobiliariaProfile.totalSales) || 0;
  return 0;
}

function formatMetric(value: number, modelType: ModelType): string {
  if (modelType === 'seguro') return `${value} ${value === 1 ? 'apólice' : 'apólices'}`;
  return value.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
}

/** Shuffle array deterministically by seed (each model gets different order) */
function shuffledBySeed<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  for (let i = copy.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const RANK_STYLES = [
  'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  'bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
];

function PerformanceCard({
  model,
  members,
}: {
  model: (typeof MODELS)[number];
  members: TeamMember[];
}) {
  const withMetrics = members
    .map((m) => ({ member: m, value: getMetricForModel(m, model.type) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const top3 =
    withMetrics.length > 0
      ? withMetrics.slice(0, 3)
      : shuffledBySeed(members, model.type)
          .slice(0, 3)
          .map((m) => ({ member: m, value: 0 }));

  const Icon = model.icon;

  return (
    <BorderRotate
      gradientColors={model.gradientColors}
      backgroundColor="var(--card)"
      borderRadius={12}
      borderWidth={2}
      className="flex-1 min-w-0"
    >
    <Card className="rounded-xl border-0 overflow-hidden h-full">
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{model.label}</h3>
            <p className="text-xs text-muted-foreground">Top 3</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
        {top3.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sem colaboradores.
          </p>
        ) : (
          <ul className="space-y-2">
            {top3.map(({ member, value }, index) => {
              const rank = index + 1;
              const rankStyle = RANK_STYLES[index] ?? RANK_STYLES[5];
              return (
                <li
                  key={member.id}
                  className="flex items-center gap-2 py-2 px-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${rankStyle}`}
                  >
                    {rank}
                  </span>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={member.image || undefined} alt={getDisplayName(member)} />
                    <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{getDisplayName(member)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                    {value > 0 ? formatMetric(value, model.type) : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
    </BorderRotate>
  );
}

export function PerformanceTop5Card() {
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient.teams
      .getList(true)
      .then((teams) => {
        if (cancelled) return;
        const list = Array.isArray(teams) ? teams : [];
        return Promise.all(
          list.map((t: { id: string }) =>
            apiClient.teams.getMembers(t.id).catch(() => [])
          )
        ).then((results) => {
          if (cancelled) return;
          const seen = new Set<string>();
          const members: TeamMember[] = [];
          results.forEach((arr) => {
            const items = Array.isArray(arr) ? arr : [];
            items.forEach((m: TeamMember) => {
              if (!seen.has(m.id)) {
                seen.add(m.id);
                members.push(m);
              }
            });
          });
          setAllMembers(members);
        });
      })
      .catch(() => {
        if (!cancelled) setAllMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {MODELS.map((model) => {
          const Icon = model.icon;
          return (
          <BorderRotate
            key={model.type}
            gradientColors={model.gradientColors}
            backgroundColor="var(--card)"
            borderRadius={12}
            borderWidth={2}
            className="flex-1 min-w-0"
          >
          <Card className="rounded-xl border-0 overflow-hidden h-full">
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{model.label}</h3>
                  <p className="text-xs text-muted-foreground">Top 3</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
              <div className="flex items-center justify-center py-8">
                <Spinner variant="bars" className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          </BorderRotate>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {MODELS.map((model) => (
        <PerformanceCard key={model.type} model={model} members={allMembers} />
      ))}
    </div>
  );
}
