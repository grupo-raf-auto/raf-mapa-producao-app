import type {
  TechnicalValidationResult,
  AIValidationResult,
  DocumentScanResult,
} from "./types";

/**
 * Compiles technical and AI validation scores into final risk assessment
 */
export class ScoreCompiler {
  private static readonly TECHNICAL_WEIGHT = 0.35;
  private static readonly AI_WEIGHT = 0.65;

  /**
   * Compiles validation results into comprehensive scan result with risk assessment
   */
  static compile(
    documentId: string,
    technical: TechnicalValidationResult,
    ai: AIValidationResult
  ): DocumentScanResult {
    // Calculate total score (weighted average)
    const scoreTotal = Math.round(
      technical.scoreTecnico * this.TECHNICAL_WEIGHT +
        ai.scoreIA * this.AI_WEIGHT
    );

    // Determine risk level
    const nivelRisco = this.determineRiskLevel(scoreTotal);

    // Determine recommendation
    const recomendacao = this.determineRecommendation(scoreTotal, nivelRisco);

    // Compile critical flags
    const flagsCriticas = this.compileCriticalFlags(technical, ai);

    // Build justification
    const justificacao = this.buildJustification(technical, ai, nivelRisco);

    return {
      documentId,
      scoreTotal,
      nivelRisco,
      recomendacao,
      scores: {
        tecnicoScore: technical.scoreTecnico,
        iaScore: ai.scoreIA,
      },
      flagsCriticas,
      justificacao,
      tempoTotalAnalise: technical.tempoAnalise + ai.tempoAnalise,
      timestamp: new Date().toISOString(),
    };
  }

  private static determineRiskLevel(
    scoreTotal: number
  ): "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO" {
    if (scoreTotal >= 90) return "ALTO_RISCO";
    if (scoreTotal >= 70) return "MEDIO_ALTO";
    if (scoreTotal >= 50) return "MEDIO";
    return "BAIXO";
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

  private static compileCriticalFlags(
    technical: TechnicalValidationResult,
    ai: AIValidationResult
  ) {
    const flags = [];

    // Add high-severity technical flags
    for (const flag of technical.flags) {
      if (flag.severidade === "ALTA") {
        flags.push({
          fonte: "TECNICO" as const,
          tipo: flag.tipo,
          severidade: flag.severidade,
        });
      }
    }

    // Add high-confidence AI risks
    for (const risk of ai.riscoDetectado) {
      if (risk.confianca >= 0.7) {
        flags.push({
          fonte: "IA" as const,
          tipo: risk.tipo,
          confianca: risk.confianca,
        });
      }
    }

    // Sort by severity/confidence (highest first)
    flags.sort((a, b) => {
      const aScore =
        (a as any).severidade === "ALTA"
          ? 100
          : (a as any).confianca
            ? (a as any).confianca * 100
            : 0;
      const bScore =
        (b as any).severidade === "ALTA"
          ? 100
          : (b as any).confianca
            ? (b as any).confianca * 100
            : 0;
      return bScore - aScore;
    });

    return flags.slice(0, 5); // Top 5 critical flags
  }

  private static buildJustification(
    technical: TechnicalValidationResult,
    ai: AIValidationResult,
    nivelRisco: string
  ): string {
    const parts: string[] = [];

    // Add technical findings
    if (technical.flags.length > 0) {
      const altaFlags = technical.flags
        .filter((f) => f.severidade === "ALTA")
        .map((f) => f.tipo)
        .join(", ");
      if (altaFlags) {
        parts.push(`Técnico: ${altaFlags} detectados.`);
      }
    }

    // Add AI findings
    if (ai.riscoDetectado.length > 0) {
      const highConfidence = ai.riscoDetectado
        .filter((r) => r.confianca >= 0.7)
        .map((r) => `${r.tipo} (${(r.confianca * 100).toFixed(0)}%)`)
        .join(", ");
      if (highConfidence) {
        parts.push(`IA: ${highConfidence} identificados.`);
      }
    }

    // Add risk level assessment
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
