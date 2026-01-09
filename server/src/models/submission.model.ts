import { getDatabase } from '../config/database';
import { FormSubmission } from '../types';
import { ObjectId } from 'mongodb';

export class SubmissionModel {
  static async findAll(filters?: { templateId?: string; submittedBy?: string }) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    const query: any = {};
    if (filters?.templateId) {
      query.templateId = filters.templateId;
    }
    if (filters?.submittedBy) {
      query.submittedBy = filters.submittedBy;
    }

    const submissions = await collection.find(query).sort({ submittedAt: -1 }).toArray();
    return submissions.map(s => ({
      ...s,
      _id: s._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const submission = await collection.findOne({ _id: objectId as any });
    if (!submission) return null;

    return {
      ...submission,
      _id: submission._id?.toString(),
    };
  }

  static async create(data: Omit<FormSubmission, '_id' | 'submittedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    const now = new Date();
    const submission: FormSubmission = {
      ...data,
      submittedAt: now,
    };

    const result = await collection.insertOne(submission);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<FormSubmission>) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    const result = await collection.updateOne(
      { _id: objectId as any },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      throw new Error('Submission not found');
    }

    // Retornar o documento atualizado
    const updated = await collection.findOne({ _id: objectId as any });
    if (!updated) {
      throw new Error('Failed to retrieve updated submission');
    }

    return {
      ...updated,
      _id: updated._id?.toString(),
    };
  }

  static async delete(id: string) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }

  static async count(filters?: { templateId?: string; submittedBy?: string }) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    const query: any = {};
    if (filters?.templateId) {
      query.templateId = filters.templateId;
    }
    if (filters?.submittedBy) {
      query.submittedBy = filters.submittedBy;
    }

    return await collection.countDocuments(query);
  }

  static async getSalesStats(filters?: { templateId?: string; submittedBy?: string }) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');
    const questionsCollection = db.collection<any>('questions');

    const query: any = {};
    if (filters?.templateId) {
      query.templateId = filters.templateId;
    }
    if (filters?.submittedBy) {
      query.submittedBy = filters.submittedBy;
    }

    const submissions = await collection.find(query).sort({ submittedAt: -1 }).toArray();
    
    // Buscar todas as questões para encontrar IDs
    const allQuestions = await questionsCollection.find({}).toArray();

    // Encontrar IDs das questões importantes
    const valorQuestion = allQuestions.find((q: any) => q.title === 'Valor');
    const bancoQuestion = allQuestions.find((q: any) => q.title === 'Banco');
    const seguradoraQuestion = allQuestions.find((q: any) => q.title === 'Seguradora');
    const distritoQuestion = allQuestions.find((q: any) => q.title === 'Distrito cliente');

    const valorQuestionId = valorQuestion?._id?.toString();
    const bancoQuestionId = bancoQuestion?._id?.toString();
    const seguradoraQuestionId = seguradoraQuestion?._id?.toString();
    const distritoQuestionId = distritoQuestion?._id?.toString();

    // Processar submissões
    const stats = {
      total: submissions.length,
      totalValue: 0,
      averageValue: 0,
      byBanco: {} as Record<string, { count: number; totalValue: number }>,
      bySeguradora: {} as Record<string, { count: number; totalValue: number }>,
      byDistrito: {} as Record<string, { count: number; totalValue: number }>,
      byMonth: {} as Record<string, { count: number; totalValue: number }>,
    };

    let validValuesCount = 0;

    submissions.forEach((submission: any) => {
      // Extrair valor
      let valor = 0;
      if (valorQuestionId) {
        const valorAnswer = submission.answers.find((a: any) => 
          a.questionId === valorQuestionId
        );
        if (valorAnswer?.answer) {
          const parsed = parseFloat(valorAnswer.answer.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(parsed)) {
            valor = parsed;
            stats.totalValue += valor;
            validValuesCount++;
          }
        }
      }

      // Extrair banco
      if (bancoQuestionId) {
        const bancoAnswer = submission.answers.find((a: any) => 
          a.questionId === bancoQuestionId
        );
        if (bancoAnswer?.answer) {
          const banco = bancoAnswer.answer.trim();
          if (!stats.byBanco[banco]) {
            stats.byBanco[banco] = { count: 0, totalValue: 0 };
          }
          stats.byBanco[banco].count++;
          stats.byBanco[banco].totalValue += valor;
        }
      }

      // Extrair seguradora
      if (seguradoraQuestionId) {
        const seguradoraAnswer = submission.answers.find((a: any) => 
          a.questionId === seguradoraQuestionId
        );
        if (seguradoraAnswer?.answer) {
          const seguradora = seguradoraAnswer.answer.trim();
          if (!stats.bySeguradora[seguradora]) {
            stats.bySeguradora[seguradora] = { count: 0, totalValue: 0 };
          }
          stats.bySeguradora[seguradora].count++;
          stats.bySeguradora[seguradora].totalValue += valor;
        }
      }

      // Extrair distrito
      if (distritoQuestionId) {
        const distritoAnswer = submission.answers.find((a: any) => 
          a.questionId === distritoQuestionId
        );
        if (distritoAnswer?.answer) {
          const distrito = distritoAnswer.answer.trim();
          if (!stats.byDistrito[distrito]) {
            stats.byDistrito[distrito] = { count: 0, totalValue: 0 };
          }
          stats.byDistrito[distrito].count++;
          stats.byDistrito[distrito].totalValue += valor;
        }
      }

      // Agrupar por mês
      if (submission.submittedAt) {
        const date = new Date(submission.submittedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!stats.byMonth[monthKey]) {
          stats.byMonth[monthKey] = { count: 0, totalValue: 0 };
        }
        stats.byMonth[monthKey].count++;
        stats.byMonth[monthKey].totalValue += valor;
      }
    });

    stats.averageValue = validValuesCount > 0 ? stats.totalValue / validValuesCount : 0;

    // Converter para arrays ordenados
    const byBancoArray = Object.entries(stats.byBanco)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const bySeguradoraArray = Object.entries(stats.bySeguradora)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const byDistritoArray = Object.entries(stats.byDistrito)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const byMonthArray = Object.entries(stats.byMonth)
      .map(([month, data]) => ({ month, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      total: stats.total,
      totalValue: stats.totalValue,
      averageValue: stats.averageValue,
      byBanco: byBancoArray,
      bySeguradora: bySeguradoraArray,
      byDistrito: byDistritoArray,
      byMonth: byMonthArray,
    };
  }
}
