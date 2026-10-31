import type { Express, Request, Response } from 'express';
import { storage } from './storage';
import { register, login, verifyToken, loadState, saveState } from './accounts';

function requireAuth(req: Request, res: Response): string | null {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : null;
  const id = verifyToken(tok);
  if (!id) { res.status(401).json({ error: 'Not signed in.' }); return null; }
  return id;
}

export function registerRoutes(app: Express) {
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'hermes-revival-backend'
    });
  });

  // ===== Accounts + progress sync (name + code) =====
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try { const { username, code } = req.body || {}; res.json(await register(username, code)); }
    catch (e: any) { res.status(e?.status || 500).json({ error: e?.msg || 'Could not create account.' }); }
  });
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try { const { username, code } = req.body || {}; res.json(await login(username, code)); }
    catch (e: any) { res.status(e?.status || 500).json({ error: e?.msg || 'Could not sign in.' }); }
  });
  app.get('/api/state', async (req: Request, res: Response) => {
    const id = requireAuth(req, res); if (!id) return;
    try { res.json(await loadState(id)); }
    catch (e: any) { res.status(500).json({ error: 'Could not load your progress.' }); }
  });
  app.put('/api/state', async (req: Request, res: Response) => {
    const id = requireAuth(req, res); if (!id) return;
    try { const { data } = req.body || {}; res.json(await saveState(id, data || {})); }
    catch (e: any) { res.status(500).json({ error: 'Could not save your progress.' }); }
  });

  // API info endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'Hermes Revival API',
      version: '1.0.0',
      endpoints: [
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api', method: 'GET', description: 'API information' }
      ]
    });
  });

  // Add your application routes here
  // Prefix with /api
  // Use storage for CRUD operations:
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
}
