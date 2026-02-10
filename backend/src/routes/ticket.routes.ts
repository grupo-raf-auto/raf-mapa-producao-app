import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';

const router = Router();

router.post('/', TicketController.create);
router.get('/', TicketController.getAll);
router.get('/:id', TicketController.getById);
router.patch('/:id', TicketController.update);

export default router;
