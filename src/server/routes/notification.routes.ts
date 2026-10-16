import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, NotificationController.getMyNotifications);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.put('/read-all', authMiddleware, NotificationController.markAllAsRead);
router.put('/:id/read', authMiddleware, NotificationController.markAsRead);

export default router;
