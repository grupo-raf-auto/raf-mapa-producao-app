import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';

const router = Router();

router.get('/', SubmissionController.getAll);
router.get('/stats', SubmissionController.getStats);
router.get('/:id', SubmissionController.getById);
router.post('/', SubmissionController.create);
router.delete('/:id', SubmissionController.delete);

export default router;
