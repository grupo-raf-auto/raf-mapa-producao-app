import fs from "fs/promises";
import path from "path";

/**
 * Extrai texto de um ficheiro baseado no tipo MIME
 */
export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
): Promise<string> {
  try {
    // Para arquivos de texto simples
    if (mimeType === "text/plain" || mimeType.startsWith("text/")) {
      return await fs.readFile(filePath, "utf-8");
    }

    // Para PDFs
    if (mimeType === "application/pdf") {
      try {
        // Tentar usar pdf-parse se disponível
        const pdfParse = require("pdf-parse");
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      } catch (error) {
        console.warn("pdf-parse não disponível, tentando leitura básica");
        throw new Error(
          "Processamento de PDF requer pdf-parse. Execute: npm install pdf-parse",
        );
      }
    }

    // Para DOCX
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        // Tentar usar mammoth se disponível
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (error) {
        console.warn("mammoth não disponível, tentando leitura básica");
        throw new Error(
          "Processamento de DOCX requer mammoth. Execute: npm install mammoth",
        );
      }
    }

    // Para Markdown
    if (mimeType === "text/markdown" || mimeType === "text/x-markdown") {
      return await fs.readFile(filePath, "utf-8");
    }

    throw new Error(`Tipo de ficheiro não suportado: ${mimeType}`);
  } catch (error: any) {
    console.error("Erro ao extrair texto:", error);
    throw new Error(`Erro ao processar ficheiro: ${error.message}`);
  }
}
