import { Router } from 'express';
import { HeroController } from '../controllers/hero.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('settings.view'), HeroController.getHero);
router.put('/:id', authMiddleware, requirePermission('settings.update'), HeroController.updateHero);

export default router;
