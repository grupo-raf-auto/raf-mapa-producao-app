import { Request, Response } from 'express';
import {
  generateMessage,
  listContexts,
  listTemplates,
} from '../services/message-generator.service';

export class MessageGeneratorController {
  static async getContexts(_req: Request, res: Response) {
    try {
      const contexts = listContexts();
      res.json(contexts);
    } catch (error) {
      console.error('Message generator getContexts:', error);
      res.status(500).json({ error: 'Erro ao obter contextos' });
    }
  }

  static async getTemplates(req: Request, res: Response) {
    try {
      const contextId =
        typeof req.query.contextId === 'string' ? req.query.contextId : undefined;
      const templates = listTemplates(contextId);
      res.json(templates);
    } catch (error) {
      console.error('Message generator getTemplates:', error);
      res.status(500).json({ error: 'Erro ao obter templates' });
    }
  }

  static async generate(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { contextId, templateId, userInput } = req.body;

      if (!contextId || typeof contextId !== 'string') {
        return res.status(400).json({ error: 'contextId é obrigatório' });
      }
      if (typeof userInput !== 'string') {
        return res.status(400).json({ error: 'userInput deve ser uma string' });
      }

      const text = await generateMessage({
        contextId,
        templateId:
          typeof templateId === 'string' && templateId
            ? templateId
            : undefined,
        userInput,
      });

      res.json({ text });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao gerar mensagem';
      if (message.includes('inválido') || message.includes('não pertence')) {
        return res.status(400).json({ error: message });
      }
      console.error('Message generator generate:', error);
      res.status(500).json({ error: message });
    }
  }
}
