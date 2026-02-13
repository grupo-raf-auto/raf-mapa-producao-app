import * as fs from "fs";
import pdfParse from "pdf-parse";
import { OCRExtractor } from "./ocrExtractor";

/**
 * Extrai texto de PDF ou imagem (apenas para análise por IA).
 * Sem validação técnica por libs.
 */
export async function extractTextFromDocument(
  filePath: string,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  if (mimeType.startsWith("image/")) {
    return OCRExtractor.extractTextFromImage(filePath);
  }
  throw new Error(`Tipo não suportado: ${mimeType}`);
}
