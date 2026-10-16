import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/roles', authMiddleware, requirePermission('users.view'), UserController.getRoles);
router.get('/', authMiddleware, requirePermission('users.view'), UserController.getUsers);
router.get('/:id', authMiddleware, requirePermission('users.view'), UserController.getUserById);
router.post('/', authMiddleware, requirePermission('users.create'), UserController.createUser);
router.put('/:id', authMiddleware, requirePermission('users.update'), UserController.updateUser);
router.put('/:id/password', authMiddleware, requirePermission('users.update'), UserController.updatePassword);
router.put('/:id/status', authMiddleware, requirePermission('users.update'), UserController.updateStatus);
router.delete('/:id', authMiddleware, requirePermission('users.delete'), UserController.deleteUser);

export default router;
