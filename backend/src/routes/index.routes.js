import { Router } from 'express';
import clientRoutes from './client.routes.js';
import draftLogRoutes from './draft-log.routes.js';

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

export default router;


