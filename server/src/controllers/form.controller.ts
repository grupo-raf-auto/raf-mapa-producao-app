import { Request, Response } from 'express';
import { FormModel } from '../models/form.model';
import { Form } from '../types';

export class FormController {
  static async getAll(req: Request, res: Response) {
    try {
      const forms = await FormModel.findAll();
      res.json(forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      res.status(500).json({ error: 'Failed to fetch forms' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const form = await FormModel.findById(id);

      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      res.json(form);
    } catch (error) {
      console.error('Error fetching form:', error);
      res.status(500).json({ error: 'Failed to fetch form' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const formData: Omit<Form, '_id' | 'createdAt' | 'updatedAt'> = {
        title: req.body.title,
        description: req.body.description,
        questions: req.body.questions || [],
      };

      const id = await FormModel.create(formData);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error creating form:', error);
      res.status(500).json({ error: 'Failed to create form' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await FormModel.update(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating form:', error);
      res.status(500).json({ error: 'Failed to update form' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await FormModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting form:', error);
      res.status(500).json({ error: 'Failed to delete form' });
    }
  }
}
