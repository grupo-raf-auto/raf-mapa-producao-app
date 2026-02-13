/**
 * Resolve o modelo OpenAI a usar por funcionalidade.
 * Prioridade: AppSettings (DB) > variáveis de ambiente > default
 */
import { prisma } from '../lib/prisma';

export type OpenAIFeature =
  | 'sabichao'
  | 'assistente'
  | 'scanner'
  | 'mytexto';

const DEFAULT_MODELS: Record<OpenAIFeature, string> = {
  sabichao: 'gpt-4o-mini',
  assistente: 'gpt-4o-mini',
  scanner: 'gpt-5.2-pro', // MyScanner: 5.2 avançado para análise de documentos (vision)
  mytexto: 'gpt-4o-mini',
};

export async function getOpenAIModelForFeature(
  feature: OpenAIFeature,
): Promise<string> {
  try {
    const settings = await prisma.appSettings.findFirst({
      orderBy: { version: 'desc' },
      select: {
        openaiModelSabichao: true,
        openaiModelAssistente: true,
        openaiModelScanner: true,
        openaiModelMyTexto: true,
      },
    });

    if (settings) {
      const model =
        feature === 'sabichao'
          ? settings.openaiModelSabichao
          : feature === 'assistente'
            ? settings.openaiModelAssistente
            : feature === 'scanner'
              ? settings.openaiModelScanner
              : settings.openaiModelMyTexto;

      if (model && model.trim()) {
        return model.trim();
      }
    }
  } catch {
    // Ignorar erros (ex: tabela não existe) e usar fallbacks
  }

  // Fallback: variáveis de ambiente
  if (feature === 'scanner') {
    const envModel = process.env.AI_MODEL_FOR_SCANNER;
    if (envModel?.trim()) return envModel.trim();
  } else {
    const envModel = process.env.OPENAI_MODEL;
    if (envModel?.trim()) return envModel.trim();
  }

  return DEFAULT_MODELS[feature];
}
