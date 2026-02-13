import type { AIValidationResult, DocumentScanResult } from "./types";

/**
 * Compila resultados da validação por IA (apenas IA, sem técnico)
 */
export class ScoreCompiler {
  /**
   * Compila resultados da análise por IA
   */
  static compile(documentId: string, ai: AIValidationResult): DocumentScanResult {
    const highConfidenceRisks = ai.riscoDetectado.filter((r) => r.confianca >= 0.6);
    const riskPenalty = highConfidenceRisks.reduce((sum, r) => sum + r.confianca, 0);
    // Penalidade: 15 pts por ponto de confiança, máx 100 (score nunca < 0)
    const penalty = Math.min(riskPenalty * 15, 100);
    const adjustedIaScore =
      highConfidenceRisks.length > 0
        ? Math.max(0, Math.min(ai.scoreIA, Math.round(100 - penalty)))
        : ai.scoreIA;

    const scoreTotal = Math.max(0, adjustedIaScore);
    const nivelRisco = this.determineRiskLevel(scoreTotal);
    const recomendacao = this.determineRecommendation(scoreTotal, nivelRisco);
    const flagsCriticas = this.compileCriticalFlags(ai);
    const justificacao = this.buildJustification(ai, nivelRisco);

    return {
      documentId,
      scoreTotal,
      nivelRisco,
      recomendacao,
      scores: {
        tecnicoScore: adjustedIaScore,
        iaScore: adjustedIaScore,
      },
      flagsCriticas,
      justificacao,
      tempoTotalAnalise: ai.tempoAnalise,
      timestamp: new Date().toISOString(),
    };
  }

  private static determineRiskLevel(
    scoreTotal: number
  ): "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO" {
    // Score alto = documento íntegro = baixo risco
    if (scoreTotal >= 85) return "BAIXO";
    if (scoreTotal >= 70) return "MEDIO";
    if (scoreTotal >= 50) return "MEDIO_ALTO";
    return "ALTO_RISCO";
  }

  private static determineRecommendation(
    scoreTotal: number,
    nivelRisco: string
  ): "REJEITAR" | "REJEITAR_COM_REVISAO" | "VALIDAR_EXTRA" | "ACEITAR" {
    switch (nivelRisco) {
      case "ALTO_RISCO":
        return "REJEITAR";
      case "MEDIO_ALTO":
        return "REJEITAR_COM_REVISAO";
      case "MEDIO":
        return "VALIDAR_EXTRA";
      case "BAIXO":
      default:
        return "ACEITAR";
    }
  }

  private static compileCriticalFlags(ai: AIValidationResult) {
    const flags = ai.riscoDetectado
      .filter((r) => r.confianca >= 0.6)
      .map((r) => ({
        fonte: "IA" as const,
        tipo: r.tipo,
        confianca: r.confianca,
        justificacao: r.justificacao,
      }))
      .sort((a, b) => (b.confianca || 0) - (a.confianca || 0));
    return flags.slice(0, 8);
  }

  private static buildJustification(
    ai: AIValidationResult,
    nivelRisco: string
  ): string {
    const parts: string[] = [];
    if (ai.analiseDetalhada) {
      parts.push(ai.analiseDetalhada);
    }
    if (ai.riscoDetectado.length > 0) {
      const highConfidence = ai.riscoDetectado
        .filter((r) => r.confianca >= 0.6)
        .map((r) => `${r.tipo} (${(r.confianca * 100).toFixed(0)}%)`)
        .join(", ");
      if (highConfidence) {
        parts.push(`Anomalias: ${highConfidence}.`);
      }
    }
    const riskMessages = {
      ALTO_RISCO: "Documento apresenta risco muito elevado de fraude.",
      MEDIO_ALTO: "Documento apresenta risco significativo e requer revisão manual.",
      MEDIO: "Documento apresenta alguns sinais de alerta. Validação adicional recomendada.",
      BAIXO: "Documento apresenta baixo risco de fraude.",
    };
    parts.push(riskMessages[nivelRisco as keyof typeof riskMessages]);
    return parts.join(" ");
  }
}
