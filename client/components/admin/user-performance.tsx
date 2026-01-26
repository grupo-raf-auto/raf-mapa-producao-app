"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient as api } from "@/lib/api-client";
import {
  TrendingUp,
  FileStack,
  HelpCircle,
  Users,
  MessageSquare,
  FileText,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE"];

export function UserPerformance() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"submissions" | "documents" | "chat" | "activity">("submissions");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await api.users.getStats();
      setData(statsData);
    } catch (error: any) {
      console.error("Error loading user stats:", error);
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
    return format(date, "yyyy-MM-dd");
  });

  const activityChartData = last30Days.map((date) => {
    return {
      date: format(parseISO(date), "dd/MM"),
      submissions: data.trends.submissionsByDay[date] || 0,
      documents: data.trends.documentsByDay[date] || 0,
      chat: data.trends.chatMessagesByDay[date] || 0,
    };
  });

  // Ordenar utilizadores conforme seleção
  const sortedUsers = [...data.users].sort((a, b) => {
    switch (sortBy) {
      case "submissions":
        return b.totalSubmissions - a.totalSubmissions;
      case "documents":
        return b.totalDocuments - a.totalDocuments;
      case "chat":
        return b.totalChatMessages - a.totalChatMessages;
      case "activity":
        return b.activeDaysLast30 - a.activeDaysLast30;
      default:
        return 0;
    }
  });

  const topUsers = sortedUsers.slice(0, 10);

  // Dados para gráfico de pizza - Distribuição de atividade
  const activityDistribution = [
    {
      name: "Submissões",
      value: data.stats.totalSubmissions,
    },
    {
      name: "Documentos",
      value: data.stats.totalDocuments,
    },
    {
      name: "Mensagens Chat",
      value: data.stats.totalChatMessages,
    },
  ];

  // Calcular taxa de processamento de documentos
  const documentProcessingRate =
    data.stats.totalDocuments > 0
      ? Math.round(
          (data.stats.processedDocuments / data.stats.totalDocuments) * 100,
        )
      : 0;

  // Calcular taxa de engajamento (utilizadores ativos)
  const engagementRate =
    data.stats.totalUsers > 0
      ? Math.round(
          (data.stats.activeUsersLast30 / data.stats.totalUsers) * 100,
        )
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
              {data.stats.processedDocuments} processados ({documentProcessingRate}%)
            </p>
            <p className="text-xs text-muted-foreground">
              {data.stats.totalChunks} chunks indexados • Média:{" "}
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
              {data.stats.uniqueConversations} conversas • Média:{" "}
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

      {/* Cards de Métricas Secundárias - Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates Criados
            </CardTitle>
            <FileStack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalTemplates}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.users.filter((u) => u.totalTemplates > 0).length} utilizadores
              criaram templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questões Criadas
            </CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalQuestions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.users.filter((u) => u.totalQuestions > 0).length} utilizadores
              criaram questões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dias Médios Ativos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.avgActiveDays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de dias ativos nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Processamento
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentProcessingRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos processados e indexados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Atividade ao Longo do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade ao Longo do Tempo</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimos 30 dias - Comparação de atividades
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="#007AFF"
                  strokeWidth={2}
                  dot={{ fill: "#007AFF", r: 3 }}
                  name="Submissões"
                />
                <Line
                  type="monotone"
                  dataKey="documents"
                  stroke="#34C759"
                  strokeWidth={2}
                  dot={{ fill: "#34C759", r: 3 }}
                  name="Documentos"
                />
                <Line
                  type="monotone"
                  dataKey="chat"
                  stroke="#FF9500"
                  strokeWidth={2}
                  dot={{ fill: "#FF9500", r: 3 }}
                  name="Chat"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição de Atividade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Atividade</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Proporção entre diferentes tipos de atividade
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras - Top 10 Utilizadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 10 Utilizadores por Desempenho</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comparação dos principais indicadores
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "submissions" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("submissions")}
              >
                Submissões
              </Button>
              <Button
                variant={sortBy === "documents" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("documents")}
              >
                Documentos
              </Button>
              <Button
                variant={sortBy === "chat" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("chat")}
              >
                Chat
              </Button>
              <Button
                variant={sortBy === "activity" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("activity")}
              >
                Atividade
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topUsers.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="email"
                stroke="#6B7280"
                style={{ fontSize: "11px" }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="totalSubmissions"
                fill="#007AFF"
                radius={[4, 4, 0, 0]}
                name="Submissões"
              />
              <Bar
                dataKey="totalDocuments"
                fill="#34C759"
                radius={[4, 4, 0, 0]}
                name="Documentos"
              />
              <Bar
                dataKey="totalChatMessages"
                fill="#FF9500"
                radius={[4, 4, 0, 0]}
                name="Mensagens"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Completa de Utilizadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tabela Completa de Desempenho</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os indicadores por utilizador
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
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
                  <TableHead className="text-right">Templates</TableHead>
                  <TableHead className="text-right">Questões</TableHead>
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
                        {user.role === "admin" && (
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
                      {user.totalTemplates}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalQuestions}
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
                      {format(new Date(user.createdAt), "dd/MM/yyyy")}
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
