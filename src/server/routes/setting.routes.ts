import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/public', SettingController.getPublicSettings);
router.get('/', authMiddleware, requirePermission('settings.view'), SettingController.getSettings);
router.get('/group/:group', authMiddleware, requirePermission('settings.view'), SettingController.getSettingsByGroup);
router.put('/', authMiddleware, requirePermission('settings.update'), SettingController.bulkUpdateSettings);
router.put('/group/:group', authMiddleware, requirePermission('settings.update'), SettingController.updateGroupSettings);

export default router;
