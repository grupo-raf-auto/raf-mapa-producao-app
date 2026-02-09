import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient as api } from '@/lib/api-client';
import {
  FileStack,
  Users,
  MessageSquare,
  FileText,
  RefreshCw,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';
import { format, subDays, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DashboardMetricCard } from '@/components/ui/dashboard-metric-card';

interface UserStats {
  userId: string;
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  totalSubmissions: number;
  totalTemplates: number;
  totalQuestions: number;
  totalDocuments: number;
  processedDocuments: number;
  totalChunks: number;
  totalChatMessages: number;
  totalUserMessages: number;
  totalConversations: number;
  activeDaysLast30: number;
  submissionsByDay: Record<string, number>;
  templateDistribution: Record<string, number>;
  createdAt: Date;
}

function AnimatedSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-1 mt-6 first:mt-0"
    >
      {children}
    </h2>
  );
}

interface StatsData {
  users: UserStats[];
  stats: {
    totalUsers: number;
    activeUsersLast30: number;
    inactiveUsers: number;
    totalSubmissions: number;
    submissionsLast30: number;
    submissionsLast7: number;
    submissionsToday: number;
    avgSubmissionsPerUser: number;
    totalTemplates: number;
    totalQuestions: number;
    totalDocuments: number;
    processedDocuments: number;
    documentsLast30: number;
    documentsLast7: number;
    totalChunks: number;
    avgDocumentsPerUser: number;
    totalChatMessages: number;
    userMessages: number;
    assistantMessages: number;
    uniqueConversations: number;
    chatMessagesLast30: number;
    chatMessagesLast7: number;
    avgChatMessagesPerUser: number;
    avgActiveDays: number;
  };
  trends: {
    submissionsByDay: Record<string, number>;
    documentsByDay: Record<string, number>;
    chatMessagesByDay: Record<string, number>;
    userMessagesByDay?: Record<string, number>;
  };
}

export function UserPerformance() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<
    'submissions' | 'documents' | 'chat' | 'activity'
  >('submissions');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const raw = await api.users.getStats();
      // Backend pode devolver { success, data: { users, stats, trends } }
      const statsData = raw?.data ?? raw;
      setData(statsData);
    } catch (error: any) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">A carregar desempenho...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium">Nenhum dado disponível</p>
          <p className="text-sm mt-1">Verifique a ligação ou tente mais tarde.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para gráficos (últimos 30 dias)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const activityChartData = last30Days.map((date) => {
    return {
      date: format(parseISO(date), 'dd/MM'),
      submissions: data.trends.submissionsByDay[date] || 0,
      documents: data.trends.documentsByDay[date] || 0,
      chat:
        data.trends.userMessagesByDay?.[date] ??
        data.trends.chatMessagesByDay[date] ??
        0,
    };
  });

  // Ordenar utilizadores conforme seleção
  const sortedUsers = [...data.users].sort((a, b) => {
    switch (sortBy) {
      case 'submissions':
        return b.totalSubmissions - a.totalSubmissions;
      case 'documents':
        return b.totalDocuments - a.totalDocuments;
      case 'chat':
        return b.totalUserMessages - a.totalUserMessages;
      case 'activity':
        return b.activeDaysLast30 - a.activeDaysLast30;
      default:
        return 0;
    }
  });

  const topUsers = sortedUsers.slice(0, 10);

  // Cores do dashboard (mesmo padrão do dashboard de users)
  const CHART_SCALE = [...chartColors.scale];

  // Label curto para eixo X do gráfico de barras (email ou nome)
  const barChartData = topUsers.map((u) => {
    const name =
      u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email;
    return {
      ...u,
      displayName: name.length > 18 ? name.slice(0, 18).trim() + '…' : name,
    };
  });

  // Calcular taxa de processamento de documentos (apenas para card Documentos)
  const documentProcessingRate =
    data.stats.totalDocuments > 0
      ? Math.round(
          (data.stats.processedDocuments / data.stats.totalDocuments) * 100,
        )
      : 0;

  // Calcular taxa de engajamento (utilizadores ativos)
  const engagementRate =
    data.stats.totalUsers > 0
      ? Math.round((data.stats.activeUsersLast30 / data.stats.totalUsers) * 100)
      : 0;

  // Sparkline a partir da tendência de submissões (últimos 8 pontos)
  const sparklineSubmissions = last30Days
    .slice(-8)
    .map((d) => data.trends.submissionsByDay[d] || 0);
  const sparklineDocuments = last30Days
    .slice(-8)
    .map((d) => data.trends.documentsByDay[d] || 0);
  const sparklineChat = last30Days
    .slice(-8)
    .map(
      (d) =>
        data.trends.userMessagesByDay?.[d] ??
        data.trends.chatMessagesByDay[d] ??
        0,
    );

  return (
    <div
      className="space-y-5"
      role="region"
      aria-label="Desempenho dos utilizadores"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageHeader
            title="Desempenho"
            description="Métricas e indicadores de desempenho."
            icon={TrendingUp}
            iconGradient="from-red-600 via-red-500 to-red-700"
            decoratorIcon={<Shield className="w-5 h-5" />}
            decoratorColor="text-red-500"
          />
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards — mesmo padrão do dashboard de user */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardMetricCard
          title="Total de Utilizadores"
          value={data.stats.totalUsers}
          icon={Users}
          trendChange={`${data.stats.activeUsersLast30} ativos • ${engagementRate}% engajamento`}
          trendType="neutral"
          sparklineType="bars"
          sparklineData={sparklineSubmissions}
          colorVariant="blue"
          animationDelay={0}
        />
        <DashboardMetricCard
          title="Total de Submissões"
          value={data.stats.totalSubmissions}
          icon={FileStack}
          trendChange={`Média: ${data.stats.avgSubmissionsPerUser} por utilizador`}
          trendType="neutral"
          sparklineType="bars"
          sparklineData={sparklineSubmissions}
          colorVariant="teal"
          animationDelay={0.08}
        />
        <DashboardMetricCard
          title="Documentos"
          value={data.stats.totalDocuments}
          icon={FileText}
          trendChange={`${documentProcessingRate}% processados • ${data.stats.totalChunks} chunks`}
          trendType="neutral"
          sparklineType="bars"
          sparklineData={sparklineDocuments}
          colorVariant="green"
          animationDelay={0.16}
        />
        <DashboardMetricCard
          title="Mensagens de Chat"
          value={data.stats.userMessages}
          icon={MessageSquare}
          trendChange={`${data.stats.uniqueConversations} conversas`}
          trendType="neutral"
          sparklineType="bars"
          sparklineData={sparklineChat}
          colorVariant="red"
          animationDelay={0.24}
        />
      </div>

      {/* Secção: Atividade ao longo do tempo — mesmo estilo do dashboard */}
      <section aria-labelledby="topic-atividade">
        <SectionTitle id="topic-atividade">
          Atividade ao longo do tempo
        </SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
          <AnimatedSection delay={0}>
            <div className="chart-card h-full relative min-h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="chart-card-title">
                    Atividade ao Longo do Tempo
                  </h3>
                  <div className="chart-legend mt-2 flex items-center gap-3 flex-wrap">
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: chartColors.primary }}
                      />
                      Submissões
                    </span>
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: chartColors.secondary }}
                      />
                      Documentos
                    </span>
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: CHART_SCALE[2] }}
                      />
                      Chat
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Últimos 30 dias
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[260px] relative bg-white rounded">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activityChartData}
                    margin={{ top: 16, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={chartColors.grid}
                      vertical={false}
                      strokeWidth={1}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: chartColors.axis, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                      angle={-40}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis
                      tick={{ fill: chartColors.axis, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-4}
                      width={32}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <ChartTooltip
                            title={String(label ?? '')}
                            rows={[
                              {
                                label: 'Submissões',
                                value:
                                  payload.find(
                                    (p) => p.dataKey === 'submissions',
                                  )?.value != null
                                    ? Number(
                                        payload.find(
                                          (p) => p.dataKey === 'submissions',
                                        )?.value,
                                      ).toLocaleString('pt-PT')
                                    : '—',
                              },
                              {
                                label: 'Documentos',
                                value:
                                  payload.find((p) => p.dataKey === 'documents')
                                    ?.value != null
                                    ? Number(
                                        payload.find(
                                          (p) => p.dataKey === 'documents',
                                        )?.value,
                                      ).toLocaleString('pt-PT')
                                    : '—',
                              },
                              {
                                label: 'Chat',
                                value:
                                  payload.find((p) => p.dataKey === 'chat')
                                    ?.value != null
                                    ? Number(
                                        payload.find(
                                          (p) => p.dataKey === 'chat',
                                        )?.value,
                                      ).toLocaleString('pt-PT')
                                    : '—',
                              },
                            ]}
                          />
                        );
                      }}
                      cursor={{ stroke: chartColors.axis, strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke={chartColors.primary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="documents"
                      stroke={chartColors.secondary}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="chat"
                      stroke={CHART_SCALE[2]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Secção: Top 10 por desempenho — mesmo estilo do dashboard */}
      <section aria-labelledby="topic-desempenho">
        <SectionTitle id="topic-desempenho">
          Desempenho por utilizador
        </SectionTitle>
        <div className="grid grid-cols-1 gap-5">
          <AnimatedSection delay={0.1}>
            <div className="chart-card h-full min-h-[360px]">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="chart-card-title">
                    Indicadores de desempenho por utilizador
                  </h3>
                  <div className="chart-legend mt-2 flex items-center gap-3 flex-wrap">
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: CHART_SCALE[0] }}
                      />
                      Submissões
                    </span>
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: CHART_SCALE[1] }}
                      />
                      Documentos
                    </span>
                    <span className="chart-legend-item">
                      <span
                        className="chart-legend-dot"
                        style={{ backgroundColor: CHART_SCALE[2] }}
                      />
                      Mensagens
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={sortBy === 'submissions' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('submissions')}
                  >
                    Submissões
                  </Button>
                  <Button
                    variant={sortBy === 'documents' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('documents')}
                  >
                    Documentos
                  </Button>
                  <Button
                    variant={sortBy === 'chat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('chat')}
                  >
                    Chat
                  </Button>
                  <Button
                    variant={sortBy === 'activity' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('activity')}
                  >
                    Atividade
                  </Button>
                </div>
              </div>
              <div className="h-[320px] relative bg-white rounded">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
                    barCategoryGap="28%"
                    barGap={3}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={chartColors.grid}
                      vertical={false}
                      strokeWidth={1}
                    />
                    <XAxis
                      dataKey="displayName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.axis, fontSize: 12 }}
                      dy={8}
                      angle={-35}
                      textAnchor="end"
                      height={64}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: chartColors.axis, fontSize: 12 }}
                      tickFormatter={(v) => Number(v).toFixed(0)}
                      dx={-4}
                      width={32}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const u = payload[0].payload;
                        const name =
                          (u.firstName && u.lastName
                            ? `${u.firstName} ${u.lastName}`
                            : u.email) || '—';
                        return (
                          <ChartTooltip
                            title={name}
                            rows={[
                              {
                                label: 'Submissões',
                                value: (u.totalSubmissions ?? 0).toLocaleString(
                                  'pt-PT',
                                ),
                              },
                              {
                                label: 'Documentos',
                                value: (u.totalDocuments ?? 0).toLocaleString(
                                  'pt-PT',
                                ),
                              },
                              {
                                label: 'Mensagens',
                                value: (
                                  u.totalUserMessages ?? 0
                                ).toLocaleString('pt-PT'),
                              },
                            ]}
                          />
                        );
                      }}
                      cursor={{ stroke: chartColors.axis, strokeWidth: 1 }}
                    />
                    <Bar
                      dataKey="totalSubmissions"
                      fill={CHART_SCALE[0]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="totalDocuments"
                      fill={CHART_SCALE[1]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="totalUserMessages"
                      fill={CHART_SCALE[2]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Tabela completa de desempenho */}
      <section aria-labelledby="topic-tabela">
        <SectionTitle id="topic-tabela">
          Tabela completa de desempenho
        </SectionTitle>
        <AnimatedSection delay={0.2}>
          <div className="performance-table-card">
            <div className="performance-table-header">
              <span className="performance-table-count">
                {sortedUsers.length} utilizadores
              </span>
            </div>
            <div className="performance-table-scroll">
              <Table className="performance-table">
                <TableHeader>
                  <TableRow className="performance-table-header-row">
                    <TableHead className="performance-table-head performance-table-head-user">
                      Utilizador
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Submissões
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Documentos
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Processados
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Chunks
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Mensagens
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Conversas
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Dias ativos
                    </TableHead>
                    <TableHead className="performance-table-head performance-table-head-num text-right">
                      Registado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow
                      key={user.userId}
                      className="performance-table-row"
                    >
                      <TableCell className="performance-table-cell performance-table-cell-user">
                        <div className="performance-table-user">
                          <div className="performance-table-user-name-row">
                            <span className="performance-table-user-name">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </span>
                            {user.role === 'admin' ? (
                              <Badge
                                variant="default"
                                className="performance-table-badge-role"
                              >
                                Admin
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="performance-table-badge-role"
                              >
                                User
                              </Badge>
                            )}
                          </div>
                          <span className="performance-table-user-email">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        {user.totalSubmissions}
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        {user.totalDocuments}
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        <span>
                          {user.processedDocuments}
                          {user.totalDocuments > 0 && (
                            <span className="performance-table-meta">
                              {Math.round(
                                (user.processedDocuments /
                                  user.totalDocuments) *
                                  100,
                              )}
                              %
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        {user.totalChunks}
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        {user.totalUserMessages}
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums">
                        {user.totalConversations}
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right">
                        <div className="performance-table-activity">
                          <span className="tabular-nums">
                            {user.activeDaysLast30}
                          </span>
                          {user.activeDaysLast30 >= 20 && (
                            <Badge
                              variant="default"
                              className="performance-table-badge"
                            >
                              Alto
                            </Badge>
                          )}
                          {user.activeDaysLast30 >= 10 &&
                            user.activeDaysLast30 < 20 && (
                              <Badge
                                variant="secondary"
                                className="performance-table-badge"
                              >
                                Médio
                              </Badge>
                            )}
                          {user.activeDaysLast30 < 10 &&
                            user.activeDaysLast30 > 0 && (
                              <Badge
                                variant="outline"
                                className="performance-table-badge"
                              >
                                Baixo
                              </Badge>
                            )}
                          {user.activeDaysLast30 === 0 && (
                            <Badge
                              variant="destructive"
                              className="performance-table-badge"
                            >
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="performance-table-cell performance-table-cell-num text-right tabular-nums performance-table-date">
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
