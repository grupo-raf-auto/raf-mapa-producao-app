// Document Scanner Types

/**
 * Represents a technical validation flag detected during document scanning.
 * Used to identify specific technical anomalies or suspicious patterns in documents.
 */
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

/**
 * Contains the results of technical validation analysis performed on a document.
 * Includes quality scores, detected flags, and extracted metadata.
 */
export interface TechnicalValidationResult {
  scoreTecnico: number; // 0-100
  flags: TechnicalValidationFlag[];
  textoExtraido: string;
  tempoAnalise: number;
  metadados?: Record<string, unknown>;
}

/**
 * Represents a detected AI validation risk or anomaly in a document.
 * Contains confidence scores and justification for the identified risk.
 */
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

/**
 * Contains the results of AI-based validation analysis performed on a document.
 * Includes quality scores, detected risks, and recommendations.
 */
export interface AIValidationResult {
  scoreIA: number; // 0-100
  riscoDetectado: AIValidationRisk[];
  recomendacao: string;
  tempoAnalise: number;
  analiseDetalhada?: string;
}

/**
 * Contains the complete scan results of a document after both technical and AI validation.
 * Aggregates scores, flags, and recommendations for document authenticity assessment.
 */
export interface DocumentScanResult {
  documentId: string;
  scoreTotal: number; // 0-100
  nivelRisco: "ALTO_RISCO" | "MEDIO_ALTO" | "MEDIO" | "BAIXO";
  recomendacao: "REJEITAR" | "REJEITAR_COM_REVISAO" | "VALIDAR_EXTRA" | "ACEITAR";
  scores: {
    tecnicoScore: number; // 0-100
    iaScore: number; // 0-100
  };
  flagsCriticas: Array<{
    fonte: "TECNICO" | "IA";
    tipo: TechnicalValidationFlag["tipo"] | AIValidationRisk["tipo"];
    severidade?: TechnicalValidationFlag["severidade"];
    confianca?: number;
  }>;
  justificacao: string;
  tempoTotalAnalise: number;
  timestamp: string;
}

/**
 * Configuration settings for the file scanner service.
 * Controls file size limits, temporary storage, OCR settings, and AI provider options.
 */
export interface FileScannerConfig {
  maxFileSize: number;
  tempDir: string;
  enableOCR: boolean;
  aiProvider: "openai";
  aiModel: "gpt-4o-mini" | "gpt-4o";
}
