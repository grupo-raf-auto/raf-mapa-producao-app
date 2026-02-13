import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ScanResult {
  id: string;
  fileName: string;
  scoreTotal: number;
  technicalScore: number;
  iaScore: number;
  riskLevel: string;
  recommendation: string;
  flags: Array<{
    tipo?: string;
    confianca?: number;
    justificacao?: string;
    valor?: number | string;
    descricao?: string;
  }>;
  justification: string;
  createdAt: string;
}

interface ScannerResultsProps {
  result: ScanResult;
  onClose: () => void;
}

const FLAG_LABELS: Record<string, string> = {
  // IA
  ASSINATURA_FALSIFICADA: 'Assinatura falsificada',
  TEXTO_ALTERADO: 'Texto alterado',
  INCONSISTENCIA_CONTEUDO: 'Inconsistência no conteúdo',
  ESTRUTURA_SUSPEITA: 'Estrutura suspeita',
  IMAGEM_EDITADA: 'Imagem editada',
  CARIMBO_FALSO: 'Carimbo/selo falsificado',
  // Técnico
  PAGINAS_OCULTAS: 'Páginas ocultas',
  METADATA_SUSPEITA: 'Metadados suspeitos',
  MULTIPLAS_VERSOES: 'Múltiplas versões no PDF',
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  REJEITAR: 'Rejeitar',
  REJEITAR_COM_REVISAO: 'Rejeitar com revisão',
  VALIDAR_EXTRA: 'Validar com documentos adicionais',
  ACEITAR: 'Aceitar',
};

function getFlagLabel(
  flag: any,
  indexAmongSame: number,
  totalSame: number,
  usedJustificacoes: Set<string>,
  short = false
): string {
  const base = FLAG_LABELS[flag.tipo] || flag.tipo;
  const justificacao = (flag.justificacao || '').trim();
  if (totalSame <= 1) return base;
  if (indexAmongSame === 0) return base;
  // Modo curto (card Suspeitas): só etiquetas concisas, sem justificação longa
  if (short) {
    if (flag.tipo === 'INCONSISTENCIA_CONTEUDO') return 'Outra inconsistência';
    if (flag.tipo === 'ESTRUTURA_SUSPEITA') return 'Outra anomalia estrutural';
    if (flag.tipo === 'TEXTO_ALTERADO') return 'Outra alteração de texto';
    return `${base} (${indexAmongSame + 1})`;
  }
  // Modo completo (Resumo): usar justificação se for única
  const jKey = justificacao.toLowerCase();
  if (justificacao && justificacao.length > 3 && !usedJustificacoes.has(jKey)) {
    usedJustificacoes.add(jKey);
    return justificacao;
  }
  if (flag.tipo === 'INCONSISTENCIA_CONTEUDO') return 'Outra inconsistência';
  if (flag.tipo === 'ESTRUTURA_SUSPEITA') return 'Outra anomalia estrutural';
  if (flag.tipo === 'TEXTO_ALTERADO') return 'Outra alteração de texto';
  return `${base} (${indexAmongSame + 1})`;
}

export function ScannerResults({ result, onClose }: ScannerResultsProps) {
  const [showResumo, setShowResumo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasManipulation = result.flags && result.flags.length > 0;
  const manipulationCount = result.flags?.length ?? 0;

  const getVerdict = () => {
    if (result.scoreTotal >= 85 && !hasManipulation)
      return {
        label: 'Sem manipulação detectada',
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    if (result.scoreTotal >= 70)
      return {
        label: 'Baixo risco',
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    if (result.scoreTotal >= 50)
      return {
        label: 'Risco moderado',
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    return {
      label: 'Manipulação ou fraude provável',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    };
  };

  const verdict = getVerdict();
  const VerdictIcon = verdict.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Score + Suspeitas lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Score */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                Score
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {result.scoreTotal}
                <span className="text-lg font-normal text-muted-foreground">/100</span>
              </p>
            </div>
            <div className={`rounded-lg px-3 py-1.5 border ${verdict.bg} ${verdict.border}`}>
              <div className="flex items-center gap-1.5">
                <VerdictIcon className={`w-4 h-4 ${verdict.color}`} />
                <span className={`font-semibold text-xs ${verdict.color}`}>
                  {verdict.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground">
              {hasManipulation ? `${manipulationCount} suspeita${manipulationCount > 1 ? 's' : ''}` : 'Sem suspeitas'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span>
              {RECOMMENDATION_LABELS[result.recommendation.split(' - ')[0]] ||
                result.recommendation.split(' - ')[0]}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                result.scoreTotal >= 85 ? 'bg-green-500' :
                result.scoreTotal >= 70 ? 'bg-green-400' :
                result.scoreTotal >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${result.scoreTotal}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Card Suspeitas */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Suspeitas
          </p>
          {hasManipulation ? (
            <div className="space-y-2">
              {result.flags.map((flag: any, idx: number) => {
                const sameTypeIndices = result.flags
                  .map((f: any, i: number) => (f.tipo === flag.tipo ? i : -1))
                  .filter((i: number) => i >= 0);
                const indexAmongSame = sameTypeIndices.indexOf(idx);
                const totalSame = sameTypeIndices.length;
                const usedJustificacoes = new Set<string>();
                result.flags.slice(0, idx).forEach((f: any) => {
                  const j = (f.justificacao || '').trim().toLowerCase();
                  if (j) usedJustificacoes.add(j);
                });
                return (
                  <div key={idx} className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {getFlagLabel(flag, indexAmongSame, totalSame, usedJustificacoes, true)}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {flag.confianca != null ? `${(flag.confianca * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma detectada</p>
          )}
        </div>
      </div>

      {/* Resumo das inconsistências */}
      {hasManipulation && (
        <div className="rounded-xl border">
          <button
            onClick={() => setShowResumo(!showResumo)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
          >
            <span className="text-sm font-medium">Resumo das inconsistências</span>
            {showResumo ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showResumo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 pb-4 space-y-3"
            >
              {result.flags.map((flag: any, idx: number) => {
                const sameTypeIndices = result.flags
                  .map((f: any, i: number) => (f.tipo === flag.tipo ? i : -1))
                  .filter((i: number) => i >= 0);
                const indexAmongSame = sameTypeIndices.indexOf(idx);
                const totalSame = sameTypeIndices.length;
                const usedJustificacoes = new Set<string>();
                result.flags.slice(0, idx).forEach((f: any) => {
                  const j = (f.justificacao || '').trim().toLowerCase();
                  if (j) usedJustificacoes.add(j);
                });
                const label = getFlagLabel(flag, indexAmongSame, totalSame, usedJustificacoes);
                const desc =
                  flag.tipo === 'PAGINAS_OCULTAS' && flag.valor != null
                    ? `${flag.valor} página(s) sem conteúdo na estrutura PDF`
                    : flag.descricao || flag.justificacao || null;
                return (
                  <div key={idx} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-foreground">
                      {label}
                      {flag.confianca != null && (
                        <span className="text-muted-foreground font-normal ml-1">
                          ({(flag.confianca * 100).toFixed(0)}%)
                        </span>
                      )}
                    </p>
                    {desc && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Detalhes */}
      {result.fileName && (
        <div className="rounded-xl border">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
          >
            <span className="text-sm font-medium">Detalhes</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 pb-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{result.fileName}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <Button onClick={onClose} className="w-full" size="lg">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Nova análise
      </Button>
    </motion.div>
  );
}
