import * as React from 'react';

/**
 * Linha de métrica no tooltip (label + valor).
 * Escalável: adicionar novos formulários = adicionar novas entradas em rows.
 */
export interface ChartTooltipRow {
  label: string;
  value: React.ReactNode;
}

export interface ChartTooltipProps {
  /** Título (ex.: nome da entidade, data, categoria) */
  title: string;
  /** Lista de métricas. Novos campos = push novo item. */
  rows: ChartTooltipRow[];
  /** Classe extra no container */
  className?: string;
}

/**
 * Tooltip unificado para gráficos: legível, acessível e escalável.
 * Usar em todos os CustomTooltip dos charts; para novos formulários
 * basta passar title + rows com os novos campos.
 */
export function ChartTooltip({ title, rows, className }: ChartTooltipProps) {
  if (!title && rows.length === 0) return null;

  return (
    <div
      className={
        'rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg min-w-[140px] max-w-[240px] z-100 ' +
        (className ?? '')
      }
      style={{ background: 'var(--card)' }}
      role="tooltip"
    >
      {title ? (
        <p
          className="text-sm font-semibold text-foreground truncate pr-1"
          title={title}
        >
          {title}
        </p>
      ) : null}
      <dl className={title ? 'mt-1.5 space-y-1.5' : 'space-y-1.5'}>
        {rows.map((row, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground shrink-0 min-w-0">
              {row.label}
            </dt>
            <dd className="text-xs font-medium tabular-nums text-foreground shrink-0">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
