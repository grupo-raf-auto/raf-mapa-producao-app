import { Request, Response } from "express";
import { DocumentScanner } from "../services/documentScanner";
import { prisma } from "../lib/prisma";
import type { DocumentScanResult } from "../services/documentScanner";
import type { AuthUser } from "../middleware/auth.middleware";

interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Controller for document scanning endpoints
 */
export class DocumentScannerController {
  /**
   * Scans uploaded document for fraud
   */
  static async scanDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "Ficheiro não fornecido" });

      const file = req.file;
      const documentId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Validate file type
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Tipo de ficheiro não suportado. Use: PDF, JPG, PNG",
        });
      }

      // Run scan async but return immediately
      DocumentScanner.scanDocument(documentId, file.path, file.mimetype)
        .then(async (result) => {
          // Store in database
          await prisma.documentScan.create({
            data: {
              id: documentId,
              fileName: file.originalname,
              fileType: file.mimetype.startsWith("image/") ? "image" : "pdf",
              fileSize: file.size,
              scoreTotal: result.scoreTotal,
              technicalScore: result.scores.tecnicoScore,
              iaScore: result.scores.iaScore,
              riskLevel: result.nivelRisco,
              recommendation: result.recomendacao,
              flags: result.flagsCriticas as any,
              justification: result.justificacao,
              technicalFlags: [] as any,
              aiRisks: result as any,
              userId: req.user!.id,
            },
          });
          console.log(`[${documentId}] Resultado persistido em BD`);
        })
        .catch((error) => {
          console.error(`[${documentId}] Erro ao persistir:`, error);
        });

      // Return immediately
      res.json({
        id: documentId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "processing",
        message: "Documento enviado. Scan em andamento...",
      });
    } catch (error: unknown) {
      console.error("Erro upload scanner:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      });
    }
  }

  /**
   * Lists user's document scans
   */
  static async getLastScans(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const scans = await prisma.documentScan.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      res.json(scans);
    } catch (error: unknown) {
      console.error("Erro ao listar scans:", error);
      res.status(500).json({ error: "Erro ao listar scans" });
    }
  }

  /**
   * Gets specific scan detail
   */
  static async getScanDetail(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const scan = await prisma.documentScan.findUnique({
        where: { id },
      });

      if (!scan) {
        return res.status(404).json({ error: "Scan não encontrado" });
      }

      if (scan.userId !== req.user!.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(scan);
    } catch (error: unknown) {
      console.error("Erro ao buscar scan:", error);
      res.status(500).json({ error: "Erro ao buscar scan" });
    }
  }
}
