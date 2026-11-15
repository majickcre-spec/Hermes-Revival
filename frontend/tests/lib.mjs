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
export async function profilePage(ctx, base, seed = {}, name = "Travis") {
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
  await pg.goto(base + "/app.html");
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

// Tiny test runner
export function suite(name) {
  const results = [];
  return {
    async test(label, fn) {
      const t0 = Date.now();
      try { await fn(); results.push({ label, ok: true, ms: Date.now() - t0 }); console.log("  ✓ " + label); }
      catch (e) { results.push({ label, ok: false, err: e.message }); console.log("  ✗ " + label + "\n      " + e.message); }
    },
    done() {
      const bad = results.filter((r) => !r.ok);
      console.log(name + ": " + (results.length - bad.length) + "/" + results.length + " passed");
      return bad.length === 0;
    },
  };
}
export function assert(c, msg) { if (!c) throw new Error(msg); }
