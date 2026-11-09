/**
 * Biofeedback session storage — every recorded meditation / Perception Lab session with its report,
 * second-by-second timeline, heartbeat intervals and raw EEG (1-minute binary blocks).
 * Also a read-only "Claude link": a secret URL that serves the reports as plain Markdown/CSV so Claude can read them.
 * Uses Postgres when DATABASE_URL is set; in-memory otherwise (local dev).
 */
import postgres from 'postgres';
import { randomBytes } from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? postgres(DATABASE_URL, { max: 3, onnotice: () => {} }) : null;
const mem = { sessions: new Map<string, any>(), eeg: new Map<string, any>(), keys: new Map<string, string>() };
const k2 = (a: string, b: string) => a + '|' + b;

export async function initSessions(): Promise<void> {
  if (!sql) return;
  await sql`CREATE TABLE IF NOT EXISTS bio_sessions (
    account_id text NOT NULL,
    id text NOT NULL,
    kind text NOT NULL,
    label text NOT NULL,
    started_at timestamptz NOT NULL,
    mins real,
    summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    report jsonb NOT NULL DEFAULT '{}'::jsonb,
    timeline jsonb NOT NULL DEFAULT '{}'::jsonb,
    rr jsonb NOT NULL DEFAULT '{}'::jsonb,
    eeg_blocks integer NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (account_id, id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS bio_sessions_by_time ON bio_sessions (account_id, started_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS bio_eeg (
    account_id text NOT NULL,
    session_id text NOT NULL,
    idx integer NOT NULL,
    data bytea NOT NULL,
    PRIMARY KEY (account_id, session_id, idx)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS claude_keys (
    key text PRIMARY KEY,
    account_id text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
  )`;
  console.log('✓ Session tables ready');
}

const cleanId = (s: string) => String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

export async function putSession(acc: string, id: string, b: any) {
  id = cleanId(id); if (!id) throw { status: 400, msg: 'Bad session id.' };
  const row = {
    kind: String(b.kind || 'session').slice(0, 40), label: String(b.label || 'Session').slice(0, 160),
    started_at: new Date(Number(b.startedAt) || Date.now()), mins: Number(b.mins) || null,
    summary: b.summary || {}, report: b.report || {}, timeline: b.timeline || {}, rr: b.rr || {}, eeg_blocks: Number(b.eegBlocks) || 0,
  };
  if (sql) {
    await sql`INSERT INTO bio_sessions (account_id, id, kind, label, started_at, mins, summary, report, timeline, rr, eeg_blocks, updated_at)
      VALUES (${acc}, ${id}, ${row.kind}, ${row.label}, ${row.started_at}, ${row.mins}, ${sql.json(row.summary)}, ${sql.json(row.report)}, ${sql.json(row.timeline)}, ${sql.json(row.rr)}, ${row.eeg_blocks}, now())
      ON CONFLICT (account_id, id) DO UPDATE SET kind = EXCLUDED.kind, label = EXCLUDED.label, started_at = EXCLUDED.started_at, mins = EXCLUDED.mins,
        summary = EXCLUDED.summary, report = EXCLUDED.report, timeline = EXCLUDED.timeline, rr = EXCLUDED.rr,
        eeg_blocks = GREATEST(bio_sessions.eeg_blocks, EXCLUDED.eeg_blocks), updated_at = now()`;
  } else mem.sessions.set(k2(acc, id), { account_id: acc, id, ...row, updated_at: new Date() });
  return { ok: true, id };
}
export async function putEeg(acc: string, id: string, idx: number, data: Buffer) {
  id = cleanId(id); if (!id || !(idx >= 0) || !data?.length) throw { status: 400, msg: 'Bad EEG block.' };
  if (sql) {
    await sql`INSERT INTO bio_eeg (account_id, session_id, idx, data) VALUES (${acc}, ${id}, ${idx}, ${data})
      ON CONFLICT (account_id, session_id, idx) DO UPDATE SET data = EXCLUDED.data`;
    await sql`UPDATE bio_sessions SET eeg_blocks = GREATEST(eeg_blocks, ${idx + 1}) WHERE account_id = ${acc} AND id = ${id}`;
  } else { mem.eeg.set(k2(acc, id) + '|' + idx, data); const s = mem.sessions.get(k2(acc, id)); if (s) s.eeg_blocks = Math.max(s.eeg_blocks, idx + 1); }
  return { ok: true };
}
export async function listSessions(acc: string, kind?: string, limit = 200) {
  if (sql) {
    const r = kind
      ? await sql`SELECT id, kind, label, started_at, mins, summary, report, eeg_blocks FROM bio_sessions WHERE account_id = ${acc} AND kind = ${kind} ORDER BY started_at DESC LIMIT ${limit}`
      : await sql`SELECT id, kind, label, started_at, mins, summary, report, eeg_blocks FROM bio_sessions WHERE account_id = ${acc} ORDER BY started_at DESC LIMIT ${limit}`;
    return r;
  }
  return [...mem.sessions.values()].filter(s => s.account_id === acc && (!kind || s.kind === kind))
    .sort((a, b) => +b.started_at - +a.started_at).slice(0, limit).map(({ timeline, rr, ...s }) => s);
}
export async function getSession(acc: string, id: string) {
  id = cleanId(id);
  if (sql) { const r = await sql`SELECT * FROM bio_sessions WHERE account_id = ${acc} AND id = ${id} LIMIT 1`; return r[0] || null; }
  return mem.sessions.get(k2(acc, id)) || null;
}
export async function getEeg(acc: string, id: string, idx: number): Promise<Buffer | null> {
  id = cleanId(id);
  if (sql) { const r = await sql`SELECT data FROM bio_eeg WHERE account_id = ${acc} AND session_id = ${id} AND idx = ${idx}`; return r[0]?.data || null; }
  return mem.eeg.get(k2(acc, id) + '|' + idx) || null;
}
export async function claudeKey(acc: string, rotate = false): Promise<string> {
  if (sql) {
    const r = await sql`SELECT key FROM claude_keys WHERE account_id = ${acc}`;
    if (r[0] && !rotate) return r[0].key;
    const key = randomBytes(24).toString('base64url');
    await sql`INSERT INTO claude_keys (key, account_id) VALUES (${key}, ${acc}) ON CONFLICT (account_id) DO UPDATE SET key = EXCLUDED.key, created_at = now()`;
    return key;
  }
  for (const [k, a] of mem.keys) if (a === acc) { if (!rotate) return k; mem.keys.delete(k); }
  const key = randomBytes(24).toString('base64url'); mem.keys.set(key, acc); return key;
}
export async function accountForKey(key: string): Promise<string | null> {
  key = String(key || '').slice(0, 64);
  if (sql) { const r = await sql`SELECT account_id FROM claude_keys WHERE key = ${key}`; return r[0]?.account_id || null; }
  return mem.keys.get(key) || null;
}

/* ---------- plain-text views for Claude ---------- */
const fmtDate = (d: any) => new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const v = (x: any) => (x == null || x === '' ? '–' : String(x));
export function mdIndex(rows: any[], base: string) {
  const out = ['# Recorded sessions', '', `${rows.length} sessions, newest first. Each link is a full report.`, '',
    '| When | Activity | Minutes | Heart | Brain | Report |', '|---|---|---|---|---|---|'];
  for (const r of rows) {
    const s = r.report?.sensors || {};
    out.push(`| ${fmtDate(r.started_at)} | ${r.label} | ${v(r.report?.minsDone ?? r.mins)} | ${s.hr ? 'yes' : 'no'} | ${s.eeg ? 'yes' : 'no'} | ${base}/${r.id} |`);
  }
  return out.join('\n');
}
export function mdReport(r: any, base: string) {
  const R = r.report || {}, s = R.sensors || {}, out: string[] = [];
  out.push(`# ${r.label}`, '', `- Session id: ${r.id} (${r.kind})`, `- Started: ${fmtDate(r.started_at)}`, `- Length: ${v(R.minsDone)} of ${v(r.mins)} min`,
    `- Heart: ${s.hr ? s.hr + ', ' + v(s.beats) + ' beats' : 'no heart sensor'}`, `- Brain: ${s.eeg ? 'Muse, raw EEG ' + v(r.eeg_blocks) + ' min' : 'no headband'}`);
  if (R.extra) for (const [k, x] of Object.entries(R.extra)) if (x != null && x !== '') out.push(`- ${k}: ${x}`);
  if (R.stages?.length) {
    out.push('', '## By stage', '', '| Stage | Min | HR | HRV (RMSSD ms) | Coherence % | Alpha % | Theta % |', '|---|---|---|---|---|---|---|');
    for (const x of R.stages) out.push(`| ${x.name} | ${v(x.min)} | ${v(x.hr)} | ${v(x.rmssd)} | ${v(x.co)} | ${v(x.ra)} | ${v(x.rt)} |`);
  }
  const S = R.sync;
  if (S) {
    out.push('', '## Hemisphere sync', '', `- Seconds in left–right sync: ${S.any}`, `- By band (s): ${Object.entries(S.bands || {}).map(([b, n]) => b + ' ' + n).join(', ')}`,
      `- Seconds with octave links: ${S.oct}; with golden-ratio links: ${S.gold}`, `- Cascades: ${S.cascades} (${S.gammaCascades} reaching gamma)`);
    if (R.cascades?.length) {
      out.push('', '### Cascades', '', '| At (s) | Stage | Chain (Hz, link) | Lasted (s) | Gamma |', '|---|---|---|---|---|');
      for (const c of R.cascades) out.push(`| ${c.start} | ${c.stage} | ${c.f.map((f: number, i: number) => (i ? ` ${c.rel[i - 1]} ` : '') + f).join(' →')} | ${c.dur} | ${c.gamma ? 'yes' : ''} |`);
    }
    if (R.episodes?.length) {
      out.push('', '### Longest sync episodes', '', '| Hz | Band | At (s) | Stage | Lasted (s) | Peak coherence |', '|---|---|---|---|---|---|');
      for (const e of R.episodes) out.push(`| ${e.f} | ${e.band} | ${e.start} | ${e.stage} | ${e.dur} | ${e.cmax} |`);
    }
  }
  if (R.notes) out.push('', '## Notes / impressions', '', String(R.notes));
  out.push('', `Second-by-second data: ${base}/${r.id}/timeline.csv`, `Heartbeat intervals: ${base}/${r.id}/rr.csv`);
  return out.join('\n');
}
export function csvTimeline(r: any) {
  const T = r.timeline || {}, st: string[] = T.stages || [], n = (T.t || []).length;
  const cols = ['seconds', 'stage', 'heart_rate', 'hrv', 'coherence_pct', 'delta_log', 'theta_log', 'alpha_log', 'beta_log', 'gamma_log', 'alpha_rel_pct', 'theta_rel_pct', 'eeg_quality_mask', 'binaural_hz', 'hemisync_hz_coh'];
  const lines = [cols.join(',')];
  for (let i = 0; i < n; i++) {
    const hp = (T.hp?.[i] || []).map((p: number[]) => p[0] + ':' + p[1]).join(' ');
    lines.push([T.t[i], st[T.st?.[i]] ?? '', T.hr?.[i], T.hrv?.[i], T.co?.[i], T.de?.[i], T.th?.[i], T.al?.[i], T.be?.[i], T.ga?.[i], T.ra?.[i], T.rt?.[i], T.q?.[i], T.bh?.[i], hp].map(x => (x == null ? '' : x)).join(','));
  }
  return lines.join('\n');
}
export function csvRR(r: any) {
  const R = r.rr || {}, rr: number[] = R.rr || [], t: number[] = R.rrT || [];
  return ['seconds,rr_ms', ...rr.map((x, i) => t[i] + ',' + x)].join('\n');
}
