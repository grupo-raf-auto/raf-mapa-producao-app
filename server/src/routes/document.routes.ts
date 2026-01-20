import { Router } from 'express';
import { DocumentController, upload } from '../controllers/document.controller';

const router = Router();

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
