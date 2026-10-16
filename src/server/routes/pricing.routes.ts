import { Router } from 'express';
import { PricingController } from '../controllers/pricing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('pricing.view'), PricingController.getPlans);
router.get('/:id', authMiddleware, requirePermission('pricing.view'), PricingController.getPlanById);
router.post('/', authMiddleware, requirePermission('pricing.create'), PricingController.createPlan);
router.put('/:id', authMiddleware, requirePermission('pricing.update'), PricingController.updatePlan);
router.delete('/:id', authMiddleware, requirePermission('pricing.delete'), PricingController.deletePlan);

export default router;
