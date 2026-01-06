import { Router } from 'express';
import { FormController } from '../controllers/form.controller';

const router = Router();

router.get('/', FormController.getAll);
router.get('/:id', FormController.getById);
router.post('/', FormController.create);
router.patch('/:id', FormController.update);
router.delete('/:id', FormController.delete);

export default router;
