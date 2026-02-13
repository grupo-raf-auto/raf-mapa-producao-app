import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { runSeed } from '../controllers/seed.controller';

const router = Router();

/**
 * POST /api/admin/seed
 * Restaura templates e questões iniciais (sem dados dummy).
 * Apenas admin.
 */
router.post('/', authenticateUser, runSeed);

export default router;
