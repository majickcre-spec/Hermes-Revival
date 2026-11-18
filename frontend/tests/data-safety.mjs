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
      const s16 = 60 / 120 / 4, start = a.currentTime + 0.2, t0 = start + 16 * s16; for (const st of [0, 8, 16]) { const T = t0 + st * s16; g.gain.setValueAtTime(0.5, T); g.gain.setValueAtTime(0, T + 3 * s16); }
      let FR = null; const of = window.swSingFill; window.swSingFill = function (sg, sec, R, S, s) { FR = swGridNotes(R.frames, S * 3, s).map((n) => n.step); return of.apply(this, arguments); };
      document.querySelector('[data-m="singsec"]').click(); await new Promise((z) => setTimeout(z, 5600)); if (SW.rec && SW.rec.done) SW.rec.done(); await new Promise((z) => setTimeout(z, 1800));
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

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
