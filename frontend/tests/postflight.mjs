// POST-FLIGHT: run after Railway deploys. Confirms the live site serves THIS build and that it boots and opens key screens.
// usage: node tests/postflight.mjs [https://frontend-production-19da.up.railway.app]
import { execSync } from "node:child_process";
import { browser, profilePage, suite, assert } from "./lib.mjs";
const live = (process.argv[2] || "https://frontend-production-19da.up.railway.app").replace(/\/+$/, "");
const head = execSync("git rev-parse --short HEAD").toString().trim();
const S = suite("Post-flight " + live);
setTimeout(() => { console.log("\n✗ post-flight ran past 4 min — stopped"); process.exit(1); }, 4 * 60000).unref();   // hard limit
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
let pg;
await S.test("live site loads", async () => {
  try { pg = await profilePage(ctx, live, {}, "Travis", "?pf=" + Date.now()); }
  catch (e) { if (/TUNNEL|ERR_NAME|ERR_CONNECTION|403/.test(e.message)) { console.log("\n  Can't reach " + live + " from this machine (network blocked). Run post-flight from a computer with normal internet: cd frontend && npm run postflight\n"); await b.close(); process.exit(2); } throw e; }
});
await S.test("live build matches pushed commit " + head, async () => {
  // waits for Railway to finish deploying (checks every 15 s, up to 3 min)
  let build = null;
  for (let t = 0; t < 12; t++) {
    build = await pg.evaluate(() => window.__MJK_BUILD__ || null).catch(() => null);
    if (build && head.startsWith(build.slice(0, 7))) return;
    await new Promise((r) => setTimeout(r, 15000));
    await pg.goto(live + "/app.html?pf=" + Date.now()).catch(() => {}); await pg.waitForTimeout(400);
    const card = await pg.$(".pcard:not(.add)"); if (card) await card.click().catch(() => {});
  }
  assert(false, "live is serving build " + build + " (expected " + head + ") after 3 min — deploy not finished or cached");
});
for (const [n, c] of [["Lyric Lab", "renderIdeaLab()"], ["Brainwave Journeys", "renderJourney()"], ["Play the Neck", "renderFretboard('guitar')"]]) {
  await S.test(n + " opens on live", async () => { const before = pg.__errors.length; await pg.evaluate((x) => (0, eval)(x), c); await pg.waitForTimeout(400); assert(pg.__errors.length === before, pg.__errors.slice(before).join(" | ")); });
}
await b.close();
process.exit(S.done() ? 0 : 1);
