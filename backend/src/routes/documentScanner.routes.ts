import { Router } from "express";
import { DocumentScannerController } from "../controllers/documentScanner.controller";
import { upload } from "../controllers/document.controller";

const router = Router();

router.post("/scan", upload.single("file"), DocumentScannerController.scanDocument);
router.get("/scans", DocumentScannerController.getLastScans);
router.get("/scans/:id", DocumentScannerController.getScanDetail);

export default router;
