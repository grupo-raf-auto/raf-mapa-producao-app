import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI integration for fraud detection analysis
 */
export interface ImageAnalysisRequest {
  documentType: string;
  extractedText: string;
  imageBases64: string[]; // Base64 encoded images
  technicalFlags: Array<{
    tipo: string;
    severidade: string;
  }>;
}

/**
 * Analyzes document for fraud patterns using OpenAI Vision
 */
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

  // Truncate extracted text to prevent exceeding OpenAI context limits
  // ~60,000 chars = ~15,000 tokens, leaving headroom for prompt and response
  const MAX_TEXT_CHARS = 60000;
  const truncatedText = request.extractedText.slice(0, MAX_TEXT_CHARS);
  const textTruncationInfo =
    request.extractedText.length > MAX_TEXT_CHARS
      ? `\n\n[Texto truncado: ${request.extractedText.length} caracteres reduzidos para ${MAX_TEXT_CHARS}]`
      : "";

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
${truncatedText}${textTruncationInfo}

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

  const response = await openaiClient.chat.completions.create({
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
  const textContent = response.choices
    .filter((c: any) => c.message?.content)
    .map((c: any) => c.message.content)
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
