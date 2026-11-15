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
const smoke = await import("./smoke.mjs"); if (!(await smoke.run())) ok = false;
const data = await import("./data-safety.mjs"); if (!(await data.run())) ok = false;
const syncs = await import("./sync-safety.mjs"); if (!(await syncs.run())) ok = false;
console.log(ok ? "\nPRE-FLIGHT PASSED — safe to push" : "\nPRE-FLIGHT FAILED — do not push");
process.exit(ok ? 0 : 1);
