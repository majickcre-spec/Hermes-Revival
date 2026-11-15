// REGRESSION: a whole-device backup carries every player, song and recording; restoring adds and never deletes.
import { serve, browser, song, suite, assert } from "./lib.mjs";
export async function run() {
  const { srv, url } = await serve(); const b = await browser(); const S = suite("Device backup & restore");
  async function device(seed, active) { const ctx = await b.newContext(); const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(String(e.message || e)));
    await pg.addInitScript(([seed, active]) => { if (sessionStorage.getItem("__s")) return; sessionStorage.setItem("__s", "1"); localStorage.setItem("majick-active", JSON.stringify(active));
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); }, [seed, active]);
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(400); pg.__errs = errs; return pg; }
  const sw = (songs) => ({ v: 2, songs, cur: songs[0].id });
  await S.test("Mac backup (Travis + Trav, song, voice take) restores onto the iPhone; the phone keeps its own Trav songs", async () => {
    const mac = await device({ "majick-profiles": [{ id: "m1", name: "Travis" }, { id: "m2", name: "Trav" }], "music-m1-set:mjk-sw": sw([song("a1", "Only One", ["am I the only one"], { takes: { Verse: 1 } })]),
      "music-m2-set:mjk-sw": sw([song("b1", "Mac Trav Song", ["b"])]) }, "m1");
    const file = await mac.evaluate(async () => { await idbPut("swtake:a1:Verse", new Blob([new Uint8Array(4000)], { type: "audio/mp4" })); let blob, name; window.swShareFile = (bl, n) => { blob = bl; name = n; };
      renderGate(); document.getElementById("devSave").click(); await new Promise((z) => setTimeout(z, 800)); return { name, text: await blob.text() }; });
    assert(/^MMU backup - Travis, Trav - /.test(file.name), "bad backup name " + file.name);
    const ph = await device({ "majick-profiles": [{ id: "p9", name: "Trav" }], "music-p9-set:mjk-sw": sw([song("c1", "Phone Song", ["c"])]) }, "p9");
    const r = await ph.evaluate(async (t) => { renderGate(); await devRestore(new File([t], "b.json")); const ps = JSON.parse(localStorage.getItem("majick-profiles"));
      const songs = (id) => (JSON.parse(localStorage.getItem("music-" + id + "-set:mjk-sw") || "null") || { songs: [] }).songs.map((s) => s.title).sort();
      const travis = ps.find((p) => p.name === "Travis"), trav = ps.find((p) => p.name === "Trav"); const tk = await idbGet("swtake:a1:Verse");
      return { names: ps.map((p) => p.name).sort(), travis: travis && songs(travis.id), trav: trav && songs(trav.id), take: tk ? tk.size : 0, active: JSON.parse(localStorage.getItem("majick-active")), cards: document.querySelectorAll(".pcard:not(.add)").length }; }, file.text);
    assert(JSON.stringify(r.names) === '["Trav","Travis"]', "players: " + JSON.stringify(r.names)); assert(JSON.stringify(r.travis) === '["Only One"]', "Travis songs: " + JSON.stringify(r.travis));
    assert(JSON.stringify(r.trav) === '["Mac Trav Song","Phone Song"]', "Trav songs: " + JSON.stringify(r.trav)); assert(r.take === 4000, "voice take missing"); assert(r.cards === 2, "gate not showing both players");
    assert(!mac.__errs.length && !ph.__errs.length, mac.__errs.concat(ph.__errs).join(" | "));
  });
  await S.test("restoring the same backup twice changes nothing", async () => {
    const pg = await device({ "majick-profiles": [{ id: "m1", name: "Travis" }], "music-m1-set:mjk-sw": sw([song("a1", "Only One", ["x"])]) }, "m1");
    const r = await pg.evaluate(async () => { let blob; window.swShareFile = (bl) => { blob = bl; }; renderGate(); await devBackup(); const t = await blob.text(); const before = localStorage.getItem("music-m1-set:mjk-sw");
      await devRestore(new File([t], "b.json")); await devRestore(new File([t], "b.json")); return { same: JSON.parse(localStorage.getItem("music-m1-set:mjk-sw")).songs.length === JSON.parse(before).songs.length, n: JSON.parse(localStorage.getItem("majick-profiles")).length }; });
    assert(r.same && r.n === 1, "double restore changed data " + JSON.stringify(r));
  });
  await b.close(); srv.close(); return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
