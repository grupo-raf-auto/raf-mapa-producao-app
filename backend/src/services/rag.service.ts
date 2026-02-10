import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Parâmetros conforme especificação do sistema RAG MySabichão
// Chunking: 1000 caracteres com 200 caracteres de sobreposição
const CHUNK_SIZE = 1000; // Tamanho padrão conforme especificação
const CHUNK_OVERLAP = 200; // Sobreposição conforme especificação
const MIN_CHUNK_SIZE = 0; // Limite mínimo chunk conforme especificação (após trim)

/**
 * Divide texto em chunks inteligentes, tentando preservar sentenças e parágrafos
 */
export function splitTextIntoChunks(text: string): string[] {
  // Normalizar quebras de linha
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Se o texto é menor que o chunk size, retornar como único chunk
  if (normalizedText.length <= CHUNK_SIZE) {
    return normalizedText.trim() ? [normalizedText.trim()] : [];
  }

  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < normalizedText.length) {
    const remainingText = normalizedText.slice(currentPos);
    
    // Se o texto restante é menor que o chunk size, adicionar tudo
    if (remainingText.length <= CHUNK_SIZE) {
      const chunk = remainingText.trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      break;
    }

    // Tentar encontrar um bom ponto de divisão
    let chunkEnd = currentPos + CHUNK_SIZE;
    
    // Prioridade 1: Dividir por parágrafo (duas quebras de linha)
    const paragraphBreak = normalizedText.lastIndexOf("\n\n", chunkEnd);
    if (paragraphBreak > currentPos + CHUNK_SIZE * 0.5) {
      chunkEnd = paragraphBreak + 2; // Incluir as quebras de linha
    } else {
      // Prioridade 2: Dividir por quebra de linha simples
      const lineBreak = normalizedText.lastIndexOf("\n", chunkEnd);
      if (lineBreak > currentPos + CHUNK_SIZE * 0.7) {
        chunkEnd = lineBreak + 1; // Incluir a quebra de linha
      } else {
        // Prioridade 3: Dividir por pontuação de fim de sentença
        const sentenceEnds = [
          normalizedText.lastIndexOf(". ", chunkEnd),
          normalizedText.lastIndexOf("! ", chunkEnd),
          normalizedText.lastIndexOf("? ", chunkEnd),
        ].filter((idx) => idx !== -1);
        const sentenceEnd = sentenceEnds.length > 0 ? Math.max(...sentenceEnds) : -1;
        if (sentenceEnd > currentPos + CHUNK_SIZE * 0.8) {
          chunkEnd = sentenceEnd + 2; // Incluir ponto e espaço
        } else {
          // Prioridade 4: Dividir por espaço (evitar quebrar palavras)
          const spaceBreak = normalizedText.lastIndexOf(" ", chunkEnd);
          if (spaceBreak > currentPos + CHUNK_SIZE * 0.9) {
            chunkEnd = spaceBreak + 1; // Incluir o espaço
          }
          // Se não encontrar espaço adequado, dividir no limite exato
        }
      }
    }

    const chunk = normalizedText.slice(currentPos, chunkEnd).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Mover posição com overlap
    // Se encontramos um bom ponto de divisão, começar um pouco antes para overlap
    if (chunkEnd < normalizedText.length) {
      currentPos = Math.max(
        currentPos + 1, // Garantir progresso
        chunkEnd - CHUNK_OVERLAP, // Aplicar overlap
      );
    } else {
      break;
    }
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY não configurada");
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    nA = 0,
    nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  const d = Math.sqrt(nA) * Math.sqrt(nB);
  return d === 0 ? 0 : dot / d;
}

export interface DocChunkWithSimilarity {
  chunk: {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    embedding: unknown;
  };
  similarity: number;
  document?: {
    originalName: string;
    fileName: string;
  };
  metadata?: {
    pageNumber?: number;
    startChar?: number;
    endChar?: number;
  };
}

const MIN_SIMILARITY_SCORE = 0.2; // Score mínimo de relevância conforme especificação
const DEFAULT_TOP_K = 8; // Top-K chunks conforme especificação

export async function searchRelevantChunks(
  query: string,
  limit: number = DEFAULT_TOP_K,
): Promise<DocChunkWithSimilarity[]> {
  const queryEmbedding = await generateEmbedding(query);

  const allChunks = await prisma.documentChunk.findMany({
    where: { embedding: { not: Prisma.JsonNull } },
    include: {
      document: {
        select: {
          originalName: true,
          filename: true,
        },
      },
    },
  });

  const withSim = allChunks
    .map((c) => {
      const emb = c.embedding as number[] | null;
      if (!emb || emb.length === 0) return null;
      const similarity = cosineSimilarity(queryEmbedding, emb);
      return { chunk: c, similarity };
    })
    .filter(
      (x): x is { chunk: (typeof allChunks)[0]; similarity: number } =>
        x !== null && x.similarity >= MIN_SIMILARITY_SCORE, // Filtrar por score mínimo
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return withSim.map(({ chunk, similarity }) => {
    const metadata = (chunk.metadata as {
      pageNumber?: number;
      startChar?: number;
      endChar?: number;
    }) || {};

    return {
      chunk: {
        id: chunk.id,
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
      },
      similarity,
      document: chunk.document
        ? {
            originalName: chunk.document.originalName,
            fileName: chunk.document.filename,
          }
        : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  });
}

export async function processDocumentChunks(
  documentId: string,
  text: string,
): Promise<string[]> {
  const textChunks = splitTextIntoChunks(text);
  const chunkIds: string[] = [];

  console.log(
    `[RAG] Processando documento ${documentId}: ${textChunks.length} chunks criados`,
  );

  if (textChunks.length === 0) {
    console.warn(`[RAG] Nenhum chunk criado para documento ${documentId}`);
    return [];
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < textChunks.length; i++) {
    const content = textChunks[i].trim();
    if (content.length === 0) {
      console.warn(`[RAG] Chunk ${i} está vazio, pulando...`);
      continue;
    }

    try {
      // Adicionar pequeno delay para evitar rate limiting da OpenAI
      if (i > 0 && i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

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
      successCount++;

      if ((i + 1) % 10 === 0) {
        console.log(
          `[RAG] Processados ${i + 1}/${textChunks.length} chunks do documento ${documentId}`,
        );
      }
    } catch (err) {
      errorCount++;
      const errorMsg =
        err instanceof Error ? err.message : String(err);
      console.error(
        `[RAG] Erro ao processar chunk ${i}/${textChunks.length} do documento ${documentId}:`,
        errorMsg,
      );

      // Se for erro de rate limit, aguardar mais tempo
      if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("429")
      ) {
        console.log("[RAG] Rate limit detectado, aguardando 5 segundos...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        // Tentar novamente este chunk
        i--;
        continue;
      }
    }
  }

  console.log(
    `[RAG] Documento ${documentId} processado: ${successCount} chunks criados, ${errorCount} erros`,
  );

  if (chunkIds.length === 0) {
    throw new Error(
      `Nenhum chunk foi criado com sucesso para o documento ${documentId}`,
    );
  }

  return chunkIds;
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({ where: { documentId } });
}
