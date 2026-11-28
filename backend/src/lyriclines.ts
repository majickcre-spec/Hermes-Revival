/* Lyric Lab "Line ideas": asks Claude for a few original next lines that rhyme and fit the rhythm.
 * Needs ANTHROPIC_API_KEY in the server's environment. Signed-in players only, with a per-player hourly cap. */

const MODEL = process.env.LYRIC_MODEL || 'claude-sonnet-5-5';
const PER_HOUR = +(process.env.LYRIC_PER_HOUR || 40);
const used = new Map<string, number[]>();

export function lyricAiOn(): boolean { return !!process.env.ANTHROPIC_API_KEY; }

function allow(acc: string): boolean {
  const now = Date.now(), hr = 3600e3, list = (used.get(acc) || []).filter((t) => now - t < hr);
  if (list.length >= PER_HOUR) { used.set(acc, list); return false; }
  list.push(now); used.set(acc, list); return true;
}

const clip = (s: unknown, n: number) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);

export type LineReq = {
  title?: string; theme?: string; section?: string;
  lines?: string[]; li?: number;           // the section's lines and which one we're writing
  rhyme?: string;                          // end word to rhyme with ('' = free)
  syl?: number;                            // syllables to aim for
  stress?: string;                         // the line above, spoken: CAPITALS = strong syllables
  current?: string;                        // what's on the line now (may be empty)
  avoid?: string[];                        // ideas already shown
};

export async function lyricLines(acc: string, b: LineReq): Promise<{ lines: string[] }> {
  if (!lyricAiOn()) throw { status: 503, msg: "Line ideas aren't turned on yet." };
  if (!allow(acc)) throw { status: 429, msg: 'That’s a lot of ideas for one hour — try again a bit later.' };
  const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 16).map((x) => clip(x, 140));
  const li = Math.max(0, Math.min(lines.length, Math.floor(+(b.li ?? lines.length) || 0)));
  const syl = Math.max(3, Math.min(16, Math.round(+(b.syl ?? 8) || 8)));
  const rhyme = clip(b.rhyme, 30).replace(/[^A-Za-z']/g, '');
  const sheet = lines.map((t, i) => `${i + 1}. ${i === li ? '>>> (write this line)' + (t.trim() ? ` [draft: ${t}]` : '') : (t || '(empty)')}`).join('\n') || `1. >>> (write this line)`;
  const avoid = (Array.isArray(b.avoid) ? b.avoid : []).slice(0, 12).map((x) => clip(x, 140));
  const prompt = [
    `You are a hit songwriter helping a singer-songwriter finish a line. Song: "${clip(b.title, 60) || 'untitled'}"${b.theme ? `, about: ${clip(b.theme, 60)}` : ''}. Section: ${clip(b.section, 20) || 'Verse'}.`,
    `Lyrics so far:\n${sheet}`,
    `Write 6 different options for line ${li + 1}. Rules:`,
    `- About ${syl} syllables each (${Math.max(2, syl - 1)}–${syl + 1}).`,
    rhyme ? `- End on a word that rhymes with "${rhyme}" (perfect rhyme preferred, a close slant rhyme is ok). Don't end on "${rhyme}" itself.` : `- No rhyme needed; end on a strong, singable word.`,
    b.stress ? `- Match the stress of the line above (CAPITALS are stressed): ${clip(b.stress, 160)}. Stressed syllables in the same places so it sings to the same melody.` : '',
    `- Say it the way people talk. Concrete images over clichés. Continue the story and feeling of the lines above; keep the same point of view.`,
    `- Original words only — never borrow lines from existing songs.`,
    `- Mix it up: some plain and direct, some with an image, one that turns the idea.`,
    avoid.length ? `- Don't repeat these: ${avoid.map((x) => `"${x}"`).join('; ')}` : '',
    `Reply with JSON only: {"lines":["...","..."]}`,
  ].filter(Boolean).join('\n');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': String(process.env.ANTHROPIC_API_KEY), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(25000),
  }).catch(() => null);
  if (!r || !r.ok) { if (r) console.error('lyric-lines', r.status, (await r.text().catch(() => '')).slice(0, 300)); throw { status: 502, msg: 'Couldn’t get ideas right now — try again.' }; }
  const j: any = await r.json().catch(() => ({}));
  const txt = String((j.content || []).map((c: any) => c.text || '').join(''));
  let out: string[] = [];
  try { const m = txt.match(/\{[\s\S]*\}/); out = m ? JSON.parse(m[0]).lines : []; } catch { out = []; }
  if (!Array.isArray(out) || !out.length) out = txt.split('\n').map((x) => x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').replace(/^"|"$/g, '').trim()).filter((x) => x && x.length < 140 && !/[{}]/.test(x));
  const seen = new Set<string>();
  out = out.map((x) => clip(x, 140).trim()).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, 8);
  if (!out.length) throw { status: 502, msg: 'Couldn’t get ideas right now — try again.' };
  return { lines: out };
}
