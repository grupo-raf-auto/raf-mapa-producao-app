import { Request, Response } from 'express';
import { TemplateModel } from '../models/template.model';
import { Template } from '../types';

export class TemplateController {
  static async getAll(req: Request, res: Response) {
    try {
      const templates = await TemplateModel.findAll();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const templateData: Omit<Template, '_id' | 'createdAt' | 'updatedAt'> = {
        title: req.body.title,
        description: req.body.description,
        questions: req.body.questions || [],
      };

      const id = await TemplateModel.create(templateData);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TemplateModel.update(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);

      // Não permitir deletar templates padrão
      if (template?.isDefault) {
        return res.status(400).json({ error: 'Não é possível excluir templates padrão do sistema' });
      }

      await TemplateModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }
}
