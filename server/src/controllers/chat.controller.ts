import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ChatModel } from '../models/chat.model';
import { generateChatResponse, getSystemPrompt, ChatContext } from '../services/openai.service';

export class ChatController {
  static async sendMessage(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message, conversationId, context } = req.body;
      const userId = req.user.clerkId; // Clerk ID do usuário

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Validar context (padrão: 'sabichao')
      const chatContext: ChatContext = context === 'support' ? 'support' : 'sabichao';

      // Gerar conversationId se não existir (incluir context para separar conversas)
      const baseConvId = conversationId || randomUUID();
      const convId = `${chatContext}-${baseConvId}`;

      // Buscar histórico de mensagens da conversa
      const history = await ChatModel.findByConversationId(convId);

      // Preparar mensagens para a OpenAI (formato esperado pela API)
      const messagesForOpenAI = history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Adicionar a nova mensagem do usuário
      messagesForOpenAI.push({
        role: 'user',
        content: message,
      });

      // Salvar mensagem do usuário no banco
      await ChatModel.create({
        conversationId: convId,
        role: 'user',
        content: message,
        userId,
      });

      // Gerar resposta usando OpenAI com o system prompt apropriado
      const systemPrompt = getSystemPrompt(chatContext);
      const aiResponse = await generateChatResponse(messagesForOpenAI, systemPrompt);

      // Salvar resposta da IA no banco
      await ChatModel.create({
        conversationId: convId,
        role: 'assistant',
        content: aiResponse,
        userId,
      });

      res.json({
        response: aiResponse,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error processing chat message:', error);
      
      // Retornar erro mais específico se disponível
      const errorMessage = error.message || 'Failed to process chat message';
      res.status(500).json({ error: errorMessage });
    }
  }

  static async getConversationHistory(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { conversationId } = req.params;
      const userId = req.user.clerkId;

      // Buscar mensagens da conversa
      const messages = await ChatModel.findByConversationId(conversationId);

      // Verificar se o usuário tem permissão para ver esta conversa
      const userMessages = messages.filter((msg) => msg.userId === userId);
      if (messages.length > 0 && userMessages.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this conversation' });
      }

      res.json({
        conversationId,
        messages: messages.map((msg) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
      });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  }
}
