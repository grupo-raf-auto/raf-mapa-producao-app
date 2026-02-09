import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  TrendingUp,
  Flag,
  FileCheck,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanResult {
  id: string;
  fileName: string;
  scoreTotal: number;
  technicalScore: number;
  iaScore: number;
  riskLevel: string;
  recommendation: string;
  flags: Array<any>;
  justification: string;
  createdAt: string;
}

interface ScannerResultsProps {
  result: ScanResult;
  onClose: () => void;
}

// Tradução de tipos de fraude para linguagem acessível
const fraudTypeTranslations: Record<string, { title: string; description: string; emoji: string }> = {
  "INCONSISTENCIA_CONTEUDO": {
    title: "Inconsistência no Conteúdo",
    description: "Detectámos informações conflitantes ou incompatíveis dentro do documento. Por exemplo, datas que não correspondem ou dados que se contradizem.",
    emoji: "⚠️",
  },
  "TEXTO_ALTERADO": {
    title: "Texto Modificado",
    description: "O documento mostra sinais de edição ou alteração posterior. Partes do texto podem ter sido modificadas ou substituídas.",
    emoji: "✏️",
  },
  "ESTRUTURA_SUSPEITA": {
    title: "Estrutura Anómala",
    description: "O layout e a estrutura do documento não correspondem ao padrão esperado. Podem haver secções ausentes ou dispostas de forma irregular.",
    emoji: "🔨",
  },
};

export function ScannerResults({ result, onClose }: ScannerResultsProps) {
  const getRiskConfig = (riskLevel: string) => {
    const config: Record<
      string,
      {
        label: string;
        labelSmall: string;
        icon: React.ReactNode;
        color: string;
        bgGradient: string;
        accentColor: string;
        severity: number;
        advice: string;
      }
    > = {
      ALTO_RISCO: {
        label: "Alto Risco Detectado",
        labelSmall: "Alto Risco",
        icon: <AlertTriangle className="w-6 h-6" />,
        color: "text-red-600",
        bgGradient: "from-red-50 to-red-100/50",
        accentColor: "bg-red-500",
        severity: 3,
        advice: "Recomendamos verificação manual urgente antes de prosseguir.",
      },
      MEDIO_ALTO: {
        label: "Risco Moderado-Alto",
        labelSmall: "Médio-Alto",
        icon: <AlertTriangle className="w-6 h-6" />,
        color: "text-orange-600",
        bgGradient: "from-orange-50 to-orange-100/50",
        accentColor: "bg-orange-500",
        severity: 2,
        advice: "Sugerimos análise cuidadosa e validação adicional.",
      },
      MEDIO: {
        label: "Alguns Avisos",
        labelSmall: "Médio",
        icon: <Flag className="w-6 h-6" />,
        color: "text-yellow-600",
        bgGradient: "from-yellow-50 to-yellow-100/50",
        accentColor: "bg-yellow-500",
        severity: 1,
        advice: "Verifique os detalhes abaixo antes de prosseguir.",
      },
      BAIXO: {
        label: "Documento Seguro",
        labelSmall: "Baixo Risco",
        icon: <CheckCircle2 className="w-6 h-6" />,
        color: "text-green-600",
        bgGradient: "from-green-50 to-green-100/50",
        accentColor: "bg-green-500",
        severity: 0,
        advice: "Documento passou na análise. Pode prosseguir com confiança.",
      },
    };
    return config[riskLevel] || config.MEDIO;
  };

  const riskConfig = getRiskConfig(result.riskLevel);

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getHumanizedFlagInfo = (flag: any) => {
    if (typeof flag === "string") {
      const translated = fraudTypeTranslations[flag];
      if (translated) return translated;
      return { title: flag, description: "Possível problema detectado no documento.", emoji: "⚠️" };
    }
    if (flag.tipo && fraudTypeTranslations[flag.tipo]) {
      return fraudTypeTranslations[flag.tipo];
    }
    return { title: "Aviso detectado", description: JSON.stringify(flag), emoji: "⚠️" };
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Alert Header */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className={`rounded-2xl p-6 ${riskConfig.bgGradient} border-2 ${riskConfig.color === "text-red-600" ? "border-red-200" : riskConfig.color === "text-orange-600" ? "border-orange-200" : riskConfig.color === "text-yellow-600" ? "border-yellow-200" : "border-green-200"}`}>
          <div className="flex items-start gap-3">
            {riskConfig.icon}
            <div className="flex-1">
              <h1 className={`text-2xl font-serif font-bold ${riskConfig.color} mb-1`}>
                {riskConfig.label}
              </h1>
              <p className="text-sm text-slate-700 mb-2">
                {riskConfig.advice}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Análise realizada em {new Date(result.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} às {new Date(result.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Trust Score - Left Column */}
        <div className="col-span-1 relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-linear-to-br from-white to-slate-50 shadow-lg p-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nível de Confiança
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-serif font-bold ${scoreColor(result.scoreTotal)}`}>
                {result.scoreTotal}
              </span>
              <span className="text-2xl font-light text-slate-400">%</span>
            </div>

            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${riskConfig.accentColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.scoreTotal}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-xs text-slate-600">
                {result.scoreTotal >= 85
                  ? "✓ Muito seguro"
                  : result.scoreTotal >= 75
                    ? "✓ Seguro"
                    : result.scoreTotal >= 60
                      ? "⚠ Análise adicional"
                      : result.scoreTotal >= 40
                        ? "⚠ Risco identificado"
                        : "✗ Alto risco"}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Scores - Middle & Right Columns */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-blue-50/50 p-6 shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Análise Técnica
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className={`text-4xl font-serif font-bold ${scoreColor(result.technicalScore)}`}>
                {result.technicalScore}%
              </p>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.technicalScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <p className="text-xs text-blue-700">Estrutura e formato</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border-2 border-purple-200 bg-linear-to-br from-purple-50 to-purple-50/50 p-6 shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Anomalias
              </span>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div className="space-y-2">
              <p className={`text-4xl font-serif font-bold ${scoreColor(result.iaScore)}`}>
                {result.iaScore}%
              </p>
              <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.iaScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                />
              </div>
              <p className="text-xs text-purple-700">Detecção IA</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recommendation Box */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className="bg-linear-to-r from-blue-50 to-slate-50 rounded-xl p-5 border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
            O que fazer agora
          </p>
          <p className="text-sm text-blue-950 font-medium">
            {result.recommendation}
          </p>
        </div>
      </motion.div>

      {/* Issues Grid */}
      <AnimatePresence>
        {result.flags && result.flags.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mb-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Problemas Detectados ({result.flags.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {result.flags.map((flag: any, idx: number) => {
                const flagInfo = getHumanizedFlagInfo(flag);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="rounded-xl border-2 border-red-200 bg-linear-to-r from-red-50 to-red-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{flagInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-red-900 text-sm">
                          {flagInfo.title}
                        </h3>
                        <p className="text-xs text-red-700 leading-relaxed mt-1">
                          {flagInfo.description}
                        </p>
                        {flag.confianca && (
                          <div className="flex items-center gap-2 text-xs mt-2">
                            <span className="text-red-600 font-medium">
                              Certeza: {Math.round(flag.confianca * 100)}%
                            </span>
                            <div className="flex-1 h-1.5 bg-red-200 rounded-full overflow-hidden max-w-xs">
                              <div
                                className="h-full bg-red-600 rounded-full"
                                style={{ width: `${flag.confianca * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Justification & File Info - Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Detailed Analysis */}
        <AnimatePresence>
          {result.justification && (
            <motion.div
              className="rounded-xl border-2 border-slate-200 bg-linear-to-br from-slate-50 to-white p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-lg bg-slate-900 p-2">
                  <FileCheck className="w-4 h-4 text-white shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Análise Detalhada
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Explicação dos resultados</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                {result.justification}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Information */}
        <motion.div
          className="rounded-xl border-2 border-slate-200 bg-linear-to-r from-slate-900 to-slate-800 text-white p-5 flex flex-col justify-center"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Documento
              </p>
              <p className="font-semibold text-white text-sm truncate mt-1">{result.fileName}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            variant="outline"
            className="w-full gap-2 border-slate-300 hover:bg-slate-50"
            disabled
          >
            <Download className="w-4 h-4" />
            Relatório
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            Fechar
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
