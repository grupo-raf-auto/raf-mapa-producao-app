import * as fs from "fs";
import { analyzePDF } from "../../utils/pdfAnalyzer";
import { OCRExtractor } from "../../utils/ocrExtractor";
import type {
  TechnicalValidationResult,
  TechnicalValidationFlag,
} from "./types";

/**
 * Technical validator service for document fraud detection.
 * Analyzes PDFs and images for structural anomalies and suspicious features.
 */
export class TechnicalValidator {
  /**
   * Validates a PDF document for fraud indicators.
   * Checks for hidden pages, metadata anomalies, compression issues, and structural inconsistencies.
   */
  static async validatePDF(filePath: string): Promise<TechnicalValidationResult> {
    const startTime = Date.now();
    const flags: TechnicalValidationFlag[] = [];
    let score = 100; // Start with perfect score, deduct for issues

    try {
      const analysis = await analyzePDF(filePath);

      // Flag 1: Hidden pages
      if (analysis.hasHiddenPages) {
        flags.push({
          tipo: "PAGINAS_OCULTAS",
          severidade: "ALTA",
          valor: analysis.pageDetails.filter((p) => !p.hasContent).length,
          descricao: "Detectadas páginas sem conteúdo na estrutura PDF",
        });
        score -= 25;
      }

      // Flag 2: Metadata suspicious
      if (
        analysis.metadata.modificationDate &&
        analysis.metadata.creationDate &&
        analysis.metadata.modificationDate > analysis.metadata.creationDate
      ) {
        const daysDiff = Math.floor(
          (analysis.metadata.modificationDate.getTime() -
            analysis.metadata.creationDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        flags.push({
          tipo: "METADATA_SUSPEITA",
          severidade: daysDiff > 365 ? "BAIXA" : "MEDIA",
          valor: `modificado ${daysDiff} dias após criação`,
          descricao: "Data de modificação posterior à criação",
        });
        score -= daysDiff > 365 ? 5 : 15;
      }

      // Flag 3: Abnormal compression
      if (analysis.suspiciousFeatures.includes("compressao_anormal")) {
        flags.push({
          tipo: "COMPRESSAO_ANORMAL",
          severidade: "BAIXA",
          descricao: "Tamanho do ficheiro anormalmente pequeno para número de páginas",
        });
        score -= 8;
      }

      // Flag 4: Multiple versions
      if (analysis.suspiciousFeatures.includes("multiplas_versoes_pdf")) {
        flags.push({
          tipo: "MULTIPLAS_VERSOES",
          severidade: "ALTA",
          descricao: "Múltiplas versões detectadas no PDF (sinal de edição)",
        });
        score -= 30;
      }

      // Flag 5: XFA forms (sometimes used for manipulation)
      if (analysis.metadata.hasXFA) {
        flags.push({
          tipo: "FONTES_SUSPEITAS",
          severidade: "MEDIA",
          descricao: "PDF contém formulários XFA (potencial para manipulação)",
        });
        score -= 10;
      }

      score = Math.max(0, score);

      return {
        scoreTecnico: score,
        flags,
        textoExtraido: analysis.textContent,
        tempoAnalise: Date.now() - startTime,
        metadados: analysis.metadata as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação técnica PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validates an image document for fraud indicators.
   * Checks for suspicious dimensions, compression artifacts, and EXIF anomalies.
   */
  static async validateImage(filePath: string): Promise<TechnicalValidationResult> {
    const startTime = Date.now();
    const flags: TechnicalValidationFlag[] = [];
    let score = 100;

    try {
      const sharp = await import("sharp");
      const fileStats = fs.statSync(filePath);

      const metadata = await sharp.default(filePath).metadata();

      // Flag 1: Unusual dimensions (screenshot vs real photo)
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (
          (aspectRatio > 2.5 || aspectRatio < 0.4) &&
          !(metadata.width === 1920 || metadata.height === 1080)
        ) {
          flags.push({
            tipo: "DIMENSOES_ANORMAIS",
            severidade: "MEDIA",
            valor: `${metadata.width}x${metadata.height}`,
            descricao: "Dimensões anormais para foto de documento",
          });
          score -= 12;
        }
      }

      // Flag 2: JPEG recompression artifacts
      if (metadata.format === "jpeg") {
        // Check file size vs dimensions (compression indicator)
        const pixelsPerByte =
          ((metadata.width || 0) * (metadata.height || 0)) / fileStats.size;
        if (pixelsPerByte > 50) {
          // Very high compression
          flags.push({
            tipo: "RECOMPRESSAO_DETECTADA",
            severidade: "BAIXA",
            descricao: "Artefatos de recompressão JPEG detectados",
          });
          score -= 8;
        }
      }

      // Flag 3: Missing or suspicious EXIF
      if (metadata.hasAlpha && metadata.format === "jpeg") {
        flags.push({
          tipo: "EXIF_ALTERADO",
          severidade: "MEDIA",
          descricao: "Metadados EXIF removidos ou modificados",
        });
        score -= 10;
      }

      // Extract text via OCR
      let textoExtraido = "";
      try {
        textoExtraido = await OCRExtractor.extractTextFromImage(filePath);
      } catch (e) {
        console.warn("OCR falhou, continuando sem texto extraído:", e);
      }

      score = Math.max(0, score);

      return {
        scoreTecnico: score,
        flags,
        textoExtraido,
        tempoAnalise: Date.now() - startTime,
        metadados: metadata as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação técnica de imagem: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Routes validation to appropriate analyzer based on MIME type.
   */
  static async validate(
    filePath: string,
    mimeType: string
  ): Promise<TechnicalValidationResult> {
    if (mimeType === "application/pdf") {
      return this.validatePDF(filePath);
    } else if (mimeType.startsWith("image/")) {
      return this.validateImage(filePath);
    } else {
      throw new Error(`Tipo de ficheiro não suportado: ${mimeType}`);
    }
  }
}
