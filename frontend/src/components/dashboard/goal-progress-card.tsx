import { motion } from 'framer-motion';

interface GoalProgressCardProps {
  /** Percentagem de progresso atual (0-100) */
  progressPercent: number;
  /** Percentagem esperada baseada no tempo decorrido (0-100) */
  expectedProgressPercent: number;
  /** Se está à frente ou atrás do ritmo esperado */
  isAheadOfPace: boolean;
  /** Percentagem de diferença (positiva se ahead, negativa se behind) */
  paceDifferencePercent: number;
}

export function GoalProgressCard({
  progressPercent,
  expectedProgressPercent,
  isAheadOfPace,
  paceDifferencePercent,
}: GoalProgressCardProps) {
  // Cores baseadas no estado
  const colors = isAheadOfPace
    ? {
        // Verde/teal para ahead of pace
        progressStart: '#10B981', // emerald-500
        progressEnd: '#14B8A6', // teal-500
        track: '#D1FAE5', // emerald-100
        indicator: '#059669', // emerald-600
        textHighlight: '#047857', // emerald-700
      }
    : {
        // Plum/magenta/pink para behind pace
        progressStart: '#A855F7', // purple-500
        progressEnd: '#EC4899', // pink-500
        track: '#FCE7F3', // pink-100
        indicator: '#9333EA', // purple-600
        textHighlight: '#7C3AED', // purple-700
      };

  const displayProgress = Math.min(100, Math.max(0, progressPercent));
  const displayExpected = Math.min(100, Math.max(0, expectedProgressPercent));
  const absPaceDiff = Math.abs(paceDifferencePercent);

  return (
    <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm border border-gray-100 dark:border-slate-700 p-2.5">
      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Progresso do Objetivo
      </h3>

      {/* Barra de progresso */}
      <div className="relative mb-2">
        {/* Track (fundo) */}
        <div
          className="h-2 w-full rounded-full overflow-hidden relative"
          style={{ backgroundColor: colors.track }}
        >
          {/* Progresso atual (preenchido) */}
          <motion.div
            className="h-full rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(to right, ${colors.progressStart}, ${colors.progressEnd})`,
            }}
          >
            {/* Padrão hachado na parte do progresso esperado (quando ahead) */}
            {displayExpected > 0 &&
              displayExpected <= displayProgress &&
              isAheadOfPace && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    width: `${(displayExpected / displayProgress) * 100}%`,
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 3px,
                      rgba(255, 255, 255, 0.3) 3px,
                      rgba(255, 255, 255, 0.3) 6px
                    )`,
                  }}
                />
              )}
          </motion.div>

          {/* Indicador circular na posição do progresso atual */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-all duration-300 z-10"
            style={{
              left: `clamp(0px, calc(${displayProgress}% - 5px), calc(100% - 10px))`,
              backgroundColor: colors.indicator,
            }}
          />
        </div>
      </div>

      {/* Texto descritivo */}
      <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
        {isAheadOfPace ? (
          <>
            Está{' '}
            <span
              className="font-bold"
              style={{ color: colors.textHighlight }}
            >
              à frente do ritmo
            </span>{' '}
            e deve atingir o seu objetivo{' '}
            <span
              className="font-bold"
              style={{ color: colors.textHighlight }}
            >
              {absPaceDiff.toFixed(0)}%
            </span>{' '}
            antes do previsto.
          </>
        ) : (
          <>
            Está{' '}
            <span
              className="font-bold"
              style={{ color: colors.textHighlight }}
            >
              atrás do ritmo
            </span>{' '}
            e deve atingir o seu objetivo{' '}
            <span
              className="font-bold"
              style={{ color: colors.textHighlight }}
            >
              {absPaceDiff.toFixed(0)}%
            </span>{' '}
            depois do previsto.
          </>
        )}
      </p>
    </div>
  );
}
