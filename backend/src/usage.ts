/**
 * Anonymous usage counts for MMU — no names, no accounts, no IP addresses stored.
 * Each device sends a random id it made itself, its kind (phone/tablet/computer/chromebook),
 * its browser family, minutes actively practiced, and short event names (screen opened,
 * level passed, meditation finished, exercise done). Travis reads the totals on the Usage screen.
 * Postgres when DATABASE_URL is set; in-memory otherwise (local dev / tests).
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? postgres(DATABASE_URL, { max: 3, onnotice: () => {} }) : null;

type Dev = { first: string; last: string; platform: string; browser: string };
const mem = {
  devices: new Map<string, Dev>(),
  days: new Map<string, number>(),          // device|day → minutes
  counts: new Map<string, number>(),        // day|kind|key → n
};

const KINDS = new Set(['open', 'level', 'med', 'done']);
const PLATFORMS = new Set(['phone', 'tablet', 'computer', 'chromebook', 'other']);
const BROWSERS = new Set(['safari', 'chrome', 'edge', 'firefox', 'samsung', 'other']);

export async function initUsage(): Promise<void> {
  if (!sql) return;
  await sql`CREATE TABLE IF NOT EXISTS usage_devices (
    device text PRIMARY KEY, first_day date NOT NULL, last_day date NOT NULL,
    platform text NOT NULL DEFAULT 'other', browser text NOT NULL DEFAULT 'other')`;
  await sql`CREATE TABLE IF NOT EXISTS usage_days (
    device text NOT NULL, day date NOT NULL, minutes integer NOT NULL DEFAULT 0, PRIMARY KEY (device, day))`;
  await sql`CREATE TABLE IF NOT EXISTS usage_counts (
    day date NOT NULL, kind text NOT NULL, key text NOT NULL, n integer NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, key))`;
  console.log('✓ Usage tables ready');
}

/* the day in Pacific time, so "today" matches Travis's day */
export function dayOf(t = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}
function addDays(day: string, n: number): string {
  const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
function clean(s: unknown, max: number): string {
  return String(s ?? '').replace(/[^\p{L}\p{N} &'’+\-.,:()/!?]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** returns false when the report is not usable (bad id); never throws on odd input */
export async function recordUsage(body: any): Promise<boolean> {
  const device = String(body?.d || '');
  if (!/^[a-z0-9]{12,40}$/i.test(device)) return false;
  const platform = PLATFORMS.has(body?.p) ? body.p : 'other';
  const browser = BROWSERS.has(body?.b) ? body.b : 'other';
  const minutes = Math.max(0, Math.min(30, Math.round(Number(body?.m) || 0)));
  const events: [string, string][] = (Array.isArray(body?.ev) ? body.ev : []).slice(0, 40)
    .map((e: any) => [String(e?.[0] || ''), clean(e?.[1], 60)] as [string, string])
    .filter(([k, key]: [string, string]) => KINDS.has(k) && key.length > 0);
  const day = dayOf();
  if (sql) {
    await sql`INSERT INTO usage_devices (device, first_day, last_day, platform, browser) VALUES (${device}, ${day}, ${day}, ${platform}, ${browser})
      ON CONFLICT (device) DO UPDATE SET last_day = GREATEST(usage_devices.last_day, EXCLUDED.last_day), platform = EXCLUDED.platform, browser = EXCLUDED.browser`;
    await sql`INSERT INTO usage_days (device, day, minutes) VALUES (${device}, ${day}, ${minutes})
      ON CONFLICT (device, day) DO UPDATE SET minutes = LEAST(1440, usage_days.minutes + EXCLUDED.minutes)`;
    for (const [k, key] of events) {
      await sql`INSERT INTO usage_counts (day, kind, key, n) VALUES (${day}, ${k}, ${key}, 1)
        ON CONFLICT (day, kind, key) DO UPDATE SET n = usage_counts.n + 1`;
    }
    return true;
  }
  const d = mem.devices.get(device);
  if (d) { if (day > d.last) d.last = day; d.platform = platform; d.browser = browser; }
  else mem.devices.set(device, { first: day, last: day, platform, browser });
  const dk = device + '|' + day; mem.days.set(dk, Math.min(1440, (mem.days.get(dk) || 0) + minutes));
  for (const [k, key] of events) { const ck = day + '|' + k + '|' + key; mem.counts.set(ck, (mem.counts.get(ck) || 0) + 1); }
  return true;
}

export async function usageStats(accounts: number): Promise<any> {
  const today = dayOf(), since = addDays(today, -120);
  let devices: { device: string; first: string; last: string; platform: string; browser: string }[] = [];
  let days: { device: string; day: string; minutes: number }[] = [];
  let counts: { day: string; kind: string; key: string; n: number }[] = [];
  if (sql) {
    devices = (await sql`SELECT device, to_char(first_day,'YYYY-MM-DD') AS first, to_char(last_day,'YYYY-MM-DD') AS last, platform, browser FROM usage_devices`) as any;
    days = (await sql`SELECT device, to_char(day,'YYYY-MM-DD') AS day, minutes FROM usage_days WHERE day >= ${since}`) as any;
    counts = (await sql`SELECT to_char(day,'YYYY-MM-DD') AS day, kind, key, n FROM usage_counts WHERE day >= ${addDays(today, -30)}`) as any;
  } else {
    devices = [...mem.devices].map(([device, d]) => ({ device, ...d }));
    days = [...mem.days].map(([k, minutes]) => { const [device, day] = k.split('|'); return { device, day, minutes }; }).filter((x) => x.day >= since);
    counts = [...mem.counts].map(([k, n]) => { const [day, kind, key] = k.split('|'); return { day, kind, key, n }; }).filter((x) => x.day >= addDays(today, -30));
  }
  const active = (from: string) => new Set(days.filter((x) => x.day >= from).map((x) => x.device)).size;
  const d7 = addDays(today, -6), d30 = addDays(today, -29);
  const newByDay: { day: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) { const day = addDays(today, -i); newByDay.push({ day, n: devices.filter((x) => x.first === day).length }); }
  const byDev = new Map<string, string[]>(); days.forEach((x) => { const a = byDev.get(x.device) || []; a.push(x.day); byDev.set(x.device, a); });
  const back = (n: number) => { const elig = devices.filter((x) => x.first <= addDays(today, -n));
    return { eligible: elig.length, back: elig.filter((x) => (byDev.get(x.device) || []).some((d) => d >= addDays(x.first, n)) || x.last >= addDays(x.first, n)).length }; };
  const mins7 = days.filter((x) => x.day >= d7).reduce((a, x) => a + x.minutes, 0);
  const top = (kind: string, n = 8) => { const m = new Map<string, number>(); counts.filter((c) => c.kind === kind).forEach((c) => m.set(c.key, (m.get(c.key) || 0) + c.n));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, n); };
  const split = (f: 'platform' | 'browser') => { const m = new Map<string, number>(); devices.forEach((x) => m.set(x[f], (m.get(x[f]) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]); };
  const total = (kind: string) => counts.filter((c) => c.kind === kind).reduce((a, c) => a + c.n, 0);
  return {
    today,
    devices: { total: devices.length, today: active(today), week: active(d7), month: active(d30) },
    accounts,
    newByDay,
    returning: { nextDay: back(1), week: back(7), month: back(30) },
    minutes: { total: days.reduce((a, x) => a + x.minutes, 0), week: mins7, perActiveWeek: active(d7) ? Math.round(mins7 / active(d7)) : 0 },
    month: { levels: total('level'), meditations: total('med'), exercises: total('done') },
    top: { open: top('open', 10), level: top('level'), med: top('med'), done: top('done') },
    platforms: split('platform'), browsers: split('browser'),
  };
}
