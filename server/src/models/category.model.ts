import { getDatabase } from '../config/database';
import { Category, QuestionCategory } from '../types';
import { ObjectId } from 'mongodb';

export class CategoryModel {
  static async findAll() {
    const db = await getDatabase();
    const collection = db.collection<Category>('categories');

    const categories = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return categories.map(c => ({
      ...c,
      _id: c._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Category>('categories');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const category = await collection.findOne({ _id: objectId as any });
    if (!category) return null;

    return {
      ...category,
      _id: category._id?.toString(),
    };
  }

  static async create(data: Omit<Category, '_id' | 'createdAt'>) {
    const db = await getDatabase();
    const collection = db.collection<Category>('categories');

    const category: Category = {
      ...data,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(category);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<Category>) {
    const db = await getDatabase();
    const collection = db.collection<Category>('categories');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.updateOne(
      { _id: objectId as any },
      { $set: data }
    );
  }

  static async delete(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Category>('categories');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }
}
