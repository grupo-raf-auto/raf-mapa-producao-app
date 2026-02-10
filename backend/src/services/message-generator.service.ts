import { generateChatResponse } from './openai.service';
import {
  MESSAGE_CONTEXTS,
  MESSAGE_TEMPLATES,
  MessageGeneratorContext,
  MessageGeneratorTemplate,
} from './message-generator.types';

const BASE_SYSTEM_PROMPT = `És um assistente de redação da empresa Grupo RAF. A tua função é gerar textos profissionais para comunicação com clientes (email e WhatsApp).

REGRAS:
- Escreve sempre em português de Portugal (PT-PT).
- Usa tom profissional e cordial.
- Não inventes dados que o utilizador não tenha fornecido (nomes, prazos, valores). Se faltar informação, usa placeholders entre parêntesis rectos, por exemplo [nome do cliente] ou [data limite].
- O utilizador vai indicar o contexto (ex.: pedido de documentação, esclarecimento) e a situação concreta; gera o texto adequado.
- Responde APENAS com o texto da mensagem/email pronto a usar, sem explicações adicionais antes ou depois.`;

function getContextById(id: string): MessageGeneratorContext | undefined {
  return MESSAGE_CONTEXTS.find((c) => c.id === id);
}

function getTemplateById(id: string): MessageGeneratorTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}

function getTemplatesForContext(contextId: string): MessageGeneratorTemplate[] {
  return MESSAGE_TEMPLATES.filter((t) => t.contextId === contextId);
}

function buildSystemPrompt(
  context: MessageGeneratorContext,
  template?: MessageGeneratorTemplate,
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (context.channel === 'email') {
    prompt += '\n\nCanal: EMAIL. Formato adequado a email (assunto se aplicável, saudação, corpo, despedida).';
  } else {
    prompt +=
      '\n\nCanal: WHATSAPP. Mensagem curta, direta e adequada ao tamanho de uma mensagem de telemóvel. Evita parágrafos longos.';
  }

  if (template?.systemPromptAddition) {
    prompt += `\n\nINSTRUÇÕES ESPECÍFICAS PARA ESTE TIPO DE TEXTO:\n${template.systemPromptAddition}`;
  }

  return prompt;
}

export async function generateMessage(params: {
  contextId: string;
  templateId?: string;
  userInput: string;
}): Promise<string> {
  const context = getContextById(params.contextId);
  if (!context) {
    throw new Error(`Contexto inválido: ${params.contextId}`);
  }

  const template = params.templateId
    ? getTemplateById(params.templateId)
    : undefined;
  if (params.templateId && !template) {
    throw new Error(`Template inválido: ${params.templateId}`);
  }
  if (template && template.contextId !== params.contextId) {
    throw new Error('O template não pertence ao contexto selecionado.');
  }

  const systemPrompt = buildSystemPrompt(context, template);
  const userMessage =
    params.userInput.trim() ||
    'Gera um texto padrão para esta situação, usando placeholders onde necessário.';

  const response = await generateChatResponse(
    [{ role: 'user', content: userMessage }],
    systemPrompt,
    { max_tokens: 800, temperature: 0.6 },
  );

  return response.trim();
}

export function listContexts(): MessageGeneratorContext[] {
  return [...MESSAGE_CONTEXTS];
}

export function listTemplates(contextId?: string): MessageGeneratorTemplate[] {
  if (contextId) return getTemplatesForContext(contextId);
  return [...MESSAGE_TEMPLATES];
}
