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
