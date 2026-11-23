// Builds public/app.html: the MMU app as a normal full page (not inside the srcdoc iframe).
// Needed for Web Bluetooth in browsers like Bluefy, which won't open Bluetooth from a sandboxed frame.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
// build stamp: post-flight checks the live site serves this exact commit
let build = process.env.RAILWAY_GIT_COMMIT_SHA || "";
if (!build) { try { build = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) { build = "local"; } }
build = build.slice(0, 12);
const api = (process.env.VITE_API_URL || "").replace(/\/+$/, "");
let html = readFileSync(new URL("../src/pages/music-theory.game.html", import.meta.url), "utf8");
html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><script>window.__MJK_API__=" + JSON.stringify(api) + ";window.__MJK_FULLPAGE__=true;window.__MJK_BUILD__=" + JSON.stringify(build) + ";try{var q=new URLSearchParams(location.search);if(q.get(\"for\"))window.__MJK_FOR__=q.get(\"for\");if(q.get(\"focus\"))window.__MJK_FOCUS__=q.get(\"focus\");}catch(e){}</scr" + "ipt></head><body>" + html + "</body></html>";
writeFileSync(new URL("../public/app.html", import.meta.url), html);
console.log("app.html written" + (api ? " (api " + api + ")" : ""));

// Heads of Things is PRIVATE: it is served only by the backend (/api/heads) to the Travis and Star accounts — never written into public/.
