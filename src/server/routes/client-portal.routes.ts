import { Router } from 'express';
import { ClientPortalController } from '../controllers/client-portal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireClientProfile } from '../middlewares/client-portal.middleware';

const router = Router();

router.use(authMiddleware, requireClientProfile);

router.get('/contracts', ClientPortalController.getMyContracts);
router.get('/contracts/:id', ClientPortalController.getMyContractById);
router.get('/messages', ClientPortalController.getMyMessages);
router.post('/messages', ClientPortalController.createMyMessage);

export default router;
