import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  const d = Math.sqrt(nA) * Math.sqrt(nB);
  return d === 0 ? 0 : dot / d;
}

export interface DocChunkWithSimilarity {
  chunk: { id: string; documentId: string; chunkIndex: number; content: string; embedding: unknown };
  similarity: number;
}

export async function searchRelevantChunks(
  query: string,
  limit: number = 5
): Promise<DocChunkWithSimilarity[]> {
  const queryEmbedding = await generateEmbedding(query);

  const allChunks = await prisma.documentChunk.findMany({
    where: { embedding: { not: Prisma.JsonNull } },
  });

  const withSim = allChunks
    .map((c) => {
      const emb = c.embedding as number[] | null;
      if (!emb || emb.length === 0) return null;
      return { chunk: c, similarity: cosineSimilarity(queryEmbedding, emb) };
    })
    .filter((x): x is { chunk: typeof allChunks[0]; similarity: number } => x !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return withSim.map(({ chunk, similarity }) => ({
    chunk: {
      id: chunk.id,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: chunk.embedding,
    },
    similarity,
  }));
}

export async function processDocumentChunks(documentId: string, text: string): Promise<string[]> {
  const textChunks = splitTextIntoChunks(text);
  const chunkIds: string[] = [];

  for (let i = 0; i < textChunks.length; i++) {
    const content = textChunks[i].trim();
    if (content.length === 0) continue;
    try {
      const embedding = await generateEmbedding(content);
      const chunk = await prisma.documentChunk.create({
        data: {
          documentId,
          chunkIndex: i,
          content,
          embedding: embedding as unknown as object,
        },
      });
      chunkIds.push(chunk.id);
    } catch (err) {
      console.error(`Erro ao processar chunk ${i}:`, err);
    }
  }
  return chunkIds;
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({ where: { documentId } });
}
