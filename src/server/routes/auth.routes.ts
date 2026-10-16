import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authLimiter, refreshLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.post('/google', authLimiter, AuthController.googleLogin);
router.post('/refresh', refreshLimiter, AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.put('/change-password', authMiddleware, AuthController.changeOwnPassword);

export default router;
