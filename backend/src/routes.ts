import express from 'express';
import type { Express, Request, Response } from 'express';
import { storage } from './storage.js';
import { register, login, verifyToken, loadState, saveState, accountsMode } from './accounts.js';
import { putSession, putEeg, listSessions, getSession, getEeg, claudeKey, accountForKey, mdIndex, mdReport, csvTimeline, csvRR } from './sessions.js';

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
      service: 'hermes-revival-backend',
      accounts: accountsMode()
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


  // ===== Biofeedback sessions (meditation / Perception Lab reports, timelines, raw EEG) =====
  const fail = (res: Response, e: any, msg: string) => res.status(e?.status || 500).json({ error: e?.msg || msg });
  app.put('/api/sessions/:id', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json(await putSession(acc, req.params.id, req.body || {})); } catch (e) { fail(res, e, 'Could not save the session.'); }
  });
  app.put('/api/sessions/:id/eeg/:idx', express.raw({ type: 'application/octet-stream', limit: '8mb' }), async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json(await putEeg(acc, req.params.id, parseInt(req.params.idx, 10), req.body as Buffer)); } catch (e) { fail(res, e, 'Could not save EEG.'); }
  });
  app.get('/api/sessions', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json({ sessions: await listSessions(acc, req.query.kind ? String(req.query.kind) : undefined) }); } catch (e) { fail(res, e, 'Could not list sessions.'); }
  });
  app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { const s = await getSession(acc, req.params.id); if (!s) return res.status(404).json({ error: 'Not found' }); res.json(s); } catch (e) { fail(res, e, 'Could not load the session.'); }
  });
  app.get('/api/sessions/:id/eeg/:idx', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { const b = await getEeg(acc, req.params.id, parseInt(req.params.idx, 10)); if (!b) return res.status(404).end(); res.type('application/octet-stream').send(b); } catch (e) { fail(res, e, 'Could not load EEG.'); }
  });
  app.post('/api/claude-key', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json({ key: await claudeKey(acc, !!(req.body && req.body.rotate)) }); } catch (e) { fail(res, e, 'Could not make a link.'); }
  });
  // Read-only plain-text views behind a secret link, so Claude can read the reports
  const claudeBase = (req: Request) => `${String(req.get('x-forwarded-proto') || req.protocol).split(',')[0]}://${req.get('host')}/api/claude/${req.params.key}`;
  app.get('/api/claude/:key', async (req: Request, res: Response) => {
    const acc = await accountForKey(req.params.key); if (!acc) return res.status(404).type('text/plain').send('Not found');
    res.type('text/plain; charset=utf-8').send(mdIndex(await listSessions(acc, req.query.kind ? String(req.query.kind) : undefined, 500), claudeBase(req)));
  });
  app.get('/api/claude/:key/:id', async (req: Request, res: Response) => {
    const acc = await accountForKey(req.params.key); if (!acc) return res.status(404).type('text/plain').send('Not found');
    const s = await getSession(acc, req.params.id); if (!s) return res.status(404).type('text/plain').send('No such session');
    res.type('text/plain; charset=utf-8').send(mdReport(s, claudeBase(req)));
  });
  app.get('/api/claude/:key/:id/:file', async (req: Request, res: Response) => {
    const acc = await accountForKey(req.params.key); if (!acc) return res.status(404).type('text/plain').send('Not found');
    const s = await getSession(acc, req.params.id); if (!s) return res.status(404).type('text/plain').send('No such session');
    if (req.params.file === 'timeline.csv') return res.type('text/plain; charset=utf-8').send(csvTimeline(s));
    if (req.params.file === 'rr.csv') return res.type('text/plain; charset=utf-8').send(csvRR(s));
    res.status(404).type('text/plain').send('Not found');
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
