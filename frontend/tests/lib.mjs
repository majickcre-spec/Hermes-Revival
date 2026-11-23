// Shared test harness for MMU: static server over public/, headless Chromium, profile seeding.
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mp3": "audio/mpeg", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".wav": "audio/wav" };

export async function loadPlaywright() {
  for (const p of ["playwright", "/opt/npm-tools/node_modules/playwright/index.mjs"]) {
    try { return await import(p); } catch (e) { /* try next */ }
  }
  throw new Error("Playwright not found. Install it: npm i -D playwright && npx playwright install chromium");
}

export function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || "/").split("?")[0]);
      if (p === "/") p = "/app.html";
      const f = join(PUBLIC, p);
      if (!f.startsWith(PUBLIC) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(readFileSync(f));
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, url: "http://127.0.0.1:" + srv.address().port }));
  });
}

export async function browser() {
  const { chromium } = await loadPlaywright();
  return chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
}

// A page with one profile ("Travis") already chosen, and optional seeded localStorage.
export async function profilePage(ctx, base, seed = {}, name = "Travis", query = "") {
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e.message || e)));
  await pg.addInitScript(([seed, name]) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    if (!localStorage.getItem("majick-profiles")) {
      localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name }]));
      localStorage.setItem("majick-active", JSON.stringify("t1"));
    }
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }, [seed, name]);
  await pg.goto(base + "/app.html" + query);
  await pg.waitForTimeout(400);
  const card = await pg.$(".pcard:not(.add)");
  if (card) { await card.click(); await pg.waitForTimeout(300); }
  pg.__errors = errors;
  return pg;
}

export function song(id, title, lines, extra = {}) {
  return Object.assign({ id, title, topic: "", bpm: 92, key: { root: 4, minor: false }, prog: {}, setup: true, at: Date.now(),
    sections: [{ id: id + "v", tag: "Verse", same: null, lines: lines.map((t) => ({ t })) }], mel: {}, sung: {}, rhymeAll: "free", rhyme: {} }, extra);
}
export const SWKEY = "music-t1-set:mjk-sw";

// Tiny test runner. SHARD="i/n" runs every n-th test (pre-flight runs shards side by side).
// A test that fails is tried once more, so a slow moment on a busy machine isn't reported as a bug; a real bug fails both times.
const SHARD = (process.env.SHARD || "").split("/").map(Number);
let _idx = 0;
// QUICK=1 (the every-push pre-flight): every screen + every saved-data check. Long feature walkthroughs run in the full check.
const SLOW_RX = /^REAL TAPS|mastery kept after reload|^Lucid night recording|^Jam:/;   // long walkthroughs: full check only
const DATA_RX = /song|save|backup|restore|sync|delet|upload|surviv|reload|lost|wipe|overwr|erase|kept|data|account|device|never|recover|missing/i;
export function suite(name, opt = {}) {
  const results = [];
  return {
    async test(label, fn) {
      if (process.env.ONLY && !label.includes(process.env.ONLY)) return;   // ONLY="part of a name" runs just that test
      if (process.env.QUICK && !opt.always && (SLOW_RX.test(label) || !DATA_RX.test(label))) return;
      const my = _idx++;
      if (SHARD.length === 2 && SHARD[1] > 1 && my % SHARD[1] !== SHARD[0]) return;
      const t0 = Date.now();
      let err = null;
      for (let a = 0; a < 2; a++) {
        try { await fn(); err = null; break; } catch (e) { err = e; }
      }
      const ms = Date.now() - t0;
      if (!err) { results.push({ label, ok: true, ms }); console.log("  ✓ " + label + "  (" + (ms / 1000).toFixed(1) + "s)"); }
      else { results.push({ label, ok: false, err: err.message }); console.log("  ✗ " + label + "\n      " + err.message); }
    },
    done() {
      const bad = results.filter((r) => !r.ok);
      console.log(name + ": " + (results.length - bad.length) + "/" + results.length + " passed");
      return bad.length === 0;
    },
  };
}
export function assert(c, msg) { if (!c) throw new Error(msg); }
