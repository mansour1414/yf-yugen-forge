import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('clients.view'), ClientController.getClients);
router.get('/:id', authMiddleware, requirePermission('clients.view'), ClientController.getClientById);
router.post('/', authMiddleware, requirePermission('clients.create'), ClientController.createClient);
router.put('/:id', authMiddleware, requirePermission('clients.update'), ClientController.updateClient);
router.delete('/:id', authMiddleware, requirePermission('clients.delete'), ClientController.deleteClient);

export default router;
