import { Router } from 'express';
import clientRoutes from './client.routes.js';
import draftLogRoutes from './draft-log.routes.js';
import milestoneRoutes from './milestone.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Rutas de clientes (/api/clients)
router.use('/clients', clientRoutes);

// Rutas de registros borradores (/api/draft-logs)
router.use('/draft-logs', draftLogRoutes);

// Rutas de hitos (/api/milestones)
router.use('/milestones', milestoneRoutes);

// Rutas de reportes (/api/reports)
router.use('/reports', reportRoutes);

export default router;


