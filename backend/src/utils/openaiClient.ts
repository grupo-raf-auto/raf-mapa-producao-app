import OpenAI from "openai";
import { getOpenAIModelForFeature } from "../services/openai-model.service";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Request para análise de integridade estrutural do documento (apenas IA)
 */
export interface DocumentIntegrityRequest {
  extractedText: string;
}

/**
 * Resposta do prompt de integridade estrutural
 */
interface StructuralAnalysisResponse {
  document_blocks_detected?: number;
  identity_entities_found?: string[];
  date_references_found?: string[];
  repeated_structural_markers?: string[];
  anomalies_detected?: string[];
  document_integrity_status?: string;
}

const STRUCTURAL_PROMPT = `You are a document structural integrity analyzer.

You will receive RAW TEXT extracted from a PDF or digital document.

Your task is to determine whether the document appears structurally consistent 
or if it shows signs of alteration, aggregation, duplication, or manipulation.

Do NOT summarize the content.
Do NOT assume document type.
Focus only on structural consistency.

Follow this validation process:

STEP 1 — Structural Segmentation
Identify repeated structural blocks, headers, footers, titles, totals, 
signature areas, date sections, identity fields, or repeated formatting markers.

Detect if:
- Multiple independent document blocks exist inside the same file
- Sections appear duplicated
- Structural markers restart mid-document
- Page numbering restarts

STEP 2 — Entity Consistency
Check for inconsistencies in:
- Names or identity references
- Dates or periods
- Reference numbers
- Totals or summary values
- Organization or issuer names
- Layout patterns

STEP 3 — Pattern Continuity
Verify:
- Logical flow from start to end
- Consistent formatting patterns
- No abrupt structural resets
- No conflicting metadata inside text

STEP 4 — Anomaly Detection
Flag:
- Multiple independent documents inside one file
- Different identities in separate blocks
- Mixed periods
- Repeated totals with different values
- Structural duplication
- Abrupt context shifts

STEP 5 — Classification

Return one of (exact key for document_integrity_status):

- "structurally_consistent"
- "possible_duplicate_content"
- "multiple_document_blocks_detected"
- "identity_inconsistency_detected"
- "mixed_periods_detected"
- "structural_anomaly_detected"
- "potentially_aggregated_or_modified"

STEP 6 — Output Format (STRICT JSON)

Return ONLY valid JSON:

{
  "document_blocks_detected": number,
  "identity_entities_found": [],
  "date_references_found": [],
  "repeated_structural_markers": [],
  "anomalies_detected": [],
  "document_integrity_status": ""
}

Be strict.
Be deterministic. For identical input, return identical output.
Do not explain.
Do not add commentary.

IMPORTANT: Write "anomalies_detected" entries in Portuguese (PT-PT).`;

/** Tradução de anomalias comuns EN→PT */
const ANOMALY_PT: Record<string, string> = {
  "multiple independent documents inside one file": "Múltiplos documentos independentes no mesmo ficheiro",
  "different identities in separate blocks": "Identidades diferentes em blocos separados",
  "mixed periods": "Períodos misturados",
  "repeated totals with different values": "Totais repetidos com valores diferentes",
  "structural duplication": "Duplicação estrutural",
  "abrupt context shifts": "Mudanças abruptas de contexto",
  "sections appear duplicated": "Secções aparentam estar duplicadas",
  "structural markers restart mid-document": "Marcadores estruturais reiniciam a meio do documento",
  "page numbering restarts": "Numeração de páginas reinicia",
};

/** Tradução do status para português */
const STATUS_PT: Record<string, string> = {
  structurally_consistent: "Estruturalmente consistente",
  possible_duplicate_content: "Possível conteúdo duplicado",
  multiple_document_blocks_detected: "Múltiplos blocos de documento",
  identity_inconsistency_detected: "Inconsistência de identidade",
  mixed_periods_detected: "Períodos misturados",
  structural_anomaly_detected: "Anomalia estrutural",
  potentially_aggregated_or_modified: "Potencialmente agregado ou modificado",
};

/**
 * Mapeia document_integrity_status para score (0-100) e recomendação
 */
function mapStatusToScoreAndRecommendation(
  status: string,
  anomalies: string[]
): { scoreIA: number; recomendacao: string } {
  const s = (status || "").toLowerCase();
  if (s === "structurally_consistent")
    return { scoreIA: 95, recomendacao: "ACEITAR" };
  if (s === "possible_duplicate_content")
    return { scoreIA: 72, recomendacao: "VALIDAR_EXTRA" };
  if (s === "multiple_document_blocks_detected")
    return { scoreIA: 55, recomendacao: "REJEITAR_COM_REVISAO" };
  if (s === "identity_inconsistency_detected")
    return { scoreIA: 45, recomendacao: "REJEITAR_COM_REVISAO" };
  if (s === "mixed_periods_detected")
    return { scoreIA: 50, recomendacao: "REJEITAR_COM_REVISAO" };
  if (s === "structural_anomaly_detected")
    return { scoreIA: 48, recomendacao: "REJEITAR_COM_REVISAO" };
  if (s === "potentially_aggregated_or_modified")
    return { scoreIA: 35, recomendacao: "REJEITAR" };
  return { scoreIA: 60, recomendacao: "VALIDAR_EXTRA" };
}

/** Anomalias redundantes com cada status (não adicionar se status já cobre) */
const STATUS_REDUNDANT_ANOMALIES: Record<string, string[]> = {
  multiple_document_blocks_detected: ["multiple independent documents", "múltiplos documentos independentes", "structural duplication", "duplicação estrutural"],
  identity_inconsistency_detected: ["different identities", "identidades diferentes"],
  mixed_periods_detected: ["mixed periods", "períodos misturados"],
  possible_duplicate_content: ["structural duplication", "duplicação estrutural", "sections appear duplicated", "secções aparentam estar duplicadas"],
  structural_anomaly_detected: ["structural duplication", "duplicação estrutural", "multiple independent documents", "múltiplos documentos independentes"],
  potentially_aggregated_or_modified: ["abrupt context shifts", "mudanças abruptas de contexto"],
};

function isAnomalyRedundantWithStatus(status: string, anomaly: string): boolean {
  const s = status.toLowerCase().replace(/-/g, "_");
  const keywords = STATUS_REDUNDANT_ANOMALIES[s];
  if (!keywords) return false;
  const lower = anomaly.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Converte anomalias e status em riscoDetectado (sem redundâncias)
 */
function buildRiskFactors(
  status: string,
  anomalies: string[]
): Array<{ tipo: string; confianca: number; justificacao: string }> {
  const factors: Array<{ tipo: string; confianca: number; justificacao: string }> = [];
  const seenJustificacoes = new Set<string>();

  const addFactor = (tipo: string, confianca: number, justificacao: string) => {
    const key = `${tipo}:${justificacao.toLowerCase().trim()}`;
    if (seenJustificacoes.has(key)) return;
    seenJustificacoes.add(key);
    factors.push({ tipo, confianca, justificacao });
  };

  const statusMap: Record<string, { tipo: string; confianca: number }> = {
    possible_duplicate_content: {
      tipo: "INCONSISTENCIA_CONTEUDO",
      confianca: 0.75,
    },
    multiple_document_blocks_detected: {
      tipo: "ESTRUTURA_SUSPEITA",
      confianca: 0.9,
    },
    identity_inconsistency_detected: {
      tipo: "INCONSISTENCIA_CONTEUDO",
      confianca: 0.9,
    },
    mixed_periods_detected: {
      tipo: "INCONSISTENCIA_CONTEUDO",
      confianca: 0.85,
    },
    structural_anomaly_detected: {
      tipo: "ESTRUTURA_SUSPEITA",
      confianca: 0.85,
    },
    potentially_aggregated_or_modified: {
      tipo: "TEXTO_ALTERADO",
      confianca: 0.9,
    },
  };
  const s = status.toLowerCase().replace(/-/g, "_");
  if (s && s !== "structurally_consistent" && statusMap[s]) {
    const { tipo, confianca } = statusMap[s];
    const justificacao = STATUS_PT[s] || status;
    addFactor(tipo, confianca, justificacao);
  }
  for (const a of anomalies || []) {
    if (isAnomalyRedundantWithStatus(status, a)) continue;
    const lower = a.toLowerCase();
    let tipo = "ESTRUTURA_SUSPEITA";
    if (lower.includes("duplicate") || lower.includes("duplicad")) tipo = "INCONSISTENCIA_CONTEUDO";
    else if (lower.includes("identity") || lower.includes("identidade")) tipo = "INCONSISTENCIA_CONTEUDO";
    else if (lower.includes("period") || lower.includes("data") || lower.includes("date")) tipo = "INCONSISTENCIA_CONTEUDO";
    else if (lower.includes("context") || lower.includes("shift")) tipo = "TEXTO_ALTERADO";
    let justificacaoPt = a;
    for (const [en, pt] of Object.entries(ANOMALY_PT)) {
      if (lower.includes(en.toLowerCase())) {
        justificacaoPt = pt;
        break;
      }
    }
    addFactor(tipo, 0.8, justificacaoPt);
  }
  return factors;
}

/**
 * Analisa integridade estrutural do documento (apenas IA, sem libs técnicas)
 */
export async function analyzeDocumentIntegrity(
  request: DocumentIntegrityRequest
): Promise<{
  scoreIA: number;
  analysis: string;
  riskFactors: Array<{
    tipo: string;
    confianca: number;
    justificacao: string;
  }>;
  recomendacao: string;
}> {
  const model = await getOpenAIModelForFeature("scanner");

  const MAX_TEXT_CHARS = 60000;
  const truncatedText = request.extractedText.slice(0, MAX_TEXT_CHARS);
  const truncInfo =
    request.extractedText.length > MAX_TEXT_CHARS
      ? `\n\n[Texto truncado: ${request.extractedText.length} → ${MAX_TEXT_CHARS} caracteres]`
      : "";

  const response = await openaiClient.chat.completions.create({
    model,
    max_completion_tokens: 2000,
    temperature: 0,
    seed: 42,
    messages: [
      {
        role: "user",
        content: `${STRUCTURAL_PROMPT}\n\n---\n\nRAW TEXT:\n\n${truncatedText}${truncInfo}`,
      },
    ],
  });

  const textContent = response.choices
    .filter((c: any) => c.message?.content)
    .map((c: any) => c.message.content)
    .join("");

  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("OpenAI não retornou JSON válido");
  }

  const analysis: StructuralAnalysisResponse = JSON.parse(jsonMatch[0]);
  const status = analysis.document_integrity_status || "";
  const anomalies = analysis.anomalies_detected || [];

  const { scoreIA, recomendacao } = mapStatusToScoreAndRecommendation(
    status,
    anomalies
  );
  const riskFactors = buildRiskFactors(status, anomalies);

  const statusPt = STATUS_PT[status.toLowerCase().replace(/-/g, "_")] || status;
  const analysisSummary = [
    status && `Estado: ${statusPt}`,
    analysis.document_blocks_detected != null &&
      `Blocos de documento: ${analysis.document_blocks_detected}`,
    anomalies.length > 0 && `Anomalias: ${anomalies.join("; ")}`,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    scoreIA,
    analysis: analysisSummary,
    riskFactors,
    recomendacao,
  };
}
