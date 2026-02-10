import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient as api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";

export function SystemStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTemplates: 0,
    totalSubmissions: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [users, templates, submissions, questions] = await Promise.all([
        api.users.getAll(),
        api.templates.getAll(),
        api.submissions.getAll({ scope: "all" }),
        api.questions.getAll(),
      ]);

      setStats({
        totalUsers: users.length,
        totalTemplates: templates.length,
        totalSubmissions: submissions.length,
        totalQuestions: questions.length,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="flex items-center justify-center py-10 sm:py-12">
          <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Total de Utilizadores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{stats.totalUsers}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Total de Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{stats.totalTemplates}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Total de Submissões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{stats.totalSubmissions}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Total de Questões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{stats.totalQuestions}</div>
        </CardContent>
      </Card>
    </div>
  );
}
