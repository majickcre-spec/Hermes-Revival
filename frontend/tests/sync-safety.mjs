// REGRESSION: two devices on one account must end up with the SAME songs — nothing overwritten, nothing lost.
import { serve, browser, song, suite, assert } from "./lib.mjs";

export async function run() {
  const { srv, url } = await serve();
  const b = await browser();
  const S = suite("Sync safety (two devices, one account)");
  const API = "https://api.mock";
  // a device = its own browser context (own storage) talking to one shared cloud blob
  async function device(cloud, seed, active) {
    const ctx = await b.newContext(); const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(String(e.message || e)));
    await pg.route(API + "/**", async (r) => {
      const req = r.request();
      if (req.url().endsWith("/api/state") && req.method() === "GET") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: cloud.data }) });
      if (req.url().endsWith("/api/state") && req.method() === "PUT") { cloud.data = JSON.parse(req.postData()).data; cloud.puts++; return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); }
      return r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await pg.addInitScript(([API, seed, active]) => { Object.defineProperty(window, "__MJK_API__", { get: () => API, set: () => {}, configurable: false }); if (sessionStorage.getItem("__s")) return; sessionStorage.setItem("__s", "1");
      localStorage.setItem("majick-token", "tok"); localStorage.setItem("majick-acct", "Trav"); localStorage.setItem("majick-active", JSON.stringify(active));
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); }, [API, seed, active]);
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(400); pg.__errors = errors; pg.__ctx = ctx; return pg;
  }
  const sync = (pg) => pg.evaluate(() => acctSync());
  const songsOf = (pg, id) => pg.evaluate((id) => { const d = JSON.parse(localStorage.getItem("music-" + id + "-set:mjk-sw") || "null"); return d ? d.songs.map((s) => s.title).sort() : []; }, id);
  const sw = (songs, cur) => ({ v: 2, songs, cur: cur || songs[0].id });

  await S.test("a song made on the Mac shows up on the iPhone, and the iPhone's songs stay", async () => {
    const cloud = { data: {}, puts: 0 };
    const mac = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([song("a1", "Only One", ["am I the only one"])]) }, "t1");
    await sync(mac);
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([song("p1", "Phone Idea", ["when I'm alone"])]) }, "t1");
    await sync(ph); await sync(mac);
    assert(JSON.stringify(await songsOf(ph, "t1")) === '["Only One","Phone Idea"]', "phone missing songs: " + (await songsOf(ph, "t1")));
    assert(JSON.stringify(await songsOf(mac, "t1")) === '["Only One","Phone Idea"]', "mac missing songs: " + (await songsOf(mac, "t1")));
    await mac.__ctx.close(); await ph.__ctx.close();
  });

  await S.test("a device that pushes never erases songs it doesn't have (no more last-writer-wins)", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }]), "music-t1-set:mjk-sw": JSON.stringify(sw([song("a1", "Only One", ["x"])])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([song("p1", "Phone Idea", ["y"])]) }, "t1");
    await ph.evaluate(() => { save("mjk-anything", 1); return acctSaveNow(); });
    const d = JSON.parse(cloud.data["music-t1-set:mjk-sw"]); assert(d.songs.some((s) => s.title === "Only One"), "cloud lost the Mac's song"); await ph.__ctx.close();
  });

  await S.test("the newest edit of the same song wins; other songs untouched", async () => {
    const old = song("a1", "Only One", ["old line"], { at: 1000 }), neu = song("a1", "Only One", ["new line"], { at: 2000 });
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }]), "music-t1-set:mjk-sw": JSON.stringify(sw([neu, song("b1", "Other", ["o"])])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([old]) }, "t1"); await sync(ph);
    const d = await ph.evaluate(() => JSON.parse(localStorage.getItem("music-t1-set:mjk-sw")));
    assert(d.songs.find((s) => s.id === "a1").sections[0].lines[0].t === "new line", "older copy won"); assert(d.songs.some((s) => s.id === "b1"), "other song lost"); await ph.__ctx.close();
  });

  await S.test("a song deleted on one device stays deleted", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }]), "music-t1-set:mjk-sw": JSON.stringify(sw([song("a1", "Keep", ["k"], { at: 1000 }), song("d1", "Gone", ["g"], { at: 1000 })])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([song("a1", "Keep", ["k"], { at: 1000 })], "a1") }, "t1");
    await ph.evaluate(() => { const d = JSON.parse(localStorage.getItem("music-t1-set:mjk-sw")); d.del = { d1: Date.now() }; localStorage.setItem("music-t1-set:mjk-sw", JSON.stringify(d)); });
    await sync(ph); assert(JSON.stringify(await songsOf(ph, "t1")) === '["Keep"]', "deleted song came back: " + (await songsOf(ph, "t1")));
    assert(!JSON.parse(cloud.data["music-t1-set:mjk-sw"]).songs.some((s) => s.id === "d1"), "cloud still has deleted song"); await ph.__ctx.close();
  });

  await S.test("two players with the same name (Travis on Mac, Travis on phone) become one, with both sets of songs", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "aaa", name: "Travis" }]), "music-aaa-set:mjk-sw": JSON.stringify(sw([song("a1", "Only One", ["x"])])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "zzz", name: "travis" }], "music-zzz-set:mjk-sw": sw([song("p1", "Phone Idea", ["y"])]) }, "zzz"); await sync(ph);
    const r = await ph.evaluate(() => ({ profiles: JSON.parse(localStorage.getItem("majick-profiles")).map((p) => p.id), active: JSON.parse(localStorage.getItem("majick-active")), left: Object.keys(localStorage).filter((k) => k.indexOf("music-zzz-") === 0) }));
    assert(JSON.stringify(r.profiles) === '["aaa"]', "players not combined " + JSON.stringify(r.profiles)); assert(r.active === "aaa", "phone not switched to the combined player");
    assert(JSON.stringify(await songsOf(ph, "aaa")) === '["Only One","Phone Idea"]', "songs lost in combine: " + (await songsOf(ph, "aaa"))); assert(!r.left.length, "old keys left behind");
    await ph.__ctx.close();
  });

  await S.test("which player is open stays per device", async () => {
    const cloud = { data: { "majick-active": JSON.stringify("s1"), "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }, { id: "s1", name: "Star" }]) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }] }, "t1"); await sync(ph);
    assert((await ph.evaluate(() => JSON.parse(localStorage.getItem("majick-active")))) === "t1", "phone switched player because of the other device"); await ph.__ctx.close();
  });

  await S.test("a removed player doesn't come back from the cloud", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }, { id: "x1", name: "Old" }]), "music-x1-set:mjk-sw": JSON.stringify(sw([song("o1", "Old song", ["o"])])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }, { id: "x1", name: "Old" }] }, "t1");
    await ph.evaluate(() => { deletePlayer("x1"); return acctSync(); });
    const r = await ph.evaluate(() => ({ p: JSON.parse(localStorage.getItem("majick-profiles")).map((p) => p.id), k: Object.keys(localStorage).filter((k) => k.indexOf("music-x1-") === 0) }));
    assert(JSON.stringify(r.p) === '["t1"]' && !r.k.length, "removed player came back " + JSON.stringify(r)); await ph.__ctx.close();
  });

  await S.test("signed in with the site's 👤 account (Travis) the game syncs too, and the sign-in itself is never uploaded", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }]), "music-t1-set:mjk-sw": JSON.stringify(sw([song("a1", "Only One", ["x"])])) }, puts: 0 };
    const ctx = await b.newContext(); const pg = await ctx.newPage();
    await pg.route(API + "/**", async (r) => { const q = r.request(); if (q.method() === "GET") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: cloud.data }) });
      cloud.data = JSON.parse(q.postData()).data; cloud.puts++; return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); });
    await pg.addInitScript((API) => { Object.defineProperty(window, "__MJK_API__", { get: () => API, set: () => {} }); if (sessionStorage.getItem("__s")) return; sessionStorage.setItem("__s", "1");
      localStorage.setItem("mjk-auth-token", "tok"); localStorage.setItem("mjk-auth-user", "Travis"); localStorage.setItem("majick-profiles", JSON.stringify([{ id: "p9", name: "Trav" }])); localStorage.setItem("majick-active", JSON.stringify("p9")); }, API);
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(400); await pg.evaluate(() => acctSync());
    const names = await pg.evaluate(() => JSON.parse(localStorage.getItem("majick-profiles")).map((p) => p.name).sort());
    assert(JSON.stringify(names) === '["Trav","Travis"]', "phone did not get the account's players: " + JSON.stringify(names));
    assert(!("mjk-auth-token" in cloud.data) && !("mjk-auth-user" in cloud.data), "sign-in was uploaded"); await ctx.close();
  });

  await S.test("a background sync never swaps out the song you're typing in (no frozen screen, no lost edits)", async () => {
    const cloud = { data: { "majick-profiles": JSON.stringify([{ id: "t1", name: "Travis" }]), "music-t1-set:mjk-sw": JSON.stringify(sw([song("a1", "Only One", ["old"], { at: 1 }), song("b1", "Other", ["x"], { at: Date.now() + 99999 })])) }, puts: 0 };
    const ph = await device(cloud, { "majick-profiles": [{ id: "t1", name: "Travis" }], "music-t1-set:mjk-sw": sw([song("a1", "Only One", ["mine"], { at: 5 })]) }, "t1");
    const r = await ph.evaluate(async () => { renderIdeaLab(); SW.lib = false; swDraw(); const before = swSong(); await acctSync(); const same = swSong() === before; const inp = document.querySelector(".sw-t"); inp.value = "typed after sync"; inp.dispatchEvent(new Event("input"));
      const d = JSON.parse(localStorage.getItem("music-t1-set:mjk-sw")); return { same, saved: d.songs.find((s) => s.id === "a1").sections[0].lines[0].t, other: d.songs.some((s) => s.id === "b1") }; });
    assert(r.same, "the open song object was replaced by sync"); assert(r.saved === "typed after sync", "edit after sync was lost: " + r.saved); assert(r.other, "synced song not added");
    await ph.__ctx.close();
  });

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
