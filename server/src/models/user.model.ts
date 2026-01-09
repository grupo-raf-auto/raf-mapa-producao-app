import { getDatabase } from '../config/database';
import { User, UserRole } from '../types';
import { ObjectId } from 'mongodb';

export class UserModel {
  static async findAll() {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return users.map(u => ({
      ...u,
      _id: u._id?.toString(),
    }));
  }

  static async findById(id: string) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null;
    }

    const user = await collection.findOne({ _id: objectId as any });
    if (!user) return null;

    return {
      ...user,
      _id: user._id?.toString(),
    };
  }

  static async findByClerkId(clerkId: string) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    const user = await collection.findOne({ clerkId });
    if (!user) return null;

    return {
      ...user,
      _id: user._id?.toString(),
    };
  }

  static async findByEmail(email: string) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    const user = await collection.findOne({ email });
    if (!user) return null;

    return {
      ...user,
      _id: user._id?.toString(),
    };
  }

  static async create(data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    // Verificar se já existe antes de criar
    if (data.clerkId) {
      const existing = await this.findByClerkId(data.clerkId);
      if (existing) {
        throw new Error(`User with clerkId ${data.clerkId} already exists`);
      }
    }

    const now = new Date();
    const user: User = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await collection.insertOne(user);
      return result.insertedId.toString();
    } catch (error: any) {
      // Se for erro de duplicata (E11000), verificar se foi criado por outro processo
      if (error.code === 11000 || error.codeName === 'DuplicateKey') {
        const existing = await this.findByClerkId(data.clerkId || '');
        if (existing) {
          throw new Error(`User with clerkId ${data.clerkId} already exists (duplicate key error)`);
        }
      }
      throw error;
    }
  }

  static async update(id: string, data: Partial<User>) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

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

  static async updateByClerkId(clerkId: string, data: Partial<User>) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    await collection.updateOne(
      { clerkId },
      { $set: { ...data, updatedAt: new Date() } }
    );
  }

  static async delete(id: string) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error('Invalid ID');
    }

    await collection.deleteOne({ _id: objectId as any });
  }

  static async deleteByClerkId(clerkId: string) {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    await collection.updateOne(
      { clerkId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }

  // Criar índices únicos para prevenir duplicatas
  static async createIndexes() {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    try {
      // Criar índice único no clerkId para prevenir duplicatas
      await collection.createIndex({ clerkId: 1 }, { unique: true });
      console.log('UserModel: Unique index on clerkId created');
    } catch (error: any) {
      // Se o índice já existir, não é um erro crítico
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('UserModel: Index on clerkId already exists');
      } else {
        console.error('UserModel: Error creating index:', error);
      }
    }

    try {
      // Criar índice no email para buscas rápidas (não único, pois pode ser vazio)
      await collection.createIndex({ email: 1 });
      console.log('UserModel: Index on email created');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('UserModel: Index on email already exists');
      } else {
        console.error('UserModel: Error creating email index:', error);
      }
    }
  }
}
