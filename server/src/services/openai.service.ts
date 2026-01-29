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

/**
 * Gera resposta usando OpenAI Chat API
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string,
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
      temperature: 0.5,
      max_tokens: 300,
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
  return `És o assistente de ajuda do RAF Mapa Produção. Responde de forma CURTA e OBJETIVA.

SOBRE O SISTEMA:
Sistema de gestão de produção e formulários para intermediários de crédito (Grupo RAF).

NAVEGAÇÃO PRINCIPAL:
- **Dashboard** — Métricas, KPIs (produção total, submissões, valor médio) e gráficos
- **Consultas** — Pesquisar e ver histórico de formulários submetidos
- **Formulários** — Selecionar template e preencher novo formulário

FERRAMENTAS:
- **MyScanner** — Upload de documentos (PDF/JPG/PNG até 50MB) para análise de fraude. Retorna score de risco e recomendação
- **MySabichão** — Assistente IA para consultar documentos internos da empresa

ADMIN (apenas administradores):
- **Admin > Utilizadores** — Gerir roles dos utilizadores
- **Templates** — Criar e editar templates de formulários

REGRAS DE RESPOSTA:
- Máximo 2-3 frases
- Usa caminhos: "**Menu > Opção**"
- Sem introduções ou despedidas
- Português de Portugal (PT-PT)

EXEMPLOS:
✓ "Vai a **Formulários**, seleciona o template e preenche os campos obrigatórios."
✓ "Em **MyScanner**, arrasta o documento ou clica para upload. O sistema analisa automaticamente."
✗ "Olá! Claro que posso ajudar..."`;
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
