import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';

const router = Router();

// Rutas CRUD de Clientes (actualizaciones exclusivas por PATCH)
router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', clientController.create);
router.patch('/:id', clientController.update);
router.delete('/:id', clientController.remove);

export default router;
