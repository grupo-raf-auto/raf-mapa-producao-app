'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient as api } from '@/lib/api-client';
import {
  FileStack,
  Users,
  MessageSquare,
  FileText,
  RefreshCw,
} from 'lucide-react';
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
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Spinner variant="bars" className="w-6 h-6" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum dado disponível
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
      chat: data.trends.chatMessagesByDay[date] || 0,
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
        return b.totalChatMessages - a.totalChatMessages;
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

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Desempenho dos Utilizadores</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão completa de todas as métricas e indicadores de desempenho
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Métricas Principais - Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Utilizadores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {data.stats.activeUsersLast30} ativos (30 dias)
              </p>
              <Badge variant="secondary" className="text-xs">
                {engagementRate}% engajamento
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média {data.stats.avgActiveDays} dias ativos (30 dias)
            </p>
            {data.stats.inactiveUsers > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.stats.inactiveUsers} inativos
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Submissões
            </CardTitle>
            <FileStack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalSubmissions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {data.stats.avgSubmissionsPerUser} por utilizador
            </p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                Hoje: {data.stats.submissionsToday}
              </span>
              <span className="text-muted-foreground">
                7 dias: {data.stats.submissionsLast7}
              </span>
              <span className="text-muted-foreground">
                30 dias: {data.stats.submissionsLast30}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documentos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.processedDocuments} processados (
              {documentProcessingRate}%)
            </p>
            <p className="text-xs text-muted-foreground">
              {data.stats.totalChunks} chunks indexados • Média:{' '}
              {data.stats.avgDocumentsPerUser} por utilizador
            </p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                7 dias: {data.stats.documentsLast7}
              </span>
              <span className="text-muted-foreground">
                30 dias: {data.stats.documentsLast30}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensagens de Chat
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalChatMessages}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.uniqueConversations} conversas • Média:{' '}
              {data.stats.avgChatMessagesPerUser} por utilizador
            </p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                Utilizador: {data.stats.userMessages}
              </span>
              <span className="text-muted-foreground">
                Assistente: {data.stats.assistantMessages}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                7 dias: {data.stats.chatMessagesLast7}
              </span>
              <span className="text-muted-foreground">
                30 dias: {data.stats.chatMessagesLast30}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendências - Atividade ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade ao Longo do Tempo</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Últimos 30 dias</p>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activityChartData}
                margin={{ top: 8, right: 12, left: -5, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                  vertical={false}
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-40}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
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
                              payload.find((p) => p.dataKey === 'submissions')
                                ?.value != null
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
                                    payload.find((p) => p.dataKey === 'chat')
                                      ?.value,
                                  ).toLocaleString('pt-PT')
                                : '—',
                          },
                        ]}
                      />
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColors.primary }}
                />
                <Line
                  type="monotone"
                  dataKey="documents"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColors.secondary }}
                />
                <Line
                  type="monotone"
                  dataKey="chat"
                  stroke={CHART_SCALE[2]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_SCALE[2] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2.5 h-0.5 rounded-full shrink-0"
                style={{ backgroundColor: chartColors.primary }}
              />
              Submissões
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2.5 h-0.5 rounded-full shrink-0"
                style={{ backgroundColor: chartColors.secondary }}
              />
              Documentos
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2.5 h-0.5 rounded-full shrink-0"
                style={{ backgroundColor: CHART_SCALE[2] }}
              />
              Chat
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Top 10 Utilizadores */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Top 10 por desempenho</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Submissões, documentos e mensagens de chat
              </p>
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
        </CardHeader>
        <CardContent>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={chartColors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="displayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  height={64}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 10 }}
                  width={36}
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
                            value: (u.totalChatMessages ?? 0).toLocaleString(
                              'pt-PT',
                            ),
                          },
                        ]}
                      />
                    );
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                />
                <Bar
                  dataKey="totalSubmissions"
                  fill={CHART_SCALE[0]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="totalDocuments"
                  fill={CHART_SCALE[1]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="totalChatMessages"
                  fill={CHART_SCALE[2]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-border/50"
                style={{ backgroundColor: CHART_SCALE[0] }}
              />
              Submissões
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-border/50"
                style={{ backgroundColor: CHART_SCALE[1] }}
              />
              Documentos
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-border/50"
                style={{ backgroundColor: CHART_SCALE[2] }}
              />
              Mensagens
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Completa de Utilizadores */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tabela Completa de Desempenho</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Indicadores de uso por utilizador
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead className="text-right">Submissões</TableHead>
                  <TableHead className="text-right">Documentos</TableHead>
                  <TableHead className="text-right">Processados</TableHead>
                  <TableHead className="text-right">Chunks</TableHead>
                  <TableHead className="text-right">Mensagens</TableHead>
                  <TableHead className="text-right">Conversas</TableHead>
                  <TableHead className="text-right">Dias Ativos</TableHead>
                  <TableHead className="text-right">Registado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        {user.role === 'admin' && (
                          <Badge variant="secondary" className="mt-1">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.totalSubmissions}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalDocuments}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.processedDocuments}
                      {user.totalDocuments > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {Math.round(
                            (user.processedDocuments / user.totalDocuments) *
                              100,
                          )}
                          %)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalChunks}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalChatMessages}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalConversations}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">
                          {user.activeDaysLast30}
                        </span>
                        {user.activeDaysLast30 >= 20 && (
                          <Badge variant="default" className="text-xs">
                            Alto
                          </Badge>
                        )}
                        {user.activeDaysLast30 >= 10 &&
                          user.activeDaysLast30 < 20 && (
                            <Badge variant="secondary" className="text-xs">
                              Médio
                            </Badge>
                          )}
                        {user.activeDaysLast30 < 10 &&
                          user.activeDaysLast30 > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Baixo
                            </Badge>
                          )}
                        {user.activeDaysLast30 === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
