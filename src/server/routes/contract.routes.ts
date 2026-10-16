import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authMiddleware, requirePermission('contracts.view'), ContractController.getContracts);
router.get('/:id', authMiddleware, requirePermission('contracts.view'), ContractController.getContractById);
router.post('/', authMiddleware, requirePermission('contracts.create'), ContractController.createContract);
router.put('/:id', authMiddleware, requirePermission('contracts.update'), ContractController.updateContract);
router.post('/:id/sign', authMiddleware, requirePermission('contracts.update'), ContractController.signContract);
router.delete('/:id', authMiddleware, requirePermission('contracts.delete'), ContractController.deleteContract);

export default router;
