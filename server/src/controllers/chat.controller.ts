import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { generateChatResponse, getSystemPrompt, ChatContext } from '../services/openai.service';
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

      const chatContext: ChatContext = context === 'support' ? 'support' : 'sabichao';
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
        data: { conversationId: convId, role: 'user', content: message, userId },
      });

      let relevantContext = '';
      if (chatContext === 'sabichao') {
        try {
          const relevantChunks = await searchRelevantChunks(message, 3);
          if (relevantChunks.length > 0) {
            relevantContext = '\n\n=== Contexto Relevante dos Documentos da Empresa ===\n';
            relevantChunks.forEach((item, i) => {
              relevantContext += `\n[Documento ${i + 1} - Similaridade: ${(item.similarity * 100).toFixed(1)}%]:\n${item.chunk.content}\n`;
            });
            relevantContext += '\n=== Fim do Contexto ===\n';
          }
        } catch (err) {
          console.error('Erro ao buscar contexto RAG:', err);
        }
      }

      const baseSystemPrompt = getSystemPrompt(chatContext);
      const enhancedSystemPrompt = relevantContext
        ? `${baseSystemPrompt}\n\n${relevantContext}\n\nIMPORTANTE: Use o contexto acima dos documentos da empresa para responder perguntas. Se a informação não estiver no contexto fornecido, seja honesto e diga que não tem essa informação específica nos documentos disponíveis, mas pode tentar ajudar com outras informações relacionadas.`
        : baseSystemPrompt;

      const aiResponse = await generateChatResponse(messagesForOpenAI, enhancedSystemPrompt);

      await prisma.chatMessage.create({
        data: { conversationId: convId, role: 'assistant', content: aiResponse, userId },
      });

      res.json({
        response: aiResponse,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error('Error processing chat message:', error);
      const msg = error instanceof Error ? error.message : 'Failed to process chat message';
      res.status(500).json({ error: msg });
    }
  }

  static async getConversationHistory(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { conversationId } = req.params;
      const userId = req.user.id;

      const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      const userMessages = messages.filter((m) => m.userId === userId);
      if (messages.length > 0 && userMessages.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this conversation' });
      }

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
