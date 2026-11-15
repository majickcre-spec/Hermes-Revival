/**
 * Account + progress sync (name + code).
 * The games store everything in localStorage under majick* / music-* / mjk* keys.
 * We sync that whole namespace to the backend as one JSON blob per account, so a
 * player can sign in on any device and get their players, progress and saved
 * instruments back. Audio recordings are NOT synced (too large; they stay local).
 */
const API = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'mjk-auth-token';
const USER_KEY = 'mjk-auth-user';
/* The music game (majick* / music-* / mjk*) runs its own merge sync with this same sign-in, song by song.
   This file only syncs the other pages' keys, and it MERGES: it never deletes local data and never overwrites the game's keys. */
const SYNCED = /^(hermetic-|heads-|learning-)/;
const SKIP = new Set([TOKEN_KEY, USER_KEY]);

export function syncEnabled(): boolean { return !!API; }
export function getToken(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function getUser(): string | null { try { return localStorage.getItem(USER_KEY); } catch { return null; } }
export function isLoggedIn(): boolean { return !!getToken(); }

function setAuth(token: string, username: string) {
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, username); } catch {}
}
export function logout() {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch {}
}

function snapshot(): Record<string, string> {
  const o: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !SYNCED.test(k) || SKIP.has(k)) continue;
      const v = localStorage.getItem(k);
      if (v != null) o[k] = v;
    }
  } catch {}
  return o;
}
/** add what this device is missing from the cloud copy; never removes or replaces local data */
function pullMissing(data: Record<string, string>) {
  try { Object.keys(data || {}).forEach((k) => { if (SYNCED.test(k) && !SKIP.has(k) && localStorage.getItem(k) == null) localStorage.setItem(k, data[k]); }); } catch {}
}

async function call(path: string, opts: RequestInit = {}): Promise<any> {
  const r = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!r.ok) {
    let m = '';
    try { m = (await r.json()).error; } catch {}
    throw new Error(m || r.statusText || 'Request failed');
  }
  return r.json();
}

export async function register(username: string, code: string) {
  const r = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, code }) });
  setAuth(r.token, r.username);
  await push(true); // keep whatever they played locally before signing up
  return r;
}
export async function login(username: string, code: string) {
  const r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, code }) });
  setAuth(r.token, r.username);
  try { const st = await call('/api/state', { headers: { Authorization: 'Bearer ' + r.token } }); pullMissing((st && st.data) || {}); } catch {}
  await push(true);
  location.reload(); // the game merges its own songs and players with the account on load
  return r;
}

let lastHash = '';
export async function push(force = false) {
  const t = getToken();
  if (!t || !API) return;
  const snap = snapshot();
  const h = JSON.stringify(snap);
  if (!force && h === lastHash) return;
  // read-merge-write: keep everything already in the account (the game's songs included), add/refresh this page's keys
  const st = await call('/api/state', { headers: { Authorization: 'Bearer ' + t } });
  const cloud: Record<string, string> = (st && st.data) || {};
  pullMissing(cloud);
  const data: Record<string, string> = { ...cloud, ...snap };
  Object.keys(data).forEach((k) => { if (SKIP.has(k)) delete data[k]; });
  await call('/api/state', { method: 'PUT', headers: { Authorization: 'Bearer ' + t }, body: JSON.stringify({ data }) });
  lastHash = h;
}

let started = false;
export function startAutoSync() {
  if (started || !API) return;
  started = true;
  setInterval(() => { push().catch(() => {}); }, 12000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) push().catch(() => {}); });
}
