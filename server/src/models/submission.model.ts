import { getDatabase } from '../config/database';
import { FormSubmission } from '../types';
import { ObjectId } from 'mongodb';

export class SubmissionModel {
  static async findAll(filters?: { templateId?: string }) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    const query: any = {};
    if (filters?.templateId) {
      query.templateId = filters.templateId;
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

  static async count(filters?: { templateId?: string }) {
    const db = await getDatabase();
    const collection = db.collection<FormSubmission>('submissions');

    const query: any = {};
    if (filters?.templateId) {
      query.templateId = filters.templateId;
    }

    return await collection.countDocuments(query);
  }
}
