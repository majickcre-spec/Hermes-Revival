// Builds public/app.html: the MMU app as a normal full page (not inside the srcdoc iframe).
// Needed for Web Bluetooth in browsers like Bluefy, which won't open Bluetooth from a sandboxed frame.
import { readFileSync, writeFileSync } from "node:fs";
const api = (process.env.VITE_API_URL || "").replace(/\/+$/, "");
let html = readFileSync(new URL("../src/pages/music-theory.game.html", import.meta.url), "utf8");
html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><script>window.__MJK_API__=" + JSON.stringify(api) + ";window.__MJK_FULLPAGE__=true;</scr" + "ipt></head><body>" + html + "</body></html>";
writeFileSync(new URL("../public/app.html", import.meta.url), html);
console.log("app.html written" + (api ? " (api " + api + ")" : ""));
