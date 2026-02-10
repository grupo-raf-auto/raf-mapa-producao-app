import { TechnicalValidator } from "./technicalValidator";
import { AIValidator } from "./aiValidator";
import { ScoreCompiler } from "./scoreCompiler";
import type { DocumentScanResult } from "./types";
import * as fs from "fs";

/**
 * Main document scanner orchestrating technical and AI validation
 */
export class DocumentScanner {
  /**
   * Scans document for fraud using dual validation approach
   */
  static async scanDocument(
    documentId: string,
    filePath: string,
    mimeType: string
  ): Promise<DocumentScanResult> {
    try {
      // Stage 1: Technical validation
      console.log(`[${documentId}] Iniciando validação técnica...`);
      const technicalResult = await TechnicalValidator.validate(
        filePath,
        mimeType
      );
      console.log(
        `[${documentId}] Validação técnica completa: score ${technicalResult.scoreTecnico}`
      );

      // Stage 2: AI validation
      console.log(`[${documentId}] Iniciando validação IA...`);
      const aiResult = await AIValidator.validateDocument(
        filePath,
        technicalResult,
        mimeType
      );
      console.log(
        `[${documentId}] Validação IA completa: score ${aiResult.scoreIA}`
      );

      // Stage 3: Compile results
      const result = ScoreCompiler.compile(documentId, technicalResult, aiResult);

      console.log(
        `[${documentId}] Scan completo: score total ${result.scoreTotal}, risco ${result.nivelRisco}`
      );

      return result;
    } catch (error) {
      console.error(
        `[${documentId}] Erro durante scan:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    } finally {
      // Cleanup temp file
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn(`Erro ao limpar ficheiro temporário: ${e}`);
        }
      }
    }
  }
}

export * from "./types";
