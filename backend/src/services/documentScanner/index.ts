import { AIValidator } from "./aiValidator";
import { ScoreCompiler } from "./scoreCompiler";
import { extractTextFromDocument } from "../../utils/textExtractor";
import type { DocumentScanResult } from "./types";
import * as fs from "fs";

/**
 * Scanner de documentos – verificação apenas por IA (sem libs técnicas)
 */
export class DocumentScanner {
  /**
   * Analisa documento usando apenas IA (extração de texto + análise estrutural)
   */
  static async scanDocument(
    documentId: string,
    filePath: string,
    mimeType: string
  ): Promise<DocumentScanResult> {
    try {
      // Stage 1: Extrair texto
      console.log(`[${documentId}] Extraindo texto...`);
      const extractedText = await extractTextFromDocument(filePath, mimeType);
      console.log(
        `[${documentId}] Texto extraído: ${extractedText.length} caracteres`
      );

      // Stage 2: Validação por IA
      console.log(`[${documentId}] Iniciando validação IA...`);
      const aiResult = await AIValidator.validateDocument(extractedText);
      console.log(
        `[${documentId}] Validação IA completa: score ${aiResult.scoreIA}`
      );

      // Stage 3: Compilar resultados
      const result = ScoreCompiler.compile(documentId, aiResult);

      console.log(
        `[${documentId}] Scan completo: score ${result.scoreTotal}, risco ${result.nivelRisco}`
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
