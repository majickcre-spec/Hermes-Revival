// SMOKE: the app boots and every main screen opens without a JavaScript error.
import { serve, browser, profilePage, suite, assert } from "./lib.mjs";

const SCREENS = [
  ["Meditation menu", "renderMeditation()"], ["Brainwave Journeys", "renderJourney()"],
  ["Guided Meditation Studio", "renderGuidedStudio()"], ["Heart Sync", "renderHeartSync()"], ["Breathwork", "renderBreathwork()"],
  ["My Frequencies", "renderMyFreq()"], ["Session Reports", "renderSensSessions()"], ["Insights", "renderInsights()"],
  ["Lyric Lab", "renderIdeaLab()"], ["Songwriting", "renderSongwriting()"], ["Metronome Flow", "renderRhythm(false)"],
  ["Guitar menu", "renderStrings('guitar')"], ["Play the Neck", "renderFretboard('guitar')"], ["Chords", "renderFretboard('guitar','chord')"],
  ["Strum Patterns", "renderStrumTrainer('guitar')"], ["Piano", "renderPiano()"], ["Ear: notes", "renderNoteEar()"], ["Ear: chords", "renderChordEar()"],
  ["Nature", "renderNature()"], ["Lucid", "renderLucid()"], ["Perception", "renderPerception()"],
];

export async function run() {
  const { srv, url } = await serve();
  const b = await browser();
  const S = suite("Smoke");
  for (const vp of [{ width: 390, height: 844, tag: "portrait" }, { width: 844, height: 390, tag: "landscape" }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true });
    const pg = await profilePage(ctx, url);
    await S.test("boots to Home with a profile (" + vp.tag + ")", async () => {
      const ok = await pg.evaluate(() => { const h = document.getElementById("home"); return !!h && !h.hidden && h.textContent.trim().length > 40; });
      assert(ok, "app did not boot"); assert(!pg.__errors.length, pg.__errors.join(" | "));
    });
    for (const [name, call] of SCREENS) {
      await S.test(name + " opens (" + vp.tag + ")", async () => {
        const before = pg.__errors.length;
        const exists = await pg.evaluate((c) => { const fn = c.split("(")[0]; if (typeof window[fn] !== "function") return false; try { (0, eval)(c); } catch (e) { setTimeout(() => { throw e; }); } return true; }, call);
        assert(exists, "screen function missing: " + call);
        await pg.waitForTimeout(250);
        const txt = await pg.evaluate(() => (document.getElementById("view") || {}).textContent || "");
        assert(txt.trim().length > 20, "screen rendered empty");
        const errs = pg.__errors.slice(before); assert(!errs.length, errs.join(" | "));
      });
      try { await pg.evaluate(() => { try { if (typeof medStop === "function") medStop(); if (typeof rStop === "function") rStop(); } catch (e) {} }); } catch (e) {}
    }
    await ctx.close();
  }
  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
