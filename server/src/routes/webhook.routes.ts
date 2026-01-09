import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Webhook do Clerk (não requer autenticação normal, usa assinatura)
router.post('/clerk', WebhookController.handleClerkWebhook);

export default router;
