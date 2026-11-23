// REGRESSION: two devices on one account must end up with the SAME songs — nothing overwritten, nothing lost.
import { serve, browser, song, suite, assert } from "./lib.mjs";

export async function run() {
  const { srv, url } = await serve();
  const b = await browser();
  const S = suite("Sync safety (two devices, one account)", { always: true });
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

  // ---------- session database: per-player uploads, research choice, delete, admin ----------
  async function bioDevice(server) {
    const ctx = await b.newContext(); const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(String(e.message || e)));
    await pg.route(API + "/**", async (r) => {
      const q = r.request(), u = new URL(q.url()), m = q.method(), j = (o) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(o) });
      server.calls.push(m + " " + u.pathname + u.search);
      if (u.pathname.startsWith("/api/sessions/") && m === "PUT" && !u.pathname.includes("/eeg/")) { server.sessions[u.pathname.split("/")[3]] = JSON.parse(q.postData()); return j({ ok: true }); }
      if (u.pathname.startsWith("/api/heartlog/") && m === "PUT") { server.heart[u.pathname.split("/")[3]] = JSON.parse(q.postData()); return j({ ok: true }); }
      if (u.pathname === "/api/sessions" && m === "GET") return j({ sessions: server.list });
      if (u.pathname === "/api/admin/me") return j({ admin: !!server.admin });
      if (u.pathname === "/api/admin/summary") return j({ sessions: 3, heartRecordings: 1, people: 2, fromOthers: 1, peopleSharing: 1 });
      if (u.pathname === "/api/research") { server.research.push(JSON.parse(q.postData())); return j({ ok: true }); }
      if (u.pathname === "/api/my-data" && m === "DELETE") return j({ ok: true });
      return j({});
    });
    await pg.addInitScript((API) => { Object.defineProperty(window, "__MJK_API__", { get: () => API, set: () => {} }); if (sessionStorage.getItem("__s")) return; sessionStorage.setItem("__s", "1");
      localStorage.setItem("mjk-auth-token", "tok"); localStorage.setItem("mjk-auth-user", "Travis");
      localStorage.setItem("majick-profiles", JSON.stringify([{ id: "t1", name: "Trav" }, { id: "s1", name: "Star" }])); localStorage.setItem("majick-active", JSON.stringify("t1"));
      localStorage.setItem("bio:split-v2", JSON.stringify({ to: "t1" })); localStorage.setItem("bio:mjk-research@s1", "true"); }, API);
    await pg.goto(url + "/app.html"); await pg.waitForTimeout(400);
    await pg.evaluate(async () => { const tl = Array.from({ length: 180 }, (_, i) => ({ t: i, hr: 70, hrv: 50, co: 1 }));
      for (const [pid, at] of [["t1", 1700000000000], ["s1", 1700000500000]]) { srIdxPut({ at, kind: "meditation", label: "Calm · " + pid, mins: 3, v: 1 }, pid); await idbPut("pl-" + at, { tl, rr: [], rrT: [] }); }
      for (const [pid, sid] of [["t1", "sT"], ["s1", "sS"]]) { const data = Array.from({ length: 90 }, (_, i) => ({ t: i, hr: 66, hrv: 40, co: 1.2, act: "Home" })); await idbPut("sens-" + sid, { id: sid, start: 1700001000000, data });
        localStorage.setItem("bio:mjk-sens-list@" + pid, JSON.stringify([{ id: sid, start: 1700001000000, dur: 89, n: 90, hr: 66 }])); } });
    pg.__errors = errors; pg.__ctx = ctx; return pg;
  }
  const srv0 = () => ({ calls: [], sessions: {}, heart: {}, list: [], research: [], admin: false });

  await S.test("every player's sessions and heart recordings upload, each tagged with its own player and sharing choice", async () => {
    const server = srv0(); const pg = await bioDevice(server);
    await pg.evaluate(async () => { await srSync(); await hlSync(); });
    const a = server.sessions["1700000000000"], s = server.sessions["1700000500000"];
    assert(a && a.player.id === "t1" && a.player.name === "Trav" && a.research === false, "Trav's session wrong " + JSON.stringify(a && { p: a.player, r: a.research }));
    assert(s && s.player.id === "s1" && s.research === true, "Star's session wrong " + JSON.stringify(s && { p: s.player, r: s.research }));
    assert(server.heart.sT && server.heart.sT.player.id === "t1" && server.heart.sS && server.heart.sS.player.id === "s1", "heart recordings not uploaded per player " + Object.keys(server.heart));
    assert(server.heart.sS.data.hr.length === 90 && server.heart.sS.research === true, "heart data missing");
    const n = server.calls.length; await pg.evaluate(async () => { await srSync(); await hlSync(); });
    assert(server.calls.length === n, "sent again when nothing changed: " + server.calls.slice(n).join(", "));
    assert(!pg.__errors.length, pg.__errors.join(" | ")); await pg.__ctx.close();
  });

  await S.test("a recording still in progress is not uploaded half-done", async () => {
    const server = srv0(); const pg = await bioDevice(server);
    await pg.evaluate(async () => { SENS.rec = true; SENS.sid = "sT"; await hlSync(); SENS.rec = false; SENS.sid = null; });
    assert(!server.heart.sT && server.heart.sS, "in-progress recording was sent"); await pg.__ctx.close();
  });

  await S.test("My sessions shows only this player's uploads (untagged old ones stay with Trav)", async () => {
    const server = srv0(); server.list = [{ id: "1600000000001", label: "Star old", kind: "meditation", mins: 5, player_id: "s1" }, { id: "1600000000002", label: "Trav old", kind: "meditation", mins: 5, player_id: "t1" }, { id: "1600000000003", label: "Untagged", kind: "meditation", mins: 5 }];
    const pg = await bioDevice(server);
    const labels = async () => { await pg.evaluate(() => renderSessions()); await pg.waitForTimeout(500); return pg.evaluate(() => [...document.querySelectorAll(".srRow")].map((b) => b.textContent).join("|")); };
    let t = await labels(); assert(t.includes("Trav old") && t.includes("Untagged") && !t.includes("Star old"), "Trav sees: " + t);
    await pg.evaluate(() => localStorage.setItem("majick-active", JSON.stringify("s1"))); t = await labels();
    assert(t.includes("Star old") && !t.includes("Trav old") && !t.includes("Untagged"), "Star sees: " + t);
    await pg.evaluate(() => { renderSensSessions(); }); await pg.waitForTimeout(500);
    const kb = await pg.evaluate(() => [...document.querySelectorAll("[data-rep]")].map((b) => b.textContent).join("|"));
    assert(!kb.includes("Trav old") && !kb.includes("Untagged"), "sensor list leaks: " + kb); await pg.__ctx.close();
  });

  await S.test("sharing switch is per player and tells the server; Delete my uploads stops re-sending", async () => {
    const server = srv0(); const pg = await bioDevice(server);
    await pg.evaluate(() => renderSessions()); await pg.waitForTimeout(500);
    assert(!(await pg.evaluate(() => $("#bioRes").checked)), "Trav's switch should start off");
    await pg.evaluate(() => { const c = $("#bioRes"); c.checked = true; c.dispatchEvent(new Event("change")); }); await pg.waitForTimeout(200);
    assert(server.research.some((x) => x.playerId === "t1" && x.on), "server not told");
    assert(await pg.evaluate(() => bioResearch("t1") && bioResearch("s1")), "choice not saved");
    await pg.evaluate(() => { const d = $("#bioDel"); d.click(); d.click(); }); await pg.waitForTimeout(400);
    assert(server.calls.some((c) => c === "DELETE /api/my-data?player=t1"), "delete not sent for this player only: " + server.calls.filter((c) => c.includes("my-data")));
    server.sessions = {}; server.heart = {}; await pg.evaluate(() => { const L = srIdx("s1"); L.forEach((e) => srIdxPut({ at: e.at, v: (e.v || 0) + 1 }, "s1")); const H = sensList("s1"); H.forEach((s) => { s.n++; }); save(pkey("mjk-sens-list", "s1"), H); }); await pg.evaluate(async () => { await srSync(); await hlSync(); });
    assert(!server.sessions["1700000000000"] && !server.heart.sT, "deleted sessions were uploaded again");
    assert(server.sessions["1700000500000"] && server.heart.sS, "Star's uploads should be unaffected"); await pg.__ctx.close();
  });

  await S.test("🔬 Research data shows only for the admin account", async () => {
    for (const admin of [false, true]) { const server = srv0(); server.admin = admin; const pg = await bioDevice(server);
      await pg.evaluate(() => renderSessions()); await pg.waitForTimeout(600);
      const vis = await pg.evaluate(() => { const a = $("#bioAdm"); return !!a && !a.hidden; });
      assert(vis === admin, "admin button visible=" + vis + " for admin=" + admin);
      if (admin) { await pg.evaluate(() => $("#bioAdm").click()); await pg.waitForTimeout(400); assert(await pg.evaluate(() => !!$("#radCsv") && document.body.textContent.includes("Heart recordings")), "admin screen did not open"); }
      await pg.__ctx.close(); }
  });

  await b.close(); srv.close();
  return S.done();
}
if (import.meta.url === "file://" + process.argv[1]) run().then((ok) => process.exit(ok ? 0 : 1));
