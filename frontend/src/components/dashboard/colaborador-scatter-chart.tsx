import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

interface ColaboradorScatterChartProps {
  data: {
    userId: string;
    name: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }[];
}

export function ColaboradorScatterChart({
  data,
}: ColaboradorScatterChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de colaboradores
      </div>
    );
  }

  const chartData = data.map((item) => ({
    x: item.totalValue,
    y: item.count,
    z: item.averageValue / 1000,
    name: item.name,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground">{p.name}</p>
        <dl className="mt-1.5 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor total</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {p.x?.toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }) ?? '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Operações</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {p.y != null ? p.y.toLocaleString('pt-PT') : '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor médio</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {p.z != null
                ? (p.z * 1000).toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  })
                : '—'}
            </dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            type="number"
            dataKey="x"
            name="Valor"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            label={{
              value: 'Valor Total (€)',
              position: 'bottom',
              fontSize: 10,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Quantidade"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            label={{
              value: 'Operações',
              angle: -90,
              position: 'insideLeft',
              fontSize: 10,
            }}
          />
          <ZAxis
            type="number"
            dataKey="z"
            range={[50, 400]}
            name="Ticket Médio"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter data={chartData} fill={chartColors.primary} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
