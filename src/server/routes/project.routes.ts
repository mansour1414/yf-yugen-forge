import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('projects.view'), ProjectController.getProjects);
router.get('/:id', authMiddleware, requirePermission('projects.view'), ProjectController.getProjectById);
router.post('/', authMiddleware, requirePermission('projects.create'), ProjectController.createProject);
router.put('/:id', authMiddleware, requirePermission('projects.update'), ProjectController.updateProject);
router.delete('/:id', authMiddleware, requirePermission('projects.delete'), ProjectController.deleteProject);

export default router;
