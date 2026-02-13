import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import {
  generateChatResponse,
  getSystemPrompt,
  ChatContext,
} from '../services/openai.service';
import { getOpenAIModelForFeature } from '../services/openai-model.service';
import { searchRelevantChunks } from '../services/rag.service';

export class ChatController {
  static async sendMessage(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { message, conversationId, context } = req.body;
      const userId = req.user.id;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (conversationId && (typeof conversationId !== 'string' || conversationId.length > 200)) {
        return res.status(400).json({ error: 'Invalid conversationId' });
      }

      const chatContext: ChatContext =
        context === 'support' ? 'support' : 'sabichao';
      const baseConvId = conversationId || randomUUID();
      const convId = `${chatContext}-${baseConvId}`;

      const history = await prisma.chatMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: 'asc' },
      });

      const messagesForOpenAI = history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      messagesForOpenAI.push({ role: 'user', content: message });

      await prisma.chatMessage.create({
        data: {
          conversationId: convId,
          role: 'user',
          content: message,
          userId,
        },
      });

      let relevantContext = '';
      if (chatContext === 'sabichao') {
        try {
          const relevantChunks = await searchRelevantChunks(message, 8); // Top-8 conforme especificação
          if (relevantChunks.length > 0) {
            // Agrupar chunks por documento para melhor organização
            const chunksByDocument = new Map<
              string,
              Array<{
                content: string;
                similarity: number;
                pageNumber?: number;
              }>
            >();

            relevantChunks.forEach((item) => {
              const docName =
                item.document?.originalName || `Documento-${item.chunk.documentId}`;
              if (!chunksByDocument.has(docName)) {
                chunksByDocument.set(docName, []);
              }
              chunksByDocument.get(docName)!.push({
                content: item.chunk.content,
                similarity: item.similarity,
                pageNumber: item.metadata?.pageNumber,
              });
            });

            // Formatar contexto conforme especificação do prompt (formato do exemplo)
            chunksByDocument.forEach((chunks, docName) => {
              relevantContext += `## 📄 Documento: ${docName}\n\n`;
              chunks.forEach((chunk) => {
                const pageInfo = chunk.pageNumber
                  ? `Página ${chunk.pageNumber}`
                  : 'Página N/A';
                const relevance = (chunk.similarity * 100).toFixed(0);
                relevantContext += `### ${pageInfo} (${relevance}% relevância)\n`;
                relevantContext += `\`\`\`\n${chunk.content}\n\`\`\`\n\n`;
              });
              relevantContext += '---\n\n';
            });
          }
        } catch (err) {
          console.error('Erro ao buscar contexto RAG:', err);
        }
      }

      const baseSystemPrompt = getSystemPrompt(chatContext);
      // Substituir placeholder {CONTEXT_WILL_BE_INSERTED_HERE} se houver contexto
      const enhancedSystemPrompt = relevantContext
        ? baseSystemPrompt.replace(
            '{CONTEXT_WILL_BE_INSERTED_HERE}',
            relevantContext,
          )
        : baseSystemPrompt.replace(
            '{CONTEXT_WILL_BE_INSERTED_HERE}',
            '\n[Nenhum contexto relevante encontrado nos documentos disponíveis.]\n',
          );

      const model = await getOpenAIModelForFeature(
        chatContext === 'support' ? 'assistente' : 'sabichao',
      );
      const aiResponse = await generateChatResponse(
        messagesForOpenAI,
        enhancedSystemPrompt,
        { model },
      );

      await prisma.chatMessage.create({
        data: {
          conversationId: convId,
          role: 'assistant',
          content: aiResponse,
          userId,
        },
      });

      res.json({
        response: aiResponse,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error('Error processing chat message:', error);
      const msg =
        error instanceof Error
          ? error.message
          : 'Failed to process chat message';
      res.status(500).json({ error: msg });
    }
  }

  static async getConversationHistory(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Verify the user participates in this conversation before returning any data
      const participantCheck = await prisma.chatMessage.findFirst({
        where: { conversationId, userId },
        select: { id: true },
      });

      if (!participantCheck) {
        return res.status(403).json({
          error: 'Forbidden: You do not have access to this conversation',
        });
      }

      // User is a participant — return all messages in the conversation
      const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        conversationId,
        messages: messages.map((m) => ({
          id: m.id,
          _id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
      });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  }
}
