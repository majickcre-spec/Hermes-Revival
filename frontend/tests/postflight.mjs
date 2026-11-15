// POST-FLIGHT: run after Railway deploys. Confirms the live site serves THIS build and that it boots and opens key screens.
// usage: node tests/postflight.mjs [https://frontend-production-19da.up.railway.app]
import { execSync } from "node:child_process";
import { browser, profilePage, suite, assert } from "./lib.mjs";
const live = (process.argv[2] || "https://frontend-production-19da.up.railway.app").replace(/\/+$/, "");
const head = execSync("git rev-parse --short HEAD").toString().trim();
const S = suite("Post-flight " + live);
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
let pg;
await S.test("live site loads", async () => {
  try { pg = await profilePage(ctx, live, {}, "Travis", "?pf=" + Date.now()); }
  catch (e) { if (/TUNNEL|ERR_NAME|ERR_CONNECTION|403/.test(e.message)) { console.log("\n  Can't reach " + live + " from this machine (network blocked). Run post-flight from a computer with normal internet: cd frontend && npm run postflight\n"); await b.close(); process.exit(2); } throw e; }
});
await S.test("live build matches pushed commit " + head, async () => {
  const build = await pg.evaluate(() => window.__MJK_BUILD__ || null);
  assert(build && head.startsWith(build.slice(0, 7)), "live is serving build " + build + " (expected " + head + ") — deploy not finished or cached");
});
for (const [n, c] of [["Lyric Lab", "renderIdeaLab()"], ["Brainwave Journeys", "renderJourney()"], ["Play the Neck", "renderFretboard('guitar')"]]) {
  await S.test(n + " opens on live", async () => { const before = pg.__errors.length; await pg.evaluate((x) => (0, eval)(x), c); await pg.waitForTimeout(400); assert(pg.__errors.length === before, pg.__errors.slice(before).join(" | ")); });
}
await b.close();
process.exit(S.done() ? 0 : 1);
