import express from 'express';
import cors from 'cors';
import router from './routes/index.routes.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount root router
app.use('/api', router);

export default app;
