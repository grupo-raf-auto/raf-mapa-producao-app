import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp } from 'lucide-react';
import { QuestionsChart } from './questions-chart';
import { ActivityChart } from './activity-chart';
import { api } from '@/lib/api';

export async function DashboardContent() {
  // TODO: Create stats endpoint in backend
  const [forms] = await Promise.all([
    api.forms.getAll(),
  ]);

  const stats = {
    totalForms: forms.length,
    totalSubmissions: 0, // TODO: Implement submissions
  };

  const kpiCards = [
    {
      title: 'Submissões',
      value: stats.totalSubmissions,
      icon: TrendingUp,
      change: '+24%',
      trend: 'up' as const,
    },
    {
      title: 'Formulários',
      value: stats.totalForms,
      icon: FileText,
      change: '+5',
      trend: 'up' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visão geral do sistema de gestão de formulários
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-success">{kpi.change}</span> vs mês anterior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Questões por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionsChart />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Atividade ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
