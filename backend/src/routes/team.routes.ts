import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import * as teamController from '../controllers/team.controller';

const router = Router();

router.use(authenticateUser);

/** List teams (active only; admin can use ?all=true) */
router.get('/', teamController.list);

/** Current user's team */
router.get('/my', teamController.getMyTeam);

/** Join a team (user sets own teamId) */
router.post('/join', teamController.join);

/** Team rankings for podium (all authenticated users) */
router.get('/rankings', teamController.getRankings);

/** Get team members (admin only) - must be before /:id */
router.get('/:id/members', requireAdmin, teamController.getMembers);

/** Get one team */
router.get('/:id', teamController.getOne);

/** Create team (admin only) */
router.post('/', requireAdmin, teamController.create);

/** Update team (admin only) */
router.patch('/:id', requireAdmin, teamController.update);

/** Delete team (admin only) */
router.delete('/:id', requireAdmin, teamController.remove);

export default router;
