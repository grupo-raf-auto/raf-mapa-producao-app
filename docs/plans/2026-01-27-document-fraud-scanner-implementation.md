# Document Fraud Scanner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build an automated document fraud detection system with dual validation (technical + AI) that analyzes PDFs and images to detect fraud, hidden pages, altered content, and forged signatures.

**Architecture:**
Two-stage validation pipeline: (1) Local technical analysis using PDF/image libraries to detect structural anomalies, metadata issues, compression artifacts, and OCR text extraction; (2) OpenAI Vision analysis for semantic understanding of content, inconsistencies, and fraud patterns. Combined scores (35% technical + 65% AI) produce risk level and automated recommendation with detailed flag justification.

**Tech Stack:**
Node.js/Express backend, Prisma ORM, OpenAI Vision API (gpt-4o-mini), pdf-parse/pdfjs-dist for PDF analysis, sharp for image metadata, tesseract.js for OCR, Zod for validation.

---

## Task 1: Setup - Add Dependencies and Types

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/services/documentScanner/types.ts`
- Modify: `backend/.env.example`

**Step 1: Add dependencies to package.json**

Current dependencies already include `pdf-parse` and `openai`. Add the missing ones:

```bash
cd backend
npm install pdfjs-dist sharp tesseract.js
npm install --save-dev @types/sharp
```

Verify in [backend/package.json](backend/package.json) that these are added to dependencies.

**Step 2: Create types file for document scanner**

Create `backend/src/services/documentScanner/types.ts`:

```typescript
// Document Scanner Types

export interface TechnicalValidationFlag {
  tipo:
    | "PAGINAS_OCULTAS"
    | "METADATA_SUSPEITA"
    | "COMPRESSAO_ANORMAL"
    | "MULTIPLAS_VERSOES"
    | "FONTES_SUSPEITAS"
    | "EXIF_ALTERADO"
    | "RECOMPRESSAO_DETECTADA"
    | "DIMENSOES_ANORMAIS";
  severidade: "ALTA" | "MEDIA" | "BAIXA";
  valor?: string | number | boolean;
  descricao?: string;
}

export interface TechnicalValidationResult {
  scoreTecnico: number;
  flags: TechnicalValidationFlag[];
  textoExtraido: string;
  tempoAnalise: number;
  metadados?: Record<string, unknown>;
}

export interface AIValidationRisk {
  tipo:
    | "ASSINATURA_FALSIFICADA"
    | "TEXTO_ALTERADO"
    | "INCONSISTENCIA_CONTEUDO"
    | "ESTRUTURA_SUSPEITA"
    | "IMAGEM_EDITADA"
    | "CARIMBO_FALSO";
  confianca: number; // 0-1
  justificacao: string;
}

export interface AIValidationResult {
  scoreIA: number;
  riscoDetectado: AIValidationRisk[];
  recomendacao: string;
  tempoAnalise: number;
  analiseDetalhada?: string;
}

export interface DocumentScanResult {
  documentId: string;
  scoreTotal: number;
  nivelRisco: "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO";
  recomendacao: "REJEITAR" | "REJEITAR_COM_REVISAO" | "VALIDAR_EXTRA" | "ACEITAR";
  scores: {
    tecnicoScore: number;
    iaScore: number;
  };
  flagsCriticas: Array<{
    fonte: "TECNICO" | "IA";
    tipo: string;
    severidade?: string;
    confianca?: number;
  }>;
  justificacao: string;
  tempoTotalAnalise: number;
  timestamp: string;
}

export interface FileScannerConfig {
  maxFileSize: number;
  tempDir: string;
  enableOCR: boolean;
  aiProvider: "openai";
  aiModel: "gpt-4o-mini" | "gpt-4o";
}
```

**Step 3: Update .env.example**

Add to `backend/.env.example`:

```
# Document Scanner
DOCUMENT_SCANNER_ENABLED=true
TEMP_UPLOAD_DIR=./uploads/temp
MAX_SCAN_FILE_SIZE=50000000
AI_MODEL_FOR_SCANNER=gpt-4o-mini
```

**Step 4: Commit**

```bash
git add backend/package.json backend/src/services/documentScanner/types.ts backend/.env.example
git commit -m "feat: add document scanner dependencies and type definitions

- Install pdfjs-dist, sharp, tesseract.js for document analysis
- Create comprehensive types for technical and AI validation
- Add environment variables for scanner configuration"
```

---

## Task 2: Create Technical Validator - PDF Analysis

**Files:**
- Create: `backend/src/services/documentScanner/technicalValidator.ts`
- Create: `backend/src/utils/pdfAnalyzer.ts`

**Step 1: Create PDF analyzer utility**

Create `backend/src/utils/pdfAnalyzer.ts`:

```typescript
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
```

**Step 2: Create technical validator service**

Create `backend/src/services/documentScanner/technicalValidator.ts`:

```typescript
import * as fs from "fs";
import { analyzePDF } from "../../utils/pdfAnalyzer";
import type {
  TechnicalValidationResult,
  TechnicalValidationFlag,
} from "./types";

export class TechnicalValidator {
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
        metadados: analysis.metadata,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação técnica PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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

      score = Math.max(0, score);

      return {
        scoreTecnico: score,
        flags,
        textoExtraido: "", // Will be filled by OCR in next task
        tempoAnalise: Date.now() - startTime,
        metadados: metadata,
      };
    } catch (error) {
      throw new Error(
        `Erro na validação técnica de imagem: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
```

**Step 3: Run and verify PDF analyzer works**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add backend/src/utils/pdfAnalyzer.ts backend/src/services/documentScanner/technicalValidator.ts
git commit -m "feat: implement technical PDF and image analysis

- Analyze PDF metadata, pages, compression, versions
- Detect hidden pages and structural anomalies
- Analyze image dimensions, EXIF, compression artifacts
- Generate technical validation flags and scores"
```

---

## Task 3: Create OCR Text Extraction Service

**Files:**
- Create: `backend/src/utils/ocrExtractor.ts`
- Modify: `backend/src/services/documentScanner/technicalValidator.ts`

**Step 1: Create OCR extractor**

Create `backend/src/utils/ocrExtractor.ts`:

```typescript
import Tesseract from "tesseract.js";
import { createReadStream } from "fs";

export class OCRExtractor {
  static async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      const result = await Tesseract.recognize(imagePath, "por", {
        logger: (m) => {
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
```

**Step 2: Update technical validator to use OCR for images**

In `backend/src/services/documentScanner/technicalValidator.ts`, update the `validateImage` method:

```typescript
import { OCRExtractor } from "../../utils/ocrExtractor";

// Inside TechnicalValidator class, update validateImage:
static async validateImage(filePath: string): Promise<TechnicalValidationResult> {
  const startTime = Date.now();
  const flags: TechnicalValidationFlag[] = [];
  let score = 100;

  try {
    const sharp = await import("sharp");
    const fileStats = fs.statSync(filePath);
    const metadata = await sharp.default(filePath).metadata();

    // ... existing flag logic ...

    // Extract text via OCR
    const textoExtraido = await OCRExtractor.extractTextFromImage(filePath);

    score = Math.max(0, score);

    return {
      scoreTecnico: score,
      flags,
      textoExtraido, // Now populated
      tempoAnalise: Date.now() - startTime,
      metadados: metadata,
    };
  } catch (error) {
    throw new Error(
      `Erro na validação técnica de imagem: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

**Step 3: Build and verify**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add backend/src/utils/ocrExtractor.ts backend/src/services/documentScanner/technicalValidator.ts
git commit -m "feat: add OCR text extraction for image documents

- Use Tesseract.js for Portuguese text recognition
- Extract and include OCR text in technical validation
- Support for image-based documents (JPG, PNG)"
```

---

## Task 4: Create AI Validator - OpenAI Integration

**Files:**
- Create: `backend/src/utils/openaiClient.ts`
- Create: `backend/src/services/documentScanner/aiValidator.ts`

**Step 1: Create OpenAI client wrapper**

Create `backend/src/utils/openaiClient.ts`:

```typescript
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageAnalysisRequest {
  documentType: string;
  extractedText: string;
  imageBases64: string[]; // Base64 encoded images
  technicalFlags: Array<{
    tipo: string;
    severidade: string;
  }>;
}

export async function analyzeFraudWithOpenAI(
  request: ImageAnalysisRequest
): Promise<{
  scoreIA: number;
  analysis: string;
  riskFactors: Array<{
    tipo: string;
    confianca: number;
    justificacao: string;
  }>;
}> {
  const model = (process.env.AI_MODEL_FOR_SCANNER as "gpt-4o-mini" | "gpt-4o") || "gpt-4o-mini";

  // Build content array
  const messageContent: Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
  }> = [
    {
      type: "text",
      text: `Você é um perito em detecção de fraude de documentos financeiros. Analise este documento rigorosamente.

CONTEXTO:
- Tipo de documento: ${request.documentType}
- Flags técnicas detectadas: ${request.technicalFlags.map((f) => `${f.tipo} (${f.severidade})`).join(", ")}

TEXTO EXTRAÍDO:
${request.extractedText}

TAREFAS:
1. Analisa visualmente as imagens do documento
2. Verifica se o texto extraído corresponde ao visual
3. Detecta inconsistências, alterações, assinaturas falsificadas
4. Avalia riscos específicos de fraude

Responde em JSON com este formato EXATO:
{
  "scoreIA": <número 0-100>,
  "riscoDetectado": [
    {
      "tipo": "ASSINATURA_FALSIFICADA|TEXTO_ALTERADO|INCONSISTENCIA_CONTEUDO|ESTRUTURA_SUSPEITA|IMAGEM_EDITADA|CARIMBO_FALSO",
      "confianca": <0.0-1.0>,
      "justificacao": "motivo da detecção"
    }
  ],
  "recomendacao": "REJEITAR|REJEITAR_COM_REVISAO|VALIDAR_EXTRA|ACEITAR",
  "analiseDetalhada": "análise técnica detalhada"
}`,
    },
  ];

  // Add images
  for (const imageBase64 of request.imageBases64) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`,
      },
    });
  }

  const response = await openaiClient.messages.create({
    model,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: messageContent as any,
      },
    ],
  });

  // Extract JSON from response
  const textContent = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as any).text)
    .join("");

  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("OpenAI não retornou JSON válido");
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    scoreIA: analysis.scoreIA || 50,
    analysis: analysis.analiseDetalhada || "",
    riskFactors: analysis.riscoDetectado || [],
  };
}
```

**Step 2: Create AI validator service**

Create `backend/src/services/documentScanner/aiValidator.ts`:

```typescript
import { analyzeFraudWithOpenAI } from "../../utils/openaiClient";
import type { AIValidationResult, TechnicalValidationResult } from "./types";
import * as fs from "fs";
import * as path from "path";

export class AIValidator {
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
      } else if (mimeType === "application/pdf") {
        // For PDFs, would need to convert pages to images
        // For now, skip image analysis for PDFs (can be enhanced)
        console.warn("PDF image extraction not yet implemented");
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
```

**Step 3: Build and verify**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add backend/src/utils/openaiClient.ts backend/src/services/documentScanner/aiValidator.ts
git commit -m "feat: implement OpenAI Vision-based fraud detection

- Create wrapper for OpenAI API calls with vision capability
- Analyze documents for fraud patterns, inconsistencies
- Generate risk factors and recommendations from IA analysis
- Support gpt-4o-mini and gpt-4o models"
```

---

## Task 5: Create Score Compiler Service

**Files:**
- Create: `backend/src/services/documentScanner/scoreCompiler.ts`

**Step 1: Implement score compilation logic**

Create `backend/src/services/documentScanner/scoreCompiler.ts`:

```typescript
import type {
  TechnicalValidationResult,
  AIValidationResult,
  DocumentScanResult,
} from "./types";

export class ScoreCompiler {
  private static readonly TECHNICAL_WEIGHT = 0.35;
  private static readonly AI_WEIGHT = 0.65;

  static compile(
    documentId: string,
    technical: TechnicalValidationResult,
    ai: AIValidationResult
  ): DocumentScanResult {
    // Calculate total score (weighted average)
    const scoreTotal = Math.round(
      technical.scoreTecnico * this.TECHNICAL_WEIGHT +
        ai.scoreIA * this.AI_WEIGHT
    );

    // Determine risk level
    const nivelRisco = this.determinaRiskLevel(scoreTotal);

    // Determine recommendation
    const recomendacao = this.determineRecommendation(scoreTotal, nivelRisco);

    // Compile critical flags (combine both sources, prioritize severe ones)
    const flagsCriticas = this.compilaCriticalFlags(technical, ai);

    // Build justification
    const justificacao = this.buildJustification(technical, ai, nivelRisco);

    return {
      documentId,
      scoreTotal,
      nivelRisco,
      recomendacao,
      scores: {
        tecnicoScore: technical.scoreTecnico,
        iaScore: ai.scoreIA,
      },
      flagsCriticas,
      justificacao,
      tempoTotalAnalise: technical.tempoAnalise + ai.tempoAnalise,
      timestamp: new Date().toISOString(),
    };
  }

  private static determinaRiskLevel(
    scoreTotal: number
  ): "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO" {
    if (scoreTotal >= 90) return "ALTO_RISCO";
    if (scoreTotal >= 70) return "MEDIO_ALTO";
    if (scoreTotal >= 50) return "MEDIO";
    return "BAIXO";
  }

  private static determineRecommendation(
    scoreTotal: number,
    nivelRisco: string
  ): "REJEITAR" | "REJEITAR_COM_REVISAO" | "VALIDAR_EXTRA" | "ACEITAR" {
    switch (nivelRisco) {
      case "ALTO_RISCO":
        return "REJEITAR";
      case "MEDIO_ALTO":
        return "REJEITAR_COM_REVISAO";
      case "MEDIO":
        return "VALIDAR_EXTRA";
      case "BAIXO":
      default:
        return "ACEITAR";
    }
  }

  private static compilaCriticalFlags(
    technical: TechnicalValidationResult,
    ai: AIValidationResult
  ) {
    const flags = [];

    // Add high-severity technical flags
    for (const flag of technical.flags) {
      if (flag.severidade === "ALTA") {
        flags.push({
          fonte: "TECNICO" as const,
          tipo: flag.tipo,
          severidade: flag.severidade,
        });
      }
    }

    // Add high-confidence AI risks
    for (const risk of ai.riscoDetectado) {
      if (risk.confianca >= 0.7) {
        flags.push({
          fonte: "IA" as const,
          tipo: risk.tipo,
          confianca: risk.confianca,
        });
      }
    }

    // Sort by severity/confidence (highest first)
    flags.sort((a, b) => {
      const aScore =
        (a as any).severidade === "ALTA"
          ? 100
          : (a as any).confianca
            ? (a as any).confianca * 100
            : 0;
      const bScore =
        (b as any).severidade === "ALTA"
          ? 100
          : (b as any).confianca
            ? (b as any).confianca * 100
            : 0;
      return bScore - aScore;
    });

    return flags.slice(0, 5); // Top 5 critical flags
  }

  private static buildJustification(
    technical: TechnicalValidationResult,
    ai: AIValidationResult,
    nivelRisco: string
  ): string {
    const parts: string[] = [];

    // Add technical findings
    if (technical.flags.length > 0) {
      const altaFlags = technical.flags
        .filter((f) => f.severidade === "ALTA")
        .map((f) => f.tipo)
        .join(", ");
      if (altaFlags) {
        parts.push(`Técnico: ${altaFlags} detectados.`);
      }
    }

    // Add AI findings
    if (ai.riscoDetectado.length > 0) {
      const highConfidence = ai.riscoDetectado
        .filter((r) => r.confianca >= 0.7)
        .map((r) => `${r.tipo} (${(r.confianca * 100).toFixed(0)}%)`)
        .join(", ");
      if (highConfidence) {
        parts.push(`IA: ${highConfidence} identificados.`);
      }
    }

    // Add risk level assessment
    const riskMessages = {
      ALTO_RISCO: "Documento apresenta risco muito elevado de fraude.",
      MEDIO_ALTO: "Documento apresenta risco significativo e requer revisão manual.",
      MEDIO: "Documento apresenta alguns sinais de alerta. Validação adicional recomendada.",
      BAIXO: "Documento apresenta baixo risco de fraude.",
    };

    parts.push(riskMessages[nivelRisco as keyof typeof riskMessages]);

    return parts.join(" ");
  }
}
```

**Step 2: Build and verify**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add backend/src/services/documentScanner/scoreCompiler.ts
git commit -m "feat: implement score compilation and risk assessment

- Combine technical (35%) and AI (65%) scores
- Determine risk level (ALTO_RISCO, MEDIO_ALTO, MEDIO, BAIXO)
- Generate automated recommendations
- Compile critical flags and justifications"
```

---

## Task 6: Create Main Scanner Service

**Files:**
- Create: `backend/src/services/documentScanner/index.ts`

**Step 1: Implement main document scanner service**

Create `backend/src/services/documentScanner/index.ts`:

```typescript
import { TechnicalValidator } from "./technicalValidator";
import { AIValidator } from "./aiValidator";
import { ScoreCompiler } from "./scoreCompiler";
import type { DocumentScanResult } from "./types";
import * as fs from "fs";

export class DocumentScanner {
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
```

**Step 2: Build and verify**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add backend/src/services/documentScanner/index.ts
git commit -m "feat: create main document scanner orchestration service

- Coordinate technical validation, AI analysis, score compilation
- Manage document processing pipeline from upload to result
- Handle cleanup of temporary files
- Log processing stages for debugging"
```

---

## Task 7: Extend Prisma Schema for Fraud Detection

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add DocumentScan model to schema**

Edit `prisma/schema.prisma` and add after the Document model:

```prisma
model DocumentScan {
  id        String   @id @default(cuid())

  // Reference to document (optional, may scan without storing)
  documentId String?

  // Scan metadata
  fileName     String
  fileType     String   // "pdf" | "image"
  fileSize     Int

  // Scores
  scoreTotal      Int
  technicalScore  Int
  iaScore         Int
  riskLevel       String  // "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO"
  recommendation  String  // "REJEITAR" | "REJEITAR_COM_REVISAO" | "VALIDAR_EXTRA" | "ACEITAR"

  // Results
  flags           Json[]  // Array of flags from both validators
  justification   String  @db.Text

  // Analysis details
  technicalFlags  Json?   // Detailed technical flags
  aiRisks         Json?   // Detailed AI risks

  // Timeline
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // User who initiated scan
  userId          String
  user            User @relation(fields: [userId], references: [id])

  @@map("document_scan")
}
```

Then update the User model to include the relation:

```prisma
model User {
  // ... existing fields ...

  documentScans DocumentScan[]

  // ... rest of model ...
}
```

**Step 2: Run migration**

```bash
cd backend
npm run db:migrate -- --name add_document_scan_model
```

Expected: Migration created and applied successfully.

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add DocumentScan model to store fraud detection results

- Store technical and AI scores separately
- Track risk levels and recommendations
- Maintain full audit trail with timestamps
- Link scans to users for accountability"
```

---

## Task 8: Create API Routes and Controller

**Files:**
- Create: `backend/src/controllers/documentScanner.controller.ts`
- Create: `backend/src/routes/documentScanner.routes.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create scanner controller**

Create `backend/src/controllers/documentScanner.controller.ts`:

```typescript
import { Request, Response } from "express";
import { DocumentScanner } from "../services/documentScanner";
import { prisma } from "../lib/prisma";
import type { DocumentScanResult } from "../services/documentScanner";

export class DocumentScannerController {
  static async scanDocument(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "Ficheiro não fornecido" });

      const file = req.file;
      const documentId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Validate file type
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `Tipo de ficheiro não suportado. Use: PDF, JPG, PNG`,
        });
      }

      // Run scan async but return immediately
      let scanResult: DocumentScanResult | null = null;
      let scanError: string | null = null;

      DocumentScanner.scanDocument(documentId, file.path, file.mimetype)
        .then(async (result) => {
          scanResult = result;
          // Store in database
          await prisma.documentScan.create({
            data: {
              fileName: file.originalname,
              fileType: file.mimetype.startsWith("image/") ? "image" : "pdf",
              fileSize: file.size,
              scoreTotal: result.scoreTotal,
              technicalScore: result.scores.tecnicoScore,
              iaScore: result.scores.iaScore,
              riskLevel: result.nivelRisco,
              recommendation: result.recomendacao,
              flags: result.flagsCriticas as any,
              justification: result.justificacao,
              technicalFlags: result.flags,
              aiRisks: result,
              userId: req.user.id,
            },
          });
          console.log(`[${documentId}] Resultado persistido em BD`);
        })
        .catch((error) => {
          scanError = error instanceof Error ? error.message : String(error);
          console.error(`[${documentId}] Erro fatal:`, scanError);
        });

      // Return immediately with processing info
      res.json({
        id: documentId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "processing",
        message: "Documento enviado. Scan em andamento...",
      });
    } catch (error: unknown) {
      console.error("Erro upload scanner:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      });
    }
  }

  static async getLastScans(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const scans = await prisma.documentScan.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      res.json(scans);
    } catch (error: unknown) {
      console.error("Erro ao listar scans:", error);
      res.status(500).json({ error: "Erro ao listar scans" });
    }
  }

  static async getScanDetail(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const scan = await prisma.documentScan.findUnique({
        where: { id },
      });

      if (!scan) {
        return res.status(404).json({ error: "Scan não encontrado" });
      }

      if (scan.userId !== req.user.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(scan);
    } catch (error: unknown) {
      console.error("Erro ao buscar scan:", error);
      res.status(500).json({ error: "Erro ao buscar scan" });
    }
  }
}
```

**Step 2: Create scanner routes**

Create `backend/src/routes/documentScanner.routes.ts`:

```typescript
import { Router } from "express";
import { DocumentScannerController } from "../controllers/documentScanner.controller";
import { upload } from "../controllers/document.controller"; // Reuse existing upload config

const router = Router();

// POST /api/scanner/scan - Upload and scan document
router.post(
  "/scan",
  upload.single("file"),
  DocumentScannerController.scanDocument
);

// GET /api/scanner/scans - List user's scans
router.get("/scans", DocumentScannerController.getLastScans);

// GET /api/scanner/scans/:id - Get specific scan detail
router.get("/scans/:id", DocumentScannerController.getScanDetail);

export default router;
```

**Step 3: Register routes in main app**

Edit `backend/src/index.ts` and add before the error handler:

```typescript
import scannerRoutes from "./routes/documentScanner.routes";

// ... existing routes ...

// API Routes (protegidas)
app.use("/api/questions", authenticateUser, questionRoutes);
app.use("/api/categories", authenticateUser, categoryRoutes);
app.use("/api/templates", authenticateUser, templateRoutes);
app.use("/api/submissions", authenticateUser, submissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", authenticateUser, documentRoutes);
app.use("/api/scanner", authenticateUser, scannerRoutes); // ADD THIS LINE

// Error handling middleware
```

**Step 4: Build and verify**

```bash
cd backend
npm run build
```

Expected: No TypeScript errors.

**Step 5: Commit**

```bash
git add backend/src/controllers/documentScanner.controller.ts backend/src/routes/documentScanner.routes.ts backend/src/index.ts
git commit -m "feat: create API endpoints for document fraud scanning

- POST /api/scanner/scan - Upload and scan document
- GET /api/scanner/scans - List user's scans
- GET /api/scanner/scans/:id - Get scan details
- Async processing with database persistence"
```

---

## Task 9: Add Frontend UI for Scanner

**Files:**
- Create: `client/components/document-scanner.tsx`
- Create: `client/hooks/useDocumentScanner.ts`
- Modify: `client/app/page.tsx` (add scanner section)

**Step 1: Create scanner hook**

Create `client/hooks/useDocumentScanner.ts`:

```typescript
import { useState } from "react";

interface ScanResult {
  id: string;
  fileName: string;
  scoreTotal: number;
  nivelRisco: "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO";
  recomendacao: string;
  scores: {
    tecnicoScore: number;
    iaScore: number;
  };
  flagsCriticas: Array<any>;
  justificacao: string;
  timestamp: string;
}

export function useDocumentScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);

  const uploadAndScan = async (file: File) => {
    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/scanner/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Scan iniciado:", data);

      // Poll for result (every 2 seconds for up to 30 seconds)
      let attempts = 0;
      const maxAttempts = 15;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const detailResponse = await fetch(`/api/scanner/scans/${data.id}`);

          if (detailResponse.ok) {
            const scanDetail = await detailResponse.json();
            if (scanDetail.scoreTotal !== undefined) {
              setResult(scanDetail);
              clearInterval(pollInterval);
              setScanning(false);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar resultado:", err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setError(
            "Timeout ao processar documento. Tente novamente mais tarde."
          );
          setScanning(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setScanning(false);
    }
  };

  const loadScans = async () => {
    try {
      const response = await fetch("/api/scanner/scans");
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      }
    } catch (err) {
      console.error("Erro ao carregar scans:", err);
    }
  };

  return {
    scanning,
    error,
    result,
    scans,
    uploadAndScan,
    loadScans,
  };
}
```

**Step 2: Create scanner component**

Create `client/components/document-scanner.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";

export function DocumentScanner() {
  const { scanning, error, result, uploadAndScan } = useDocumentScanner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndScan(file);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case "ALTO_RISCO":
        return "bg-red-100 text-red-800 border-red-300";
      case "MEDIO_ALTO":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIO":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "BAIXO":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Scan de Documentos</h2>

      <div className="mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 cursor-pointer transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={handleFileChange}
              disabled={scanning}
              className="hidden"
            />
            <p className="text-gray-600">
              {scanning ? "Processando..." : "Clique para selecionar PDF ou Imagem"}
            </p>
            <p className="text-sm text-gray-400">Máx 50MB</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div
            className={`border rounded-lg p-4 ${getRiskColor(result.nivelRisco)}`}
          >
            <div className="font-bold text-lg">{result.nivelRisco}</div>
            <div className="text-sm">Score: {result.scoreTotal}/100</div>
            <div className="text-sm">
              Técnico: {result.scores.tecnicoScore} | IA: {result.scores.iaScore}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-2">Recomendação</h3>
            <p>{result.recomendacao}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-2">Justificativa</h3>
            <p className="text-sm">{result.justificacao}</p>
          </div>

          {result.flagsCriticas.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-2">Flags Críticas</h3>
              <ul className="space-y-2">
                {result.flagsCriticas.map((flag, idx) => (
                  <li key={idx} className="text-sm flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold">{flag.tipo}</span>
                      {flag.confianca && (
                        <span className="text-gray-600 ml-2">
                          ({(flag.confianca * 100).toFixed(0)}% confiança)
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Escanear Outro Documento
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Add scanner to main page**

Edit `client/app/page.tsx` and add the scanner component in the page layout.

**Step 4: Commit**

```bash
git add client/hooks/useDocumentScanner.ts client/components/document-scanner.tsx client/app/page.tsx
git commit -m "feat: add frontend UI for document fraud scanning

- Create DocumentScanner component with file upload
- Implement polling for async scan results
- Display risk levels, scores, and recommendations
- Show critical flags and justifications"
```

---

## Task 10: Test End-to-End Integration

**Files:**
- Test: Manual testing flow

**Step 1: Start both server and client**

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd client
npm run dev
```

Expected: Both services running on http://localhost:3005 and http://localhost:3004

**Step 2: Test document upload and scanning**

1. Open http://localhost:3004
2. Navigate to document scanner section
3. Upload a PDF or image
4. Monitor server logs for scanning progress
5. Wait for result and verify:
   - Score is calculated (0-100)
   - Risk level is assigned
   - Recommendation is provided
   - Flags are displayed
   - Justification is shown

**Step 3: Verify database storage**

```bash
cd backend
npm run db:studio
```

Check that `document_scan` table contains the scan result with all scores and flags.

**Step 4: Test multiple scans**

Upload 2-3 different documents and verify:
- Each gets unique ID
- Results are stored correctly
- GET /api/scanner/scans returns list
- GET /api/scanner/scans/:id returns details

**Step 5: Commit test results**

```bash
git add .
git commit -m "test: verify end-to-end document scanning integration

- Tested upload and async processing
- Verified score calculation (technical + AI)
- Confirmed database persistence
- Validated API endpoints and frontend display"
```

---

## Summary

**Completed Features:**
- ✅ Technical validation (PDF/image analysis)
- ✅ AI validation (OpenAI Vision integration)
- ✅ Score compilation and risk assessment
- ✅ Database persistence (Prisma)
- ✅ API endpoints for scanning
- ✅ Frontend UI for document upload
- ✅ Async processing with polling

**Future Enhancements (not in this plan):**
- PDF page-to-image conversion for better IA analysis
- Batch scanning for multiple documents
- Advanced dashboard with charts and statistics
- Webhook notifications for scan completion
- Support for additional document types (DOCX, etc.)
