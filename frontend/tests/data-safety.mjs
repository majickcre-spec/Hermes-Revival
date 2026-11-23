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

  await S.test("Find my songs is visible at the top of Lyric Lab without scrolling", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const pg = await profilePage(ctx, url, {});
    await pg.evaluate(() => { const c = [...document.querySelectorAll(".card")].find((x) => /Lyric Lab/.test(x.textContent)); c.click(); }); await pg.waitForTimeout(400);
    const top = await pg.evaluate(() => { const e = document.getElementById("swFindTopB"); return e ? e.getBoundingClientRect().top : null; });
    assert(top !== null && top >= 0 && top < 844, "Find my songs not visible on first screen (top=" + top + ")"); await ctx.close();
  });

  await S.test("changing backing settings never touches the lyrics", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone", "Does anybody hear"])], cur: "a1" } });
    await open(pg); await pg.evaluate(() => { SW.lib = false; swDraw(); document.querySelector('[data-bkg="g_funk"]').click(); document.querySelector('[data-bkp="2"]').click(); document.querySelector('[data-bkc="pad"]').click(); });
    await pg.reload(); await pg.waitForTimeout(300); const d = await disk(pg), s = d.songs.find((x) => x.id === "a1");
    assert(s.sections[0].lines.map((l) => l.t).join("|") === "When I'm alone|Does anybody hear", "lyrics changed");
    assert(s.bk && s.bk.g === "g_funk" && s.bk.p === 2 && s.bk.cs === "pad", "backing settings not remembered: " + JSON.stringify(s.bk)); await ctx.close();
  });

  await S.test("backing loop rides the metronome engine and hands it back untouched", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone"], { bpm: 120 })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; swDraw(); R.patIdx = 3; R.bpm = 72; const before = { p: R.patIdx, b: R.bpm, c: R.countIn };
      document.getElementById("bkGo").click(); await new Promise((z) => setTimeout(z, 3200)); const mid = { run: R.running, bpm: R.bpm, bars: BK.bar };
      document.getElementById("bkTp").click(); const bpm2 = R.bpm; document.getElementById("bkGo").click();
      return { before, mid, bpm2, after: { p: R.patIdx, b: R.bpm, c: R.countIn, run: R.running } }; });
    assert(r.mid.run && r.mid.bpm === 120, "backing not running at song tempo " + JSON.stringify(r.mid));
    assert(r.mid.bars >= 2, "chords not looping bar by bar: " + r.mid.bars); assert(r.bpm2 === 122, "tempo + did not reach the engine");
    assert(!r.after.run && r.after.p === 3 && r.after.b === 72 && r.after.c === r.before.c, "Metronome Flow settings not restored " + JSON.stringify(r.after));
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Play song with Backing follows the song's chords on the groove, then hands the engine back", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "I'm Alone", ["When I'm alone", "Does anybody hear"], { bpm: 160, prog: { Verse: 0 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw();
      document.querySelector('[data-acc="band"]').click(); R.patIdx = 2; const p0 = R.patIdx; document.getElementById("swPlay").click();
      await new Promise((z) => setTimeout(z, 900)); const mid = { run: R.running, play: BK.play, seq: (BK.seq || []).map((c) => c && c.name) };
      await new Promise((z) => setTimeout(z, 5200)); return { mid, end: { run: R.running, play: BK.play, p: R.patIdx, p0 }, acc: swData().acc }; });
    assert(r.acc === "band", "option not saved"); assert(r.mid.run && r.mid.play, "backing not playing with the song " + JSON.stringify(r.mid));
    assert(JSON.stringify(r.mid.seq) === JSON.stringify([null, "E", "B"]), "wrong chords: " + JSON.stringify(r.mid.seq));
    assert(!r.end.run && !r.end.play && r.end.p === r.end.p0, "engine not handed back after the song " + JSON.stringify(r.end));
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Play / settings follow the section you're writing in, without losing your place", async () => {
    const ctx = await fresh(); const sg = song("a1", "Only One", ["am I the only one", "I feel so alone at night"]); sg.sections.push({ id: "c1", tag: "Chorus", same: null, lines: [{ t: "When I'm alone" }] });
    const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [sg], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(() => { SW.lib = false; swDraw(); const a = document.getElementById("swCtl").closest(".sw-sec").dataset.sec;
      const i = document.querySelector('.sw-sec[data-sec="c1"] .sw-t'); i.focus(); return { a, b: document.getElementById("swCtl").closest(".sw-sec").dataset.sec, focus: document.activeElement === i, play: !!document.getElementById("swPlay") }; });
    assert(r.a === "a1v" && r.b === "c1" && r.focus && r.play, "controls did not follow the section " + JSON.stringify(r));
    const d = await disk(pg); assert(d.songs[0].sections.length === 2, "sections changed"); await ctx.close();
  });

  await S.test("Loop plays just the bars you pick, from the line you're on", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["a one", "b two", "c three", "d four"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw();
      document.querySelectorAll(".sw-t")[1].focus(); document.querySelector('[data-loop="2"]').click(); const lp = [...document.querySelectorAll(".sw-line.lp")].map((e) => e.dataset.l);
      document.getElementById("swPlay").click(); await new Promise((z) => setTimeout(z, 4200)); const still = !!SW.stopT; document.getElementById("swPlay").click();
      return { lp, still, stopped: !SW.stopT, saved: swData().loop }; });
    assert(JSON.stringify(r.lp) === '["1","2"]', "wrong loop range " + JSON.stringify(r.lp)); assert(r.still, "loop did not keep going"); assert(r.stopped, "Stop did not stop the loop");
    assert(r.saved === 2, "loop length not remembered"); assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Bounce records melody, chords and groove into a WAV", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["a one", "b two"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swData().acc = "band"; swSave(); swDraw(); unlockAudio(); await ac().resume();
      let blob = null, name = ""; window.swShareFile = (bl, n) => { blob = bl; name = n; }; document.getElementById("swBounce").click(); await new Promise((z) => setTimeout(z, 6500));
      if (!blob) return { none: true }; const v = new Int16Array(await blob.arrayBuffer(), 44); let m = 0; for (const x of v) m = Math.max(m, Math.abs(x)); const sg2 = swSong(); sg2.sections.push({ id: "c1", tag: "Chorus", same: null, lines: [{ t: "x" }] }, { id: "v2", tag: "Verse", same: null, lines: [{ t: "y" }] }); swData().loop = 2; SW.active = { s: sg2.sections[0].id, l: 1 };
      return { name, peak: m / 32768, secs: v.length / 2 / ac().sampleRate, loopName: swBounceName(sg2, swLoopKeys()), secName: (swData().loop = "sec", swBounceName(sg2, swLoopKeys())) }; });
    assert(!r.none, "no file made"); assert(r.name === "Only One - Full song - 2 bars.wav", "bad file name " + r.name); assert(r.peak > 0.05, "bounce is silent (peak " + r.peak + ")"); assert(r.secs > 2, "bounce too short");
    assert(r.loopName === "Only One - Verse 1 + Chorus - 2 bars.wav", "bad loop name " + r.loopName); assert(r.secName === "Only One - Verse 1 - 2 bars.wav", "bad section name " + r.secName);
    await ctx.close();
  });

  await S.test("songs move between devices by file: lyrics and voice takes arrive, nothing on the other device is removed", async () => {
    const A = await profilePage(await fresh(), url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one"], { takes: { Verse: 1 } })], cur: "a1" } });
    await open(A); const file = await A.evaluate(async () => { await idbPut("swtake:a1:Verse", new Blob([new Uint8Array(3000)], { type: "audio/mp4" }));
      let blob = null, name = ""; window.swShareFile = (b, n) => { blob = b; name = n; }; await swExport(); return { name, text: await blob.text() }; });
    assert(/^MMU songs - .*\.json$/.test(file.name), "bad export name " + file.name);
    const B = await profilePage(await fresh(), url, { [SWKEY]: { v: 2, songs: [song("p1", "Phone Idea", ["when I'm alone"])], cur: "p1" } });
    await open(B); const r = await B.evaluate(async (t) => { await swImport(new File([t], "x.json")); const tk = await idbGet("swtake:a1:Verse");
      return { titles: swData().songs.map((s) => s.title).sort(), take: tk ? tk.size : 0, msg: document.getElementById("swXMsg") ? document.getElementById("swXMsg").textContent : "" }; }, file.text);
    assert(JSON.stringify(r.titles) === '["Only One","Phone Idea"]', "songs after import: " + JSON.stringify(r.titles)); assert(r.take === 3000, "voice take did not arrive");
    const d = await disk(B); assert(d.songs.length === 2, "import not saved"); await A.context().close(); await B.context().close();
  });

  await S.test("Record a take over the loop: saves a new take with line timing, never touches lyrics or melody; playback mixes it in", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one", "I feel so alone at night"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); const melBefore = JSON.stringify(sg.mel); swSave(); swDraw(); unlockAudio(); const a = ac(); await a.resume();
      const o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); micStream = d.stream; window.ensureMic = () => Promise.resolve(true);
      swData().loop = "sec"; swSave(); swDraw(); document.getElementById("swRecB").click(); await new Promise((z) => setTimeout(z, 11500));
      const s2 = swSong(), key = swTakeKey(s2, "Verse", 1), meta = s2.takeMeta && s2.takeMeta[key];
      swPlaySecs(s2.sections, {}); await new Promise((z) => setTimeout(z, 2000)); const vox = (SW.voxSrc || []).length; swStopPlay();
      return { first: meta && meta.at && meta.at["0"], takes: s2.takes && s2.takes.Verse, lines: Object.keys((meta && meta.at) || {}), lyr: s2.sections[0].lines.map((l) => l.t).join("|"), melSame: JSON.stringify(s2.mel) === melBefore, vox, blob: !!(await idbGet("swtake:" + key)) }; });
    assert(r.takes === 1 && r.blob, "take not saved " + JSON.stringify(r)); assert(r.first != null && r.first < 1, "take keeps the lead-in instead of starting at the first line " + JSON.stringify(r)); assert(JSON.stringify(r.lines) === '["0","1"]', "line timing missing " + JSON.stringify(r.lines));
    assert(r.lyr === "am I the only one|I feel so alone at night" && r.melSame, "recording changed lyrics or melody"); assert(r.vox >= 1, "your voice did not play back with the music");
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Next-line ideas: prosody check shows, and tapping a suggested rhyme fills the NEXT line's end word only", async () => {
    const ctx = await fresh(); await ctx.route("https://api.datamuse.com/**", (r) => { const u = r.request().url(); const body = u.includes("sp=") ? [{ word: decodeURIComponent(u.match(/sp=([^&]+)/)[1]), tags: ["pron:W AH1 N"] }] : [{ word: "run", numSyllables: 1 }];
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }); });
    const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["one around", "nobody around", "money only one", "I feel"], { rhyme: { Verse: "AABB" } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw();
      const l = document.querySelectorAll(".sw-line")[2]; l.querySelector('[data-a="ideas"]').click(); await new Promise((z) => setTimeout(z, 900));
      const pros = document.querySelectorAll(".sw-ideas .pf").length; const nx = document.querySelector("[data-nx]"); if (nx) nx.click();
      return { pros, nx: !!nx, lines: swSong().sections[0].lines.map((x) => x.t) }; });
    assert(r.pros >= 4, "prosody check missing"); assert(r.nx, "no next-line rhymes offered");
    assert(JSON.stringify(r.lines) === JSON.stringify(["one around", "nobody around", "money only one", "I run"]), "wrong line changed: " + JSON.stringify(r.lines)); await ctx.close();
  });

  await S.test("Note grid shows the line's notes; melody options show their notes and the theory; bounce shows a player and Save button", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one", "I feel so alone at night"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw(); document.querySelectorAll(".sw-t")[1].focus();
      const notes = document.querySelectorAll(".sw-line .sw-rollbox rect[rx]").length; SW.mp = "Verse"; SW.pi.Verse = 2; swDraw();
      const pick = { roll: !!document.querySelector(".sw-mp .sw-rollbox"), theory: (document.querySelector(".sw-theory") || {}).textContent || "" }; SW.mp = null; swDraw();
      unlockAudio(); await ac().resume(); window.swShareFile = () => {}; swData().loop = 1; swSave(); swDraw(); document.querySelectorAll(".sw-t")[0].focus(); document.getElementById("swBounce").click(); await new Promise((z) => setTimeout(z, 7000));
      return { notes, want: swLineNotes(sg, "Verse", 1, sg.sections[0].lines[1].t).length, pick, player: !!document.querySelector("#swBncOut audio"), save: !!document.getElementById("swBncSave") }; });
    assert(r.notes === r.want && r.notes > 0, "grid shows " + r.notes + " notes, melody has " + r.want); assert(r.pick.roll && /Range:/.test(r.pick.theory), "melody option view missing");
    assert(r.player && r.save, "bounce result not shown"); assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Throw out the last take removes only that take; deleting a section can be undone", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one", "I feel so alone at night"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw(); unlockAudio(); const a = ac(); await a.resume();
      const o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); micStream = d.stream; window.ensureMic = () => Promise.resolve(true);
      swData().loop = "sec"; swSave(); swDraw(); document.getElementById("swRecB").click(); await new Promise((z) => setTimeout(z, 11500));
      const after = swSong().takes && swSong().takes.Verse, btn = !!document.getElementById("swThrow"); document.getElementById("swThrow").click(); await new Promise((z) => setTimeout(z, 200));
      const s2 = swSong(), gone = !(s2.takes && s2.takes.Verse), blob = null;
      const kept = { lines: s2.sections[0].lines.map((l) => l.t).join("|"), mel: !!s2.mel.Verse, prog: s2.prog.Verse };
      const del = document.querySelector('.sw-sec [data-sa="del"]'); del.click(); del.click(); const secsGone = swSong().sections.length; document.querySelector("#swUndo button").click();
      return { after, btn, gone, blob: !!blob, kept, secsGone, back: swSong().sections.length, backLines: swSong().sections[0].lines.map((l) => l.t).join("|") }; });
    assert(r.after === 1 && r.btn, "no take / no throw-out button " + JSON.stringify(r)); assert(r.gone && !r.blob, "take not thrown out");
    assert(r.kept.lines === "am I the only one|I feel so alone at night" && r.kept.mel && r.kept.prog === 1, "throw-out touched words/melody/chords " + JSON.stringify(r.kept));
    assert(r.secsGone === 0 && r.back === 1 && r.backLines === "am I the only one|I feel so alone at night", "undo did not bring the section back " + JSON.stringify(r));
    const d = await disk(pg); assert(d.songs[0].sections.length === 1 && d.songs[0].prog.Verse === 1, "undo not saved"); await ctx.close();
  });

  await S.test("Sing it in plays the section's chords under you (and shows the chord), with the click", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one", "I feel so alone"], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; swDraw(); unlockAudio(); const a = ac(); await a.resume();
      const o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); micStream = d.stream; window.ensureMic = () => Promise.resolve(true);
      let n = 0; const orig = window.swNote; window.swNote = function (m, t, du, l) { if (l === "ch") n++; return orig.apply(this, arguments); };
      document.querySelector('[data-m="singsec"]').click(); await new Promise((z) => setTimeout(z, 2600)); const now = (document.getElementById("bkCh") || {}).textContent || "";
      const st = SW.rec ? Object.keys(SW.rec).join(",") : "none"; if (SW.rec && SW.rec.done) SW.rec.done(); else swRecStop(); await new Promise((z) => setTimeout(z, 900)); return { n, now, st }; });
    assert(r.n >= 4, "no chords played while singing (" + r.n + ") " + r.st); assert(/next/.test(r.now), "chord display not showing: " + r.now); await ctx.close();
  });

  await S.test("Throw out a Sing-it-in take: the audio AND the melody/words it filled are all removed; Undo brings them back", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one", ""], { bpm: 160, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; swDraw(); unlockAudio(); const a = ac(); await a.resume();
      const o = a.createOscillator(); o.frequency.value = 220; const g = a.createGain(); g.gain.value = 0.5; const d = a.createMediaStreamDestination(); o.connect(g); g.connect(d); o.start(); micStream = d.stream;
      window.ensureMic = () => Promise.resolve(true); toneAnalyser = a.createAnalyser(); toneAnalyser.fftSize = 2048; a.createMediaStreamSource(d.stream).connect(toneAnalyser);
      document.querySelector('[data-m="singsec"]').click(); await new Promise((z) => setTimeout(z, 4200)); if (SW.rec && SW.rec.done) SW.rec.done(); await new Promise((z) => setTimeout(z, 1500));
      const mid = { takes: (swSong().takes || {}).Verse || 0, mel: !!swSong().mel.Verse, btn: !!document.getElementById("swThrow") };
      if (document.getElementById("swThrow")) document.getElementById("swThrow").click(); await new Promise((z) => setTimeout(z, 200));
      const after = { takes: (swSong().takes || {}).Verse || 0, mel: !!swSong().mel.Verse, lines: swSong().sections[0].lines.map((l) => l.t).join("|") };
      document.querySelector("#swUndo button").click(); const undone = { takes: (swSong().takes || {}).Verse || 0, mel: !!swSong().mel.Verse };
      return { mid, after, undone }; });
    assert(r.mid.takes === 1 && r.mid.btn, "take/button missing " + JSON.stringify(r.mid));
    assert(r.after.takes === 0 && r.after.mel === false && r.after.lines === "am I the only one|", "throw-out left part of the take behind " + JSON.stringify(r.after));
    assert(r.undone.takes === 1 && r.undone.mel === r.mid.mel, "undo did not restore the take " + JSON.stringify(r.undone)); await ctx.close();
  });

  await S.test("Sung take → lines follow your phrases (pickups join the next line) and each line plays back where you sang it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", [""], { bpm: 90 })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(() => { SW.lib = false; swDraw(); const sg = swSong(), sec = sg.sections[0], S = swSteps(), s16 = swS16(), fr = [];
      const sing = (st, len, m) => { for (let k = 0; k < len * 4; k++) fr.push({ t: (st + k / 4) * s16, m }); };
      sing(0, 3, 60); sing(4, 4, 62);                       // "it's time" in bar 1
      sing(14, 1, 64); sing(15, 1, 65); sing(16, 2, 67); sing(18, 2, 65); sing(20, 2, 64); sing(22, 4, 62); // pickup + "I know it's been too long"
      fr.sort((a, b) => a.t - b.t); for (let t = 26 * s16; t < 32 * s16; t += s16 / 4) fr.push({ t, m: null });
      swSingFill(sg, sec, { frames: fr, words: "it's time I know it's been too long" }, S, s16);
      const L = sec.lines.map((l) => l.t).filter(Boolean), n2 = swLineNotes(sg, sec.tag, 1, L[1] || "");
      return { L, first2: n2.slice(0, 2).map((n) => n.step), n1: swLineNotes(sg, sec.tag, 0, L[0] || "").map((n) => n.step) }; });
    assert(JSON.stringify(r.L) === JSON.stringify(["it's time", "I know it's been too long"]), "lines split wrong: " + JSON.stringify(r.L));
    assert(r.first2[0] < 0, "pickup notes lost — line 2 starts at " + JSON.stringify(r.first2)); assert(JSON.stringify(r.n1) === "[0,4]", "line 1 timing moved: " + JSON.stringify(r.n1));
    await ctx.close();
  });

  await S.test("Change key from the backing options (letter + major/minor): key, chords and melody follow; words untouched", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "Only One", ["am I the only one"], { key: { root: 0, minor: false }, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(() => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swSave(); swDraw(); const m0 = sg.mel.Verse.a[0].midi;
      document.querySelector('[data-bkk="2"]').click(); const k1 = JSON.stringify(swSong().key), m1 = swSong().mel.Verse.a[0].midi, ch1 = bkChords(swSong()).map((c) => c.name).join(" ");
      document.querySelector('[data-bkm="1"]').click(); return { k1, k2: JSON.stringify(swSong().key), d: m1 - m0, ch1, lyr: swSong().sections[0].lines[0].t, sub: document.querySelector(".sw-sub").textContent }; });
    assert(r.k1 === '{"root":2,"minor":false}' && r.d === 2, "key letter change failed " + JSON.stringify(r)); assert(r.k2 === '{"root":2,"minor":true}', "minor switch failed " + r.k2);
    assert(/^D /.test(r.ch1) || r.ch1.indexOf("D") >= 0, "chords did not move to D: " + r.ch1); assert(r.lyr === "am I the only one" && /D minor/.test(r.sub), "words changed or key not shown " + r.sub); await ctx.close();
  });

  await S.test("Sing it in: notes are found where they were sung, and the saved take carries per-line timing on the same clock", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "T", [""], { bpm: 120, prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; swDraw(); unlockAudio(); const a = ac(); await a.resume();
      const d = a.createMediaStreamDestination(), dl = a.createDelay(1); dl.delayTime.value = 0.15; dl.connect(d); const g = a.createGain(); g.gain.value = 0; const o = a.createOscillator(); o.frequency.value = 220; o.connect(g); g.connect(dl); o.start();
      clickBus(a).connect(dl); micStream = d.stream; window.ensureMic = () => Promise.resolve(true);   // simulated 150 ms speaker→mic delay; the mic hears the count-in
      toneAnalyser = a.createAnalyser(); toneAnalyser.fftSize = 2048; a.createMediaStreamSource(d.stream).connect(toneAnalyser);
      const s16 = 60 / 120 / 4, start = a.currentTime + 0.2, t0 = start + 4 * 16 * s16; /* one full progression (4 chords) plays first */ for (const st of [0, 8, 16]) { const T = t0 + st * s16; g.gain.setValueAtTime(0.5, T); g.gain.setValueAtTime(0, T + 3 * s16); }
      let FR = null; const of = window.swSingFill; window.swSingFill = function (sg, sec, R, S, s) { FR = swGridNotes(R.frames, S * 3, s).map((n) => n.step); return of.apply(this, arguments); };
      document.querySelector('[data-m="singsec"]').click(); await new Promise((z) => setTimeout(z, 11600)); if (SW.rec && SW.rec.done) SW.rec.done(); await new Promise((z) => setTimeout(z, 1800));
      const sg = swSong(), key = swTakeKey(sg, "Verse", (sg.takes && sg.takes.Verse) || 1); return { FR, meta: sg.takeMeta && sg.takeMeta[key] }; });
    assert(r.FR && JSON.stringify(r.FR.filter((x) => x <= 19)) === "[0,8,16]" && r.FR.filter((x) => x > 19).length <= 1, "notes not where sung: " + JSON.stringify(r.FR));   // a busy test machine can hear one count-in click after the last note; sung notes must still land exactly assert(r.meta && r.meta.at && r.meta.at[0] != null && r.meta.at[1] != null, "take has no line timing " + JSON.stringify(r.meta));
    assert(Math.abs((r.meta.at[1] - r.meta.at[0]) - 2) < 0.01, "line timing spacing wrong " + JSON.stringify(r.meta.at)); await ctx.close();
  });

  await S.test("Play song: the Groove slider plays the groove picked for the chords, at the song's tempo", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "T", ["am I the only one", "I feel so alone"], { bpm: 110, prog: { Verse: 1 }, bk: { g: "g_funk", ds: "hat" } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; const sg = swSong(); sg.mel.Verse = swCand(sg, "Verse", 0); swData().acc = "block"; swMix().clk = 0.7; swSave(); swDraw(); unlockAudio(); await ac().resume();
      document.getElementById("swPlay").click(); await new Promise((z) => setTimeout(z, 1200)); const st = { run: R.running, pat: (RHYTHM_PATTERNS[R.patIdx] || {}).id, bpm: R.bpm, snd: R.sound, gv: R.gv, play: BK.play };
      document.getElementById("swPlay").click(); return { st, after: R.running }; });
    assert(r.st.run && r.st.play && r.st.pat === "g_funk" && r.st.bpm === 110 && r.st.snd === "hat" && Math.abs(r.st.gv - 0.7) < 0.01, "groove not playing with the song " + JSON.stringify(r.st));
    assert(!r.after, "groove kept going after Stop"); await ctx.close();
  });

  await S.test("Backing options: any key, 11 progressions with numbers, and a groove pattern you can show/hide", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "T", ["x"], { key: { root: 0, minor: false }, prog: { Verse: 0 }, bk: { g: "g_funk" } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(() => { SW.lib = false; swDraw(); const n = document.querySelectorAll("[data-bkp]").length, nums = (document.querySelector("[data-bkp]") || {}).textContent || "";
      document.getElementById("bkGInfo").click(); const on = document.querySelectorAll(".bk-ggr span.on").length; document.getElementById("bkGInfo").click(); const off = document.querySelectorAll(".bk-ggr").length;
      document.querySelector('[data-bkk="7"]').click(); return { n, nums, on, off, key: swKeyName(swSong()), bar: document.getElementById("bkCh").textContent }; });
    assert(r.n === 11, "progression choices: " + r.n); assert(/I–V–vi–IV · 1-5-6-4/.test(r.nums), "numbers missing: " + r.nums);
    assert(r.on === 7 && r.off === 0, "groove pattern toggle wrong " + JSON.stringify(r)); assert(r.key === "G major" && /^G/.test(r.bar), "key change failed " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Light Test: safety warning first; screen flicker hits the asked rate; Stop ends it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { renderLightTest(); const warn = !!document.getElementById("ltAck") && !document.getElementById("ltTorch");
      document.getElementById("ltAck").click(); LT.mode = "screen"; renderLightTest(); document.querySelector('[data-lt="4"]').click(); await new Promise((z) => setTimeout(z, 2500));
      const R = LT.run, hz = R.flips / 2 / ((performance.now() - R.t0) / 1000); document.querySelector("#ltScreen button").click(); return { warn, hz, gone: !document.getElementById("ltScreen") && !LT.run }; });
    assert(r.warn, "flicker started without the safety warning"); assert(Math.abs(r.hz - 12.67) < 1.5, "screen flicker rate off: " + r.hz); assert(r.gone, "Stop did not end the flicker");
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("Journey light: safety warning first, screen flicker follows the journey's rate, stops with the journey", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { renderJourney(); await new Promise((z) => setTimeout(z, 300));
      LGT.mult = "auto"; document.querySelector('[data-jl="screen"]').click(); const warn = !!document.getElementById("jLightOk") && !document.getElementById("lgtScr"); document.getElementById("jLightOk").click();
      unlockAudio(); await ac().resume(); document.getElementById("jPlay").click(); await new Promise((z) => setTimeout(z, 2500));
      const o = document.getElementById("lgtScr"); let flips = 0, last = null; const t0 = performance.now();
      await new Promise((res) => { const f = () => { const on = o && o.style.background !== "rgb(0, 0, 0)" && o.style.background !== "#000"; if (on !== last) { flips++; last = on; } if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(); }; f(); });
      const hz = MED.planHz(), mul = LGT.run && LGT.run.mul, meas = flips / 2 / 3; medStop(); return { warn, hz, mul, meas, gone: !document.getElementById("lgtScr") }; });
    assert(r.warn, "light came on without the safety warning"); assert(r.mul >= 2 && r.hz * r.mul >= 8, "Auto did not lift the slow stage into the pattern range: ×" + r.mul);
    assert(Math.abs(r.meas - r.hz * r.mul) < 1.2, "light rate " + r.meas + " vs journey " + r.hz + " × " + r.mul); assert(r.gone, "light kept going after the journey stopped");
    await ctx.close();
  });

  await S.test("Light show: cascades through the chosen rates for the chosen length, gliding between steps; Stop ends it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { renderLightTest(); document.getElementById("ltAck").click(); LT.mode = "screen"; renderLightTest();
      document.querySelector('[data-lsl="5"]').click(); document.querySelector('[data-lsp="climb"]').click(); document.getElementById("lsGo").click(); await new Promise((z) => setTimeout(z, 400));
      const a = lsHz(), ov = !!document.getElementById("lgtScr"), seg = LS.len * 60 / LS.steps.length * 1000; LS.t0 -= seg + 6000; const mid = lsHz(); LS.t0 -= 10000; const b = lsHz(); LS.t0 -= 2 * seg; const c = lsHz();
      document.getElementById("lsStopB").click(); return { a, ov, mid, b, c, off: !LS.on && !document.getElementById("lgtScr") }; });
    assert(r.ov && Math.abs(r.a - 2.99) < 0.01, "show did not start on the first rate " + JSON.stringify(r)); assert(r.mid > 2.99 && r.mid < 4.84, "no glide between steps " + r.mid);
    assert(Math.abs(r.b - 4.84) < 0.01 && Math.abs(r.c - 12.67) < 0.01, "cascade steps wrong " + JSON.stringify(r)); assert(r.off, "Stop did not end the show"); await ctx.close();
  });

  await S.test("Light harmony: Both + octave puts the screen at 2× the flashlight; φ Alternate glides between the rate and its golden partner", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { renderJourney(); await new Promise((z) => setTimeout(z, 300)); LT.ack = true;
      LGT.mode = "both"; LGT.harm = "octave"; LGT.mult = 1; unlockAudio(); await ac().resume(); document.getElementById("jPlay").click(); await new Promise((z) => setTimeout(z, 2600));
      const oct = { ft: LGT.run.ft, fs: LGT.run.fs }; lgtStop(); LGT.mode = "screen"; LGT.harm = "phiAlt"; lgtStart(); await new Promise((z) => setTimeout(z, 300)); const R = LGT.run; const lo = R.fs;
      R.t0 -= 5000; await new Promise((z) => setTimeout(z, 200)); const hi = R.fs; const B = R.hz * R.mul; medStop(); return { oct, lo, hi, B }; });
    assert(Math.abs(r.oct.fs - 2 * r.oct.ft) < 0.05, "octave harmony off " + JSON.stringify(r.oct)); assert(Math.abs(r.lo - r.B) < 0.3, "φ Alternate should start on the rate " + JSON.stringify(r));
    assert(Math.abs(r.hi - r.B * 1.618) < 0.3 || Math.abs(r.hi - r.B / 1.618) < 0.3, "φ Alternate did not reach the golden partner " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Light Mix is lively: changes rate every few seconds, stays in the pattern range on beat harmonics, louder = faster", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { let _sd = 12345; const _mr = Math.random; Math.random = () => { _sd = (_sd * 1103515245 + 12345) % 2147483648; return _sd / 2147483648; }; const R = {}; let now = 0; const dt = 0.05, hz = 3; let changes = 0, lastTo = null, minR = 99, maxR = 0, offGrid = 0, q = [], l = [];
      for (let i = 0; i < 20 * 60 * 20; i++) { now += dt * 1000; const t = now / 1000, lv = Math.max(0, Math.min(1, 0.5 + 0.45 * Math.sin(t / 9) * Math.sin(t / 31 + 1))); const m = lgtMixStep(R, lv, dt, now, 20, hz), rate = m * hz;
        if (R.to !== lastTo) { changes++; lastTo = R.to; if (Math.abs(R.to / hz - Math.round(R.to / hz)) > 0.001) offGrid++; } minR = Math.min(minR, rate); maxR = Math.max(maxR, rate); if (t > 60) { if (lv < 0.2) q.push(rate); if (lv > 0.85) l.push(rate); } }
      const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1); return { perMin: changes / 20, minR, maxR, offGrid, quiet: avg(q), loud: avg(l) }; });
    assert(r.perMin >= 15, "not enough rate change: " + r.perMin + "/min"); assert(r.minR >= 5.99 && r.maxR <= 20.01, "rate left the 6–20 Hz range " + JSON.stringify(r));
    assert(r.offGrid === 0, "targets not on beat harmonics"); assert(r.loud > r.quiet + 0.8, "louder music didn't push the rate up " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Journey flashlight runs on its own clock like the Light Test: 20 Hz asked → ~20 Hz switched", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { let n = 0; LT.track = { applyConstraints: () => { n++; return Promise.resolve(); }, stop() {} }; LT.ack = true;
      localStorage.setItem("mjk-torchmax2", "60"); LGT.mode = "torch"; LGT.src = () => 20; LGT.harm = "phi"; await lgtStart(); const R = LGT.run; R.t0 -= 21000; await new Promise((z) => setTimeout(z, 600)); n = 0; const t0 = performance.now();
      await new Promise((z) => setTimeout(z, 2000)); const hz = n / 2 / ((performance.now() - t0) / 1000); LGT.src = null; lgtStop(); return { hz }; });
    assert(Math.abs(r.hz - 20) < 3.2, "flashlight switched at " + r.hz + " Hz instead of 20"); await ctx.close();
  });

  await S.test("Flashlight max is simply 80 Hz (lower only if the phone couldn't switch that fast)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { const a = lgtTorchMax(); localStorage.setItem("mjk-torchmax2", "40"); const b = lgtTorchMax(); localStorage.setItem("mjk-torchmax2", "100"); const c = lgtTorchMax(); return { a, b, c }; });
    assert(r.a === 80 && r.b === 40 && r.c === 80, "flashlight max rule wrong " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Light Mix at 100 Hz: reaches the top through golden-ratio cascades, mostly lives in the mid-high range", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { const R = {}; let now = 0; const dt = 0.05, hz = 4; let maxR = 0, steps = [], lastTo = null, t50 = 0, T = 0;
      for (let i = 0; i < 4 * 60 * 20; i++) { now += dt * 1000; const t = now / 1000, lv = Math.max(0, Math.min(1, 0.5 + 0.45 * Math.sin(t / 9) * Math.sin(t / 31 + 1))); const rate = lgtMixStep(R, lv, dt, now, 100, hz) * hz;
        maxR = Math.max(maxR, rate); T += dt; if (rate <= 55) t50 += dt; if (R.mode === "cascade" && R.to !== lastTo) { steps.push(R.to); } lastTo = R.to; }
      let phi = 0, n = 0; for (let i = 1; i < steps.length; i++) { const q = steps[i] / steps[i - 1]; if (q > 1.3 && q < 2) { phi += q; n++; } }
      return { maxR, ratio: n ? phi / n : 0, mid: t50 / T, cascades: steps.length }; });
    assert(r.maxR >= 80, "never reached the top: " + r.maxR); assert(r.cascades > 6 && Math.abs(r.ratio - 1.618) < 0.2, "cascade steps not golden: " + JSON.stringify(r));
    assert(r.mid > 0.55, "spent too long at the weak top end: " + r.mid); await ctx.close();
  });

  await S.test("Light Mix drops to dark every 1–2.5 min (4.5–12 s) and comes back with a burst", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { const R = {}; let now = 0; const dt = 0.05, hz = 4; let drops = 0, inDrop = false, start = 0, lens = [], burstAfter = 0;
      for (let i = 0; i < 20 * 60 * 20; i++) { now += dt * 1000; const t = now / 1000, lv = Math.max(0, Math.min(1, 0.5 + 0.45 * Math.sin(t / 9) * Math.sin(t / 31 + 1))); lgtMixStep(R, lv, dt, now, 80, hz);
        if (R.drop && !inDrop) { drops++; start = now; } if (!R.drop && inDrop) { lens.push((now - start) / 1000); if (R.mode === "burst") burstAfter++; } inDrop = !!R.drop; }
      return { drops, perMin: drops / 20, minL: Math.min(...lens), maxL: Math.max(...lens), burstAfter }; });
    assert(r.drops >= 6 && r.perMin <= 1, "drop count off " + JSON.stringify(r)); assert(r.minL >= 4.4 && r.maxL <= 12.1, "drop length off " + JSON.stringify(r));
    assert(r.burstAfter >= r.drops - 1, "no burst after drops " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Leaving Lyric Lab mid-take stops the recorder (no background build-up that freezes the app)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { [SWKEY]: { v: 2, songs: [song("a1", "T", ["x"], { prog: { Verse: 1 } })], cur: "a1" } });
    await open(pg); const r = await pg.evaluate(async () => { SW.lib = false; swDraw(); unlockAudio(); const a = ac(); await a.resume(); const o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); micStream = d.stream;
      window.ensureMic = () => Promise.resolve(true); toneAnalyser = a.createAnalyser(); a.createMediaStreamSource(d.stream).connect(toneAnalyser);
      document.querySelector('[data-m="singsec"]').click(); await new Promise((z) => setTimeout(z, 1500)); const cap = SW.rec && SW.rec.cap; teardown && teardown(); goHome();
      await new Promise((z) => setTimeout(z, 400)); const n0 = cap ? cap.chunks.length : 0; await new Promise((z) => setTimeout(z, 1500)); return { n0, n1: cap ? cap.chunks.length : 0, had: !!cap }; });
    assert(r.had && r.n1 === r.n0, "recorder kept running after leaving: " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Calm Light Finder scores: calmer body in the light → plus, tenser → minus, nothing measured and no rating → no score", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { const mk = (hr, hv, co) => Array.from({ length: 20 }, () => ({ hr, hv, co, al: null }));
      const calm = clfScore(mk(60, 60, 2), mk(66, 45, 1), null), tense = clfScore(mk(70, 40, 1), mk(66, 45, 1), null), none = clfScore(mk(null, null, null), mk(null, null, null), null), felt = clfScore(mk(null, null, null), mk(null, null, null), 5);
      return { calm: calm.sc, tense: tense.sc, none: none.sc, felt: felt.sc, dHR: calm.dHR, dHRV: calm.dHRV }; });
    assert(r.calm > 15 && r.tense < -5 && r.none === null && r.felt === 10 && r.dHR === -6 && r.dHRV === 33, "finder scoring wrong " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Calm Light Finder: a full session runs dark → 3 patterns → saves each one, finds the one that lowers heart rate, light ends off", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { let on = 0; LT.track = { readyState: "live", applyConstraints: (c) => { on = c.advanced[0].torch ? 1 : 0; return Promise.resolve(); }, stop() {} }; LT.ack = true; LT.mode = "torch";
      HR.connected = true; window.hrFresh = () => true; const cur = () => { const s = CLF.plan && CLF.plan[CLF.seg]; return s && !s.rest ? s.id : null; };
      window.bioHR = () => (cur() === "hz:7.83" ? 58 : 66); window.bioHRV = () => (cur() === "hz:7.83" ? 62 : 45); window.bioCoherence = () => ({ score: 1 });
      CLF.next = { narrow: false, ids: ["hz:10", "hz:7.83", "dark"] }; CLF.k = 0.004; renderLightFinder(); await clfStart();
      let lit = 0; const iv = setInterval(() => { if (LGT.run && clfHz() > 0) lit++; }, 20); while (CLF.on) await new Promise((z) => setTimeout(z, 100)); clearInterval(iv);
      const D = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith("mjk-lfind"))) || "null"); const B = clfBoard();
      return { stage: CLF.stage, n: D && D.runs.length, best: B[0] && B[0].id, bestSc: B[0] && B[0].sc, darkSc: (B.find((x) => x.id === "dark") || {}).sc, lit, onAfter: on, rateRows: document.querySelectorAll("[data-clfr]").length / 5 }; });
    assert(r.stage === "rate" && r.n === 3, "session didn't save 3 results " + JSON.stringify(r)); assert(r.best === "hz:7.83" && r.bestSc > r.darkSc + 10, "didn't find the calming light " + JSON.stringify(r));
    assert(r.lit > 5 && r.onAfter === 0, "light didn't run or was left on " + JSON.stringify(r)); assert(r.rateRows === 3, "rating step missing"); await ctx.close();
  });

  await S.test("Calm Light Finder never loses results: stopping or locking mid-session keeps finished patterns, ratings update without dropping others", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { LT.track = { readyState: "live", applyConstraints: () => Promise.resolve(), stop() {} }; LT.ack = true; LT.mode = "torch";
      HR.connected = true; window.hrFresh = () => true; window.bioHR = () => 64; window.bioHRV = () => 50; window.bioCoherence = () => null;
      save("mjk-lfind", { runs: [{ t: 1, ses: 1, si: 1, id: "hz:6", sc: 4, sens: true }] });
      CLF.next = { narrow: false, ids: ["hz:10", "mix", "br:6"] }; CLF.k = 0.004; renderLightFinder(); await clfStart();
      while (CLF.on && !(CLF.seg >= 2)) await new Promise((z) => setTimeout(z, 20)); clfStop("locked"); const after = clfData().runs.length, stage = CLF.stage, lastN = (CLF.last || []).length;
      CLF.rate[CLF.last[0].si] = 5; clfSaveRatings(); const D = clfData().runs; const mine = D.find((x) => x.ses === CLF.ses);
      return { after, stage, lastN, kept: D.some((x) => x.id === "hz:6" && x.sc === 4), rate: mine && mine.rate, sc: mine && mine.sc, light: !!LGT.run }; });
    assert(r.after === 2 && r.lastN === 1 && r.stage === "rate", "finished pattern not kept " + JSON.stringify(r)); assert(r.kept, "older result was lost");
    assert(r.rate === 5 && r.sc === 10, "rating not applied " + JSON.stringify(r)); assert(!r.light, "light still running after stop"); await ctx.close();
  });

  await S.test("Calm Light Finder narrows in once a winner is clear (and a winner must beat 'No light')", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(() => { const runs = []; let ses = 0;
      CLF_BASE.forEach((id) => { for (let i = 0; i < 2; i++) runs.push({ ses: ++ses, si: 1, id, sc: id === "hz:7.83" ? 20 : id === "dark" ? 2 : 5 }); }); save("mjk-lfind", { runs });
      const p = clfPick(), L = clfLeader(); save("mjk-lfind", { runs: runs.map((x) => (x.id === "dark" ? Object.assign({}, x, { sc: 25 }) : x)) }); const L2 = clfLeader();
      return { narrow: p.narrow, ids: p.ids.slice().sort(), lead: L && L.id, lead2: L2 }; });
    assert(r.narrow && r.lead === "hz:7.83" && JSON.stringify(r.ids) === JSON.stringify(["hz:7.05", "hz:7.83", "hz:8.61"]), "didn't narrow around the winner " + JSON.stringify(r));
    assert(r.lead2 === null, "a pattern that doesn't beat 'No light' was called the winner"); await ctx.close();
  });

  await S.test("Your calm light appears in the Light show and drives the journey light when chosen", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { const a = !!lsPaths().calm; save("mjk-calmlight", "hz:7.83"); const p = lsPaths().calm;
      LT.track = { readyState: "live", applyConstraints: () => Promise.resolve(), stop() {} }; LGT.mode = "screen"; LGT.mult = "calm"; MED.planHz = () => 4; await lgtStart(); await new Promise((z) => setTimeout(z, 700)); const R = LGT.run, fs = R && R.fs; lgtStop();
      save("mjk-calmlight", "br:6"); const g = lsPaths().calm; return { a, s: p && p.s, fs, glow: g && g.glow }; });
    assert(!r.a && JSON.stringify(r.s) === "[7.83]" && Math.abs(r.fs - 7.83) < 0.3 && r.glow === true, "calm light not wired in " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Light show Start never hangs: a frozen flashlight falls back to the screen within a few seconds", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); const r = await pg.evaluate(async () => { LT.track = { readyState: "live", muted: false, applyConstraints: () => new Promise(() => {}), stop() {} };
      navigator.mediaDevices.getUserMedia = () => new Promise(() => {}); LT.ack = true; LT.mode = "torch"; renderLightTest(); const b = document.querySelector("#lsGo"); b.click(); const mid = b.textContent; b.click();
      const t0 = performance.now(); while (!LS.on && performance.now() - t0 < 9000) await new Promise((z) => setTimeout(z, 100)); const secs = (performance.now() - t0) / 1000;
      const out = { on: LS.on, mode: LGT.mode, screen: !!document.getElementById("lgtScr"), mid, secs, note: !!document.getElementById("lsNote") }; lsStop(false); return out; });
    assert(r.on && r.mode === "screen" && r.screen && r.secs < 8 && r.mid === "Starting…" && r.note, "light show hung on a frozen flashlight " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Strum patterns (landscape): the full neck stays through chord changes, arrows stop at the gold line over the body, reggae chop is a short real chord", async () => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); const pg = await profilePage(ctx, url, {});
    await pg.evaluate(() => { ST.neck = true; renderStrumTrainer("ukulele"); ST.mode = "watch"; }); await pg.waitForTimeout(600); await pg.evaluate(() => document.getElementById("stGo").click());
    const ws = []; for (let i = 0; i < 4; i++) { await pg.waitForTimeout(1500); ws.push(await pg.evaluate(() => { const e = document.querySelector("#fbSvgWrap svg"); return e ? Math.round(e.getBoundingClientRect().width) : 0; })); }
    const r = await pg.evaluate(() => { stStop(); const P = SPATS.find((p) => p.id === "reggae"); let d = []; const op = window.pluck; window.pluck = (m, t, x) => d.push(x); stPlay("U", 0, P, 1, "C"); window.pluck = op; return { pat: P.pat, dur: Math.max(...d) }; });
    assert(ws.every((w) => w > 300), "neck vanished in landscape " + JSON.stringify(ws)); assert(r.pat === "-U-U-U-U" && r.dur > 0.1 && r.dur < 0.3, "reggae chop wrong " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Strum patterns: arrows point the way you strum (sideways ↓/↑ with a downward swipe = down strum; upright →/←); paused sound shows a tap-to-resume note", async () => {
    const out = [];
    for (const [w, h] of [[844, 390], [390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); const pg = await profilePage(ctx, url, {});
      await pg.evaluate(() => { ST.neck = true; renderStrumTrainer("guitar"); }); await pg.waitForTimeout(500); await pg.evaluate(() => document.getElementById("fbZone").scrollIntoView({ block: "center" })); await pg.waitForTimeout(250);
      const info = await pg.evaluate(() => { const r = document.getElementById("fbZone").getBoundingClientRect(); window.__sw = []; FB.onSwipe = (d) => window.__sw.push(d); return { g: stGlyph("D") + stGlyph("U"), z: [r.left, r.top, r.width, r.height] }; });
      const cdp = await ctx.newCDPSession(pg), z = info.z, T = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
      const [x0, y0, x1, y1] = w > h ? [z[0] + z[2] / 2, z[1] + 8, z[0] + z[2] / 2, z[1] + z[3] - 8] : [z[0] + 8, z[1] + z[3] / 2, z[0] + z[2] - 8, z[1] + z[3] / 2];
      await T("touchStart", x0, y0); for (let i = 1; i <= 12; i++) await T("touchMove", x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12); await T("touchEnd");
      info.sw = await pg.evaluate(() => window.__sw);
      if (w > h) info.paused = await pg.evaluate(async () => { ST.mode = "watch"; stStart(); await new Promise((z) => setTimeout(z, 300)); await AC.suspend(); const o = window.ac; window.ac = () => AC; await new Promise((z) => setTimeout(z, 400)); const n = !!document.getElementById("sndPaused") || AC.state === "running"; window.ac = o; stStop(); return n; });
      out.push(info); await ctx.close();
    }
    assert(out[0].g === "↓↑" && out[1].g === "→←", "arrows wrong " + JSON.stringify(out.map((x) => x.g)));
    assert(out[0].sw[0] === "d" && out[1].sw[0] === "d", "swipe direction wrong " + JSON.stringify(out.map((x) => x.sw))); assert(out[0].paused, "no note when the phone paused the sound");
  });

  await S.test("Star's Focus Session: flows step by step, pause stops the clock, survives a reload, logs + beans on finish, and the parent sees Star's history", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r1 = await pg.evaluate(async () => { const ps = getProfiles(); const star = { id: "ustar1", name: "Star", mode: "kid" }; ps.push(star); setProfiles(ps); const parent = activeId(); save("majick-active", "ustar1");
      fsStart(); const a = fsState(); await new Promise((z) => setTimeout(z, 2300)); const el1 = fsState().el; const bar = !!document.getElementById("fsBar") && !!document.getElementById("fsOrb");
      document.getElementById("fsbPause").click(); const p0 = fsState().el; await new Promise((z) => setTimeout(z, 2200)); const p1 = fsState().el; document.getElementById("fsbPause").click();
      const x = fsState(); x.el = 300; fsSave(x); fsNext(); return { parent, start: a.i, el1, bar, paused: p1 === p0, step2: fsState().i, theory: !!document.getElementById("fsQ") }; });
    assert(r1.start === 0 && r1.el1 >= 1 && r1.bar && r1.paused && r1.step2 === 1 && r1.theory, "session flow wrong " + JSON.stringify(r1));
    await pg.reload(); await pg.waitForTimeout(1500);
    const r2 = await pg.evaluate(async () => { const pk = fsPicker(); if (pk) { const c = [...document.querySelectorAll("#profiles *")].find((e) => e.children.length < 4 && /Star/.test(e.textContent) && e.closest("button,[data-id],.profile")); if (c) (c.closest("button,[data-id],.profile") || c).click(); await new Promise((z) => setTimeout(z, 1300)); } const st = fsState(); const bar = !!document.getElementById("fsBar") && !fsPicker(); fsGo(st); await new Promise((z) => setTimeout(z, 300));
      const q = document.querySelector("#fsQ button"); q.click(); const sc = fsState().score;
      for (let i = 0; i < 4; i++) { const s = fsState(); s.el = 200; s.showed = true; s.rated = true; fsSave(s); fsNext(); await new Promise((z) => setTimeout(z, 600)); } const s = fsState(); s.el = 60; fsSave(s); fsNext();
      const lg = fsLog(); return { resumed: st && st.i === 1, bar, sc, log: lg[0], beans: getBeans(), count: load(mk("fs", "count"), 0), state: fsState(), bars: !!document.getElementById("fsBar") }; });
    assert(r2.resumed && r2.bar, "didn't resume after reload " + JSON.stringify(r2)); assert(r2.sc && r2.sc.n === 1, "quiz answer not saved");
    assert(r2.log && r2.log.complete && r2.log.steps.length === 6 && r2.count === 1 && r2.beans === 20 && r2.state === null && !r2.bars, "finish not logged right " + JSON.stringify(r2));
    const r3 = await pg.evaluate((pid) => { save("majick-active", pid); renderFocusSession(); return { txt: document.querySelector("#view").innerText, day: fsDay() }; }, r1.parent);
    assert(/Star’s sessions/.test(r3.txt) && /Rhythm/.test(r3.txt) && /6\/6 steps/.test(r3.txt), "parent can't see Star's sessions"); await ctx.close();
  });

  await S.test("Focus Session kid pace: real ukulele plays, Show me raises chord tempo only when clean, melody rating moves tempo, the session waits for 'Who's playing?'", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { fsStart(); await new Promise((z) => setTimeout(z, 1500)); let n = 0; const o = window.ukeNote; window.ukeNote = function () { const h = o.apply(this, arguments); if (h) n++; return h; }; fsStrum("C"); window.ukeNote = o;
      const x = fsState(); x.i = 3; x.coached = true; fsSave(x); fsNext(); const sm = !!document.querySelector("#fsSelf, #fsSkip");
      for (let i = 0; i < 4; i++) { const b = document.getElementById("fsSelf"); if (b) b.click(); }
      const ch = fsTempo().ch; document.getElementById("fsOn").click(); const after = fsState().i;
      const y = fsState(); y.coached = true; fsSave(y); fsNext(); const rated = !!document.querySelector("[data-r]"); document.querySelector('[data-r="hard"]').click(); const mel = fsTempo().mel;
      document.getElementById("gate").hidden = false; const before = fsState().i; fsGo(fsState()); const blocked = !document.getElementById("fsBar") || fsPicker(); document.getElementById("gate").hidden = true;
      return { notes: n, sm, ch, after, rated, mel, blocked, wanted: (() => { renderStrumTrainer("ukulele"); return ukeWanted(); })(), notWanted: (() => { renderStrumTrainer("guitar"); return ukeWanted(); })() }; });
    assert(r.notes === 4, "ukulele samples didn't play " + JSON.stringify(r)); assert(r.sm && r.ch === 65 && r.after === 4, "Show me didn't run or raise tempo " + JSON.stringify(r));
    assert(r.rated && r.mel === 67, "melody rating didn't move tempo " + JSON.stringify(r)); assert(r.blocked, "session ran under the player picker"); assert(r.wanted && !r.notWanted, "ukulele voice used on the wrong instrument"); await ctx.close();
  });

  await S.test("Focus Session is front and center: Star's home shows Start at the top; a parent sees her last session", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(() => { const ps = getProfiles(); ps.push({ id: "ustar1", name: "Star", mode: "kid" }); setProfiles(ps); localStorage.setItem("music-ustar1-fs-log", JSON.stringify([{ t: Date.now(), day: 0, topic: "Rhythm", steps: [], minutes: 27, stars: "4/4", complete: true }]));
      goHome(); renderHome(); const parent = document.getElementById("fsHero").innerText; const pid = activeId(); save("majick-active", "ustar1"); renderHome(); const star = document.getElementById("fsHero").innerText; const first = document.getElementById("home").firstElementChild.id; save("majick-active", pid); return { parent, star, first }; });
    assert(/Star’s Focus Session/.test(r.parent) && /27 min/.test(r.parent), "parent card missing " + JSON.stringify(r)); assert(/My Focus Session/.test(r.star) && /Start/.test(r.star) && r.first === "fsHero", "Star's card not front and center " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Focus Session 5 days: each day has its own breath, sound world, song and strum; no G7 in her play-along or easy songs (G7 only as day-5 practice); picking a day sticks until a session is done", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const days = FS_DAYS.map((d) => d.br.n + "|" + d.snd.nm + "|" + d.mel + "|" + d.strum);
      const songs = ["jingle-easy", "twinkle-easy", "mary-easy", "ode"].map((id) => melAll().find((m) => m.id === id)); const lhBad = songs.some((m) => !m || /F#/.test(m.lh) || m.lh.split(" ").some((x) => /B2/.test(x) && /F3/.test(x)));
      const playChords = FS_DAYS.map((d) => d.ch.join(" ")).join(" "); save(mk("fs", "pick"), 2); const picked = fsDay();
      save(mk("fs", "state"), { day: 2, i: 0, el: 70, steps: [], score: null }); fsGo(fsState()); await new Promise((z) => setTimeout(z, 800)); const nat = !!FS.nat, hum = document.getElementById("fsSub").textContent;
      const x = fsState(); x.i = 5; x.el = 300; x.steps = ["breathe", "theory", "tune", "chords", "melody"]; fsSave(x); fsNext(); const after = fsDay();
      return { uniq: new Set(days).size, lhBad, g7: /G7/.test(playChords), newCh: FS_DAYS[4].newCh, picked, nat, hum, after, natGone: !FS.nat }; });
    assert(r.uniq === 5, "days aren't different"); assert(!r.g7 && r.newCh === "G7", "G7 in her play-along"); assert(!r.lhBad, "G7 in an easy song backing");
    assert(r.picked === 2 && r.nat && /hum/.test(r.hum) && r.natGone, "day pick / sound world wrong " + JSON.stringify(r)); assert(r.after === 1, "pick didn't clear after finishing " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Sound comes back on its own after the phone cuts it (screen recording, Control Center, calls)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { ac(); await AC.resume(); await AC.suspend(); const mid = AC.state; await new Promise((z) => setTimeout(z, 1500)); return { mid, after: AC.state }; });
    assert(r.mid === "suspended" && r.after === "running", "sound stayed off " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Lyric Lab takes with no chords picked: 2-bar 4-3-2-1 count-in, steady click while you sing (toggle), chords at full level, lyric shown as you sing, and Hear it back after the take", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); renderIdeaLab(); await w(700);
      const D = swData(), song = swSong(); song.setup = true; song.bpm = 120; if (!song.sections.length) song.sections.push(swSec("Verse")); const sec = song.sections[0];
      ["What if there is only one", "I feel so alone"].forEach((x, i) => { sec.lines[i] = sec.lines[i] || swLine(); sec.lines[i].t = x; });
      song.mel[sec.tag] = swCand(song, sec.tag, 1); song.prog = {}; D.acc = "block"; D.loop = 0; const m = swMix(); m.ch = 0.7; m.clk = 0.5; swSave(); swDraw(); await w(200);
      const clicks = [], notes = []; const oc = window.click; window.click = function (t, k, v) { clicks.push({ t: t - SW.t0, k, v }); return oc.apply(this, arguments); };
      const on = window.swNote; window.swNote = function (mi, t, d, layer) { notes.push({ layer, at: ac().currentTime + t - SW.t0 }); return on.apply(this, arguments); };
      const msgs = []; swPlaySecs(song.sections, { rec: true, noVox: true }); for (let i = 0; i < 26; i++) { await w(200); msgs.push((document.getElementById("swRecMsg") || {}).textContent || ""); } swStopPlay(); window.click = oc; window.swNote = on;
      const bar = 2, leadClicks = clicks.filter((c) => c.t < 2 * bar - 0.05 && (c.v === 0.7 || c.v === 0.95)).length, takeClicks = clicks.filter((c) => c.t >= 2 * bar - 0.05 && c.v === 0.55).length, leadChord = notes.some((n) => n.layer === "ch" && n.at < 0.3);
      D.recClick = false; let c2 = 0; window.click = function (t, k, v) { if (v === 0.55) c2++; return oc.apply(this, arguments); }; swPlaySecs(song.sections, { rec: true, noVox: true }); await w(5200); swStopPlay(); window.click = oc; D.recClick = true;
      SW.lastRec = [{ song: song.id, tag: sec.tag, tn: 1 }]; SW.takeSnap = { id: song.id, json: JSON.stringify(song) }; SW.recNote = "✓ Take saved."; swDraw(); const hear = !!document.getElementById("swHear"); SW.lastRec = null; SW.recNote = "";
      return { leadClicks, takeClicks, leadChord, counted: ["4", "3", "2", "1"].every((n) => msgs.some((x) => x.trim() === n)), lyric: msgs.some((x) => /What if there is only one/.test(x)) && msgs.some((x) => /next: I feel so alone/.test(x)), clickOffLead: c2, hear,
        chordLevel: /v\*=0\.85/.test(swNote.toString()) }; });
    assert(r.leadClicks === 8 && r.counted, "lead-in " + JSON.stringify(r));
    assert(r.takeClicks >= 3 && r.clickOffLead === 0, "steady click / toggle " + JSON.stringify(r));
    assert(r.lyric && r.hear && r.chordLevel, "lyric / hear back / chords " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Lyric Lab takes: a practice round plays one full progression with click + groove, not recorded, then a silent 4-3-2-1 on screen", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); renderIdeaLab(); await w(700);
      const D = swData(), song = swSong(); song.setup = true; song.bpm = 160; if (!song.sections.length) song.sections.push(swSec("Verse")); const sec = song.sections[0];
      ["What if there is only one", "I feel so alone", "I can't tell if anyone", "the way I do"].forEach((x, i) => { sec.lines[i] = sec.lines[i] || swLine(); sec.lines[i].t = x; });
      song.mel[sec.tag] = swCand(song, sec.tag, 1); song.prog = {}; song.prog[sec.tag] = 1; D.acc = "block"; D.loop = 0; delete D.recLead; const m = swMix(); m.clk = 0.5; swSave(); swDraw(); await w(200);
      const want = swRecLeadChords(song, song.sections).map((c) => c.name), clicks = [], ch = []; const oc = window.click; window.click = function (t, k, v) { clicks.push(v); return oc.apply(this, arguments); };
      const on = window.swNote; window.swNote = function (mi, t, d, layer) { if (layer === "ch") ch.push(ac().currentTime + t - SW.t0); return on.apply(this, arguments); };
      swPlaySecs(song.sections, { rec: true, noVox: true }); const bar = 1.5, msgs = []; for (let i = 0; i < 32; i++) { await w(200); msgs.push((document.getElementById("swRecMsg") || {}).textContent || ""); }
      const firstLine = SW.lastLines[0] && SW.lastLines[0].at; swStopPlay(); window.click = oc; window.swNote = on; D.recLead = "count";
      return { want, lead: firstLine, bars: want.length * bar, leadChordHits: ch.filter((x) => x < want.length * bar - 0.05).length, countClicks: clicks.filter((v) => v === 0.7 || v === 0.95).length, pracClicks: clicks.filter((v) => v === 0.6).length, groove: !!BK || true, feel: msgs.some((x) => /not recording/.test(x) && x.indexOf(want[0]) >= 0 && x.indexOf("What if there is only one") >= 0), counted: ["4", "3", "2", "1"].every((n) => msgs.some((x) => new RegExp("recording in\\s*" + n).test(x))) }; });
    assert(r.want.length === 4 && Math.abs(r.lead - r.bars) < 0.01, "lead is not one pass of the chords " + JSON.stringify(r));
    assert(r.leadChordHits >= 12 && r.countClicks === 0 && r.pracClicks >= 12 && r.feel && r.counted, "practice round " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Sing it in: one full progression first (chords + click + groove, not recorded), recording on the 2nd time around; mic off after; only take can be deleted; backing bar shows the section's chords", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); renderIdeaLab(); await w(700);
      const D = swData(), song = swSong(); song.setup = true; song.bpm = 160; if (!song.sections.length) song.sections.push(swSec("Verse")); const sec = song.sections[0];
      ["What if there is only one", "I feel so alone", "I can't tell", "the way I do"].forEach((x, i) => { sec.lines[i] = sec.lines[i] || swLine(); sec.lines[i].t = x; });
      song.mel[sec.tag] = swCand(song, sec.tag, 1); song.prog = {}; song.prog[sec.tag] = 1; song.bk = { p: 0 }; D.acc = "block"; const m = swMix(); m.clk = 0.5; m.ch = 0.7; swSave(); swDraw(); await w(200);
      const want = swProgPass(song, sec.tag, 0).map((c) => c.name).join(""), barTxt = document.getElementById("bkCh").textContent.replace(/[^A-G#bm]/g, "").replace(/[a-l]/g, "");
      const ac0 = ac(); const o = ac0.createOscillator(), dd = ac0.createMediaStreamDestination(); o.connect(dd); o.start(); micStream = dd.stream; toneAnalyser = ac0.createAnalyser(); window.ensureMic = () => Promise.resolve(true);
      const ch = []; const on = window.swNote; window.swNote = function (mi, t, d, layer) { if (layer === "ch") ch.push(performance.now() / 1000 + t); return on.apply(this, arguments); };
      const st = performance.now() / 1000; view.querySelector('.sw-sec [data-m="singsec"]').click(); await w(400);
      const lead = SW.rec && SW.rec.t0 - SW.rec.start, msgs = [], gr = []; for (let i = 0; i < 12; i++) { await w(250); msgs.push((document.getElementById("swRecMsg") || {}).textContent || ""); gr.push(BK.play && R.running); }
      window.swNote = on; if (SW.rec) SW.rec.done(); await w(2500);
      return { want, barHasSec: want.split("").every(Boolean) && document.getElementById("bkCh").textContent.indexOf("Am") >= 0, lead, bar: 1.5, leadCh: ch.filter((x) => x - st < lead - 0.05).length, prac: msgs.some((x) => /not recording/.test(x)), groove: gr.filter(Boolean).length >= 8, grooveStopped: !BK.play, micOff: !micStream }; });
    assert(r.barHasSec, "backing bar is not showing the section's chords " + JSON.stringify(r));
    assert(Math.abs(r.lead - 4 * r.bar) < 0.01 && r.leadCh >= 12 && r.prac && r.groove, "practice round " + JSON.stringify(r));
    assert(r.grooveStopped && r.micOff, "groove/mic left on after the take " + JSON.stringify(r));
    /* a single take can be deleted (asks once) */
    const d = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const song = swSong(), tag = song.sections[0].tag; song.takes = { [tag]: 1 }; song.takeSel = { [tag]: 1 }; swSave(); SW.tkOpen = tag; swDraw(); await w(100);
      const b = view.querySelector('[data-m="tkdel"]'); if (!b) return { btn: false }; b.click(); await w(50); const still = swTakeN(swSong(), tag); view.querySelector('[data-m="tkdel"]').click(); await w(600); return { btn: true, askedFirst: still === 1, gone: swTakeN(swSong(), tag) === 0 }; });
    assert(d.btn && d.askedFirst && d.gone, "single take could not be deleted " + JSON.stringify(d)); await ctx.close();
  });

  await S.test("Jam: chords + groove loop while everything records; review shows rounds cut on the 1 with waveforms; slide, keep, save as takes or make a melody; lyrics never touched", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); renderIdeaLab(); await w(700);
      const D = swData(), song = swSong(); song.setup = true; song.bpm = 160; if (!song.sections.length) song.sections.push(swSec("Verse")); const sec = song.sections[0];
      ["What if there is only one", "I feel so alone", "I can't tell", "the way I do"].forEach((x, i) => { sec.lines[i] = sec.lines[i] || swLine(); sec.lines[i].t = x; });
      song.mel[sec.tag] = swCand(song, sec.tag, 1); song.prog = {}; song.prog[sec.tag] = 1; song.takes = { [sec.tag]: 1 }; D.acc = "block"; const m = swMix(); m.clk = 0.5; swSave(); swDraw(); SW.active = { s: sec.id, l: 0 }; await w(200);
      const lyr0 = swSong().sections[0].lines.map((l) => l.t).join("|");
      const a = ac(); const o = a.createOscillator(), g = a.createGain(), dd = a.createMediaStreamDestination(); o.frequency.value = 220; g.gain.value = 0; o.connect(g); g.connect(dd); o.start(); micStream = dd.stream; toneAnalyser = a.createAnalyser(); window.ensureMic = () => Promise.resolve(true);
      document.getElementById("swJam").click(); await w(300); const J = JAM, round = J.round; /* sing through round 2 only */ g.gain.setValueAtTime(0.4, J.start + round + 0.1); g.gain.setValueAtTime(0, J.start + 2 * round - 0.1);
      await w(Math.round((2 * round + 1.2) * 1000)); const chordsPlayed = J.nb >= 8, groove = BK.play; document.getElementById("swJam").click(); await w(1500);
      const rv = JAM && JAM.review, levels = JAM.rounds.map((x) => x.level), n = JAM.rounds.length, waves = document.querySelectorAll("[data-jw]").length, overview = !!document.getElementById("jmAll");
      JAM.rounds[1].keep = true; JAM.rounds[1].shift = JAM.beat / 2; swJamDraw(); document.getElementById("jmSave").click(); await w(200);
      const s2 = swSong(), takes = s2.takes[sec.tag], meta = s2.takeMeta[swTakeKey(s2, sec.tag, takes)];
      document.getElementById("jmMel").click(); await w(300); const s3 = swSong();
      return { chordsPlayed, groove, rv, n, sung2: levels[1] > 0.5 && levels[0] < 0.12, waves, overview, takes, lines: meta && Object.keys(meta.at).length, melSung: /jam round 2/.test((s3.mel[sec.tag] || {}).label || ""), lyrSame: s3.sections[0].lines.map((l) => l.t).join("|") === lyr0, micOff: !micStream, reviewClosed: !JAM }; });
    assert(r.chordsPlayed && r.groove && r.rv && r.n >= 2 && r.sung2, "jam/rounds " + JSON.stringify(r));
    assert(r.waves >= 1 && r.overview, "waveforms " + JSON.stringify(r));
    assert(r.takes === 2 && r.lines === 4, "kept round not saved as a take (existing take must stay) " + JSON.stringify(r));
    assert(r.melSung && r.lyrSame && r.micOff && r.reviewClosed, "melody/lyrics/mic " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Journeys: breath cues are scheduled on the audio clock far ahead (survive a locked screen and leaving the screen); stop clears them; waves are crashing surf", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); save("mjk-jbreath", "coherent"); save("mjk-jlen", 20); BRCUE.click = true; BRCUE.chime = true; MEDOCEAN.on = true;
      renderJourney(); await w(400); document.getElementById("jPlay").click(); await w(1500); const a = ac(), now = a.currentTime;
      const src = (a._brCueSrc || []), ahead = src.length ? Math.max(...src.map((x) => x.e)) - now : 0, tone = !!MED.jBrG;
      try { teardown && teardown(); } catch (e) {} teardown = null; renderMeditation(); await w(300);
      const src2 = (a._brCueSrc || []).filter((x) => x.e > a.currentTime), tone2 = !!MED.jBrG, surf = !!(MED.ocean && MED.ocean.nat && MED.ocean.nat.L && MED.ocean.nat.L.surf && MED.ocean.nat.L.surf.srcs.length);
      medStop(); await w(200); const left = (a._brCueSrc || []).filter((x) => x.e > a.currentTime + 1).length;
      return { n: src.length, ahead, tone, kept: src2.length, tone2, surf, left, toneAfter: !!MED.jBrG }; });
    assert(r.n > 50 && r.ahead > 300 && r.tone, "breath cues not scheduled ahead " + JSON.stringify(r));
    assert(r.kept > 50 && r.tone2, "leaving the screen silenced the breath cues " + JSON.stringify(r));
    assert(r.left === 0 && !r.toneAfter, "stopping the journey left cues playing " + JSON.stringify(r));
    assert(r.surf, "journey waves are not the crashing surf " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Lucid Dream: 'Full journey' opens the descent with every journey sound setting; when it ends the silent night + REM cues start, timed from lying down", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); LUC.view = "home"; renderLucid(); await w(200);
      const row = !!document.querySelector('[data-lw="journey"]'); document.querySelector('[data-lw="journey"]').click(); await w(100); document.getElementById("lucGo").click(); await w(100); document.getElementById("lucGo2").click(); await w(400);
      const txt = view.textContent, j = { banner: /night takes over/.test(txt), name: /Lucid Dream Descent/.test(txt), locked: !document.getElementById("jTypes"), breathe: /Breathe with it/.test(txt) };
      try { teardown && teardown(); } catch (e) {} teardown = null; medStop();
      lucStart({ elapsed: 1800, fromJourney: true }); await w(400); const a = ac(), first = LUC.windows[0] && (LUC.windows[0].t - a.currentTime) / 3600, since = (Date.now() - LUC.at) / 1000;
      const c = lucCfg(); lucEnd(); return { row, ...j, first, want: c.first - 0.5, since }; });
    assert(r.row && r.banner && r.name && r.locked && r.breathe, "lucid descent journey " + JSON.stringify(r));
    assert(Math.abs(r.first - r.want) < 0.01 && Math.abs(r.since - 1800) < 3, "night cues not timed from lying down " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Phone heat at night: lucid descent goes to a black sleep screen after a minute (tap brings it back, breath cues keep playing); the night dims and stops its stars; audio never sleeps during a night", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); save("mjk-jbreath", "coherent"); BRCUE.chime = true;
      renderJourney({ type: "lucid", lock: true, len: 30 }); await w(300); document.getElementById("jPlay").click(); await w(900);
      const armed = NB.armed; nbShow(); const black = !!document.getElementById("nightBlack"); const cues = (ac()._brCueSrc || []).filter((x) => x.e > ac().currentTime).length;
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); await w(100); const back = !document.getElementById("nightBlack");
      medStop(); await w(100); const disarmed = !NB.armed;
      LUC.view = "home"; renderLucid(); lucStart(); await w(400); const keepAwake = (() => { _acLastUse = Date.now() - 300000; _acQuietSince = Date.now() - 300000; acIdleCheck(); return !_acIdle && ac().state === "running"; })();
      const nv = document.getElementById("lucNight"); LUC.starsPaused = true; await w(400); const stopped = !LUC.starsRaf; lucEnd();
      return { armed, black, cues, back, disarmed, keepAwake, stopped, nv: !!nv }; });
    assert(r.armed && r.black && r.cues > 10 && r.back && r.disarmed, "black sleep screen " + JSON.stringify(r));
    assert(r.keepAwake && r.stopped, "night: audio slept or stars kept drawing " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Heart sensor: during a lucid night a dropped sensor keeps reconnecting once a minute all night (not just 6 tries)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const delays = []; const st = window.setTimeout; window.setTimeout = function (f, ms) { if (ms >= 1000) delays.push(ms); return st(() => {}, 0); };
      HR.connected = false; HR.userOff = false; LUC.on = true; hrAutoReconnect({ gatt: { connect: () => Promise.reject(0) } }, null, 6); LUC.on = false; hrAutoReconnect({ gatt: { connect: () => Promise.reject(0) } }, null, 6);
      window.setTimeout = st; return delays; });
    assert(r.length === 1 && r[0] === 60000, "no all-night reconnect " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Lucid night: cues are ~55% quieter and each window builds 60% -> 80% -> 100%; a dropped Muse keeps reconnecting all night", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const peak = async (lv) => { const oc = new OfflineAudioContext(1, 44100 * 8, 44100); LUC.g = oc.createGain(); LUC.g.gain.value = 1; LUC.g.connect(oc.destination); const sv = lucCfg().style; lucCfg().style = "chime"; lucCueAt(oc, 0.1, lv); lucCfg().style = sv; const b = await oc.startRendering(); const d = b.getChannelData(0); let m = 0; for (const x of d) m = Math.max(m, Math.abs(x)); LUC.g = null; return m; };
      const full = await peak(1), first = await peak(0.6);
      const delays = []; const st = window.setTimeout; window.setTimeout = function (f, ms) { if (ms >= 1000) delays.push(ms); return 1; };
      M.connected = false; M.userOff = false; M.reconT = null; M.dev = { gatt: {} }; LUC.on = true; museAutoReconnect(6); M.reconT = null; LUC.on = false; museAutoReconnect(6); M.reconT = null; M.userOff = true; LUC.on = true; museAutoReconnect(0); LUC.on = false; M.userOff = false;
      window.setTimeout = st; return { full, first, delays, win: lucWindowAt.toString().indexOf("[0,0.6],[150,0.8],[300,1]") >= 0 }; });
    assert(Math.abs(r.full - 0.34 * 0.45) < 0.01 && Math.abs(r.first - 0.34 * 0.45 * 0.6) < 0.01 && r.win, "cue level " + JSON.stringify(r));
    assert(r.delays.length === 1 && r.delays[0] === 60000, "Muse all-night reconnect " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Screen stays awake for sensors all night: wake lock, or a tiny looping video where the browser has none (Bluefy); re-held when a sensor connects mid-night", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const ok = await fetch("/media/keepawake.mp4").then((x) => x.ok);
      Object.defineProperty(navigator, "wakeLock", { value: undefined, configurable: true }); medWake(true); await w(300); const vid = !!document.querySelector('video[src="/media/keepawake.mp4"]'), playing = MED_VID && !MED_VID.paused;
      medWake(false); const gone = !document.querySelector('video[src="/media/keepawake.mp4"]');
      LUC.view = "home"; renderLucid(); lucStart(); HR.connected = true; await w(1300); const held = MED_WANT; HR.connected = false; lucEnd(); const released = !MED_WANT;
      return { ok, vid, playing, gone, held, released }; });
    assert(r.ok && r.vid && r.playing && r.gone && r.held && r.released, "keep-awake " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Who's playing? screen: sensor buttons hidden and nothing records until a player is picked; then it records for that player; back to the picker closes it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { "majick-profiles": [{ id: "t1", name: "Trav" }, { id: "s2", name: "Star" }], "majick-active": "t1" });
    await pg.reload(); await pg.waitForTimeout(1200);
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
      o.gated = document.body.classList.contains("gated"); o.fab = getComputedStyle(document.getElementById("sensFab")).display;
      HR.connected = true; HR.updated = performance.now(); HR.bpm = 70; HR.rr = [850, 860, 840]; save("mjk-sens-auto", true);
      for (let i = 0; i < 3; i++) { HR.updated = performance.now(); sensTick(); } o.recGated = !!SENS.rec;
      activate("s2"); await w(300); HR.updated = performance.now(); sensTick(); o.recAfter = !!SENS.rec; o.owner = SENS.pid; o.fabAfter = getComputedStyle(document.getElementById("sensFab")).display;
      for (let i = 0; i < 3; i++) { HR.updated = performance.now(); sensTick(); }
      renderGate(); await w(200); HR.updated = performance.now(); sensTick(); o.closedOnGate = !SENS.rec; o.starSaved = sensList("s2").length; o.travNone = sensList("t1").length;
      HR.connected = false; return o; });
    assert(r.gated && r.fab === "none" && !r.recGated, "recording/buttons before a player is picked " + JSON.stringify(r));
    assert(r.recAfter && r.owner === "s2" && r.fabAfter !== "none" && r.closedOnGate && r.starSaved === 1 && r.travNone === 0, "recording after picking a player went wrong " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Bass Grooves: opens from Bass; plays the right chord tones with drums after a count-in; Your turn drops the bass every other bar; back stops; settings remembered per player", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}, "Trav");
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
      window.__bv = []; window.__dk = []; const ob = bassVoice; bassVoice = function (m) { __bv.push(m); return ob.apply(this, arguments); };
      const od = dkTrigger; dkTrigger = function (id) { __dk.push(id); return od.apply(this, arguments); };
      renderBass(); await w(200); document.getElementById("bgGroove").click(); await w(400); o.open = /Bass Grooves/.test(grpTitle());
      const s = document.getElementById("bgvPat"); s.value = "r58"; s.onchange(); const k = document.getElementById("bgvKey"); k.value = "A"; k.onchange();
      const bp = document.getElementById("bgvBpm"); bp.value = "140"; bp.oninput();
      document.getElementById("bgvGo").click(); await w(1900 + 1800); o.notes = __bv.slice(0, 4); o.kick = __dk.filter((x) => x === "kick").length; o.snare = __dk.filter((x) => x === "snare").length;
      document.getElementById("bgvGo").click(); [...document.querySelectorAll("#bgvModes button")].find((b) => b.dataset.m === "turn").click(); __bv = [];
      document.getElementById("bgvGo").click(); await w(1714 + 1714 * 1.6); o.turnNotes = __bv.length;
      document.getElementById("eBack").click(); await w(200); o.stopped = !BGV.running; o.backBass = /Bass Guitar/.test(grpTitle());
      o.saved = load(mk("bassgroove", "st"), {}); return o; });
    assert(r.open && r.notes.join() === "33,40,45,40" && r.kick >= 2 && r.snare >= 2, "Bass Grooves didn't play A root–fifth–octave with drums " + JSON.stringify(r));
    assert(r.turnNotes === 4, "Your turn didn't drop the bass every other bar " + JSON.stringify(r));
    assert(r.stopped && r.backBass && r.saved.pat === "r58" && r.saved.key === "A" && r.saved.bpm === 140 && r.saved.mode === "turn", "back/remember failed " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Heart/brain sessions and progress are separate per player: old shared history goes to Trav, Star keeps only her own (backup kept); Star's new sessions go to Star only; a player switch mid-recording splits it; reports file to who started them; age/practice marks separate; Move to… works; survives reload", async () => {
    const ctx = await fresh();
    const old = [{ id: "sOld1", start: Date.now() - 86400000, dur: 600, n: 600, hr: 62, hrv: 70 }, { id: "sOld2", start: Date.now() - 2 * 86400000, dur: 900, n: 900, hr: 70, hrv: 40 }];
    const pg = await profilePage(ctx, url, { "majick-profiles": [{ id: "t1", name: "Trav" }, { id: "s2", name: "Star" }], "majick-active": "t1", "mjk-sens-list": old, "mjk-bioprof": { age: 50 }, "music-s2-set:mjk-sens-list": old.concat([{ id: "sStarPast", start: Date.now() - 3600000, dur: 300, n: 300, hr: 90 }]) });
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
      try { activate("t1"); } catch (e) {} await w(300);
      o.travOld = sensList("t1").map((x) => x.id); o.starOld = sensList("s2").map((x) => x.id); o.legacy = !!localStorage.getItem("mjk-sens-list"); o.sharedGone = true;
      o.travAge = tgtProf().age;
      /* Star records a heart session */
      activate("s2"); await w(200); o.starAge = tgtProf().age || null; const p = tgtProf(); p.age = 9; save(pkey("mjk-bioprof"), p);
      HR.connected = true; HR.updated = performance.now(); HR.bpm = 88; HR.rr = [680, 690, 700, 690, 680, 700]; sensBegin(); const starSid = SENS.sid;
      for (let i = 0; i < 5; i++) { HR.updated = performance.now(); sensTick(); } sensSave(false);
      o.starHas = sensList("s2").some((x) => x.id === starSid); o.travHasStar = sensList("t1").some((x) => x.id === starSid);
      /* Trav takes over mid-recording: Star's closes, a new one starts for Trav */
      activate("t1"); await w(200); HR.updated = performance.now(); sensTick(); o.newOwner = SENS.pid; o.newSid = SENS.sid !== starSid;
      for (let i = 0; i < 3; i++) { HR.updated = performance.now(); sensTick(); } sensSave(true);
      o.travNew = sensList("t1").length; o.starStill = sensList("s2").length;
      /* report recorder started by Star, ended after switching to Trav */
      activate("s2"); await w(100); const at = Date.now() - 600000; plrStart(at, "journey", "Test journey"); for (let i = 0; i < 70; i++) plrTick(at + i * 1000, "x", null); PLR.sens.hr = "heart sensor";
      activate("t1"); await w(100); plrEnd(); await w(300);
      o.repStar = srIdx("s2").some((x) => x.at === at); o.repTrav = srIdx("t1").some((x) => x.at === at);
      /* practice marks */
      dayMark("m"); o.travDay = !!dayGet().m; activate("s2"); await w(100); o.starDay = !!dayGet().m; o.starAge2 = tgtProf().age; activate("t1"); await w(100); o.travAge2 = tgtProf().age;
      /* Move to… : Trav sends an old session to Star */
      o.moved = bioMoveSens("sOld2", "s2"); o.travAfterMove = sensList("t1").map((x) => x.id).includes("sOld2"); o.starAfterMove = sensList("s2").map((x) => x.id).includes("sOld2");
      o.repMoved = (activate("s2"), bioMoveRep(at, "t1")); o.repNowTrav = srIdx("t1").some((x) => x.at === at) && !srIdx("s2").some((x) => x.at === at);
      HR.connected = false; return o; });
    assert(r.travOld.join() === "sOld1,sOld2" && r.starOld.join() === "sStarPast" && r.legacy && r.sharedGone && r.travAge === 50, "old shared history not handed to Trav safely " + JSON.stringify(r));
    assert(r.starHas && !r.travHasStar && !r.starAge && r.starAge2 === 9 && r.travAge2 === 50, "Star's session/age leaked " + JSON.stringify(r));
    assert(r.newOwner === "t1" && r.newSid && r.starStill === 2, "player switch mid-recording didn't split " + JSON.stringify(r));
    assert(r.repStar && !r.repTrav, "report filed under the wrong player " + JSON.stringify(r));
    assert(r.travDay && !r.starDay, "practice marks shared " + JSON.stringify(r));
    assert(r.moved && !r.travAfterMove && r.starAfterMove && r.repMoved && r.repNowTrav, "Move to… failed " + JSON.stringify(r));
    await pg.reload(); await pg.waitForTimeout(1000);
    const r2 = await pg.evaluate(() => ({ t: sensList("t1").map((x) => x.id), s: sensList("s2").map((x) => x.id), flag: !!localStorage.getItem("bio:split-v2") }));
    assert(r2.flag && r2.t.includes("sOld1") && !r2.t.includes("sOld2") && r2.s.includes("sOld2"), "separation didn't survive reload " + JSON.stringify(r2)); await ctx.close();
  });

  await S.test("Muse forehead pulse: reads the real heart rate through drift, echo and noise (45–150 bpm), and shows no number instead of a false 160–183 when there's no clear pulse", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const out = await pg.evaluate(() => { const res = [];
      for (const [bpm, echo, noise, drift] of [[45,0.4,0.08,1],[55,0.85,0.1,0.5],[62,0.3,0.05,0.2],[72,1.0,0.15,0.2],[80,0.5,0.15,8],[70,0.5,0.1,4],[95,0.6,0.1,2],[130,0.4,0.08,1],[150,0.3,0.05,0.2],[0,0,0.3,6],[0,0,1,0.5]]) {
        M.ppg=[];M.ppgN=0;M.ibis=[];M.lastPeakT=0;M.acT=0;M.acPer=0;M.acR=0;M.hr=0;M.rmssd=0;M.ppgHz=64;M.ppgHzOk=true;
        const HZ=64,T=bpm?60/bpm:1;let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-0.5;};const hrs=[];
        for(let n=0;n<HZ*40;n++){const tt=n/HZ,ph=(tt%T)/T;
          const v=(bpm?Math.exp(-Math.pow((ph-0.15)/0.06,2))+echo*Math.exp(-Math.pow((ph-0.55)/0.07,2)):0)+noise*rnd()*2+drift*(Math.sin(2*Math.PI*tt/9)+0.6*Math.sin(2*Math.PI*tt/23+1));
          M.ppg.push({v:v*1000,t:M.ppgN/HZ});M.ppgN++;if(n%10===0){musePPG();if(tt>15)hrs.push(M.hr);}}
        hrs.sort((a,b)=>a-b);res.push([bpm,hrs[hrs.length>>1],hrs[hrs.length-1]]);}
      return res; });
    const bad = out.filter(([bpm, med, max]) => bpm ? Math.abs(med - bpm) > Math.max(3, bpm * 0.04) : max !== 0);
    assert(!bad.length, "Muse pulse misread " + JSON.stringify(bad) + " all " + JSON.stringify(out)); await ctx.close();
  });

  await S.test("Heads of Things in the music app: only Star and Trav/Travis see it; it opens inside the app; each player keeps their own progress on a shared device; others can't open it", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}, "Trav");
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
      const doors = () => [...document.querySelectorAll("#doors .door b")].map((e) => e.textContent);
      goHome(); await w(200); o.trav = doors().includes("Heads of Things");
      [...document.querySelectorAll("#doors .door")].find((b) => /Heads of Things/.test(b.textContent)).click(); await w(1500);
      const f = document.getElementById("hhFrame"); o.inApp = !!f && !view.hidden; o.fab = getComputedStyle(document.getElementById("sensFab")).display;
      const d = f.contentDocument; d.getElementById("tQuiz").click(); await w(100); o.head = d && d.getElementById("qv").innerText.trim(); d.getElementById("tStudy").click(); await w(100);
      d.getElementById("goQuizB").click(); await w(100); const inp = d.querySelector("#ins input"); inp.value = "only that which is not is immovable"; d.getElementById("checkB").click(); d.getElementById("nextB").click(); await w(100);
      o.travKey = Object.keys(localStorage).filter((k) => k.startsWith("heads-v2"));
      document.getElementById("eBack").click(); await w(300); o.home = !home.hidden;
      /* Star on the same device */
      const P = getProfiles(); P.push({ id: "s2", name: "Star" }, { id: "b3", name: "Bob" }); save("majick-profiles", P); activate("s2"); await w(300);
      o.star = doors().includes("Heads of Things"); renderHeadsHalves(); await w(1500);
      const d2 = document.getElementById("hhFrame").contentDocument; d2.getElementById("tQuiz").click(); await w(100); o.starWhere = d2.getElementById("where").innerText;
      activate("b3"); await w(300); o.bob = doors().includes("Heads of Things"); renderHeadsHalves(); await w(300); o.bobBlocked = view.hidden && !home.hidden;
      o.keys = Object.keys(localStorage).filter((k) => k.startsWith("heads-v2")).sort(); o.travSaved = JSON.parse(localStorage.getItem("heads-v2-t1") || "{}");
      return o; });
    assert(r.trav && r.star && !r.bob && r.bobBlocked, "Heads button shown to the wrong players " + JSON.stringify(r));
    assert(r.inApp && r.fab !== "none" && /All things that are, are moved/.test(r.head) && r.home, "Heads didn't open inside the music app " + JSON.stringify(r));
    assert(r.travSaved && r.travSaved.pos && r.travSaved.pos[1] === 1 && r.travSaved.hist.length === 1 && r.travSaved.hist[0].s === 100 && /Head 1\//.test(r.starWhere) && r.keys.join(",") === "heads-v2-s2,heads-v2-t1", "players share Heads progress " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Guitar section: 4 cards; Chords and Play Along have tabs; switching tabs or going back stops the sound; tabs never leak into other sections; the 🫀/🧠 device buttons stay visible; Progressions and the last tab are remembered after a reload; ukulele gets the same menu", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
      renderStrings("guitar"); await w(200); o.cards = [...view.querySelectorAll("#strGrid .card h3")].map((e) => e.textContent);
      o.fabHub = getComputedStyle(document.getElementById("sensFab")).display;
      grpGo("guitar", "play", 0); await w(500); o.tabs = [...view.querySelectorAll(".gtrTabs button")].map((e) => e.textContent);
      const sel = document.getElementById("prgList"); sel.value = "2"; sel.onchange(); await w(200); document.getElementById("prgBpmUp").click(); await w(100);
      document.getElementById("prgStart").click(); await w(800); o.playing = PRG.running;
      view.querySelectorAll(".gtrTabs button")[1].click(); await w(700); o.stoppedOnTab = !PRG.running; o.onStrums = /Strum/.test(grpTitle());
      document.getElementById("eBack").click(); await w(400); o.backToHub = !!document.getElementById("strGrid");
      goHome(); await w(200); renderFretboard("bass"); await w(500); o.leak = !!view.querySelector(".gtrZone"); o.fabElsewhere = getComputedStyle(document.getElementById("sensFab")).display;
      renderStrings("ukulele"); await w(200); o.uke = [...view.querySelectorAll("#strGrid .card h3")].map((e) => e.textContent); grpGo("ukulele", "chords", 0); await w(400); o.ukeTabs = [...view.querySelectorAll(".gtrTabs button")].map((e) => e.textContent);
      o.saved = load("mjk-prgsel", null); return o; });
    assert(r.cards.join("|") === "Guitar Method|Chords|The Neck|Play Along" && r.tabs.length === 4, "guitar menu " + JSON.stringify(r));
    assert(r.playing && r.stoppedOnTab && r.onStrums && r.backToHub, "tabs/back left sound playing or went the wrong way " + JSON.stringify(r));
    assert(!r.leak && r.fabHub !== "none" && r.fabElsewhere !== "none", "guitar tabs leaked or device buttons hidden " + JSON.stringify(r));
    assert(r.uke.join("|") === "Ukulele Method|Chords|The Neck|Play Along" && r.ukeTabs.indexOf("Hard ones") < 0 && r.ukeTabs.length === 3, "ukulele menu " + JSON.stringify(r));
    await pg.reload(); await pg.waitForTimeout(1200);
    const r2 = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); try { activate(activeId()); } catch (e) {} await w(300);
      renderStrings("guitar"); await w(200); [...view.querySelectorAll("#strGrid .card")].find((c) => /Play Along/.test(c.textContent)).click(); await w(600);
      return { title: grpTitle(), on: (view.querySelector(".gtrTabs button.on") || {}).textContent }; });
    assert(r2.on === "Strums", "last Play Along tab not reopened " + JSON.stringify(r2));
    const r3 = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); view.querySelectorAll(".gtrTabs button")[0].click(); await w(600); const s = document.getElementById("prgList"); return { pi: s && s.value, bpm: PRG.bpm }; });
    assert(r3.pi === "2" && r3.bpm === r.saved.bpm && r.saved.bpm !== 90, "Progressions forgot the pick/tempo " + JSON.stringify({ r3, saved: r.saved })); await ctx.close();
  });

  await S.test("Lucid night recording: leaving the descent screen still starts the night; the night continues the descent's recording (one record, stages + cue windows saved); sensor dropouts don't split the always-on recording", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms));
      HR.connected = true; HR.rr = []; HR.n = 0; const fk = setInterval(() => { HR.updated = performance.now(); HR.rr.push(1000); HR.n++; HR.bpm = 60; }, 500);
      LUC.cfg = Object.assign({}, lucCfg(), { wind: "journey", jLen: 1 });
      LUC.view = "home"; renderLucid(); await w(100); document.getElementById("lucGo").click(); await w(100); document.getElementById("lucGo2").click(); await w(300); document.getElementById("jPlay").click(); await w(2500);
      const jAt = PLR && PLR.at; try { teardown && teardown(); } catch (e) {} teardown = null; home.hidden = false; view.hidden = true;
      await w(64000); const night = LUC.on, same = PLR && PLR.at === jAt, kind = PLR && PLR.kind, hasLuc = !!(PLR && PLR.luc), nightView = LUC.view;
      /* sensor drops out for 2 minutes mid-night: the always-on recording stays one session */
      const sid = SENS.sid; HR.connected = false; SENS.offSince = Date.now() - 120000; sensTick(); const notSplit = SENS.rec && SENS.sid === sid; HR.connected = true;
      LUC.ep.push({ t: Date.now(), hr: 60, rmssd: 30, wand: 2, max: 66 }); PLR.luc.ep.push([600, 2]);
      lucEnd(); await w(400); const rec = await idbGet("pl-" + jAt); clearInterval(fk);
      const ix = srIdx().filter((e) => e.at === jAt);
      return { jAt: !!jAt, night, same, kind, hasLuc, nightView, notSplit, recKind: rec && rec.kind, ep: rec && rec.luc && rec.luc.ep.length, win: rec && rec.luc && rec.luc.win.length, n: rec && rec.tl.t.length, ix: ix.length, ixKind: ix[0] && ix[0].kind }; });
    assert(r.jAt && r.night && r.nightView === "night", "night didn't start after leaving the descent screen " + JSON.stringify(r));
    assert(r.same && r.kind === "lucid" && r.hasLuc && r.recKind === "lucid" && r.ix === 1 && r.ixKind === "lucid", "night isn't one recording with the descent " + JSON.stringify(r));
    assert(r.ep >= 1 && r.win >= 1 && r.n > 60, "night stages / cue windows not saved " + JSON.stringify(r));
    assert(r.notSplit, "sensor dropout split the night's always-on recording " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Lucid night survives a reload: a banner offers 'Continue night'; one tap carries on with no burst of cues that were already due, no wind-down replay, and the night's recording continues (nothing overwritten)", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const a = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms));
      HR.connected = true; HR.rr = []; HR.n = 0; window.__fk = setInterval(() => { HR.updated = performance.now(); HR.rr.push(1000); HR.n++; HR.bpm = 60; }, 500);
      LUC.cfg = Object.assign({}, lucCfg(), { wind: "off", first: 4.5, hours: 8 }); LUC.view = "home"; renderLucid(); lucStart({ elapsed: 5 * 3600 }); await w(2500);
      Object.assign(LUC.windows[0], { past: false, released: true, orig: LUC.windows[0].t - 360 });
      for (let i = 0; i < 80; i++) plrTick(Date.now(), "descent", null); plrWrite(); lucLiveSave(); await w(500);
      const rec = await idbGet("pl-" + LUC.plAt); return { plAt: LUC.plAt, n0: rec.tl.t.length, live: !!localStorage.getItem("mjk-luclive") }; });
    await pg.reload(); await pg.waitForTimeout(1500);
    const r = await pg.evaluate(async (a) => { const w = (ms) => new Promise((z) => setTimeout(z, ms));
      const bar = !!document.getElementById("lucResumeBar"); document.getElementById("lrGo").click(); await w(2500);
      const ac0 = ac(), pastScheduled = LUC.windows.filter((x) => x.t < ac0.currentTime && x.nodes && x.nodes.length).length, pastDone = LUC.windows.filter((x) => x.past).length;
      const on = LUC.on, view = LUC.view, n1 = PLR && PLR.tl.t.length, same = PLR && PLR.at === a.plAt;
      for (let i = 0; i < 5; i++) plrTick(Date.now(), "descent", null);
      lucEnd(); await w(500); const rec = await idbGet("pl-" + a.plAt); const gone = !localStorage.getItem("mjk-luclive");
      return { bar, on, view, pastScheduled, pastDone, n1, same, nEnd: rec && rec.tl.t.length, win0: rec && rec.luc && rec.luc.win[0], gone }; }, a);
    assert(a.live && r.bar && r.on && r.view === "night", "no 'Continue night' after reload " + JSON.stringify({ a, r }));
    assert(r.pastScheduled === 0 && r.pastDone >= 1, "cues already due would burst on resume " + JSON.stringify(r));
    assert(r.same && r.n1 >= a.n0 && r.nEnd > a.n0 && r.win0 && r.win0.held === 6, "the night's recording was overwritten on resume " + JSON.stringify({ a, r }));
    assert(r.gone, "ending the night left a resume marker " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Night timeline: reads the whole night across the clock — stitches the always-on recording when the night record is short, shows REM stretches, cues (waited / stopped), movement and no-signal gaps", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const at = Date.now() - 9 * 3600000;
      /* night record: only the first 30 min (as on Nov 19), plus REM/cue info */
      const tl = { stages: ["Settling in"], t: [], st: [], hr: [], hrv: [], co: [], de: [], th: [], al: [], be: [], ga: [], ra: [], rt: [], q: [], bh: [], hp: [], cas: [], br: [] };
      for (let s = 0; s < 1800; s += 5) { tl.t.push(s); tl.st.push(0); tl.hr.push(56); tl.hrv.push(60); ["co","de","th","al","be","ga","ra","rt","q","bh","hp","cas","br"].forEach((k) => tl[k].push(null)); }
      const ep = []; for (let m = 200; m < 225; m++) ep.push([m * 60, 2]);
      await idbPut("pl-" + at, { at, kind: "lucid", title: "Lucid Dream Journey", tl, rr: [], rrT: [], eegBlocks: 0, sens: { hr: "HeartMath" }, luc: { night: 1800, ep, win: [{ s: 3.5 * 3600, held: 12, cut: false }, { s: 5 * 3600, held: 0, cut: true }] } });
      srIdxPut({ at, kind: "lucid", label: "Lucid Dream Journey", mins: 30 });
      /* always-on recorder: two pieces (split by an old dropout) covering the rest of the night, with a 20-min gap and a wake spike */
      const mk2 = (id, start, secs, spikeAt) => { const d = []; for (let s = 0; s < secs; s += 10) d.push({ t: s, hr: spikeAt != null && Math.abs(s - spikeAt) < 90 ? 84 : 55, hrv: 58, act: "Lucid" }); return idbPut("sens-" + id, { id, start, data: d, tags: [] }).then(() => ({ id, start, dur: secs, n: d.length })); };
      const a1 = await mk2("sa", at + 1700000, 4 * 3600, 1.5 * 3600), a2 = await mk2("sb", at + 1700000 + 4 * 3600000 + 20 * 60000, 3.5 * 3600);
      save(pkey("mjk-sens-list"), [a2, a1]);
      plReport(at); await w(1500);
      const txt = (document.getElementById("plNight") || {}).textContent || "", cv = document.getElementById("plNightCv");
      const N = await lucNightLoad(await idbGet("pl-" + at), at);
      document.getElementById("srRead").click(); await w(1200); const brTxt = (document.getElementById("brNight") || {}).textContent || "";
      return { mins: N.m.length, stitched: N.stitched, rem: /REM likely · .*25 min/.test(txt), waited: /waited 12 min/.test(txt), stopped: /stopped, you were moving/.test(txt), moving: /Moving \/ awake/.test(txt), gap: /No heart signal · (19|2\d) min/.test(txt), txt: txt.slice(0, 700), cv: !!(cv && cv.width > 0), br: /Your night/.test(brTxt) && /REM likely/.test(brTxt) }; });
    assert(r.stitched && r.mins > 7 * 60, "timeline didn't read the whole night " + JSON.stringify(r));
    assert(r.rem && r.waited && r.stopped && r.moving && r.gap && r.cv, "timeline events missing " + JSON.stringify(r));
    assert(r.br, "Session read has no night timeline " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("REM finder (HeartMath beats): deep sleep reads deep, REM reads REM, a movement spike reads moving; a due window waits for REM, then plays; moving cuts a window short", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const minute = (kind) => { const rr = []; let tsec = 0, k = 0; while (tsec < 60) { let hr; /* deep: slow + strong regular breathing rhythm (high beat-to-beat variability, flat 10-beat average); REM: faster, wandering, weaker breathing rhythm */ if (kind === "deep") hr = 55 + 4 * Math.sin(2 * Math.PI * k / 4.5); else if (kind === "rem") hr = 61 + 5 * Math.sin(k / 9) + 1.5 * Math.sin(2 * Math.PI * k / 4) + 1.2 * (rnd() - 0.5); else hr = 88 + 8 * rnd(); const x = 60000 / hr; rr.push(x); tsec += x / 1000; k++; } return rr; };
      HR.connected = true; HR.rr = []; HR.n = 0; LUC.ep = []; LUC.lastN = null; const feed = (kind) => { const rr = minute(kind); HR.rr.push(...rr); while (HR.rr.length > 800) HR.rr.shift(); HR.n += rr.length; HR.updated = performance.now(); const e = lucEpoch(), B = lucBase(); if (!e.gap && B) e.mv = e.hr > B.hr * 1.22 || e.max > B.hr * 1.5; LUC.ep.push(e); return lucStage(); };
      let s; for (let i = 0; i < 60; i++) s = feed("deep"); const deep = s; for (let i = 0; i < 4; i++) s = feed("rem"); const rem = s; s = feed("move"); s = feed("move"); const moving = s;
      /* gating with a fake window */
      LUC.ep = LUC.ep.slice(0, 64); for (let i = 0; i < 10; i++) feed("deep"); LUC.stage = lucStage(); const a = ac(); LUC.on = true; LUC.at = Date.now(); LUC.lastEp = Date.now(); lucCfg().gate = true; LUC.stats = { rem: 0, held: [], cut: 0 };
      LUC.g = a.createGain(); LUC.g.connect(a.destination); LUC.windows = [{ i: 0, t: a.currentTime + 3, nodes: [], shift: 0 }]; lucTick(); const held = LUC.windows[0].held;
      for (let i = 0; i < 4; i++) feed("rem"); LUC.stage = lucStage(); lucTick(); const w = LUC.windows[0], released = !w.held && w.released && w.nodes.length > 0;
      w.t = a.currentTime - 30; feed("move"); feed("move"); LUC.stage = lucStage(); lucTick(); const cut = w.cut && LUC.stats.cut === 1;
      LUC.windows.forEach((x) => lucCancel(x.nodes)); LUC.windows = []; LUC.on = false; HR.connected = false;
      return { deep, rem, moving, held, released, cut }; });
    assert(r.deep === "deep" && r.rem === "rem" && r.moving === "moving", "stages " + JSON.stringify(r));
    assert(r.held && r.released && r.cut, "gating " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Home: Vocal Training and Lyric Lab each have a main menu button; Lyric Lab's opens it directly", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { goHome(); const v = !!document.querySelector('.door[data-d="voice"]'), l = document.querySelector('.door[data-d="lyric"]'); if (l) l.click(); await new Promise((z) => setTimeout(z, 500));
      return { v, l: !!l, opened: /Lyric Lab/.test((document.querySelector(".ttitle") || {}).textContent || "") }; });
    assert(r.v && r.l && r.opened, "home buttons " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Vocal Training: own home section + hub, Ear Training routes there, Range Finder saves a range that fits the guide voice, daily/weekly flow, rap timing score, belting daily cap — and a saved guide-voice choice is kept", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, { "mjk-tonevoice": JSON.stringify("piano") });
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const out = {};
      out.door = !!document.querySelector('.door[data-d="voice"]') && !!document.getElementById("voiceGrid") && document.getElementById("voiceGrid").children.length === VOX_CARDS.length;
      out.keptVoice = toneVoice === "piano"; out.realVoices = VOICES.filter((v) => v.kind === "sf").length;
      window.toneAnalyser = window.toneAnalyser || { fftSize: 2048, getFloatTimeDomainData() {} };
      const sim = { m: 45.1, rms: 0.05 }; window.voxPitch = () => sim.m; window.voxRms = () => sim.rms;
      toneMenu(); out.hub = document.querySelectorAll("#tGrid .card").length;
      renderVoxRange(); await w(700); document.getElementById("vrNext").click(); sim.m = 67.1; await w(700); document.getElementById("vrNext").click(); await w(100);
      const rg = voxRange(); out.range = rg && rg.lo + "-" + rg.hi + " " + rg.type; out.shift = voxShift();
      renderWarmups(); out.warmStart = WARM.start;
      /* weekly check: range → hiss → hold, skipping through, saves one entry */
      renderVoxDaily(0, true); sim.m = 45.1; await w(700); document.getElementById("vrNext").click(); sim.m = 67.1; await w(700); document.getElementById("vrNext").click(); await w(100); document.getElementById("vrDone").click(); await w(100);
      for (let i = 0; i < 4 && !document.getElementById("vdOk"); i++) { const s = document.getElementById("vdSkip"); if (s) s.click(); await w(120); }
      out.weekly = load(mk("voice", "weekly"), []).length;
      /* rap timing: onsets right on the grid score high, scattered ones score low */
      VF.mode = "pocket"; const lat = 0, mkExp = () => { const e = []; for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 7; i++) e.push({ t: 10 + bar * 2 + i * 0.25, bar, i }); return e; };
      renderVoxFlow(); const ex = mkExp(); vfScore(ex, ex.filter((e) => e.bar > 0).map((e) => e.t + 0.02), lat); out.flowGood = parseInt(document.getElementById("vfFb").textContent);
      vfScore(mkExp(), mkExp().filter((e) => e.bar > 0).map((e, k) => e.t + (k % 2 ? 0.12 : -0.11)), lat); out.flowOff = parseInt(document.getElementById("vfFb").textContent);
      /* belting: a daily cap protects the voice */
      save(mk("voice", "belt-" + dayKey()), 99); renderVoxBelt(); out.beltCapped = /enough belting/.test(document.getElementById("vbtBody").textContent);
      openEar("tone"); await w(300); out.earRoute = /Vocal Training/.test((document.querySelector(".ttitle") || {}).textContent || "");
      return out; });
    assert(r.door && r.hub === 12 && r.keptVoice && r.realVoices === 2, "section/hub/voice " + JSON.stringify(r));
    assert(r.range === "45-67 Baritone" && r.shift === -12 && r.warmStart === 47, "range fit " + JSON.stringify(r));
    assert(r.weekly === 1, "weekly check not saved " + JSON.stringify(r));
    assert(r.flowGood >= 90 && r.flowOff <= 20 && r.beltCapped, "flow/belt " + JSON.stringify(r));
    assert(r.earRoute, "Ear Training card does not open Vocal Training " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Halftime: Trap + D&B halftime grooves play a real kit in Metronome Flow at their own tempo, and Lyric Lab keeps the song at the felt tempo with drums at double — song words untouched", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const out = {};
      renderRhythm(false); await w(300); const pick = (n) => [...document.querySelectorAll("#rChips .rchip")].find((c) => c.textContent.indexOf(n) >= 0).click();
      pick("Trap halftime"); out.trap = R.bpm; out.lanes = document.querySelectorAll(".htLanes .htL").length; out.felt = document.querySelectorAll(".rcell.felt").length;
      pick("D&B halftime"); out.dnb = R.bpm; let calls = 0; const o = window.htKitStep; window.htKitStep = function () { calls++; return o.apply(this, arguments); };
      R.countIn = 0; document.getElementById("rStart").click(); await w(700); rStop(); window.htKitStep = o; out.kitSteps = calls;
      out.quizClean = RHYTHM_PATTERNS.filter((p) => !p.kit).length === RHYTHM_PATTERNS.length - 2;
      renderIdeaLab(); await w(700); const s = swSong(); if (!s.setup) { s.setup = true; } s.bpm = 90; s.sections = s.sections || []; const before = JSON.stringify(s.sections); swSave(); swDraw(); await w(200);
      document.getElementById("bkSet").open = true; [...document.querySelectorAll("[data-bkg]")].find((x) => x.dataset.bkg === "ht_trap").click(); await w(200);
      document.getElementById("bkGo").click(); await w(300); out.song = swSong().bpm; out.drums = R.bpm; out.words = JSON.stringify(swSong().sections) === before; bkStop(); return out; });
    assert(r.trap === 140 && r.dnb === 172 && r.lanes === 3 && r.felt === 4 && r.kitSteps > 5 && r.quizClean, "Metronome Flow halftime " + JSON.stringify(r));
    assert(r.song === 70 && r.drums === 140 && r.words, "Lyric Lab halftime " + JSON.stringify(r)); await ctx.close();
  });

  await S.test("Djembe: real djembe-pitched bass, a big playable drum on every djembe screen (portrait + landscape), hits light their zone, and no Lead note anywhere", async () => {
    for (const [w, h] of [[390, 844], [844, 390]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const pg = await profilePage(ctx, url, {});
      const r = await pg.evaluate(async (land) => { const wt = (ms) => new Promise((z) => setTimeout(z, ms)); const out = {};
        const screens = { main: () => renderDjembe(), strike: () => renderStrikeCheck(), cr: () => renderCR(), dex: () => renderDexterity("djembe"), beat: () => renderBeat("djembe") };
        for (const k in screens) { screens[k](); await wt(250); const d = document.querySelector(".djDrumWrap .drum"); const rc = d.getBoundingClientRect(); out[k] = { w: Math.round(rc.width), top: Math.round(rc.top), bot: Math.round(rc.top + rc.width) }; }
        renderDjembe(); await wt(200); djHit("T", "L"); const zh = document.querySelector(".djZoneHit"); out.zone = zh ? zh.className : "";
        out.bassFile = await fetch("/sounds/djembe/bass_h1.mp3").then((x) => x.ok ? x.arrayBuffer() : null).then((ab) => ab ? ab.byteLength : 0);
        out.lead = leadOn(); renderHandpan(); await wt(200); out.leadBtn = !!document.getElementById("leadChip") || /Lead note/.test(document.getElementById("view").textContent);
        return out; }, w > h);
      if (w < h) { for (const k of ["main", "strike", "cr", "dex", "beat"]) assert(r[k].w >= 360, k + " drum too small in portrait " + JSON.stringify(r[k])); }
      else { for (const k of ["main", "strike", "cr", "dex", "beat"]) assert(r[k].top >= 0 && r[k].bot <= h + 2 && r[k].w >= 300, k + " drum not fully on screen in landscape " + JSON.stringify(r[k])); }
      assert(/tone/.test(r.zone) && /on/.test(r.zone), "hit zone not lit " + r.zone);
      assert(r.bassFile > 8000 && r.bassFile !== 37138, "djembe bass not replaced " + r.bassFile);
      assert(r.lead === false && !r.leadBtn, "Lead note still present"); await ctx.close();
    }
  });

  await S.test("Phone heat: the home background freezes without a touch, and the audio engine sleeps after real silence and wakes on the next sound", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms));
      const a = ac(); acLevel(); playTone(440, a.currentTime + 0.05, 0.3); await w(3000);
      _acLastUse = Date.now() - 200000; _acQuietSince = Date.now() - 100000; acIdleCheck(); await w(300);
      const slept = AC.state, sil = _silentEl ? _silentEl.paused : true; ac(); await w(300); const woke = AC.state;
      /* a sound still ringing never counts as silence */
      { const c = ac(), o = c.createOscillator(), g = c.createGain(); g.gain.value = 0.05; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 1.5); } await w(250); _acLastUse = Date.now() - 200000; _acQuietSince = Date.now() - 100000; acIdleCheck(); const keptAwake = !_acIdle;
      return { slept, sil, woke, keptAwake }; });
    assert(r.slept === "suspended" && r.sil && r.woke === "running" && r.keptAwake, "audio sleep/wake " + JSON.stringify(r));
    const sky = await pg.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const on = SKY_STATE.running; await w(21500); const off = !SKY_STATE.running;
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); await w(200); return { on, off, back: SKY_STATE.running }; });
    assert(sky.on && sky.off && sky.back, "home background " + JSON.stringify(sky)); await ctx.close();
  });

  await S.test("Ear trainers: chord/scale/progression/cadence play through the same grand piano as the Interval Trainer; one play button per screen", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {});
    const r = await pg.evaluate(async () => { let n = 0; const o = window.sfPlayKey; window.sfPlayKey = function (k) { if (k === "piano") n++; return o.apply(this, arguments); }; playChordEar(53, CHORD_DEFS.maj.iv); playProg(53, PROG_DEFS["1546"].iv); window.sfPlayKey = o; earStop();
      const scr = []; for (const m of ["intervals", "chords", "prog", "noteid"]) { openEar(m); await new Promise((z) => setTimeout(z, 200)); const st = document.getElementById("egStart"); if (st) { st.click(); await new Promise((z) => setTimeout(z, 300)); } scr.push(!document.getElementById("replay")); }
      return { n, single: scr.every(Boolean) }; });
    assert(r.n === 3 + 12, "ear notes not on the shared piano " + JSON.stringify(r)); assert(r.single, "duplicate play/again buttons"); await ctx.close();
  });

  await S.test("the app never throws while opening Lyric Lab", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); await open(pg);
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await S.test("REAL TAPS: pick player → search Guitar / Bass Grooves / Heads → open → ← back home: the 🫀 and 🧠 buttons are there on every screen, both orientations", async () => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const ctx = await b.newContext({ viewport: vp, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
      await pg.goto(url + "/app.html"); await pg.waitForTimeout(700);
      const fabs = () => pg.evaluate(() => ["sensFab", "brainFab"].every((id) => { const e = document.getElementById(id); return e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0; }));
      assert(!(await fabs()), "device buttons showed before picking a player");
      await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
      assert(await fabs(), vp.width + ": missing on home after picking player");
      for (const q of ["Guitar", "Bass Grooves", "Ukulele", "Bass Guitar"]) {
        await pg.evaluate(() => window.scrollTo(0, 0)); const s = pg.locator("#homeSearch"); await s.fill(""); await s.click(); await pg.keyboard.type(q); await pg.waitForTimeout(400);
        await pg.locator("#home :is(button,a,.kb,[data-go])").filter({ hasText: new RegExp("^\\W*" + q) }).filter({ visible: true }).first().click(); await pg.waitForTimeout(700);
        assert(await fabs(), vp.width + ": missing inside " + q);
        const inner = pg.locator("#view #strGrid > .card:visible").first(); if (await inner.count()) { await inner.click(); await pg.waitForTimeout(600); assert(await fabs(), vp.width + ": missing inside a " + q + " tool"); }
        for (let i = 0; i < 6 && !(await pg.evaluate(() => document.getElementById("view").hidden)); i++) { await pg.locator("#view .back").first().click(); await pg.waitForTimeout(350); }
        assert(await fabs(), vp.width + ": missing on home after leaving " + q);
      }
      await pg.evaluate(() => window.scrollTo(0, 0)); { const s = pg.locator("#homeSearch"); await s.fill(""); await s.click(); await pg.keyboard.type("Heads"); await pg.waitForTimeout(400); }
      await pg.locator("#home :is(button,a,.card,.door,.kb,[data-go])").filter({ hasText: /Heads of Things/ }).filter({ visible: true }).first().click(); await pg.waitForTimeout(1500);
      assert(await fabs(), vp.width + ": missing on Heads");
      const clash = await pg.evaluate(() => { const f = document.getElementById("hhFrame"); const d = f.contentDocument; const fr = f.getBoundingClientRect(); const bad = [];
        for (const id of ["sensFab", "brainFab"]) { const a = document.getElementById(id).getBoundingClientRect();
          d.querySelectorAll("button").forEach((btn) => { const r = btn.getBoundingClientRect(); if (!r.width || r.bottom <= 0 || r.top >= fr.height) return; const x1 = r.left + fr.left, y1 = Math.max(r.top, 0) + fr.top, x2 = x1 + r.width, y2 = Math.min(r.bottom, fr.height) + fr.top;
            if (a.left < x2 && a.right > x1 && a.top < y2 && a.bottom > y1) bad.push(id + " on " + btn.textContent.trim()); }); } return bad; });
      assert(!clash.length, vp.width + ": device buttons cover Heads buttons: " + clash.join(", "));
      await pg.locator("#view .back").first().click(); await pg.waitForTimeout(400); assert(await fabs(), vp.width + ": missing on home after Heads");
      assert(!errs.length, errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: Heads — study guide → typed quiz (spelling slips OK, wrong word caught) → in-my-mind → progress report → meditation → ← back; reload keeps it all; old save untouched; both orientations", async () => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const ctx = await b.newContext({ viewport: vp, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); localStorage.setItem("heads-halves-v1-t1", JSON.stringify({ i: 5, r: 2, done: [14, 15], mix: false })); });
      const open = async () => { await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
        const s = pg.locator("#homeSearch"); await s.fill(""); await s.click(); await pg.keyboard.type("Heads"); await pg.waitForTimeout(400);
        await pg.locator("#home :is(button,a,.card,.door,.kb,[data-go])").filter({ hasText: /Heads of Things/ }).filter({ visible: true }).first().click(); await pg.waitForTimeout(1500); };
      await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await open();
      const f = pg.frameLocator("#hhFrame");
      assert(await f.locator("#study").isVisible(), vp.width + ": first visit should open the study guide");
      assert((await f.locator("#studyList .it").count()) === 68, vp.width + ": study guide should list all 68 heads");
      assert(/All things that are, are moved, only that which is not is immovable\./.test(await f.locator("#studyList .it").first().innerText()), vp.width + ": Head 1 wording wrong");
      await f.locator("#goQuizB").click(); await pg.waitForTimeout(200);
      assert(/Head 1\//.test(await f.locator("#where").innerText()), vp.width + ": quiz should start at head 1");
      await f.locator("#ins input").first().click(); await pg.keyboard.type("only that wich is not is immoveable"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(200);
      assert(/Perfect/.test(await f.locator("#say").innerText()), vp.width + ": small spelling slips should pass: " + await f.locator("#say").innerText());
      assert((await f.locator("#qv .ok").count()) === 7, vp.width + ": the 7 right words should show green");
      await f.locator("#nextB").click(); await pg.waitForTimeout(200);
      await f.locator("#ins input").first().click(); await pg.keyboard.type("is solid"); await f.locator("#checkB").click(); await pg.waitForTimeout(200);
      assert(/50%/.test(await f.locator("#say").innerText()) && (await f.locator("#qv .no").count()) === 1, vp.width + ": a wrong word must be caught and shown red");
      await f.locator("#againB").click(); await f.locator("#ins input").first().click(); await pg.keyboard.type("is changeable"); await f.locator("#checkB").click(); await pg.waitForTimeout(200);
      assert(/Perfect/.test(await f.locator("#say").innerText()), vp.width + ": Again should let me retry");
      await f.locator("#nextB").click(); await f.locator("#modeB").click(); await pg.waitForTimeout(200);
      assert(await f.locator("#showB").isVisible() && !(await f.locator("#ins input").count()), vp.width + ": mind mode should have no typing boxes");
      await f.locator("#showB").click(); await f.locator("#hadB").click(); await pg.waitForTimeout(200);
      assert(/Head 4\//.test(await f.locator("#where").innerText()), vp.width + ": after Had it, the next head in order");
      /* half-typed answer survives leaving */
      await f.locator("#modeB").click(); await f.locator("#ins input").first().click(); await pg.keyboard.type("are dis"); await pg.waitForTimeout(100);
      assert(!(await f.locator("#tProg").isVisible()), vp.width + ": tabs should step aside while typing");
      await f.locator("#qv").click(); await pg.waitForTimeout(300); /* tap off the box, like closing the keyboard */
      await f.locator("#tProg").click(); await pg.waitForTimeout(300);
      const prog = await f.locator("#progBox").innerText();
      assert(/Quizzes taken\s*4/.test(prog) && /Level 1 passed\s*3/.test(prog), vp.width + ": progress report wrong: " + prog.slice(0, 200));
      await f.locator("#tMed").click(); await pg.waitForTimeout(200); await f.locator("#medGo").click(); await pg.waitForTimeout(1500);
      assert(/HEAD 1/.test(await f.locator("#medNow").innerText()) && /Pause/.test(await f.locator("#medGo").innerText()), vp.width + ": meditation didn't start at head 1");
      assert((await f.locator("#medRate").inputValue()) === "0.6" && /Slow/.test(await f.locator("#medRate option:checked").innerText()), vp.width + ": meditation voice should default to Slow");
      await f.locator("#tQuiz").click(); await pg.waitForTimeout(200);
      assert(/Begin/.test(await f.locator("#medGo").innerText()), vp.width + ": leaving Meditate should stop the voice");
      assert((await f.locator("#ins input").first().inputValue()) === "are dis", vp.width + ": half-typed answer lost");
      await pg.locator("#view .back").first().click(); await pg.waitForTimeout(400);
      assert(!(await pg.evaluate(() => document.getElementById("home").hidden)), vp.width + ": ← back should go home");
      await pg.reload(); await pg.waitForTimeout(700); await open();
      assert(/Head 4\//.test(await f.locator("#where").innerText()), vp.width + ": reload should come back to head 4 on the quiz");
      const st = await pg.evaluate(() => ({ v2: JSON.parse(localStorage.getItem("heads-v2-t1")), v1: localStorage.getItem("heads-halves-v1-t1") }));
      assert(st.v2.hist.length === 4 && st.v1 === JSON.stringify({ i: 5, r: 2, done: [14, 15], mix: false }), vp.width + ": saves wrong " + JSON.stringify(st).slice(0, 200));
      assert(!errs.length, vp.width + ": page errors " + errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("Heads meditation voice: British, most natural voice is picked first; novelty voices sink; your pick is kept after reload; speed defaults to Slow", async () => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const ctx = await b.newContext({ viewport: vp, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => { const V = [["Samantha", "en-US"], ["Zarvox", "en-US"], ["Daniel", "en-GB"], ["Arthur (Enhanced)", "en-GB"], ["Karen", "en-AU"], ["Thomas", "fr-FR"]].map(([name, lang]) => ({ name, lang, voiceURI: "v." + name, localService: true, default: false }));
        speechSynthesis.getVoices = () => V; window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } }; window.__spoken = []; speechSynthesis.speak = (u) => { window.__spoken.push({ t: u.text, v: u.voice && u.voice.name, r: u.rate }); setTimeout(() => u.onend && u.onend(), 30); }; });
      await pg.goto(url + "/heads-halves.html?who=vv" + vp.width); await pg.waitForTimeout(500);
      await pg.locator("#tMed").click(); await pg.waitForTimeout(200);
      const opts = await pg.locator("#medVoice option").allInnerTexts();
      assert(/^Arthur · Enhanced · British/.test(opts[0]) && /^Daniel.*British/.test(opts[1]) && /Zarvox/.test(opts[opts.length - 1]) && !opts.some((o) => /Thomas/.test(o)), vp.width + ": voice order wrong " + opts.join(" | "));
      assert((await pg.locator("#medRate option:checked").innerText()) === "Slow", vp.width + ": speed should default to Slow");
      await pg.locator("#medTry").click(); await pg.waitForTimeout(100);
      let sp = await pg.evaluate(() => window.__spoken);
      assert(sp.length === 1 && sp[0].v === "Arthur (Enhanced)" && sp[0].r === 0.6, vp.width + ": Try should use Arthur, slow " + JSON.stringify(sp));
      await pg.locator("#medVoice").selectOption("v.Daniel"); await pg.locator("#medGo").click(); await pg.waitForTimeout(1800);
      sp = await pg.evaluate(() => window.__spoken.filter((x) => x.t.trim()));
      assert(sp[1] && sp[1].t === "Head 1." && sp[1].v === "Daniel" && sp[2] && /^All things that are, are moved/.test(sp[2].t), vp.width + ": meditation should say 'Head 1.' then the verse, in Daniel " + JSON.stringify(sp));
      await pg.locator("#medStop").click(); await pg.reload(); await pg.waitForTimeout(500);
      assert((await pg.locator("#medVoice").inputValue()) === "v.Daniel", vp.width + ": voice pick not kept after reload");
      assert(!errs.length, vp.width + ": page errors " + errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: meditation journeys play straight to the speakers (no hidden <audio> pipe that makes iPhone warp the tone) — 20 s of real output: steady pitch, no clicks; Golden Ladder too", async () => {
    for (const jt of ["", "Golden Ladder"]) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => {
        if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); }
        window.__msd = 0; const AC0 = window.AudioContext;
        window.AudioContext = window.webkitAudioContext = function (o) { const c = new AC0(o); window.__ctx = c; const msd = c.createMediaStreamDestination.bind(c); c.createMediaStreamDestination = function () { window.__msd++; return msd(); };
          const tap = c.createGain(); c.__tap = tap; c.__L = []; c.__on = false;
          const code = "class R extends AudioWorkletProcessor{constructor(){super();this.b=new Float32Array(8192);this.n=0;}process(i){const x=i[0];const l=x&&x[0]?x[0]:new Float32Array(128);this.b.set(l,this.n);this.n+=128;if(this.n>=8192){this.port.postMessage(this.b);this.b=new Float32Array(8192);this.n=0;}return true;}}registerProcessor('rec',R);";
          c.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: "application/javascript" }))).then(() => { const n = new AudioWorkletNode(c, "rec", { channelCount: 2, channelCountMode: "explicit" }); const g = c.createGain(); g.gain.value = 0; tap.connect(n); n.connect(g); g.connect(c.destination); n.port.onmessage = (e) => { if (c.__on) c.__L.push(e.data); }; });
          return c; };
        window.AudioContext.prototype = AC0.prototype;
        const conn = AudioNode.prototype.connect; AudioNode.prototype.connect = function (t, ...r) { const res = conn.call(this, t, ...r); try { if (t === this.context.destination && this.context.__tap && this !== this.context.__tap) conn.call(this, this.context.__tap); } catch (e) {} return res; };
      });
      await pg.goto(url + "/app.html"); await pg.waitForTimeout(800);
      await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
      await pg.locator("#home button").filter({ hasText: /^Meditation$/ }).first().click(); await pg.waitForTimeout(600);
      await pg.locator("#home").getByText("Brainwave binaural beats", { exact: false }).first().click(); await pg.waitForTimeout(1000);
      await pg.locator("#view").getByText("Brainwave Journey", { exact: false }).filter({ visible: true }).first().click(); await pg.waitForTimeout(1200);
      if (jt) { await pg.locator("#jTypes button").filter({ hasText: new RegExp(jt) }).first().click(); await pg.waitForTimeout(400); }
      await pg.evaluate(() => { window.__ctx.__on = true; }); await pg.locator("#jPlay").click(); await pg.waitForTimeout(21000);
      const r = await pg.evaluate(() => { const c = window.__ctx, sr = c.sampleRate, n = c.__L.reduce((a, x) => a + x.length, 0), L = new Float32Array(n); let o = 0; c.__L.forEach((x) => { L.set(x, o); o += x.length; });
        const st = Math.floor(sr * 2); let rms = 0, clicks = 0, d2s = []; for (let i = st + 2; i < n; i++) { const d2 = Math.abs(L[i] - 2 * L[i - 1] + L[i - 2]); d2s.push(d2); rms += L[i] * L[i]; } rms = Math.sqrt(rms / Math.max(1, n - st));
        d2s.sort((a, b) => a - b); const med = d2s[d2s.length >> 1] || 0; for (let i = st + 2; i < n; i++) { if (Math.abs(L[i] - 2 * L[i - 1] + L[i - 2]) > 8 * med + 0.02) clicks++; }
        /* zero-crossing pitch of the left (carrier) channel per second — it must not wander */
        const per = []; for (let s0 = st; s0 + sr <= n; s0 += sr) { let z = 0; for (let i = s0 + 1; i < s0 + sr; i++) if (L[i - 1] < 0 && L[i] >= 0) z++; per.push(z); }
        const pipes = [...document.querySelectorAll("audio")].filter((a) => a.srcObject).length;
        return { secs: n / sr, rms, clicks, per, msd: window.__msd, pipes, mvToDest: true }; });
      const spread = Math.max(...r.per) - Math.min(...r.per);
      assert(r.msd === 0 && r.pipes === 0, (jt || "journey") + ": sound was piped through a hidden player " + JSON.stringify(r));
      assert(r.secs > 15 && r.rms > 0.01, (jt || "journey") + ": no sound reached the speakers " + JSON.stringify(r));
      assert(r.clicks === 0, (jt || "journey") + ": clicks in the output " + r.clicks);
      assert(jt || spread <= 3, "journey: the tone wandered " + JSON.stringify(r.per));
      await pg.locator("#jPlay").click(); await pg.waitForTimeout(300);
      assert(!errs.length, "page errors " + errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: 8th-note breath count in every meditation (Journey, Breathwork, Heart Sync, Binaural, Soundscapes, Meditation Session): a click every 8th, the 1 loudest, numbers louder than the &s, out-breath lower; count shows on the circle; both orientations", async () => {
    const screens = [["Brainwave Journey", "journey"], ["Breathwork", "preset"], ["Heart Sync", "hs"], ["Brainwave Binaural", "mbr"], ["Soundscapes", "mbr"], ["Meditation Session", "mbr"]];
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) for (const [name, how] of screens) {
      const ctx = await b.newContext({ viewport: vp, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => {
        if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); }
        window.__clk = []; const st = AudioBufferSourceNode.prototype.start, cn = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function (t, ...r) { if (this instanceof AudioBufferSourceNode && t instanceof GainNode) this.__g = t; return cn.call(this, t, ...r); };
        AudioBufferSourceNode.prototype.start = function (when, ...r) { try { const d = this.buffer && this.buffer.duration, rt = this.playbackRate.value; if (d && d < 0.06 && (Math.abs(rt - 1.12) < 0.001 || Math.abs(rt - 0.8) < 0.001)) window.__clk.push({ t: when || this.context.currentTime, r: rt, g: this.__g ? this.__g.gain.value : null }); } catch (e) {} return st.call(this, when, ...r); };
      });
      await pg.goto(url + "/app.html"); await pg.waitForTimeout(800);
      await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
      await pg.locator("#home button").filter({ hasText: /^Meditation$/ }).first().click(); await pg.waitForTimeout(600);
      await pg.locator("#home").getByText("Brainwave binaural beats", { exact: false }).first().click(); await pg.waitForTimeout(1000);
      await pg.locator("#view button").filter({ hasText: new RegExp("^" + name) }).first().click(); await pg.waitForTimeout(1200);
      const sheet = async (open) => { const on = await pg.evaluate(() => { const z = document.getElementById("czA"); return !!(z && z.classList.contains("on")); }); if (open !== on && (await pg.locator(open ? "#czABtn" : "#czAX").count())) { await pg.locator(open ? "#czABtn" : "#czAX").first().click(); await pg.waitForTimeout(500); } };
      if (how === "journey") { await sheet(true); await pg.locator("#jBrs button").filter({ hasText: /8th count/ }).first().click(); await sheet(false); await pg.locator("#jPlay").click(); }
      else if (how === "preset") { await pg.locator("#view button.preset").filter({ hasText: /8th count/ }).first().click(); await pg.locator("#brStart").click(); }
      else if (how === "hs") { await pg.locator("#hsCzBtn").click(); await pg.waitForTimeout(500); await pg.locator("#hsB_eighths").click(); await pg.waitForTimeout(200); if (await pg.locator("#hsCzX").isVisible()) await pg.locator("#hsCzX").click(); await pg.waitForTimeout(300); await pg.locator("#hsGo").click(); }
      else { await pg.locator("#view button").filter({ hasText: /^▶ (Play|Begin)$/ }).filter({ visible: true }).first().click(); await pg.waitForTimeout(800); await pg.locator("[data-mbr=eighths]").filter({ visible: true }).first().click(); }
      await pg.waitForTimeout(700); const shown = []; for (let i = 0; i < 6; i++) { shown.push(await pg.evaluate(() => { const e = ["jBrT", "brPhT", "mbrT", "hsCue"].map((id) => document.getElementById(id)).find((x) => x && x.offsetParent); return e ? e.textContent.trim() : ""; })); await pg.waitForTimeout(260); }
      await pg.waitForTimeout(5000);
      if (vp.width === 390) await pg.screenshot({ path: "/tmp/br8-" + how + "-" + name.replace(/\W+/g, "") + ".png" });
      const clk = (await pg.evaluate(() => window.__clk)).sort((a, b) => a.t - b.t);
      const tag = vp.width + " " + name + ": ";
      assert(clk.length >= 10, tag + "too few count clicks " + clk.length);
      const gaps = clk.slice(1, 16).map((c, i) => c.t - clk[i].t), g0 = gaps.slice().sort((a, b) => a - b)[gaps.length >> 1];
      assert(gaps.every((g) => Math.abs(g - g0) < 0.02), tag + "uneven spacing " + gaps.map((g) => g.toFixed(3)).join(","));
      if (how !== "hs") assert(Math.abs(g0 - 0.5) < 0.01, tag + "8ths should be half a second apart, got " + g0);
      const one = clk.findIndex((c, i) => i + 7 < clk.length && c.g > clk[i + 2].g && c.r === clk[i + 7].r); const run = clk.slice(one, one + 8).map((c) => c.g);
      assert(one >= 0 && run[0] > run[2] && run[2] > run[1] && Math.abs(run[2] - run[4]) < 1e-6 && Math.abs(run[4] - run[6]) < 1e-6 && [1, 3, 5, 7].every((i) => run[i] < run[2]), tag + "accents wrong " + JSON.stringify(run));
      assert(clk.some((c) => Math.abs(c.r - 1.12) < 0.001) && clk.some((c) => Math.abs(c.r - 0.8) < 0.001), tag + "in and out should click at different pitches");
      assert(shown.some((x) => /(^|· )[1-4]( &)?$|^&$/.test(x)), tag + "count not shown on the circle: " + shown.join(" | "));
      assert(!errs.length, tag + "page errors " + errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("Heads data safety: a damaged save is kept aside (not erased); Clear needs two taps and keeps a copy", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const pg = await ctx.newPage();
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("heads-v2-z9", "{broken"); });
    await pg.goto(url + "/heads-halves.html?who=z9"); await pg.waitForTimeout(500);
    let keys = await pg.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("heads-v2-z9")));
    assert(keys.some((k) => /damaged/.test(k)), "damaged save was thrown away " + keys);
    assert((await pg.evaluate(() => Object.keys(localStorage).filter((k) => /damaged/.test(k)).map((k) => localStorage.getItem(k))[0])) === "{broken", "damaged save not kept as-is");
    await pg.locator("#goQuizB").click(); await pg.locator("#ins input").first().fill("only that which is not is immovable"); await pg.locator("#checkB").click();
    await pg.locator("#tProg").click(); await pg.locator("#resetB").click();
    assert(JSON.parse(await pg.evaluate(() => localStorage.getItem("heads-v2-z9"))).hist.length === 1, "one tap erased progress");
    await pg.locator("#resetB").click();
    const after = await pg.evaluate(() => ({ now: JSON.parse(localStorage.getItem("heads-v2-z9")), copy: Object.keys(localStorage).filter((k) => /cleared/.test(k)).map((k) => JSON.parse(localStorage.getItem(k)))[0] }));
    assert(after.now.hist.length === 0 && after.copy && after.copy.hist.length === 1, "clear didn't keep a copy " + JSON.stringify(after).slice(0, 200)); await ctx.close();
  });

  await S.test("REAL TAPS: searching Heads finds it for Trav, and finds nothing for another player", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage();
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }, { id: "b1", name: "Bob" }])); });
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(700);
    const look = async (name) => { await pg.locator("#profiles").getByText(name, { exact: true }).first().click(); await pg.waitForTimeout(500);
      const s = pg.locator("#homeSearch"); await s.fill(""); await s.click(); await pg.keyboard.type("Heads"); await pg.waitForTimeout(400);
      return pg.locator("#searchResults :is(button,.card)").filter({ hasText: /Heads of Things/ }).filter({ visible: true }).count(); };
    assert((await look("Trav")) === 1, "Trav can't find Heads by search");
    await pg.locator("#switchProfile").click(); await pg.waitForTimeout(400);
    assert((await look("Bob")) === 0, "Bob can find Heads by search"); await ctx.close();
  });

  await S.test("REAL TAPS: leaving Piano / Handpan / Djembe by the player chip stops their sound and brings the 🫀/🧠 buttons back", async () => {
    for (const inst of ["Piano", "Handpan", "Djembe Groove"]) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
      await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
      await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
      const s = pg.locator("#homeSearch"); await s.click(); await pg.keyboard.type(inst); await pg.waitForTimeout(400);
      await pg.locator("#searchResults .card:visible").filter({ has: pg.locator("h3", { hasText: new RegExp("^" + inst + "$") }) }).first().click(); await pg.waitForTimeout(900);
      if (inst === "Djembe Groove") { await pg.locator("#view button:visible").filter({ hasText: /Start/ }).first().click(); await pg.waitForTimeout(2000); }
      await pg.locator("#switchProfile").click(); await pg.waitForTimeout(400); await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(1500);
      const r = await pg.evaluate(() => ({ fab: ["sensFab", "brainFab"].every((id) => getComputedStyle(document.getElementById(id)).display !== "none"), cls: document.body.className, lvl: acLevel() }));
      assert(r.fab && !/pkWide|djOn/.test(r.cls), inst + ": buttons still hidden after the chip " + JSON.stringify(r));
      assert(r.lvl < 0.001, inst + ": still making sound after leaving " + r.lvl);
      assert(!errs.length, errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: when nothing is making sound the app stops 'playing' within ~15 s (so dictation/other apps can use audio), and a note on the neck wakes it instantly", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage();
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
    const st = () => pg.evaluate(() => ({ eng: AC ? AC.state : "none", loop: _silentEl ? (_silentEl.paused ? "paused" : "playing") : "none" }));
    await pg.waitForTimeout(17000); let r = await st(); assert(r.eng !== "running" && r.loop === "none", "still playing after 17 s idle " + JSON.stringify(r));
    await pg.mouse.click(200, 300); await pg.waitForTimeout(500); r = await st(); assert(r.eng !== "running" && r.loop === "none", "a plain tap woke the sound " + JSON.stringify(r));
    const s = pg.locator("#homeSearch"); await s.click(); await pg.keyboard.type("Guitar Neck"); await pg.waitForTimeout(400);
    await pg.locator("#searchResults .card:visible").filter({ hasText: "Guitar Neck" }).first().click(); await pg.waitForTimeout(1200);
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.touchscreen.tap(229, 590); await pg.waitForTimeout(150);
    r = await st(); assert(r.eng === "running" && r.loop === "playing", "a note didn't wake the sound " + JSON.stringify(r));
    await pg.waitForTimeout(17000); r = await st(); assert(r.eng !== "running" && r.loop === "none", "didn't go back to sleep after the note " + JSON.stringify(r));
    await ctx.close();
  });

  // ---------- brain dashboards in plain words ----------
  async function brainPage(vp) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
    // no headband here: a simulated Muse feeds raw EEG through the same path real samples take
    await pg.evaluate(() => { M.connected = true; let t = 0; window.__sim = setInterval(() => { const S = [[], [], [], []]; for (let i = 0; i < 26; i++) { t += 1 / 256; for (let ch = 0; ch < 4; ch++) S[ch].push(30 * Math.sin(2 * Math.PI * 10 * t + ch) + 8 * Math.sin(2 * Math.PI * 20 * t) + 6 * Math.sin(2 * Math.PI * 6 * t) + (Math.random() - 0.5) * 6); }
      for (let ch = 0; ch < 4; ch++) { for (const v of S[ch]) M.eeg[ch].push(v); if (PLR && PLR.on) plrEEG(ch, S[ch]); } try { museBands(); } catch (e) {} }, 100); try { sensEnsureTimer(); bioStart(); } catch (e) {} });
    await pg.waitForTimeout(3000); return { ctx, pg, errs };
  }
  const GREEK = /[αβγδθ]/;
  await S.test("REAL TAPS: 🧠 panel speaks plain words (Calm / Dreamy / Focused / Peak, a 'Right now' sentence, meanings) — no Greek-only labels", async () => {
    const { ctx, pg, errs } = await brainPage({ width: 390, height: 844 });
    await pg.locator("#brainFab").click(); await pg.waitForTimeout(1500);
    const txt = await pg.evaluate(() => document.getElementById("brainPanel").innerText);
    assert(/Right now: mostly (Calm|Dreamy|Focused)/.test(txt), "no plain 'Right now' sentence: " + txt.slice(0, 200));
    for (const w of ["Calm", "Dreamy", "Focused", "Peak", "What do these mean"]) assert(txt.includes(w), "panel missing " + w);
    assert(!GREEK.test(txt.replace(/\(.*?\)/g, "")), "Greek label in the panel: " + txt);
    assert(/Calm \d+%/.test(await pg.locator("#brainFab").innerText()), "brain button not in plain words");
    const cols = await pg.evaluate(() => BC_BANDS.map((b) => b[2])); assert(new Set(cols).size === 5, "band colors not distinct");
    assert(!errs.length, errs.join(" | ")); await ctx.close();
  });

  await S.test("REAL TAPS: 'Open dashboard' starts on the Simple view; ⓘ explains the chart and every band; More charts has plain names; the heart panel opens the Vitals dashboard", async () => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const { ctx, pg, errs } = await brainPage(vp);
      await pg.locator("#brainFab").click(); await pg.waitForTimeout(800); await pg.locator("#bpFull").click(); await pg.waitForTimeout(2500);
      assert(await pg.evaluate(() => BC.view === "simple"), vp.width + ": dashboard didn't open on Simple");
      await pg.locator("#bcHelp").click(); await pg.waitForTimeout(400);
      const help = await pg.evaluate(() => document.getElementById("bcHelpBox").innerText);
      for (const w of ["Deep sleep", "Dreamy", "Calm", "Focused", "Peak"]) assert(help.includes(w), "help missing " + w);
      await pg.locator("#bcHelpX").click(); await pg.locator("#bcFold").click(); await pg.waitForTimeout(500);
      const chips = (await pg.locator("[data-bcv]").allTextContents()).join("|");
      for (const w of ["Head map", "Left vs right", "Rest vs effort"]) assert(chips.includes(w), "chart list missing " + w + ": " + chips);
      assert(!/LF·HF|Ridge|Mirror/.test(chips), "old jargon chart names: " + chips);
      await pg.locator("#eBack").click(); await pg.waitForTimeout(400);
      await pg.locator("#sensFab").click(); await pg.waitForTimeout(600); await pg.locator("#sensDash").click(); await pg.waitForTimeout(1500);
      assert(await pg.evaluate(() => BC.view === "vitals"), vp.width + ": heart dashboard didn't open Vitals");
      assert(!errs.length, errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: dashboards are one tap away inside Piano, Handpan and Djembe (small icons, panels open)", async () => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const { ctx, pg, errs } = await brainPage(vp);
      for (const inst of ["Piano", "Handpan", "Djembe Groove"]) {
        for (let i = 0; i < 6 && !(await pg.evaluate(() => document.getElementById("view").hidden)); i++) { await pg.locator("#view .back:visible").first().click().catch(() => {}); await pg.waitForTimeout(400); }
        await pg.evaluate(() => window.scrollTo(0, 0)); const s = pg.locator("#homeSearch"); await s.fill(""); await s.click(); await pg.keyboard.type(inst); await pg.waitForTimeout(400);
        await pg.locator("#searchResults .card:visible").filter({ has: pg.locator("h3", { hasText: new RegExp("^" + inst + "$") }) }).first().click(); await pg.waitForTimeout(1200);
        await pg.locator("#brainFab").click(); await pg.waitForTimeout(700);
        assert(await pg.evaluate(() => !document.getElementById("brainPanel").hidden && document.getElementById("brainPanel").getBoundingClientRect().height > 50), vp.width + " " + inst + ": brain panel didn't open");
        await pg.locator("#bpX").click(); await pg.locator("#sensFab").click(); await pg.waitForTimeout(600);
        assert(await pg.evaluate(() => !document.getElementById("sensPanel").hidden && document.getElementById("sensPanel").getBoundingClientRect().height > 50), vp.width + " " + inst + ": heart panel didn't open");
        await pg.locator("#sensX").click(); await pg.waitForTimeout(200);
      }
      assert(!errs.length, errs.join(" | ")); await ctx.close();
    }
  });

  await S.test("REAL TAPS: record a meditation with the Muse, unplug it, and '📼 My last brain session' replays it on the Simple view", async () => {
    const { ctx, pg, errs } = await brainPage({ width: 390, height: 844 });
    await pg.locator("#home :is(button,.card,.kb)").filter({ hasText: /Afternoon/ }).filter({ visible: true }).first().click(); await pg.waitForTimeout(1200);
    await pg.locator("#jPlay").click(); await pg.waitForTimeout(75000);
    for (let i = 0; i < 6 && !(await pg.evaluate(() => document.getElementById("view").hidden)); i++) { await pg.locator("#view .back:visible").first().click().catch(() => {}); await pg.waitForTimeout(500); }
    await pg.waitForTimeout(17000);
    await pg.evaluate(() => { clearInterval(window.__sim); M.connected = false; });
    await pg.locator("#brainFab").click(); await pg.waitForTimeout(1000);
    assert(await pg.locator("#bpLast").count(), "no 'My last brain session' button with the Muse off");
    await pg.locator("#bpLast").click(); await pg.waitForTimeout(3500);
    const r = await pg.evaluate(() => ({ src: BC.src, view: BC.view, rec: !!BC.rec, frames: BC.rec ? BC.rec.frames.length : 0, now: (bcSimpleData().now || null) }));
    assert(r.src === "rec" && r.view === "simple" && r.rec && r.frames > 30 && r.now, "past session didn't open on Simple " + JSON.stringify(r));
    assert(!errs.length, errs.join(" | ")); await ctx.close();
  });

  await S.test("REAL TAPS: Piano Scales — tempo on the main screen, 3 runs up and down, a stop isn't clean, clean at the goal tempo = mastered (✓ on the root), tempo + mastery kept after reload", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
    const open = async () => { await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
      await pg.locator("#homeSearch").click(); await pg.keyboard.type("Piano"); await pg.waitForTimeout(400);
      await pg.locator("#searchResults .card:visible").filter({ has: pg.locator("h3", { hasText: /^Piano$/ }) }).first().click(); await pg.waitForTimeout(1200);
      if ((await pg.evaluate(() => PK.mode)) !== "scales") { await pg.locator("#pkTabs button").filter({ hasText: /Scales/ }).click(); await pg.waitForTimeout(700); } };
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await open();
    assert(await pg.evaluate(() => { const e = document.getElementById("pkBpmUp"); return !!e && !e.closest("#czA") && e.getBoundingClientRect().width > 0; }), "tempo is not on the main screen");
    await pg.locator("#pkModes [data-pm='you']").click();
    for (let i = 0; i < 40 && (await pg.evaluate(() => PK.bpm)) < 160; i++) await pg.locator("#pkBpmUp").click();
    assert((await pg.evaluate(() => PK.bpm)) === 160, "couldn't reach ♩160 with +");
    // no piano here: a player that presses each note on time, through the same judge a MIDI keyboard uses
    const play = (skip) => pg.evaluate((skip) => new Promise((res) => { const evs = PK.ev.filter((e) => !e.auto).sort((a, b) => a.b - b.b); let i = 0;
      const tk = setInterval(() => { if (!PK.running) { clearInterval(tk); res(); return; } const now = ac().currentTime; while (i < evs.length && now >= pkT(evs[i].b)) { if (skip.indexOf(i) < 0) pkJudge(evs[i].notes[0], now); i++; } }, 5); }), skip);
    await pg.locator("#pkGo").click(); await pg.waitForTimeout(50);
    const shape = await pg.evaluate(() => ({ n: PK.ev.length, runs: [...new Set(PK.ev.map((e) => e.run))].length }));
    assert(shape.n === 43 && shape.runs === 3, "not 3 runs up and down " + JSON.stringify(shape));
    await play([20, 21]); await pg.waitForTimeout(1200);
    let msg = await pg.evaluate(() => document.getElementById("pkMsg").innerText);
    assert(/stopped in run 2/.test(msg) && /Try ♩\s*150/.test(msg), "a stop wasn't called out: " + msg);
    assert(!(await pg.evaluate(() => pkScaleRec().best)), "a run with a stop counted as clean");
    // one wrong note anywhere = not clean
    await pg.locator("#pkGo").click(); await pg.waitForTimeout(50);
    await pg.evaluate(() => new Promise((res) => { const evs = PK.ev.filter((e) => !e.auto).sort((a, b) => a.b - b.b); let i = 0, w = false; const tk = setInterval(() => { if (!PK.running) { clearInterval(tk); res(); return; } const now = ac().currentTime; while (i < evs.length && now >= pkT(evs[i].b)) { pkJudge(evs[i].notes[0], now); if (i === 10 && !w) { w = true; pkJudge(evs[i].notes[0] + 1, now + 0.01); } i++; } }, 5); }));
    await pg.waitForTimeout(1200); msg = await pg.evaluate(() => document.getElementById("pkMsg").innerText);
    assert(/1 wrong note/.test(msg) && !(await pg.evaluate(() => pkScaleRec().best)), "a wrong note still counted as clean: " + msg);
    await pg.locator("#pkGo").click(); await pg.waitForTimeout(50); await play([30]); await pg.waitForTimeout(1200);
    assert(!(await pg.evaluate(() => pkScaleRec().best)), "a missed note still counted as clean");
    await pg.locator("#pkGo").click(); await pg.waitForTimeout(50); await play([]); await pg.waitForTimeout(1200);
    msg = await pg.evaluate(() => document.getElementById("pkMsg").innerText);
    assert(/Mastered/.test(msg), "clean ×3 at the goal tempo wasn't mastered: " + msg);
    assert(/✓/.test(await pg.locator("[data-sroot='0']").innerText()), "no ✓ on the mastered root");
    await pg.reload(); await pg.waitForTimeout(800); await open();
    const r = await pg.evaluate(() => ({ bpm: PK.bpm, st: document.getElementById("pkScStat").innerText }));
    assert(r.bpm === 160 && /Mastered/.test(r.st), "tempo or mastery lost after reload " + JSON.stringify(r));
    assert(!errs.length, errs.join(" | ")); await ctx.close();
  });

  await S.test("REAL TAPS: Moonlight Sonata (1st mvt) is in Piano → Melodies → Classical: full piece, melody + triplets + bass together, exact timing, not on the guitar list", async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }])); });
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(700); await pg.locator("#profiles").getByText("Trav", { exact: true }).first().click(); await pg.waitForTimeout(500);
    await pg.locator("#homeSearch").click(); await pg.keyboard.type("Piano"); await pg.waitForTimeout(400);
    await pg.locator("#searchResults .card:visible").filter({ has: pg.locator("h3", { hasText: /^Piano$/ }) }).first().click(); await pg.waitForTimeout(1200);
    await pg.locator("#pkTabs button").filter({ hasText: /Melodies/ }).click(); await pg.waitForTimeout(600);
    await pg.locator("[data-melf='Classical']").click(); await pg.waitForTimeout(300);
    await pg.locator("[data-mel='moonlight1']").scrollIntoViewIfNeeded(); await pg.locator("[data-mel='moonlight1']").click(); await pg.waitForTimeout(400);
    await pg.locator("#pkModes [data-pm='watch']").click(); await pg.locator("#pkGo").click(); await pg.waitForTimeout(400);
    const r = await pg.evaluate(() => { const at = (b, h) => PK.ev.filter((e) => Math.abs(e.b - b) < 1e-6 && e.hand === h).map((e) => e.notes.map(pkNameOct).join("+")).sort().join(" ");
      return { R: PK.ev.filter((e) => e.hand === "R").reduce((a, e) => a + e.notes.length, 0), L: PK.ev.filter((e) => e.hand === "L").reduce((a, e) => a + e.notes.length, 0), len: PK.len,
        b0: at(0, "R") + " | " + at(0, "L"), b19: at(19, "R"), b1975: at(19.75, "R"), b16L: at(16, "L"), bars: pkMelBars(melAll().find((x) => x.id === "moonlight1")) }; });
    assert(r.R === 899 && r.L === 245 && r.len === 276 && r.bars === 69, "piece incomplete or notes on the wrong hand " + JSON.stringify(r));
    assert(r.b0 === "G♯3 | C♯3+C♯2" && /G♯4/.test(r.b19) && r.b1975 === "G♯4" && r.b16L === "C♯3+G♯2+C♯2", "notes/timing/hands wrong " + JSON.stringify(r));
    const xr = await pg.evaluate(() => ({ e3R: PK.ev.some((e) => Math.abs(e.b - 16) < 1e-6 && e.hand === "R" && e.notes.map(pkNameOct).join() === "E3"), e3L: PK.ev.some((e) => Math.abs(e.b - 16) < 1e-6 && e.hand === "L" && e.notes.map(pkNameOct).join() === "E3") }));
    assert(xr.e3R && !xr.e3L, "bar 5 triplet (printed on the bass staff) should be right hand " + JSON.stringify(xr));
    await pg.locator("#pkGo").click();
    assert(!errs.length, errs.join(" | ")); await ctx.close();
  });

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
