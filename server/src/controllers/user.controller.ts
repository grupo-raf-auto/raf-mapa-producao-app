import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { SubmissionModel } from '../models/submission.model';
import { TemplateModel } from '../models/template.model';
import { QuestionModel } from '../models/question.model';
import { User, UserRole } from '../types';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserModel.findAll();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.json(req.user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch current user' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { clerkId, email, firstName, lastName, role } = req.body;

      if (!clerkId || !email) {
        return res.status(400).json({ error: 'clerkId and email are required' });
      }

      // Verificar se já existe
      const existing = await UserModel.findByClerkId(clerkId);
      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'> = {
        clerkId,
        email,
        firstName,
        lastName,
        role: role || 'user',
        isActive: true,
        createdBy: req.user?.clerkId,
      };

      const id = await UserModel.create(userData);
      res.status(201).json({ id, success: true });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, isActive, firstName, lastName } = req.body;

      // Apenas admins podem alterar roles
      if (role && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change user roles' });
      }

      const updateData: Partial<User> = {};
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;

      await UserModel.update(id, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Não permitir deletar a si mesmo
      const user = await UserModel.findById(id);
      if (user && user.clerkId === req.user?.clerkId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await UserModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view stats' });
      }

      const users = await UserModel.findAll();
      const allSubmissions = await SubmissionModel.findAll();
      const allTemplates = await TemplateModel.findAll();
      const allQuestions = await QuestionModel.findAll();

      // Calcular estatísticas por usuário
      const userStats = users.map(user => {
        const clerkId = user.clerkId;
        
        // Submissões do usuário
        const userSubmissions = allSubmissions.filter(s => s.submittedBy === clerkId);
        
        // Templates criados pelo usuário
        const userTemplates = allTemplates.filter(t => t.createdBy === clerkId);
        
        // Questões criadas pelo usuário
        const userQuestions = allQuestions.filter(q => q.createdBy === clerkId);

        // Calcular dias ativos (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSubmissions = userSubmissions.filter(s => 
          new Date(s.submittedAt) >= thirtyDaysAgo
        );
        const activeDays = new Set(
          recentSubmissions.map(s => 
            new Date(s.submittedAt).toISOString().split('T')[0]
          )
        ).size;

        // Submissões por dia (últimos 30 dias)
        const submissionsByDay: Record<string, number> = {};
        recentSubmissions.forEach(s => {
          const date = new Date(s.submittedAt).toISOString().split('T')[0];
          submissionsByDay[date] = (submissionsByDay[date] || 0) + 1;
        });

        // Distribuição por template
        const templateDistribution: Record<string, number> = {};
        userSubmissions.forEach(s => {
          templateDistribution[s.templateId] = (templateDistribution[s.templateId] || 0) + 1;
        });

        return {
          userId: user._id,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          totalSubmissions: userSubmissions.length,
          totalTemplates: userTemplates.length,
          totalQuestions: userQuestions.length,
          activeDaysLast30: activeDays,
          submissionsByDay,
          templateDistribution,
          createdAt: user.createdAt,
        };
      });

      // Ordenar por total de submissões (ranking)
      const rankedUsers = userStats.sort((a, b) => b.totalSubmissions - a.totalSubmissions);

      // Estatísticas gerais
      const totalStats = {
        totalUsers: users.length,
        totalSubmissions: allSubmissions.length,
        totalTemplates: allTemplates.length,
        totalQuestions: allQuestions.length,
        activeUsersLast30: userStats.filter(u => u.activeDaysLast30 > 0).length,
      };

      res.json({
        users: rankedUsers,
        stats: totalStats,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  }
}
