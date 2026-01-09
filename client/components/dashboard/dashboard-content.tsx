import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileStack,
  TrendingUp,
  Euro,
  BarChart3,
  MapPin,
  Building2,
  Shield,
} from 'lucide-react';
import { QuestionsChart } from './questions-chart';
import { ActivityChart } from './activity-chart';
import { SalesByBancoChart } from './sales-by-banco-chart';
import { SalesBySeguradoraChart } from './sales-by-seguradora-chart';
import { SalesByDistritoChart } from './sales-by-distrito-chart';
import { SalesTimelineChart } from './sales-timeline-chart';
import { TopBancosPieChart } from './top-bancos-pie-chart';
import { api } from '@/lib/api';

export async function DashboardContent() {
  let templates = [];
  let salesStats = null;

  try {
    const result = await Promise.all([
      api.templates.getAll(),
      api.submissions.getStats({ detailed: true }).catch(() => null),
    ]);
    templates = result[0] || [];
    salesStats = result[1];
  } catch (error) {
    console.error('Error fetching data:', error);
    // Continue with empty data if API fails
  }

  const stats = {
    totalTemplates: templates.length,
    totalSubmissions: salesStats?.total || 0,
    totalValue: salesStats?.totalValue || 0,
    averageValue: salesStats?.averageValue || 0,
  };

  const kpiCards = [
    {
      title: 'Total de Vendas',
      value: stats.totalSubmissions,
      icon: TrendingUp,
      description: 'Número total de submissões',
    },
    {
      title: 'Valor Total',
      value: stats.totalValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: Euro,
      description: 'Soma de todos os valores',
    },
    {
      title: 'Valor Médio',
      value: stats.averageValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      icon: BarChart3,
      description: 'Média por venda',
    },
    {
      title: 'Templates',
      value: stats.totalTemplates,
      icon: FileStack,
      description: 'Templates disponíveis',
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Dashboard de Vendas
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visão geral das métricas de vendas e performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
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
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Timeline Chart */}
      {salesStats?.byMonth && salesStats.byMonth.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução Temporal de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTimelineChart data={salesStats.byMonth} />
          </CardContent>
        </Card>
      )}

      {/* Sales by Banco and Top Bancos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {salesStats?.byBanco && salesStats.byBanco.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Vendas por Banco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesByBancoChart data={salesStats.byBanco} />
            </CardContent>
          </Card>
        )}

        {salesStats?.byBanco && salesStats.byBanco.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Distribuição por Banco (Top 8)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopBancosPieChart data={salesStats.byBanco} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales by Seguradora */}
      {salesStats?.bySeguradora && salesStats.bySeguradora.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Vendas por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBySeguradoraChart data={salesStats.bySeguradora} />
          </CardContent>
        </Card>
      )}

      {/* Sales by Distrito */}
      {salesStats?.byDistrito && salesStats.byDistrito.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Vendas por Distrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByDistritoChart data={salesStats.byDistrito} />
          </CardContent>
        </Card>
      )}

      {/* Legacy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Questões por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionsChart />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Atividade ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
