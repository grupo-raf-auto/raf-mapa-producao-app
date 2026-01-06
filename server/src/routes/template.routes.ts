import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';

const router = Router();

router.get('/', TemplateController.getAll);
router.get('/:id', TemplateController.getById);
router.post('/', TemplateController.create);
router.patch('/:id', TemplateController.update);
router.delete('/:id', TemplateController.delete);

export default router;
