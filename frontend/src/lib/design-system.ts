// Design System Colors
export const colors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  primary: '#E14840',
  primarySoft: '#F87171',
  secondary: '#FEE2E2',
  accent: '#16CBC7',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#DC2626',
} as const;

/** Paleta profissional para gráficos do dashboard (contexto da app: vermelho + teal) */
export const chartColors = {
  /** Vermelho principal (marca) - tom mais contido */
  primary: '#B91C1C',
  primaryLight: '#C2413A',
  /** Secundário valor / série 2 */
  secondary: '#0D9488',
  secondaryLight: '#14B8A6',
  /** Neutro para eixos e grelha */
  axis: '#64748B',
  grid: '#E2E8F0',
  /** Escala para gráficos de múltiplas séries (pie, barras) */
  scale: [
    '#B91C1C', // vermelho
    '#0D9488', // teal
    '#475569', // slate
    '#6366F1', // indigo
    '#0F766E', // teal escuro
  ] as const,
  /** Escala avermelhada para donuts/segmentos (variações da marca) */
  redScale: ['#B91C1C', '#991B1B', '#C2413A', '#7F1D1D', '#E07B73'] as const,
  /** Performance: ouro, prata, bronze */
  medal: ['#B45309', '#64748B', '#92400E'] as const,
} as const;

// Design System Spacing — mobile-first (base 320px, scale up)
export const spacing = {
  pagePadding: 'px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-6 lg:px-12 lg:py-8',
  sectionGap: 'space-y-4 sm:space-y-5 md:space-y-6',
  cardPadding: 'p-4 sm:p-5',
  gridGap: 'gap-4 sm:gap-5',
} as const;

// Design System Radius
export const radius = {
  card: 'rounded-lg',
  button: 'rounded-lg',
  input: 'rounded-md',
} as const;
