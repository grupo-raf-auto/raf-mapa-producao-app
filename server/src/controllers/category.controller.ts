import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { Category } from '../types';

export class CategoryController {
  static async getAll(req: Request, res: Response) {
    try {
      const categories = await CategoryModel.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const categoryData: Omit<Category, '_id' | 'createdAt'> = {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
      };

      const id = await CategoryModel.create(categoryData);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CategoryModel.update(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CategoryModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
}
