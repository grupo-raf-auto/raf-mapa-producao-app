import { Router } from 'express';
import { MessageGeneratorController } from '../controllers/message-generator.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);

router.get('/contexts', MessageGeneratorController.getContexts);
router.get('/templates', MessageGeneratorController.getTemplates);
router.post('/generate', MessageGeneratorController.generate);

export default router;
