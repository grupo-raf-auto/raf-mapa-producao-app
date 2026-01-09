import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateUser);

router.post('/message', ChatController.sendMessage);
router.get('/conversation/:conversationId', ChatController.getConversationHistory);

export default router;
