import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';
import { messageLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/', messageLimiter, MessageController.createMessage);
router.get('/', authMiddleware, requirePermission('messages.view'), MessageController.getMessages);
router.get('/services', authMiddleware, requirePermission('messages.view'), MessageController.getServiceOptions);
router.get('/:id', authMiddleware, requirePermission('messages.view'), MessageController.getMessageById);
router.put('/:id', authMiddleware, requirePermission('messages.reply'), MessageController.updateMessage);
router.delete('/:id', authMiddleware, requirePermission('messages.delete'), MessageController.deleteMessage);

export default router;
