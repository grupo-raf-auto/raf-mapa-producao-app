import { getDatabase } from '../config/database';
import { ChatMessage } from '../types';
import { ObjectId } from 'mongodb';

export class ChatModel {
  static async create(data: Omit<ChatMessage, '_id' | 'createdAt'>) {
    const db = await getDatabase();
    const collection = db.collection<ChatMessage>('chat_messages');

    const message: ChatMessage = {
      ...data,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(message);
    return result.insertedId.toString();
  }

  static async findByConversationId(conversationId: string) {
    const db = await getDatabase();
    const collection = db.collection<ChatMessage>('chat_messages');

    const messages = await collection
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray();

    return messages.map((msg) => ({
      ...msg,
      _id: msg._id?.toString(),
    }));
  }

  static async findByUserId(userId: string, limit: number = 50) {
    const db = await getDatabase();
    const collection = db.collection<ChatMessage>('chat_messages');

    const messages = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return messages.map((msg) => ({
      ...msg,
      _id: msg._id?.toString(),
    }));
  }

  static async deleteByConversationId(conversationId: string) {
    const db = await getDatabase();
    const collection = db.collection<ChatMessage>('chat_messages');

    await collection.deleteMany({ conversationId });
  }

  static async createIndexes() {
    const db = await getDatabase();
    const collection = db.collection<ChatMessage>('chat_messages');

    try {
      // Índice para buscar mensagens por conversationId
      await collection.createIndex({ conversationId: 1, createdAt: 1 });
      console.log('ChatModel: Index on conversationId and createdAt created');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('ChatModel: Index on conversationId already exists');
      } else {
        console.error('ChatModel: Error creating index:', error);
      }
    }

    try {
      // Índice para buscar mensagens por userId
      await collection.createIndex({ userId: 1, createdAt: -1 });
      console.log('ChatModel: Index on userId and createdAt created');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('ChatModel: Index on userId already exists');
      } else {
        console.error('ChatModel: Error creating userId index:', error);
      }
    }
  }
}
