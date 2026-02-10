import { Router } from "express";
import { DocumentController, upload } from "../controllers/document.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  DocumentController.uploadDocument,
);
router.post("/sync", requireAdmin, DocumentController.syncFromDisk);
router.get("/", DocumentController.listDocuments);
router.get("/:id", DocumentController.getDocument);
router.delete("/:id", DocumentController.deleteDocument);

export default router;
