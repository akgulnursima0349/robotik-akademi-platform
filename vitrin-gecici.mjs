import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
const D = "/tmp/labdist", tip = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png" };
const sv = createServer((q, r) => { let p = join(D, decodeURIComponent(q.url.split("?")[0])); if (p.endsWith("/")) p += "index.html"; if (!existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": tip[extname(p)] || "application/octet-stream" }); r.end(readFileSync(p)); }).listen(4999);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on("console", (m) => { if (m.type() === "error") console.log("KONSOL", m.text()); });
p.on("pageerror", (e) => console.log("SAYFA", e.message));
await p.addInitScript(() => { window.SRA_AYAR = {}; });
for (const a of (process.argv[2] || "on-sag").split(",")) {
  await p.goto(`http://localhost:4999/?${a}#vitrin/${a}`); await p.waitForSelector("body[data-hazir]", { timeout: 60000 }); await p.waitForTimeout(800);
  await p.screenshot({ path: `/tmp/vitrin_${a}.png` }); console.log("ok", a);
}
await b.close(); sv.close();
