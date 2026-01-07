import { getDatabase } from '../config/database';
import { Question, QuestionStatus } from '../types';
import { ObjectId } from 'mongodb';

export class QuestionModel {
  static async findAll(filters?: { status?: QuestionStatus; search?: string }) {
    const db = await getDatabase();
    const collection = db.collection<Question>('questions');

    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const questions = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return questions.map((q) => ({
      ...q,
      _id: q._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Question>('questions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const question = await collection.findOne({ _id: objectId as any });
    if (!question) return null;

    return {
      ...question,
      _id: question._id?.toString(),
    };
  }

  static async create(data: Omit<Question, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<Question>('questions');

    const now = new Date();
    const question: Question = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(question);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<Question>) {
    const db = await getDatabase();
    const collection = db.collection<Question>('questions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.updateOne(
      { _id: objectId as any },
      { $set: { ...data, updatedAt: new Date() } }
    );
  }

  static async delete(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Question>('questions');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }
}
