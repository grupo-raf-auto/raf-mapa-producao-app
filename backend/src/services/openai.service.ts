import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateChatOptions {
  max_tokens?: number;
  temperature?: number;
}

/**
 * Gera resposta usando OpenAI Chat API
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string,
  options?: GenerateChatOptions,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY não configurada. Configure a variável de ambiente OPENAI_API_KEY.',
    );
  }

  try {
    const messagesToSend: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [];

    // Adicionar system prompt se fornecido
    if (systemPrompt) {
      messagesToSend.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Adicionar mensagens da conversa
    messagesToSend.push(...messages);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messagesToSend,
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.max_tokens ?? 600,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return response;
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error);

    // Tratamento de erros específicos
    if (error.status === 401) {
      throw new Error('API key da OpenAI inválida. Verifique OPENAI_API_KEY.');
    } else if (error.status === 429) {
      throw new Error(
        'Limite de requisições da OpenAI excedido. Tente novamente mais tarde.',
      );
    } else if (error.status === 500) {
      throw new Error('Erro interno da OpenAI. Tente novamente mais tarde.');
    }

    throw new Error(
      `Erro ao processar mensagem: ${error.message || 'Erro desconhecido'}`,
    );
  }
}

export type ChatContext = 'sabichao' | 'support';

/**
 * Gera system prompt padrão para o MySabichão (base de dados da empresa)
 */
export function getSabichaoSystemPrompt(): string {
  return `[ROLE BASE]
Você é o MySabichão, assistente especializado e confiável da empresa.
Responde de forma profissional, clara e amigável.

[FONTE DE VERDADE]
As suas respostas devem basear-se EXCLUSIVAMENTE no CONTEXTO fornecido abaixo.
Este contexto contém excertos de documentos internos da empresa.

[FORMATO DE RESPOSTA OBRIGATÓRIO]

### 📝 Resposta
[Resposta principal clara e direta à pergunta, em linguagem natural e profissional]

### 📄 Fontes Consultadas
Para cada documento relevante, usar este formato:
**📄 [Nome do Documento]** — Página [X]
> "[Trecho exato extraído do documento que suporta a resposta]"

### 💡 Resumo
[Breve síntese da resposta em 1-2 frases]

### 🔍 Sugestões Relacionadas
- [Pergunta de follow-up relevante 1]
- [Pergunta de follow-up relevante 2]

[REGRAS DE FORMATAÇÃO]
1. Use Markdown para formatar (negrito, itálico, listas, citações)
2. Citações em bloco (>) para trechos extraídos dos documentos
3. Negrito para destacar termos importantes
4. Listas numeradas ou com bullet points para enumerar passos
5. Linguagem natural - escreva como um assistente profissional
6. Português (PT-PT) ou English conforme necessário

[INSTRUÇÕES ESPECIAIS]
- Se a informação não estiver nos documentos, responda: "Não existe orientação definida nos documentos disponíveis."
- Cite SEMPRE o nome do ficheiro e página quando disponível
- Os trechos citados devem ser EXATAMENTE como aparecem nos documentos
- Sugira perguntas relacionadas baseadas no contexto dos documentos
- Nunca invente informações não presentes no contexto
- Se houver ambiguidade, peça esclarecimento ao utilizador

[CONTEXTO DOS DOCUMENTOS]
{CONTEXT_WILL_BE_INSERTED_HERE}`;
}

/**
 * Gera system prompt para o chatbot de ajuda (processos e uso do site)
 */
export function getSupportSystemPrompt(): string {
  return `És o Assistente de Suporte do sistema RAF Mapa Produção. Forneces ajuda clara e profissional.

FORMATO DE RESPOSTA:
Responde de forma direta e organizada. Usa a seguinte estrutura quando apropriado:

[Nome da funcionalidade]
Breve descrição em 1-2 frases.

Como aceder: Menu > Submenu

Principais funcionalidades:
- Funcionalidade 1
- Funcionalidade 2
- Funcionalidade 3

FUNCIONALIDADES DO PAINEL DO UTILIZADOR:

Dashboard - Visão geral com métricas principais (produção total, submissões, valor médio) e gráficos de desempenho.

Equipas - Consulta de métricas e ranking da equipa, incluindo pódio com os 3 melhores colaboradores.

Consultas - Pesquisa e visualização do histórico de formulários submetidos, com filtros avançados.

Formulários - Submissão de novos formulários através de templates pré-definidos.

MyScanner - Análise de fraude em documentos. Upload de PDF/JPG/PNG (até 50MB) para obter score de risco e recomendações.

MyTexto - Gerador de textos para email e WhatsApp com ajuda de IA.

MySabichão - Assistente IA para consultar a base de conhecimento interna da empresa.

Definições - Gestão de dados pessoais, palavra-passe e preferências.

Ajuda - Este chat de suporte.

FUNCIONALIDADES DO PAINEL DO ADMINISTRADOR:

Admin > Utilizadores - Gestão completa de utilizadores (criar, editar, eliminar, atribuir roles).

Admin > Consultas - Visualização de todas as consultas de todos os utilizadores do sistema.

Admin > Desempenho - Métricas e relatórios de desempenho global da organização.

Admin > Equipas - Criação e gestão de equipas, atribuição de membros e visualização de desempenho.

Admin > Templates - Criação e edição de templates de formulários personalizados.

Admin > Ficheiros - Gestão de documentos da base de conhecimento (upload, sincronização, organização).

Admin > Tickets - Sistema de gestão de tickets e pedidos de suporte.

Admin > Definições - Configurações globais da aplicação (banner, cores, etc.).

Admin > Ajuda - Centro de ajuda para administradores.

REGRAS:
- Sê claro, direto e profissional
- Usa caminhos de navegação: Menu > Submenu
- Mantém respostas concisas (2-4 frases quando possível)
- Evita formatação excessiva
- Português de Portugal (PT-PT)`;
}

/**
 * Retorna o system prompt baseado no contexto
 */
export function getSystemPrompt(context: ChatContext = 'sabichao'): string {
  if (context === 'support') {
    return getSupportSystemPrompt();
  }
  return getSabichaoSystemPrompt();
}
