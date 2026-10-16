import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', authMiddleware, requirePermission('media.view'), MediaController.getMedia);
router.get('/folders', authMiddleware, requirePermission('media.view'), MediaController.getFolders);
router.post('/folders', authMiddleware, requirePermission('media.upload'), MediaController.createFolder);
router.put('/folders/:id', authMiddleware, requirePermission('media.upload'), MediaController.updateFolder);
router.delete('/folders/:id', authMiddleware, requirePermission('media.delete'), MediaController.deleteFolder);
router.get('/:id', authMiddleware, requirePermission('media.view'), MediaController.getMediaById);
router.post('/upload', authMiddleware, requirePermission('media.upload'), upload.single('file'), MediaController.uploadMedia);
router.post('/upload/multiple', authMiddleware, requirePermission('media.upload'), upload.array('files', 10), MediaController.uploadMultipleMedia);
router.post('/', authMiddleware, requirePermission('media.upload'), MediaController.createMedia);
router.put('/:id', authMiddleware, requirePermission('media.upload'), MediaController.updateMedia);
router.delete('/:id/file', authMiddleware, requirePermission('media.delete'), MediaController.deleteMediaFile);
router.delete('/:id', authMiddleware, requirePermission('media.delete'), MediaController.deleteMedia);

export default router;
