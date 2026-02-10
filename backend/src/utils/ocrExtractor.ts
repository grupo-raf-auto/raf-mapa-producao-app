import * as Tesseract from "tesseract.js";

/**
 * OCR text extraction service for document images
 */
export class OCRExtractor {
  /**
   * Extracts text from image files using Tesseract.js with Portuguese language support
   */
  static async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      const result = await (Tesseract as any).recognize(imagePath, "por", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return result.data.text;
    } catch (error) {
      throw new Error(
        `Erro na extração OCR: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
