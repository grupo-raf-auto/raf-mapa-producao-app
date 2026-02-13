import { analyzeDocumentIntegrity } from "../../utils/openaiClient";
import type { AIValidationResult } from "./types";

/**
 * Validação de integridade documental por IA (sem verificação técnica por libs)
 */
export class AIValidator {
  /**
   * Valida documento usando apenas análise por IA
   */
  static async validateDocument(
    extractedText: string
  ): Promise<AIValidationResult> {
    const startTime = Date.now();

    try {
      const openaiResult = await analyzeDocumentIntegrity({
        extractedText,
      });

      return {
        scoreIA: openaiResult.scoreIA,
        riscoDetectado: openaiResult.riskFactors.map((r) => ({
          tipo: r.tipo as any,
          confianca: r.confianca,
          justificacao: r.justificacao,
        })),
        recomendacao: this.mapRecommendation(openaiResult.recomendacao),
        tempoAnalise: Date.now() - startTime,
        analiseDetalhada: openaiResult.analysis,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação IA: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private static mapRecommendation(recomendacao: string): string {
    const upper = recomendacao.toUpperCase().trim();
    if (upper.startsWith("REJEITAR") && !upper.includes("REVISAO"))
      return "REJEITAR - Manipulação ou fraude detectada";
    if (upper.includes("REJEITAR_COM_REVISAO"))
      return "REJEITAR_COM_REVISAO - Requer análise manual";
    if (upper.includes("VALIDAR_EXTRA"))
      return "VALIDAR_EXTRA - Solicitar documentos adicionais";
    return "ACEITAR - Documento sem sinais de manipulação";
  }
}
