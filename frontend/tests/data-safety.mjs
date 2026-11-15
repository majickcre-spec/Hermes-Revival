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
      document.getElementById("bkGo").click(); await new Promise((z) => setTimeout(z, 2600)); const mid = { run: R.running, bpm: R.bpm, bars: BK.bar };
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
      swData().loop = "sec"; swSave(); swDraw(); document.getElementById("swRecB").click(); await new Promise((z) => setTimeout(z, 6500));
      const s2 = swSong(), key = swTakeKey(s2, "Verse", 1), meta = s2.takeMeta && s2.takeMeta[key];
      swPlaySecs(s2.sections, {}); await new Promise((z) => setTimeout(z, 2000)); const vox = (SW.voxSrc || []).length; swStopPlay();
      return { takes: s2.takes && s2.takes.Verse, lines: Object.keys((meta && meta.at) || {}), lyr: s2.sections[0].lines.map((l) => l.t).join("|"), melSame: JSON.stringify(s2.mel) === melBefore, vox, blob: !!(await idbGet("swtake:" + key)) }; });
    assert(r.takes === 1 && r.blob, "take not saved " + JSON.stringify(r)); assert(JSON.stringify(r.lines) === '["0","1"]', "line timing missing " + JSON.stringify(r.lines));
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
      swData().loop = "sec"; swSave(); swDraw(); document.getElementById("swRecB").click(); await new Promise((z) => setTimeout(z, 6500));
      const after = swSong().takes && swSong().takes.Verse, btn = !!document.getElementById("swThrow"); document.getElementById("swThrow").click(); await new Promise((z) => setTimeout(z, 200));
      const s2 = swSong(), gone = !(s2.takes && s2.takes.Verse), blob = await idbGet("swtake:" + swTakeKey(s2, "Verse", 1));
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

  await S.test("the app never throws while opening Lyric Lab", async () => {
    const ctx = await fresh(); const pg = await profilePage(ctx, url, {}); await open(pg);
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await ctx.close();
  });

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
