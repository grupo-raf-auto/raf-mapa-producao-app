import { analyzeFraudWithOpenAI } from "../../utils/openaiClient";
import type { AIValidationResult, TechnicalValidationResult } from "./types";
import * as fs from "fs";
import * as path from "path";

/**
 * AI-based fraud detection validator using OpenAI Vision
 */
export class AIValidator {
  /**
   * Validates document for fraud using OpenAI Vision API
   */
  static async validateDocument(
    filePath: string,
    technicalResult: TechnicalValidationResult,
    mimeType: string
  ): Promise<AIValidationResult> {
    const startTime = Date.now();

    try {
      // Prepare images for OpenAI
      const imageBases64: string[] = [];

      if (mimeType.startsWith("image/")) {
        // Single image
        const imageBuffer = fs.readFileSync(filePath);
        imageBases64.push(imageBuffer.toString("base64"));
      }

      // Call OpenAI
      const openaiResult = await analyzeFraudWithOpenAI({
        documentType: this.inferDocumentType(filePath),
        extractedText: technicalResult.textoExtraido,
        imageBases64,
        technicalFlags: technicalResult.flags,
      });

      return {
        scoreIA: openaiResult.scoreIA,
        riscoDetectado: openaiResult.riskFactors.map((r) => ({
          tipo: r.tipo as any,
          confianca: r.confianca,
          justificacao: r.justificacao,
        })),
        recomendacao: this.mapOpenAIRecommendation(openaiResult.analysis),
        tempoAnalise: Date.now() - startTime,
        analiseDetalhada: openaiResult.analysis,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação IA: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private static inferDocumentType(filePath: string): string {
    const filename = path.basename(filePath).toLowerCase();
    if (filename.includes("contrato")) return "contrato";
    if (filename.includes("rendimento")) return "declaracao_rendimento";
    if (filename.includes("comprovante")) return "comprovante";
    return "documento_generico";
  }

  private static mapOpenAIRecommendation(analysis: string): string {
    const lower = analysis.toLowerCase();
    if (lower.includes("alto risco") || lower.includes("rejeitar"))
      return "REJEITAR - Alto risco de fraude";
    if (lower.includes("revisão")) return "REJEITAR_COM_REVISAO - Requer análise manual";
    if (lower.includes("validar")) return "VALIDAR_EXTRA - Solicitar documentos adicionais";
    return "ACEITAR - Documento válido";
  }
}
