import { Router } from 'express';
import { AppSettingsController } from '../controllers/app-settings.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();
const controller = new AppSettingsController();

/**
 * GET /api/app-settings
 * Obter configurações da aplicação
 * Público - qualquer utilizador autenticado pode ver
 */
router.get('/', authenticateUser, (req, res) => controller.getSettings(req, res));

/**
 * PUT /api/app-settings
 * Atualizar configurações da aplicação
 * Apenas ADMIN
 */
router.put('/', authenticateUser, (req, res) => controller.updateSettings(req, res));

/**
 * POST /api/app-settings/reset
 * Resetar configurações para valores padrão
 * Apenas ADMIN
 */
router.post('/reset', authenticateUser, (req, res) =>
  controller.resetSettings(req, res),
);

export default router;
