import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../lib/prisma";
import { extractTextFromFile } from "../services/document-processor.service";
import {
  processDocumentChunks,
  deleteDocumentChunks,
} from "../services/rag.service";

const uploadDir = path.join(process.cwd(), "uploads");

async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório de uploads:", error);
  }
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(
        new Error(
          `Tipo não suportado: ${file.mimetype}. Use: PDF, DOCX, TXT, MD`,
        ),
      );
  },
});

async function processDocumentAsync(
  documentId: string,
  filePath: string,
  mimeType: string,
) {
  try {
    const text = await extractTextFromFile(filePath, mimeType);
    if (!text?.trim()) throw new Error("Nenhum texto extraído");

    const chunkIds = await processDocumentChunks(documentId, text);
    if (chunkIds.length === 0) throw new Error("Nenhum chunk criado");

    await prisma.document.update({
      where: { id: documentId },
      data: { processedAt: new Date() },
    });

    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("Erro ao apagar ficheiro temporário:", e);
    }
  } catch (error: unknown) {
    console.error(`Erro ao processar documento ${documentId}:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { processedAt: new Date() },
    });
  }
}

export class DocumentController {
  static async uploadDocument(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file)
        return res.status(400).json({ error: "Ficheiro não fornecido" });

      const file = req.file;
      const doc = await prisma.document.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user.id,
          isActive: true,
        },
      });

      processDocumentAsync(doc.id, file.path, file.mimetype).catch((e) =>
        console.error("Erro em processDocumentAsync:", e),
      );

      res.json({
        id: doc.id,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        message: "Documento enviado. Processamento em andamento...",
      });
    } catch (error: unknown) {
      console.error("Erro upload:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      });
    }
  }

  static async listDocuments(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const isAdmin = (req.user as { role?: string }).role === 'admin';
      const list = await prisma.document.findMany({
        where: {
          isActive: true,
          ...(!isAdmin && { uploadedBy: req.user.id }),
        },
        include: {
          chunks: true,
        },
        orderBy: { uploadedAt: "desc" },
      });
      res.json(
        list.map((d) => ({
          ...d,
          _id: d.id,
          chunksCount: d.chunks.length,
        })),
      );
    } catch (error: unknown) {
      console.error("Erro ao listar documentos:", error);
      res.status(500).json({ error: "Erro ao listar documentos" });
    }
  }

  static async getDocument(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc)
        return res.status(404).json({ error: "Documento não encontrado" });
      const isAdmin = (req.user as { role?: string }).role === 'admin';
      if (!isAdmin && doc.uploadedBy !== req.user.id)
        return res.status(403).json({ error: "Acesso negado" });
      res.json({ ...doc, _id: doc.id });
    } catch (error: unknown) {
      console.error("Erro ao buscar documento:", error);
      res.status(500).json({ error: "Erro ao buscar documento" });
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc)
        return res.status(404).json({ error: "Documento não encontrado" });
      const isAdmin = (req.user as { role?: string }).role === 'admin';
      if (!isAdmin && doc.uploadedBy !== req.user.id)
        return res.status(403).json({ error: "Acesso negado" });

      await deleteDocumentChunks(id);
      await prisma.document.update({
        where: { id },
        data: { isActive: false },
      });

      try {
        await fs.unlink(path.join(uploadDir, doc.filename));
      } catch (e) {
        console.warn("Erro ao apagar ficheiro físico:", e);
      }

      res.json({ message: "Documento eliminado com sucesso" });
    } catch (error: unknown) {
      console.error("Erro ao eliminar documento:", error);
      res.status(500).json({ error: "Erro ao eliminar documento" });
    }
  }
}
