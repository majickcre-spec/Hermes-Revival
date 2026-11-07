import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.js';
import { initAccounts } from './accounts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
// Sign-in uses a bearer token (no cookies), so any origin may call the API — the app is reachable
// from more than one address (main page, /app.html, custom domains), and a strict single origin
// made sign-in fail with "Failed to fetch" on some devices.
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
registerRoutes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// Initialize accounts/progress tables (no-op without DATABASE_URL)
initAccounts().catch((e) => console.error('initAccounts failed:', e));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log('🔗 CORS: any origin (bearer-token API)');
});
