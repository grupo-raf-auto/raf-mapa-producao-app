'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { TimeFilterType } from './time-filter';

interface SalesTimelineChartProps {
  data: { month: string; count: number; totalValue: number }[];
  timeFilter?: TimeFilterType;
}

// 1. Cash Flow Stacked Bar Chart
export function CashFlowStackedChart({ data, timeFilter = 'month' }: SalesTimelineChartProps) {
  const chartData = data.map((item, index) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    const entrada = Math.round(item.totalValue * 0.65);
    const saida = Math.round(item.totalValue * 0.35);
    
    return {
      date: index === data.length - 1 ? 'Hoje' : `${monthName} ${year.slice(-2)}`,
      Entrada: entrada,
      Saída: saida,
      total: item.totalValue,
    };
  });

  const current = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];
  const change = previous ? (((current.total - previous.total) / previous.total) * 100).toFixed(1) : '0.0';
  const periodLabel = timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? 'Sem' : 'Fev';
  const prevPeriodLabel = timeFilter === 'day' ? 'Ontem' : timeFilter === 'week' ? 'Sem passada' : 'Jan';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">1 {periodLabel} - Hoje</p>
          <p className="text-2xl font-bold text-foreground">
            {current.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {previous ? `1 ${prevPeriodLabel} - ${previous.date}` : 'Sem comparação'}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {previous?.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) || 'N/A'}
          </p>
          <p className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
            formatter={(v) => (v != null ? Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) : '-')}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
          <Bar dataKey="Entrada" stackId="a" fill="#5347CE" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Saída" stackId="a" fill="#16CBC7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Profit & Loss Progress Bar
export function ProfitLossChart({ data, timeFilter = 'month' }: SalesTimelineChartProps) {
  const current = data[data.length - 1];
  const currentValue = current?.totalValue || 0;
  const costs = currentValue * 0.4;
  const profit = currentValue - costs;
  const maxValue = Math.max(currentValue, 3000);
  const profitPercentage = (profit / maxValue) * 100;
  const periodLabel = timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? 'Sem' : 'Fev';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">1 {periodLabel} - Hoje</p>
        <p className="text-2xl font-bold text-foreground">
          {currentValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-amber-700/60" style={{ width: `${(costs / maxValue) * 100}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-blue-900 z-10" style={{ left: `${profitPercentage}%` }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="bg-blue-900 text-white text-xs px-2 py-0.5 rounded font-medium">PROFIT</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>0</span>
          <span>1000</span>
          <span>2000</span>
          <span>3000</span>
        </div>
      </div>
    </div>
  );
}

// 3. Net Volume Line Chart with "Today" label
export function NetVolumeChart({ data, timeFilter = 'month' }: SalesTimelineChartProps) {
  const chartData = data.map((item, index) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    return {
      date: index === data.length - 1 ? 'Hoje' : `${monthName} ${year.slice(-2)}`,
      current: Math.round(item.totalValue),
      previous: Math.round(item.totalValue * 0.8),
    };
  });

  const current = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];
  const change = previous ? (((current.current - previous.current) / previous.current) * 100).toFixed(1) : '0.0';
  const periodLabel = timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? 'Sem' : 'Fev';
  const prevPeriodLabel = timeFilter === 'day' ? 'Ontem' : timeFilter === 'week' ? 'Sem passada' : 'Jan';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">1 {periodLabel} - Hoje</p>
          <p className="text-2xl font-bold text-foreground">
            {current.current.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {previous ? `1 ${prevPeriodLabel} - ${previous.date}` : 'Sem comparação'}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {previous?.current.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) || 'N/A'}
          </p>
          <p className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </p>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '11px' }} />
            <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
              formatter={(v) => (v != null ? Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) : '-')}
            />
            <Line type="monotone" dataKey="current" stroke="#5347CE" strokeWidth={2} dot={{ fill: '#5347CE', r: 4 }} />
            <Line type="monotone" dataKey="previous" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.5} />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute top-0 right-8 bg-black text-white text-xs px-2 py-1 rounded font-medium">
          Hoje
        </div>
      </div>
    </div>
  );
}

// 4. Reports Completion Radial Chart
export function ReportsCompletionRadial({ data }: { data: { month: string; count: number; totalValue: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const completed = Math.round(total * 0.96);
  const percentage = 96;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 py-4">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#5347CE"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{percentage}</span>
        </div>
      </div>
      <div className="text-center px-4">
        <p className="text-sm text-muted-foreground">
          Taxa de conclusão de relatórios para o período é sólida ({completed} de {total} hrs registradas)
        </p>
      </div>
    </div>
  );
}

// 5. Reports Completion Bar Chart
export function ReportsCompletionBar({ data }: { data: { month: string; count: number; totalValue: number }[] }) {
  const chartData = data.slice(-7).map((item, index) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    const completed = Math.round(item.count * 0.96);
    const missing = item.count - completed;
    
    return {
      date: index === data.length - 1 ? 'Hoje' : `${monthName} ${year.slice(-2)}`,
      completed,
      missing,
      total: item.count,
    };
  });

  const totalCompleted = chartData.reduce((sum, item) => sum + item.completed, 0);
  const totalMissing = chartData.reduce((sum, item) => sum + item.missing, 0);
  const percentage = Math.round((totalCompleted / (totalCompleted + totalMissing)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">{percentage}%</p>
          <p className="text-sm text-muted-foreground">{totalMissing} hrs em falta</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
          />
          <Bar dataKey="completed" stackId="a" fill="#5347CE" radius={[0, 0, 0, 0]} />
          <Bar dataKey="missing" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 6. Cash Flow Column Chart (Positive/Negative)
export function CashFlowColumnChart({ data, timeFilter = 'month' }: SalesTimelineChartProps) {
  const chartData = data.map((item, index) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    const positive = Math.round(item.totalValue * 0.6);
    const negative = -Math.round(item.totalValue * 0.2);
    
    return {
      date: index === data.length - 1 ? 'Hoje' : `${monthName} ${year.slice(-2)}`,
      positive,
      negative,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-foreground">Fluxo de Caixa</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
            formatter={(v) => (v != null ? Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) : '-')}
          />
          <Bar dataKey="positive" fill="#5347CE" radius={[4, 4, 0, 0]} />
          <Bar dataKey="negative" fill="#1F2937" radius={[0, 0, 4, 4]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 1. Evolução Temporal de Vendas (estilo moderno)
export function SalesTimelineChart({ data, timeFilter = 'month' }: SalesTimelineChartProps) {
  const chartData = data.map((item, index) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    return {
      date: index === data.length - 1 ? 'Hoje' : `${monthName} ${year.slice(-2)}`,
      'Número de Vendas': item.count,
      'Valor Total (€)': Math.round(item.totalValue),
    };
  });

  const current = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];
  const countChange = previous ? (((current['Número de Vendas'] - previous['Número de Vendas']) / previous['Número de Vendas']) * 100).toFixed(1) : '0.0';
  const valueChange = previous ? (((current['Valor Total (€)'] - previous['Valor Total (€)']) / previous['Valor Total (€)']) * 100).toFixed(1) : '0.0';
  const periodLabel = timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? 'Sem' : 'Fev';
  const prevPeriodLabel = timeFilter === 'day' ? 'Ontem' : timeFilter === 'week' ? 'Sem passada' : 'Jan';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">1 {periodLabel} - Hoje</p>
          <p className="text-2xl font-bold text-foreground">
            {current['Valor Total (€)'].toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {current['Número de Vendas']} vendas
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {previous ? `1 ${prevPeriodLabel} - ${previous.date}` : 'Sem comparação'}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {previous?.['Valor Total (€)'].toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) || 'N/A'}
          </p>
          <p className={`text-xs font-medium ${parseFloat(valueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(valueChange) >= 0 ? '+' : ''}{valueChange}%
          </p>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '11px' }} />
            <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value, name) => {
                if (value == null) return '-';
                if (name === 'Valor Total (€)') {
                  return `${Number(value).toLocaleString('pt-PT')} €`;
                }
                return value;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
            <Line type="monotone" dataKey="Número de Vendas" stroke="#5347CE" strokeWidth={2} dot={{ fill: '#5347CE', r: 4 }} />
            <Line type="monotone" dataKey="Valor Total (€)" stroke="#16CBC7" strokeWidth={2} dot={{ fill: '#16CBC7', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        {current.date === 'Hoje' && (
          <div className="absolute top-0 right-8 bg-black text-white text-xs px-2 py-1 rounded font-medium">
            Hoje
          </div>
        )}
      </div>
    </div>
  );
}
