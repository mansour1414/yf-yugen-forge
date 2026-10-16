import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('services.view'), ServiceController.getServices);
router.get('/:id', authMiddleware, requirePermission('services.view'), ServiceController.getServiceById);
router.post('/', authMiddleware, requirePermission('services.create'), ServiceController.createService);
router.put('/:id', authMiddleware, requirePermission('services.update'), ServiceController.updateService);
router.delete('/:id', authMiddleware, requirePermission('services.delete'), ServiceController.deleteService);

export default router;
