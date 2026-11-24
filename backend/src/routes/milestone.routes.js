import { Router } from 'express';
import { milestoneController } from '../controllers/milestone.controller.js';

const router = Router();

// Rutas CRUD de Hitos (actualizaciones exclusivas por PATCH)
router.get('/', milestoneController.getAll);
router.get('/:id', milestoneController.getById);
router.post('/', milestoneController.create);
router.patch('/:id', milestoneController.update);
router.delete('/:id', milestoneController.remove);

// Endpoint de reconciliación: asignar logs a un milestone
router.post('/:id/assign-logs', milestoneController.assignLogs);

export default router;
