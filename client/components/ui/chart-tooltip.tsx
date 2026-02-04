'use client';

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
        'rounded-lg border border-border bg-card px-3 py-2.5 shadow-md min-w-[140px] max-w-[280px] ' +
        (className ?? '')
      }
      role="tooltip"
    >
      {title ? (
        <p
          className="text-sm font-semibold text-foreground truncate"
          title={title}
        >
          {title}
        </p>
      ) : null}
      <dl className={title ? 'mt-1.5 space-y-1' : 'space-y-1'}>
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-xs text-muted-foreground shrink-0">
              {row.label}
            </dt>
            <dd className="text-xs font-medium tabular-nums text-foreground text-right truncate">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
