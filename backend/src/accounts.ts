/**
 * Accounts + progress sync — "name + code" sign-in, no email.
 * Each account stores one JSON progress blob (the player's localStorage snapshot).
 * Uses Postgres when DATABASE_URL is set; falls back to in-memory for local dev.
 */
import postgres from 'postgres';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const SECRET = process.env.AUTH_SECRET || 'dev-insecure-secret-change-me';

const sql = DATABASE_URL ? postgres(DATABASE_URL, { max: 5, onnotice: () => {} }) : null;
const mem = { accounts: new Map<string, any>(), progress: new Map<string, any>(), medAccess: new Set<string>() };

export function accountsMode() { return { store: sql ? 'database' : 'memory (accounts reset on every deploy!)', secret: process.env.AUTH_SECRET ? 'set' : 'default' }; }
export async function initAccounts(): Promise<void> {
  if (!sql) {
    console.warn('⚠  No DATABASE_URL set — accounts use an in-memory store (NOT persistent across restarts).');
    return;
  }
  await sql`CREATE TABLE IF NOT EXISTS accounts (
    id text PRIMARY KEY,
    username text UNIQUE NOT NULL,
    display text NOT NULL,
    code_hash text NOT NULL,
    created_at timestamptz DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS progress (
    account_id text PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS med_access (
    username text PRIMARY KEY,
    granted_at timestamptz DEFAULT now()
  )`;
  console.log('✓ Accounts tables ready');
}

function hashCode(code: string): string {
  const salt = randomBytes(16).toString('hex');
  const dk = scryptSync(code, salt, 64).toString('hex');
  return salt + ':' + dk;
}
function verifyCode(code: string, stored: string): boolean {
  const [salt, dk] = (stored || '').split(':');
  if (!salt || !dk) return false;
  const d2 = scryptSync(code, salt, 64).toString('hex');
  const a = Buffer.from(dk, 'hex'), b = Buffer.from(d2, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
function sign(id: string): string {
  return id + '.' + createHmac('sha256', SECRET).update(id).digest('hex');
}
export function verifyToken(tok?: string | null): string | null {
  if (!tok) return null;
  const i = tok.lastIndexOf('.');
  if (i < 0) return null;
  const id = tok.slice(0, i), h = tok.slice(i + 1);
  const exp = createHmac('sha256', SECRET).update(id).digest('hex');
  const a = Buffer.from(h), b = Buffer.from(exp);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

async function findByUsername(uname: string): Promise<any> {
  if (sql) { const r = await sql`SELECT * FROM accounts WHERE username = ${uname} LIMIT 1`; return r[0] || null; }
  for (const a of mem.accounts.values()) if (a.username === uname) return a;
  return null;
}
async function insertAccount(acc: any): Promise<void> {
  if (sql) { await sql`INSERT INTO accounts (id, username, display, code_hash) VALUES (${acc.id}, ${acc.username}, ${acc.display}, ${acc.code_hash})`; return; }
  mem.accounts.set(acc.id, acc);
}
async function getProgress(id: string): Promise<any> {
  if (sql) { const r = await sql`SELECT data, updated_at FROM progress WHERE account_id = ${id} LIMIT 1`; return r[0] || null; }
  return mem.progress.get(id) || null;
}
async function setProgress(id: string, data: any): Promise<void> {
  if (sql) {
    await sql`INSERT INTO progress (account_id, data, updated_at) VALUES (${id}, ${sql.json(data)}, now())
      ON CONFLICT (account_id) DO UPDATE SET data = ${sql.json(data)}, updated_at = now()`;
    return;
  }
  mem.progress.set(id, { data, updated_at: new Date().toISOString() });
}

type Err = { status: number; msg: string };
const err = (status: number, msg: string): Err => ({ status, msg });

export async function register(username: string, code: string) {
  const display = (username || '').trim();
  const uname = display.toLowerCase();
  if (uname.length < 2 || uname.length > 24) throw err(400, 'Name must be 2–24 characters.');
  if (!code || String(code).length < 4) throw err(400, 'Code must be at least 4 characters.');
  if (await findByUsername(uname)) throw err(409, 'That name is taken — try another, or log in.');
  if (adminNames().includes(uname) || headsNames().includes(uname)) throw err(409, 'That name is taken — try another, or log in.'); /* admin + private-page names can't be claimed by a new sign-up */
  const acc = { id: randomUUID(), username: uname, display, code_hash: hashCode(String(code)) };
  await insertAccount(acc);
  return { token: sign(acc.id), username: display };
}
export async function login(username: string, code: string) {
  const uname = (username || '').trim().toLowerCase();
  const acc = await findByUsername(uname);
  if (!acc || !verifyCode(String(code), acc.code_hash)) throw err(401, 'Wrong name or code.');
  return { token: sign(acc.id), username: acc.display };
}
export async function loadState(id: string) {
  const p = await getProgress(id);
  return { data: p?.data || {}, updated_at: p?.updated_at || null };
}
export async function saveState(id: string, data: any) {
  await setProgress(id, data || {});
  return { ok: true, updated_at: new Date().toISOString() };
}

/* research admin: accounts named in ADMIN_USERS (default "travis") */
export function adminNames(): string[] { return String(process.env.ADMIN_USERS || 'travis').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean); }
/* Heads of Things (private study pages): only these accounts, default Travis + Star */
export function headsNames(): string[] { return String(process.env.HEADS_USERS || 'travis,star').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean); }
export async function accountName(id: string): Promise<string | null> {
  try {
    let u: any = null;
    if (sql) { const r = await sql`SELECT username FROM accounts WHERE id = ${id} LIMIT 1`; u = r[0]; }
    else for (const acc of mem.accounts.values()) if (acc.id === id) u = acc;
    return u ? String(u.username).toLowerCase() : null;
  } catch { return null; }
}
export async function canHeads(id: string): Promise<boolean> { const n = await accountName(id); return !!n && headsNames().includes(n); }
/* Meditation is locked: open to the admin, the Heads accounts (Travis, Star) and anyone the admin grants by name */
export async function medGranted(): Promise<string[]> {
  if (sql) { const r = await sql`SELECT username FROM med_access ORDER BY username`; return r.map((x: any) => String(x.username)); }
  return [...mem.medAccess].sort();
}
export async function setMedAccess(username: string, on: boolean): Promise<string[]> {
  const u = String(username || '').trim().toLowerCase();
  if (u.length < 2 || u.length > 24) throw err(400, 'Name must be 2–24 characters.');
  if (on && !(await findByUsername(u))) throw err(404, 'No account with that name yet — ask them to sign up first.');
  if (sql) { if (on) await sql`INSERT INTO med_access (username) VALUES (${u}) ON CONFLICT DO NOTHING`; else await sql`DELETE FROM med_access WHERE username = ${u}`; }
  else { if (on) mem.medAccess.add(u); else mem.medAccess.delete(u); }
  return medGranted();
}
export async function canMeditate(id: string): Promise<boolean> {
  const n = await accountName(id); if (!n) return false;
  if (adminNames().includes(n) || headsNames().includes(n)) return true;
  return (await medGranted()).includes(n);
}
export async function accountCount(): Promise<number> {
  if (sql) { const r = await sql`SELECT count(*)::int AS n FROM accounts`; return Number(r[0]?.n || 0); }
  return mem.accounts.size;
}
export async function isAdmin(id: string): Promise<boolean> {
  try {
    let u: any = null;
    if (sql) { const r = await sql`SELECT username FROM accounts WHERE id = ${id} LIMIT 1`; u = r[0]; }
    else for (const acc of mem.accounts.values()) if (acc.id === id) u = acc;
    return !!u && adminNames().includes(String(u.username).toLowerCase());
  } catch { return false; }
}
