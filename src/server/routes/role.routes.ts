import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminRole, requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/permissions', authMiddleware, requirePermission('users.view'), RoleController.getPermissions);
router.get('/', authMiddleware, requirePermission('users.view'), RoleController.getRoles);
router.get('/:id', authMiddleware, requirePermission('users.view'), RoleController.getRoleById);
// Changing roles/permissions is privilege management, so on top of the users.* permission it is
// limited to the Admin role.
router.post('/', authMiddleware, requirePermission('users.create'), requireAdminRole, RoleController.createRole);
router.put('/:id', authMiddleware, requirePermission('users.update'), requireAdminRole, RoleController.updateRole);
router.put('/:id/permissions', authMiddleware, requirePermission('users.update'), requireAdminRole, RoleController.updateRolePermissions);
router.delete('/:id', authMiddleware, requirePermission('users.delete'), requireAdminRole, RoleController.deleteRole);

export default router;
