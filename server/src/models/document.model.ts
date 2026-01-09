import { getDatabase } from '../config/database';
import { Document } from '../types';
import { ObjectId } from 'mongodb';

export class DocumentModel {
  static async findAll() {
    const db = await getDatabase();
    const collection = db.collection<Document>('documents');

    const documents = await collection.find({ isActive: true }).sort({ uploadedAt: -1 }).toArray();
    return documents.map(d => ({
      ...d,
      _id: d._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<Document>('documents');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const document = await collection.findOne({ _id: objectId as any });
    if (!document) return null;

    return {
      ...document,
      _id: document._id?.toString(),
    };
  }

  static async create(data: Omit<Document, '_id' | 'uploadedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<Document>('documents');

    const document: Document = {
      ...data,
      uploadedAt: new Date(),
    };

    const result = await collection.insertOne(document);
    return result.insertedId.toString();
  }

  static async update(id: string, data: Partial<Document>) {
    const db = await getDatabase();
    const collection = db.collection<Document>('documents');

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
    const collection = db.collection<Document>('documents');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.updateOne(
      { _id: objectId as any },
      { $set: { isActive: false } }
    );
  }
}
