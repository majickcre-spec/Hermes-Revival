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
const SYNCED = /^(majick|music-|mjk)/;
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
function applySnapshot(data: Record<string, string>) {
  try {
    const remove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && SYNCED.test(k) && !SKIP.has(k)) remove.push(k);
    }
    remove.forEach((k) => localStorage.removeItem(k));
    Object.keys(data || {}).forEach((k) => { try { localStorage.setItem(k, data[k]); } catch {} });
  } catch {}
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
  const st = await call('/api/state', { headers: { Authorization: 'Bearer ' + r.token } });
  if (st && st.data && Object.keys(st.data).length) {
    applySnapshot(st.data);
    location.reload(); // let the game iframes pick up the restored data
  } else {
    await push(true); // account is empty — seed it from this device
  }
  return r;
}

let lastHash = '';
export async function push(force = false) {
  const t = getToken();
  if (!t || !API) return;
  const snap = snapshot();
  const h = JSON.stringify(snap);
  if (!force && h === lastHash) return;
  lastHash = h;
  await call('/api/state', { method: 'PUT', headers: { Authorization: 'Bearer ' + t }, body: JSON.stringify({ data: snap }) });
}

let started = false;
export function startAutoSync() {
  if (started || !API) return;
  started = true;
  setInterval(() => { push().catch(() => {}); }, 12000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) push().catch(() => {}); });
}
