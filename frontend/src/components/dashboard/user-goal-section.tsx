import { useState, useEffect } from 'react';
import {
  Target,
  Euro,
  FileStack,
  Shield,
  Home,
  Check,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient as api } from '@/lib/api-client';
import { chartColors } from '@/lib/design-system';
import { useModelContext } from '@/contexts/model-context';
import type { ModelType } from '@/contexts/model-context';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/line-chart';
import { GoalProgressCard } from './goal-progress-card';
import { ShineBorder } from '@/components/ui/shine-border';

const ICONS = { FileStack, Euro, Shield, Home } as const;

/** Opções de objetivo por modelo de negócio (apenas as que o modelo calcula) */
function getGoalOptionsForModel(modelType: ModelType | undefined) {
  if (modelType === 'seguro') {
    return [
      {
        id: 'policies_monthly' as const,
        label: 'Apólices mensais',
        description: 'Número de apólices por mês',
        icon: 'Shield' as keyof typeof ICONS,
        color: chartColors.scale[2],
      },
      {
        id: 'value_monthly' as const,
        label: 'Valor mensal (€)',
        description: 'Volume total em euros por mês',
        icon: 'Euro' as keyof typeof ICONS,
        color: chartColors.secondary,
      },
    ];
  }
  if (modelType === 'imobiliaria') {
    return [
      {
        id: 'submissions_monthly' as const,
        label: 'Negócios mensais',
        description: 'Número de negócios/imóveis por mês',
        icon: 'FileStack' as keyof typeof ICONS,
        color: chartColors.primary,
      },
      {
        id: 'value_monthly' as const,
        label: 'Volume de vendas (€)',
        description: 'Valor total de vendas por mês',
        icon: 'Euro' as keyof typeof ICONS,
        color: chartColors.secondary,
      },
    ];
  }
  // credito (default)
  return [
    {
      id: 'submissions_monthly' as const,
      label: 'Produção mensal',
      description: 'Número de submissões por mês',
      icon: 'FileStack' as keyof typeof ICONS,
      color: chartColors.primary,
    },
    {
      id: 'value_monthly' as const,
      label: 'Valor em € mensal',
      description: 'Volume total em euros por mês',
      icon: 'Euro' as keyof typeof ICONS,
      color: chartColors.secondary,
    },
  ];
}

type GoalType =
  | 'submissions_monthly'
  | 'value_monthly'
  | 'policies_monthly';

interface GoalResponse {
  goal: {
    id: string;
    goalType: string;
    targetValue: number;
    period: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  progress: {
    currentValue: number;
    targetValue: number;
    progressPercent: number;
    monthlyTotal: number;
    monthlyValue: number;
    yearlyTotal: number;
    yearlyValue: number;
  };
}

function formatValue(value: number, goalType: string): string {
  if (goalType === 'value_monthly') {
    return value.toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString('pt-PT');
}

interface GoalDefineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelType: ModelType | undefined;
  initialGoal: GoalResponse['goal'];
  onSaved: () => void;
}

function GoalDefineModal({
  open,
  onOpenChange,
  modelType,
  initialGoal,
  onSaved,
}: GoalDefineModalProps) {
  const options = getGoalOptionsForModel(modelType);
  const [selectedType, setSelectedType] = useState<GoalType>(
    (initialGoal?.goalType as GoalType) || 'submissions_monthly',
  );
  const [targetInput, setTargetInput] = useState(
    initialGoal ? String(Math.round(Number(initialGoal.targetValue))) : '',
  );
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(
    (initialGoal?.period as 'monthly' | 'yearly') || 'monthly',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedType(
        (initialGoal?.goalType as GoalType) || 'submissions_monthly',
      );
      setTargetInput(
        initialGoal
          ? String(Math.round(Number(initialGoal.targetValue)))
          : '',
      );
      setPeriod(
        (initialGoal?.period as 'monthly' | 'yearly') || 'monthly',
      );
    }
  }, [open, initialGoal]);

  const handleSave = async () => {
    const value = Math.max(0, Number(targetInput) || 0);
    if (value <= 0) return;
    setSaving(true);
    try {
      await api.user.setGoal({
        goalType: selectedType,
        targetValue: value,
        period,
      });
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl md:max-w-2xl w-[calc(100%-2rem)]"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Definir objetivo</DialogTitle>
          <DialogDescription className="text-base">
            Escolha o tipo de objetivo e o valor que pretende atingir no seu
            modelo atual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((opt) => {
              const Icon = ICONS[opt.icon];
              const isSelected = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedType(opt.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <Icon className="h-6 w-6" style={{ color: opt.color }} />
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="goal-target-modal"
                className="text-sm font-medium text-foreground"
              >
                Valor do objetivo
              </label>
              <input
                id="goal-target-modal"
                type="number"
                min={1}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder={
                  selectedType === 'value_monthly' ? 'Ex: 50000' : 'Ex: 10'
                }
                className="rounded-xl border border-input bg-background px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Período
              </span>
              <div className="flex rounded-xl border border-input overflow-hidden bg-muted/30">
                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    period === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('yearly')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    period === 'yearly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !targetInput || Number(targetInput) <= 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Guardar objetivo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MonthlyDatum {
  month: string;
  count: number;
  totalValue: number;
}

interface UserGoalSectionProps {
  /** Dados mensais para o gráfico de evolução (opcional) */
  monthlyData?: MonthlyDatum[];
}

export function UserGoalSection({ monthlyData = [] }: UserGoalSectionProps) {
  const { activeModel } = useModelContext();
  const [data, setData] = useState<GoalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const res = (await api.user.getGoal()) as GoalResponse;
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, [activeModel?.id]);

  const options = getGoalOptionsForModel(activeModel?.modelType);
  const hasGoal = data?.goal && Number(data.goal.targetValue) > 0;
  const progress = data?.progress;
  const goalType = data?.goal?.goalType ?? 'submissions_monthly';
  const option =
    options.find((o) => o.id === goalType) || options[0];

  // Cores do card alinhadas ao dropdown de modelos na navbar (model-selector)
  const modelCardStyles: Record<string, string> = {
    credito:
      'border border-blue-200/80 dark:border-blue-500/20 bg-linear-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/50 dark:via-slate-800/60 dark:to-slate-800/40 shadow-lg shadow-blue-500/10',
    imobiliaria:
      'border border-orange-200/80 dark:border-orange-500/20 bg-linear-to-br from-orange-50/90 via-amber-50/40 to-white dark:from-orange-950/50 dark:via-slate-800/60 dark:to-slate-800/40 shadow-lg shadow-orange-500/10',
    seguro:
      'border border-emerald-200/80 dark:border-emerald-500/20 bg-linear-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/50 dark:via-slate-800/60 dark:to-slate-800/40 shadow-lg shadow-emerald-500/10',
  };
  const cardClassName =
    modelCardStyles[activeModel?.modelType ?? ''] ??
    'border border-slate-200/80 dark:border-slate-500/20 bg-linear-to-br from-slate-50/90 via-slate-50/40 to-white dark:from-slate-900/50 dark:via-slate-800/60 dark:to-slate-800/40 shadow-lg shadow-slate-500/5';

  const isValueGoal = goalType === 'value_monthly';
  const chartData = monthlyData.slice(-12).map((m) => ({
    month: m.month,
    current: isValueGoal ? m.totalValue : m.count,
    target: hasGoal && data?.goal ? Number(data.goal.targetValue) : 0,
  }));

  // Calcular progresso esperado baseado no tempo decorrido
  const calculateExpectedProgress = (): {
    expectedPercent: number;
    isAheadOfPace: boolean;
    paceDifferencePercent: number;
  } => {
    if (!hasGoal || !data?.goal) {
      return { expectedPercent: 0, isAheadOfPace: true, paceDifferencePercent: 0 };
    }

    const now = new Date();
    const period = data.goal.period || 'monthly';
    let expectedPercent = 0;

    if (period === 'monthly') {
      // Calcular quantos dias do mês já passaram
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      const daysElapsed = Math.floor(
        (now.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1; // +1 para incluir o dia atual
      expectedPercent = Math.min(100, (daysElapsed / daysInMonth) * 100);
    } else {
      // Anual: calcular quantos dias do ano já passaram
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
      const daysInYear = Math.ceil(
        (lastDayOfYear.getTime() - firstDayOfYear.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1; // +1 para incluir o último dia
      const daysElapsed =
        Math.floor(
          (now.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1; // +1 para incluir o dia atual
      expectedPercent = Math.min(100, (daysElapsed / daysInYear) * 100);
    }

    const actualProgress = progress?.progressPercent || 0;
    const paceDifference = actualProgress - expectedPercent;
    const isAheadOfPace = paceDifference >= 0;

    return {
      expectedPercent,
      isAheadOfPace,
      paceDifferencePercent: Math.abs(paceDifference),
    };
  };

  const paceInfo = calculateExpectedProgress();

  if (loading) {
    return (
      <section aria-label="Objetivo">
        <Card className={`overflow-hidden ${cardClassName}`}>
          <CardContent className="py-12 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Objetivo do utilizador" className="space-y-4">
      {/* Card principal de objetivos - redesenhado */}
      <ShineBorder
        borderRadius={16}
        borderWidth={3}
        duration={12}
        color={[
          option.color || '#B91C1C',
          chartColors.secondary || '#0D9488',
          option.color || '#B91C1C',
        ]}
        className="shadow-lg overflow-hidden"
      >
        <Card className="border-0 shadow-none bg-linear-to-br from-white via-white to-gray-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 h-full w-full" style={{ borderRadius: '13px' }}>
          <CardHeader className="pb-2 pt-3 px-4 border-b border-gray-100 dark:border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${option.color}15, ${option.color}25)`,
                  border: `1px solid ${option.color}30`,
                }}
              >
                <Target className="h-4 w-4" style={{ color: option.color }} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0">
                  O meu objetivo
                </CardTitle>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  {hasGoal
                    ? `${option.label} • ${data?.goal?.period === 'yearly' ? 'Anual' : 'Mensal'}`
                    : 'Defina um objetivo para acompanhar as suas métricas'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Settings2 className="h-3 w-3" />
              {hasGoal ? 'Alterar' : 'Definir'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-4 pb-4">
          {hasGoal && progress ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3">
              {/* Coluna esquerda: Métricas + Progresso vs ritmo */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                      Valor atual
                    </p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 tabular-nums truncate">
                      {formatValue(progress.currentValue, goalType)}
                    </p>
                  </div>
                  <div className="rounded-md bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                      Objetivo
                    </p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 tabular-nums truncate">
                      {formatValue(progress.targetValue, goalType)}
                    </p>
                  </div>
                </div>
                <GoalProgressCard
                  progressPercent={progress.progressPercent}
                  expectedProgressPercent={paceInfo.expectedPercent}
                  isAheadOfPace={paceInfo.isAheadOfPace}
                  paceDifferencePercent={paceInfo.paceDifferencePercent}
                />
              </div>

              {/* Coluna direita: Gráfico de evolução */}
              {progress.targetValue > 0 && chartData.length > 0 ? (
                <div className="rounded-lg bg-white/60 dark:bg-slate-800/40 border border-gray-200/50 dark:border-slate-700/50 p-3 flex flex-col">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Evolução temporal
                  </span>
                  <div className="h-[90px] w-full">
                    <ChartContainer
                      config={{
                        current: {
                          label: 'Atual',
                          color: chartColors.primary,
                        },
                      } satisfies ChartConfig}
                      className="h-full w-full !aspect-auto"
                    >
                      <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={6}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => {
                            const s = String(v);
                            return s.length >= 7 ? s.slice(0, 7) : s;
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) =>
                            isValueGoal
                              ? `${(v / 1000).toFixed(0)}k`
                              : String(v)
                          }
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value) =>
                                isValueGoal && typeof value === 'number'
                                  ? formatValue(value, 'value_monthly')
                                  : typeof value === 'number'
                                    ? value.toLocaleString('pt-PT')
                                    : String(value ?? '')
                              }
                            />
                          }
                        />
                        {progress.targetValue > 0 && (
                          <ReferenceLine
                            y={progress.targetValue}
                            stroke={chartColors.secondary}
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                          />
                        )}
                        <Line
                          dataKey="current"
                          name="Atual"
                          type="linear"
                          stroke="var(--color-current)"
                          dot={false}
                          strokeDasharray="4 4"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-white/60 dark:bg-slate-800/40 border border-gray-200/50 dark:border-slate-700/50 p-3 flex items-center justify-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sem dados de evolução</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 mb-2">
                <Target className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5 font-medium">
                Nenhum objetivo definido
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Clique em &quot;Definir&quot; para começar
              </p>
            </div>
          )}
        </CardContent>
        </Card>
      </ShineBorder>

      <GoalDefineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        modelType={activeModel?.modelType}
        initialGoal={data?.goal ?? null}
        onSaved={loadGoal}
      />
    </section>
  );
}
