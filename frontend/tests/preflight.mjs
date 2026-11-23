// PRE-FLIGHT: run before every push. Builds, syntax-checks, then smoke + data-safety regression. Exit 1 blocks the push.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
let ok = true;
const step = (name, fn) => { process.stdout.write("▶ " + name + "\n"); try { fn(); console.log("  ✓ " + name); } catch (e) { ok = false; console.log("  ✗ " + name + "\n" + String(e.stdout || e.message).slice(0, 2000)); } };

step("build app.html", () => execSync("node scripts/make-app.mjs", { cwd: root, stdio: "pipe" }));
step("syntax check (every inline script)", () => {
  const html = readFileSync(join(root, "public/app.html"), "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  scripts.forEach((js, i) => { const f = join(tmpdir(), "mmu-inline-" + i + ".js"); writeFileSync(f, js); execSync("node --check " + f, { stdio: "pipe" }); });
});
step("state baseline written", () => {
  const html = readFileSync(join(root, "public/app.html"), "utf8");
  const state = { at: new Date().toISOString(), bytes: html.length, journeys: (html.match(/\{id:"[a-z0-9]+",ic:/g) || []).length, build: (html.match(/__MJK_BUILD__=("[^"]*")/) || [])[1] || null };
  writeFileSync(join(root, "tests/.state.json"), JSON.stringify(state, null, 2));
});
const FULL = process.argv.includes("--full");
// Checks, run as side-by-side shards (most of the time is waiting, not computing).
const N = Number(process.env.SHARDS || 2), t0 = Date.now();
const { spawn } = await import("node:child_process");
const codes = await Promise.all(Array.from({ length: N }, (_, i) => new Promise((res) => {
  const c = spawn(process.execPath, [join(root, "tests/shard.mjs")], { cwd: root, env: { ...process.env, SHARD: i + "/" + N, ...(FULL ? {} : { QUICK: "1" }) } });
  let out = ""; c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (out += d));
  c.on("close", (code) => { console.log("── shard " + (i + 1) + "/" + N + " ──\n" + out.split("\n").filter((l) => /✓|✗|passed|Error|^\s{6}/.test(l)).join("\n")); res(code); });
})));
if (codes.some((c) => c !== 0)) ok = false;
const all = codes.length; console.log("\nchecks took " + Math.round((Date.now() - t0) / 1000) + "s across " + N + " shards");
console.log(ok ? "\nPRE-FLIGHT PASSED — safe to push" + (FULL ? " (full check)" : "") : "\nPRE-FLIGHT FAILED — do not push");
process.exit(ok ? 0 : 1);
