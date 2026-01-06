import { getDatabase } from '../config/database';
import { Template } from '../types';
import { ObjectId } from 'mongodb';

export class TemplateModel {
  static async findAll() {
    const db = await getDatabase();
    const collection = db.collection<Template>('templates');

    const templates = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return templates.map(t => ({
      ...t,
      _id: t._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Template>('templates');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const template = await collection.findOne({ _id: objectId as any });
    if (!template) return null;

    return {
      ...template,
      _id: template._id?.toString(),
    };
  }

  static async create(data: Omit<Template, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<Template>('templates');

    const now = new Date();
    const template: Template = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(template);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<Template>) {
    const db = await getDatabase();
    const collection = db.collection<Template>('templates');

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
    const collection = db.collection<Template>('templates');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }
}
