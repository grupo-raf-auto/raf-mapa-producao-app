"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient as api } from "@/lib/api-client";
import { TrendingUp, FileStack, HelpCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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
} from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface UserStats {
  userId: string;
  clerkId?: string; // opcional (compatibilidade; API pode enviar id como clerkId)
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  totalSubmissions: number;
  totalTemplates: number;
  totalQuestions: number;
  activeDaysLast30: number;
  submissionsByDay: Record<string, number>;
  templateDistribution: Record<string, number>;
  createdAt: Date;
}

interface StatsData {
  users: UserStats[];
  stats: {
    totalUsers: number;
    totalSubmissions: number;
    totalTemplates: number;
    totalQuestions: number;
    activeUsersLast30: number;
  };
}

export function UserPerformance() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Preparar dados para gráfico de linha (últimos 30 dias)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return format(date, "yyyy-MM-dd");
  });

  const chartData = last30Days.map((date) => {
    const total = data.users.reduce((sum, user) => {
      return sum + (user.submissionsByDay[date] || 0);
    }, 0);
    return {
      date: format(parseISO(date), "dd/MM"),
      submissions: total,
    };
  });

  // Top 10 usuários
  const topUsers = data.users.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.activeUsersLast30} ativos (30 dias)
            </p>
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
              Média:{" "}
              {data.stats.totalUsers > 0
                ? Math.round(
                    data.stats.totalSubmissions / data.stats.totalUsers,
                  )
                : 0}{" "}
              por usuário
            </p>
          </CardContent>
        </Card>

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
              {data.users.filter((u) => u.totalTemplates > 0).length} usuários
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
              {data.users.filter((u) => u.totalQuestions > 0).length} usuários
              criaram questões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Submissões ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Submissões ao Longo do Tempo</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos 30 dias - Total de submissões por dia
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#007AFF"
                strokeWidth={2}
                dot={{ fill: "#007AFF", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Usuários</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Top 10 usuários por número de submissões
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold">{user.totalSubmissions}</div>
                    <div className="text-xs text-muted-foreground">
                      Submissões
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{user.activeDaysLast30}</div>
                    <div className="text-xs text-muted-foreground">
                      Dias ativos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{user.totalTemplates}</div>
                    <div className="text-xs text-muted-foreground">
                      Templates
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Top 5 Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Usuários por Submissões</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topUsers.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="email"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="totalSubmissions"
                fill="#007AFF"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
