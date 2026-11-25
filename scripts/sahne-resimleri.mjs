/* Ders anlatımındaki 3D sahne anlarının hazır resimleri (WebGL olmayan tarayıcı için).
   Önce: npm run derle  ·  Çalıştır: node scripts/sahne-resimleri.mjs
   Her dersin sahneli adımını açar, sahne hazır olunca çerçeveyi çeker: apps/portal/public/gorseller/<ad>.png
   (sonra webp'ye çevrilir). Modeller ya da sahne anları değişince yeniden çalıştırılır. */
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const KOK = resolve(import.meta.dirname, "..");
const HEDEF = resolve(KOK, "apps/portal/public/gorseller");
const PORT = 4800 + Math.floor(Math.random() * 100);
mkdirSync(HEDEF, { recursive: true });

/* hangi dersin hangi adımında hangi sahne var: kataloğu derlenmiş sayfadan okumak yerine dersleri tsx ile yükle */
const liste = JSON.parse(execFileSync("npx", ["tsx", "-e",
  `import { DERSLER } from "./packages/mufredat/src"; console.log(JSON.stringify(DERSLER.flatMap((d) => d.anlat.map((a, i) => a.gorsel?.tur === "sahne" ? { ders: d.kimlik, adim: i, ad: a.gorsel.ad } : null).filter(Boolean))));`
], { cwd: KOK, encoding: "utf8" }));
const tekil = [...new Map(liste.map((x) => [x.ad, x])).values()];

const sunucu = spawn(process.execPath, [resolve(KOK, "scripts/sun.mjs")], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));
const tarayici = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const { ders, adim, ad } of tekil) {
    const ctx = await tarayici.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
    await ctx.route(/\/ayarlar\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: "window.SRA_AYAR={};" }));
    await ctx.addInitScript(([d, a]) => localStorage.setItem("sra-ders-v1", JSON.stringify({ dersler: { [d]: { anlat: { adim: a, bitti: false } } } })), [ders, adim]);
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/#ders/${ders}`);
    await p.waitForSelector(`[data-sahne="${ad}"][data-hazir="1"]`, { timeout: 60000 });
    await p.addStyleTag({ content: ".sa-basa{display:none !important}" });
    await p.waitForTimeout(1500);
    const png = resolve(HEDEF, `${ad}.png`);
    await p.locator(`[data-sahne="${ad}"]`).screenshot({ path: png });
    execFileSync("python3", ["-c", `from PIL import Image; im=Image.open("${png}").convert("RGB"); im.thumbnail((800,600)); im.save("${png.replace(/\.png$/, ".webp")}", quality=82)`]);
    rmSync(png);
    console.log(`  ✓ ${ad}.webp`);
    await ctx.close();
  }
} finally { await tarayici.close(); sunucu.kill(); }
