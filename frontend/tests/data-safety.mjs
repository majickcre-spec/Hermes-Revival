// REGRESSION: the user's work must never be lost. Every scenario here is a way songs have been or could be wiped.
import { serve, browser, profilePage, song, SWKEY, suite, assert } from "./lib.mjs";

export async function run() {
  const { srv, url } = await serve();
  const b = await browser();
  const S = suite("Data safety (Lyric Lab)");
  const fresh = () => b.newContext();
  const open = async (pg) => { await pg.evaluate(() => { renderIdeaLab(); }); await pg.waitForTimeout(250); };
  const disk = (pg) => pg.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), SWKEY);
  const titles = (d) => ((d && d.songs) || []).filter((s) => s.title || (s.sections || []).some((x) => (x.lines || []).some((l) => l.t))).map((s) => s.title).sort();

  await S.test("a saved song survives a reload", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone"])], cur: "a1" } });
    await open(pg); await pg.evaluate(() => { swSong().sections[0].lines.push({ t: "Does anybody hear" }); swSave(); });
    await pg.reload(); await pg.waitForTimeout(300); const c = await pg.$(".pcard:not(.add)"); if (c) await c.click();
    const d = await disk(pg); assert(titles(d).includes("I'm Alone"), "song missing after reload");
    assert(d.songs.find((s) => s.id === "a1").sections[0].lines.length === 2, "new line not saved"); await ctx.close();
  });

  await S.test("two windows open: an older window saving does NOT wipe a song saved in the other", async () => {
    const ctx = await fresh(); const seed = { [SWKEY]: { v: 2, songs: [song("a1", "Old Song", ["line one"])], cur: "a1" } };
    const A = await profilePage(ctx, url, seed); await open(A);                       // window A caches the list
    const B = await ctx.newPage(); await B.goto(url + "/app.html"); await B.waitForTimeout(300); const c = await B.$(".pcard:not(.add)"); if (c) await c.click();
    await open(B); await B.evaluate(() => { const D = swData(); D.songs.unshift({ ...swSong(), id: "b2", title: "I'm Alone", sections: [{ id: "x", tag: "Verse", lines: [{ t: "When I'm alone" }] }] }); D.cur = "b2"; swSave(); });
    await A.evaluate(() => { swSong().sections[0].lines.push({ t: "edit in the stale window" }); swSave(); });  // stale save
    const d = await disk(A); assert(titles(d).includes("I'm Alone"), "stale window wiped the other window's song: " + JSON.stringify(titles(d)));
    assert(titles(d).includes("Old Song"), "stale window's own song lost"); await ctx.close();
  });

  await S.test("never writes a blank list over real songs", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone"])], cur: "a1" } });
    await open(pg); await pg.evaluate(() => { const D = swData(); D.songs = [swNewSong("")]; D.cur = D.songs[0].id; swSave(); });
    assert(titles(await disk(pg)).includes("I'm Alone"), "blank list overwrote real songs"); await ctx.close();
  });

  await S.test("opens with songs from anywhere on the device instead of starting blank", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { "music-OLDID-set:mjk-sw": { v: 2, songs: [song("o1", "I'm Alone", ["When I'm alone"])], cur: "o1" } });
    await open(pg); const t = await pg.evaluate(() => swData().songs.filter(swReal).map((s) => s.title));
    assert(t.includes("I'm Alone"), "orphaned songs not recovered: " + JSON.stringify(t)); await ctx.close();
  });

  await S.test("deleting a song on purpose stays deleted (not resurrected by the merge)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Keep", ["k"]), song("d1", "Delete me", ["d"])], cur: "d1" } });
    await open(pg); await pg.evaluate(() => { const D = swData(); SW.deleted = { d1: 1 }; D.songs = D.songs.filter((s) => s.id !== "d1"); D.cur = "a1"; swSave(); });
    const t = titles(await disk(pg)); assert(!t.includes("Delete me") && t.includes("Keep"), "delete not respected: " + JSON.stringify(t)); await ctx.close();
  });

  await S.test("songs that vanish between visits are flagged with a restore banner", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Keep", ["k"]), song("m1", "I'm Alone", ["When I'm alone"])], cur: "a1" } });
    await open(pg); await pg.evaluate(() => swSave());
    await pg.evaluate((k) => { const d = JSON.parse(localStorage.getItem(k)); d.songs = d.songs.filter((s) => s.id !== "m1"); localStorage.setItem(k, JSON.stringify(d)); }, SWKEY); // outside wipe
    await pg.reload(); await pg.waitForTimeout(300); const c = await pg.$(".pcard:not(.add)"); if (c) await c.click(); await open(pg); await pg.waitForTimeout(150);
    const banner = await pg.evaluate(() => (document.getElementById("swGuardB") || {}).textContent || "");
    assert(/missing/i.test(banner), "no missing-song warning shown"); await ctx.close();
  });

  await S.test("every save writes a backup, and Find my songs can restore from it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone"])], cur: "a1" } });
    await open(pg); await pg.evaluate(() => swSave()); await pg.waitForTimeout(3000);
    const n = await pg.evaluate(async () => ((await idbGet("swbak")) || []).length); assert(n >= 1, "no backup in IndexedDB");
    await pg.evaluate((k) => localStorage.removeItem(k), SWKEY);
    const found = await pg.evaluate(async () => (await swScanAll()).map((f) => f.song.title)); assert(found.includes("I'm Alone"), "Find my songs did not see the backup"); await ctx.close();
  });

  await S.test("Find my songs sees songs saved in other formats, and text search finds a line", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { "majick-p-t1-lyrics:draft": { title: "I'm Alone", sections: [{ tag: "Verse 1", text: "When I'm alone\nDoes anybody hear" }] } });
    await open(pg); const found = await pg.evaluate(async () => (await swScanAll()).map((f) => f.song.title));
    assert(found.includes("I'm Alone"), "old-format song not found: " + JSON.stringify(found));
    const hits = await pg.evaluate(() => swTextHits("anybody hear").length); assert(hits >= 1, "text search missed the line"); await ctx.close();
  });

  await S.test("the app never throws while opening Lyric Lab", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); await open(pg);
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
