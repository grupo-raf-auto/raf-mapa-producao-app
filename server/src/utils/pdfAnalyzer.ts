import * as fs from "fs";
import * as pdfjsLib from "pdfjs-dist";
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

  // 4. Check for hidden pages (pages with no text but present in structure)
  const pageDetails = [];
  for (let i = 1; i <= data.numpages; i++) {
    const pageText = data.text.split("\f")[i - 1] || "";
    pageDetails.push({
      pageNum: i,
      hasContent: pageText.trim().length > 0,
      textLength: pageText.length,
    });
  }

  const hiddenPages = pageDetails.some(
    (p) => !p.hasContent && p.pageNum <= data.numpages
  );
  if (hiddenPages) {
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
    hasHiddenPages: hiddenPages,
    suspiciousFeatures,
    pageDetails,
  };
}
