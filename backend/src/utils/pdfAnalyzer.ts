import * as fs from "fs";
import pdfParse from "pdf-parse";

interface PDFMetadata {
  numPages: number;
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
  isLinearized?: boolean;
  hasXFA?: boolean;
}

interface PDFAnalysisResult {
  metadata: PDFMetadata;
  textContent: string;
  hasHiddenPages: boolean;
  suspiciousFeatures: string[];
  pageDetails: Array<{
    pageNum: number;
    hasContent: boolean;
    textLength: number;
  }>;
}

export async function analyzePDF(filePath: string): Promise<PDFAnalysisResult> {
  const fileBuffer = fs.readFileSync(filePath);

  // Parse with pdf-parse for metadata
  const data = await pdfParse(fileBuffer);

  // Check for suspicious metadata
  const suspiciousFeatures: string[] = [];

  // 1. Check if creation and modification dates don't match (sign of alteration)
  if (
    data.info?.CreationDate &&
    data.info?.ModDate &&
    new Date(data.info.CreationDate).getTime() !==
      new Date(data.info.ModDate).getTime()
  ) {
    suspiciousFeatures.push("data_modificacao_posterior_criacao");
  }

  // 2. Check for multiple versions in PDF (indicates editing)
  const fileStr = fileBuffer.toString("binary");
  const versionMatches = fileStr.match(/%PDF-/g);
  if (versionMatches && versionMatches.length > 1) {
    suspiciousFeatures.push("multiplas_versoes_pdf");
  }

  // 3. Check for unusual compression
  if (fileBuffer.length / data.numpages < 1000) {
    suspiciousFeatures.push("compressao_anormal");
  }

  // 4. Check for hidden pages (páginas sem conteúdo extraível na estrutura PDF)
  const pageDetails = await getPageDetailsFromPdf(fileBuffer, data.numpages, data.text);
  const pagesWithoutContent = pageDetails.filter((p) => !p.hasContent);
  const hasHiddenPages = pagesWithoutContent.length > 0;

  if (hasHiddenPages) {
    suspiciousFeatures.push("paginas_ocultas_detectadas");
  }

  return {
    metadata: {
      numPages: data.numpages,
      producer: data.info?.Producer,
      creator: data.info?.Creator,
      creationDate: data.info?.CreationDate
        ? new Date(data.info.CreationDate)
        : undefined,
      modificationDate: data.info?.ModDate
        ? new Date(data.info.ModDate)
        : undefined,
      isLinearized: fileStr.includes("linearized"),
      hasXFA: fileStr.includes("/XFA"),
    },
    textContent: data.text,
    hasHiddenPages,
    suspiciousFeatures,
    pageDetails,
  };
}

/**
 * Extrai detalhes por página para detecção de páginas ocultas.
 * Usa pdfjs para extrair texto por página; fallback para heurística com pdf-parse.
 */
async function getPageDetailsFromPdf(
  fileBuffer: Buffer,
  numPages: number,
  fullText: string
): Promise<Array<{ pageNum: number; hasContent: boolean; textLength: number }>> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const doc = await (pdfjsLib as any).getDocument({ data: new Uint8Array(fileBuffer) }).promise;
    const pageDetails: Array<{ pageNum: number; hasContent: boolean; textLength: number }> = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const text = (textContent.items as Array<{ str?: string }>)
        .map((item) => item.str || "")
        .join(" ")
        .trim();
      pageDetails.push({
        pageNum: i,
        hasContent: text.length > 0,
        textLength: text.length,
      });
    }
    return pageDetails;
  } catch {
    // Fallback: usa form feed (\f) como separador de páginas (comum em PDFs)
    const parts = fullText.split(/\f/);
    const pageDetails: Array<{ pageNum: number; hasContent: boolean; textLength: number }> = [];
    for (let i = 1; i <= numPages; i++) {
      const pageText = (parts[i - 1] || "").trim();
      pageDetails.push({
        pageNum: i,
        hasContent: pageText.length > 0,
        textLength: pageText.length,
      });
    }
    return pageDetails;
  }
}
