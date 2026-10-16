import { Router } from 'express';
import { TestimonialController } from '../controllers/testimonial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('settings.view'), TestimonialController.getTestimonials);
router.get('/:id', authMiddleware, requirePermission('settings.view'), TestimonialController.getTestimonialById);
router.post('/', authMiddleware, requirePermission('settings.update'), TestimonialController.createTestimonial);
router.put('/:id', authMiddleware, requirePermission('settings.update'), TestimonialController.updateTestimonial);
router.delete('/:id', authMiddleware, requirePermission('settings.update'), TestimonialController.deleteTestimonial);

export default router;
