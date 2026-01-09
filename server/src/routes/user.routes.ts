import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateUser);

// Obter usuário atual
router.get('/me', UserController.getCurrentUser);

// Rotas de admin
router.get('/', requireAdmin, UserController.getAll);
router.get('/stats', requireAdmin, UserController.getStats);
router.get('/:id', requireAdmin, UserController.getById);
router.post('/', requireAdmin, UserController.create);
router.patch('/:id', requireAdmin, UserController.update);
router.delete('/:id', requireAdmin, UserController.delete);

export default router;
