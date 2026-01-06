import { getDatabase } from '../config/database';
import { Form } from '../types';
import { ObjectId } from 'mongodb';

export class FormModel {
  static async findAll() {
    const db = await getDatabase();
    const collection = db.collection<Form>('forms');

    const forms = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return forms.map(f => ({
      ...f,
      _id: f._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Form>('forms');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const form = await collection.findOne({ _id: objectId as any });
    if (!form) return null;

    return {
      ...form,
      _id: form._id?.toString(),
    };
  }

  static async create(data: Omit<Form, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<Form>('forms');

    const now = new Date();
    const form: Form = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(form);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<Form>) {
    const db = await getDatabase();
    const collection = db.collection<Form>('forms');

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
    const collection = db.collection<Form>('forms');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }
}
