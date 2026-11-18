/* dist/ klasörünü yerelde sunar (internet gerekmez). PORT ortam değişkeniyle port değişir. */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const KOK = resolve(import.meta.dirname, "..", process.env.DIZIN || "dist");
const PORT = Number(process.env.PORT || 4173);
const TUR = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff",
  ".wasm": "application/wasm", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".ipynb": "application/json" };

createServer((istek, cevap) => {
  let yol = decodeURIComponent(new URL(istek.url, "http://x").pathname);
  let dosya = normalize(join(KOK, yol));
  if (!dosya.startsWith(KOK)) { cevap.writeHead(403).end(); return; }
  if (existsSync(dosya) && statSync(dosya).isDirectory()) {
    if (!yol.endsWith("/")) { cevap.writeHead(301, { Location: yol + "/" }).end(); return; }
    dosya = join(dosya, "index.html");
  }
  if (!existsSync(dosya)) { cevap.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Bulunamadı"); return; }
  cevap.writeHead(200, { "Content-Type": TUR[extname(dosya)] || "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(dosya).pipe(cevap);
}).listen(PORT, () => console.log(`Platform: http://localhost:${PORT}/`));
