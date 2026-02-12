import { Router } from 'express';
import * as objectiveController from '../controllers/objective.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateUser);

router.get('/', objectiveController.list);
router.get('/flat', objectiveController.listFlat);
router.post('/', requireAdmin, objectiveController.create);
router.patch('/:id', requireAdmin, objectiveController.update);
router.delete('/:id', requireAdmin, objectiveController.remove);
router.post('/reorder', requireAdmin, objectiveController.reorder);

export default router;
