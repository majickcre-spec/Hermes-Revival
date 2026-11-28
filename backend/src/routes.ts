import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Express, Request, Response } from 'express';
import { storage } from './storage.js';
import { register, login, verifyToken, loadState, saveState, accountsMode, isAdmin, canHeads, canMeditate, medGranted, setMedAccess, accountCount } from './accounts.js';
import { recordUsage, usageStats } from './usage.js';
import { lyricLines, lyricAiOn } from './lyriclines.js';
import { putSession, putEeg, listSessions, getSession, getEeg, claudeKey, accountForKey, mdIndex, mdReport, csvTimeline, csvRR, putHeartlog, setResearch, deleteMine, adminSummary, adminCsv, adminFull } from './sessions.js';

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
  // background heart recordings
  app.put('/api/heartlog/:id', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json(await putHeartlog(acc, req.params.id, req.body || {})); } catch (e) { fail(res, e, 'Could not save the recording.'); }
  });
  // a player's research sharing switch
  app.post('/api/research', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { const b = req.body || {}; res.json(await setResearch(acc, b.playerId, !!b.on)); } catch (e) { fail(res, e, 'Could not update sharing.'); }
  });
  // delete my uploads (one player, or the whole account)
  app.delete('/api/my-data', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json(await deleteMine(acc, req.query.player ? String(req.query.player) : undefined)); } catch (e) { fail(res, e, 'Could not delete.'); }
  });
  // research export — admin account only (checked here on the server)
  const requireAdmin = async (req: Request, res: Response): Promise<string | null> => {
    const acc = requireAuth(req, res); if (!acc) return null;
    if (!(await isAdmin(acc))) { res.status(403).json({ error: 'Admins only.' }); return null; }
    return acc;
  };
  app.get('/api/admin/summary', async (req: Request, res: Response) => {
    const acc = await requireAdmin(req, res); if (!acc) return;
    try { res.json(await adminSummary(acc)); } catch (e) { fail(res, e, 'Could not load.'); }
  });
  app.get('/api/admin/export.csv', async (req: Request, res: Response) => {
    const acc = await requireAdmin(req, res); if (!acc) return;
    try { res.type('text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="mmu-sessions.csv"').send(await adminCsv(acc)); } catch (e) { fail(res, e, 'Could not export.'); }
  });
  app.get('/api/admin/export.json', async (req: Request, res: Response) => {
    const acc = await requireAdmin(req, res); if (!acc) return;
    try { res.set('Content-Disposition', 'attachment; filename="mmu-sessions-full.json"').json(await adminFull(acc)); } catch (e) { fail(res, e, 'Could not export.'); }
  });
  // Heads of Things: private pages, served only to the Travis and Star accounts (never in the public site files)
  app.get('/api/heads/:which', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    if (!(await canHeads(acc))) { res.status(403).json({ error: 'Private.' }); return; }
    const file = ({ halves: 'heads-halves.html', star: 'star-heads.html' } as Record<string, string>)[req.params.which];
    if (!file) { res.status(404).json({ error: 'Not found.' }); return; }
    const p = [join(process.cwd(), 'private', file), join(process.cwd(), 'backend', 'private', file)].find((f) => existsSync(f));
    if (!p) { res.status(500).json({ error: 'Missing page.' }); return; }
    res.set('Cache-Control', 'private, no-store').type('html').send(readFileSync(p, 'utf8'));
  });
  app.get('/api/heads', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return; res.json({ ok: await canHeads(acc) });
  });
  // which locked sections this account can open
  app.get('/api/access', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    res.json({ meditation: await canMeditate(acc), heads: await canHeads(acc), admin: await isAdmin(acc) });
  });
  // admin: who has Meditation (grant / remove by account name)
  app.get('/api/admin/access', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    if (!(await isAdmin(acc))) { res.status(403).json({ error: 'Admin only.' }); return; }
    res.json({ meditation: await medGranted() });
  });
  app.post('/api/admin/access', express.json(), async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    if (!(await isAdmin(acc))) { res.status(403).json({ error: 'Admin only.' }); return; }
    try { res.json({ meditation: await setMedAccess(req.body?.username, !!req.body?.meditation) }); }
    catch (e: any) { res.status(e?.status || 500).json({ error: e?.msg || e?.message || 'Could not save.' }); }
  });
  // anonymous usage: a random device id + minutes + short event names (sent as text/plain so no preflight / works with sendBeacon)
  app.post('/api/usage', express.text({ type: '*/*', limit: '8kb' }), async (req: Request, res: Response) => {
    try { const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      res.status((await recordUsage(body)) ? 204 : 400).end(); }
    catch { res.status(400).end(); }
  });
  app.get('/api/admin/usage', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    if (!(await isAdmin(acc))) { res.status(403).json({ error: 'Admin only.' }); return; }
    try { res.json(await usageStats(await accountCount())); } catch (e: any) { res.status(500).json({ error: 'Could not load usage.' }); }
  });
  app.get('/api/admin/me', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return; res.json({ admin: await isAdmin(acc) });
  });
  // Lyric Lab: original next-line ideas that rhyme and fit the rhythm (needs ANTHROPIC_API_KEY)
  app.get('/api/lyric-lines', (req: Request, res: Response) => { res.json({ on: lyricAiOn() }); });
  app.post('/api/lyric-lines', async (req: Request, res: Response) => {
    const acc = requireAuth(req, res); if (!acc) return;
    try { res.json(await lyricLines(acc, req.body || {})); }
    catch (e: any) { res.status(e?.status || 500).json({ error: e?.msg || 'Couldn\u2019t get ideas right now.' }); }
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
