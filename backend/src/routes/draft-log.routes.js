import { Router } from 'express';
import { draftLogController } from '../controllers/draft-log.controller.js';

const router = Router();

// Rutas CRUD para Draft Logs (actualizaciones mediante PATCH, nunca PUT)
router.get('/', draftLogController.getAll);
router.get('/:id', draftLogController.getById);
router.post('/', draftLogController.create);
router.patch('/:id', draftLogController.update);
router.delete('/:id', draftLogController.remove);

export default router;
