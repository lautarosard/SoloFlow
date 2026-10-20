import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[SoloFlow API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[SoloFlow API] Health check endpoint available at http://localhost:${PORT}/api/health`);
});
