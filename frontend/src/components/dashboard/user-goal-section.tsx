import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

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
  const IconComponent = ICONS[option.icon];

  // Cores do card alinhadas ao dropdown de modelos na navbar (model-selector)
  const modelCardStyles: Record<
    string,
    { card: string; loading?: string }
  > = {
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
    <section aria-label="Objetivo do utilizador">
      <Card className={`overflow-hidden ${cardClassName}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--goal-icon-bg) text-(--goal-icon)"
                style={{
                  ['--goal-icon-bg' as string]: `${option.color}18`,
                  ['--goal-icon' as string]: option.color,
                }}
              >
                <Target className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  O meu objetivo
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {hasGoal
                    ? 'Acompanhe o seu progresso em relação à meta definida.'
                    : 'Defina um objetivo para acompanhar as suas métricas.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/60 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary transition-colors shadow-sm"
            >
              <Settings2 className="h-4 w-4" />
              {hasGoal ? 'Alterar objetivo' : 'Definir objetivo'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {/* Bloco de métricas do objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/50 border border-border/60 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/80">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor atual
                </p>
                <p className="text-lg font-bold tabular-nums truncate">
                  {progress
                    ? formatValue(progress.currentValue, goalType)
                    : '—'}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/50 border border-border/60 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/80">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Objetivo
                </p>
                <p className="text-lg font-bold tabular-nums truncate">
                  {progress && hasGoal
                    ? formatValue(progress.targetValue, goalType)
                    : '—'}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary uppercase tracking-wider">
                  Progresso
                </p>
                <p className="text-xl font-bold tabular-nums text-primary">
                  {progress?.progressPercent ?? 0}%
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/50 border border-border/60 p-4 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Estado
              </p>
              <p className="text-sm font-semibold text-foreground">
                {hasGoal
                  ? `Objetivo: ${option.label}`
                  : 'Sem objetivo definido'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasGoal
                  ? 'Altere quando quiser.'
                  : 'Clique em "Definir objetivo".'}
              </p>
            </div>
          </div>

          {/* Barra e gráfico (só com objetivo definido) */}
          {progress && progress.targetValue > 0 && (
            <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-border/50 p-4 sm:p-5 space-y-5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Evolução vs objetivo
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatValue(progress.currentValue, goalType)} /{' '}
                  {formatValue(progress.targetValue, goalType)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, progress.progressPercent)}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {chartData.length > 0 && (
                <div className="h-[220px] w-full -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="goalCurrent"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors.primary}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors.primary}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: chartColors.axis }}
                        tickFormatter={(v) => {
                          const s = String(v);
                          return s.length >= 7 ? s.slice(0, 7) : s;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chartColors.axis }}
                        tickFormatter={(v) =>
                          isValueGoal
                            ? `${(v / 1000).toFixed(0)}k`
                            : String(v)
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value: number) => [
                          isValueGoal
                            ? formatValue(value, 'value_monthly')
                            : value,
                          'Atual',
                        ]}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      {progress.targetValue > 0 && (
                        <ReferenceLine
                          y={progress.targetValue}
                          stroke={chartColors.secondary}
                          strokeDasharray="4 4"
                          strokeWidth={2}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke={chartColors.primary}
                        strokeWidth={2}
                        fill="url(#goalCurrent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
