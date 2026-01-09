import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Placeholder para integração com IA
// Por enquanto retorna respostas simples
// TODO: Integrar com OpenAI/Anthropic e RAG

export class ChatController {
  static async sendMessage(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message, conversationId } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Gerar conversationId se não existir
      const convId = conversationId || randomUUID();

      // TODO: Implementar lógica de IA aqui
      // Por enquanto, resposta simples
      const response = `Olá! Recebi sua mensagem: "${message}". Esta é uma resposta temporária. A integração com IA será implementada em breve.`;

      res.json({
        response,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  }

  static async getConversationHistory(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { conversationId } = req.params;

      // TODO: Implementar busca de histórico no banco
      res.json({
        conversationId,
        messages: [],
      });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  }
}
