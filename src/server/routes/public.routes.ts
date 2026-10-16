import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();

router.get('/settings', PublicController.getSettings);
router.get('/hero', PublicController.getHero);
router.get('/services', PublicController.getServices);
router.get('/pricing', PublicController.getPricingPlans);
router.get('/projects', PublicController.getProjects);
router.get('/testimonials', PublicController.getTestimonials);
router.get('/home', PublicController.getHome);

export default router;
