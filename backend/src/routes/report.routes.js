import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';

const router = Router();

// Rutas CRUD de Reportes (actualizaciones exclusivas por PATCH)
router.get('/', reportController.getAll);
router.get('/:id', reportController.getById);
router.post('/', reportController.create);
router.patch('/:id', reportController.update);
router.delete('/:id', reportController.remove);

// Endpoint para habilitar/rotar enlace público
router.post('/:id/public-link', reportController.enablePublicLink);

export default router;
