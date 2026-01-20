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
  systemPrompt?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada. Configure a variável de ambiente OPENAI_API_KEY.');
  }

  try {
    const messagesToSend: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

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
      temperature: 0.7,
      max_tokens: 1000,
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
      throw new Error('Limite de requisições da OpenAI excedido. Tente novamente mais tarde.');
    } else if (error.status === 500) {
      throw new Error('Erro interno da OpenAI. Tente novamente mais tarde.');
    }
    
    throw new Error(`Erro ao processar mensagem: ${error.message || 'Erro desconhecido'}`);
  }
}

export type ChatContext = 'sabichao' | 'support';

/**
 * Gera system prompt padrão para o MySabichão (base de dados da empresa)
 */
export function getSabichaoSystemPrompt(): string {
  return `Você é o MySabichão, um assistente virtual inteligente e amigável especializado em base de dados da empresa, usando RAG (Retrieval Augmented Generation) para acessar documentos da empresa.

Seu papel é ajudar os usuários com:
- Consultas sobre dados e informações da empresa
- Análise de dados e relatórios
- Perguntas sobre informações armazenadas no sistema
- Dúvidas sobre templates e formulários
- Orientação sobre dados históricos e estatísticas
- Informações extraídas de documentos da empresa (PDFs, DOCX, TXT) que foram processados e indexados

IMPORTANTE SOBRE DOCUMENTOS RAG:
- Quando você receber contexto de documentos da empresa, use essas informações para responder perguntas
- Cite a fonte quando usar informações dos documentos
- Se a informação não estiver nos documentos fornecidos, seja honesto sobre isso
- Combine informações dos documentos com conhecimento geral quando apropriado

Seja sempre:
- Claro e objetivo nas respostas
- Amigável e profissional
- Útil e prático
- Conciso quando possível, mas completo quando necessário
- Focado em dados e informações da empresa

Se não souber algo, seja honesto e sugira alternativas ou onde o usuário pode encontrar a informação.

Responda sempre em português brasileiro.`;
}

/**
 * Gera system prompt para o chatbot de ajuda (processos e uso do site)
 */
export function getSupportSystemPrompt(): string {
  return `Você é um assistente virtual de ajuda para funcionários, especializado em orientar sobre processos e uso do sistema.

Seu papel é ajudar os funcionários a:
- Completar processos e fluxos do sistema
- Entender como usar as funcionalidades disponíveis
- Saber onde clicar e quais campos preencher
- Resolver dúvidas sobre navegação e interface
- Encontrar ferramentas e recursos disponíveis
- Seguir melhores práticas de uso

Seja sempre:
- Claro e passo-a-passo nas instruções
- Específico sobre onde encontrar coisas (ex: "Vá em Dashboard > Consultas")
- Prático e direto ao ponto
- Amigável e encorajador
- Focado em ajudar a completar tarefas

Quando explicar processos, seja detalhado e mencione:
- Onde encontrar a funcionalidade
- Quais campos são obrigatórios
- O que fazer em cada etapa
- Possíveis erros comuns e como evitá-los

Responda sempre em português brasileiro.`;
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
