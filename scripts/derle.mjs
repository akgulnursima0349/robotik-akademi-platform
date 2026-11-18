/* Platformu tek çıktıya derler:
     dist/            portal
     dist/junior/     Python Atölyesi Junior (submodule)
     dist/ortaokul/   Python Atölyesi (submodule, site/ klasörü)
   ve üç uygulamanın ayarlar.js dosyasını ayarlar/platform.json'dan yeniden yazar.
   Kullanım: node scripts/derle.mjs [--deneme] */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const KOK = resolve(import.meta.dirname, "..");
const DIST = join(KOK, "dist");
const arg = new Set(process.argv.slice(2));

/* Gerçek öğrencilerin bulunduğu proje(ler): platform bu projelere asla bağlanmaz. */
const GERCEK_PROJELER = ["dllbqjxhxrffjqwcnjjz"];

function ayarOku() {
  if (arg.has("--deneme")) return { deneme: true };
  const yol = join(KOK, "ayarlar", "platform.json");
  if (!existsSync(yol)) return {};
  const a = JSON.parse(readFileSync(yol, "utf8"));
  if (a.supabaseUrl && GERCEK_PROJELER.some((p) => a.supabaseUrl.includes(p))) {
    console.error("✗ ayarlar/platform.json gerçek öğrencilerin bulunduğu Supabase projesini gösteriyor. Platform yalnızca DEMO projesine bağlanır.");
    process.exit(1);
  }
  if (a.supabaseKey && !/^sb_publishable_|^eyJ/.test(a.supabaseKey)) {
    console.error("✗ supabaseKey publishable anahtar gibi görünmüyor. Secret / service_role anahtarı asla kullanılmaz.");
    process.exit(1);
  }
  return a;
}

const sh = (komut, cwd) => { console.log(`  $ ${komut}   (${cwd.replace(KOK + "/", "")})`); execSync(komut, { cwd, stdio: "inherit" }); };

const KURSLAR = [
  { ad: "junior", dizin: join(KOK, "kurslar/junior"), degisken: "JUNIOR_AYAR" },
  { ad: "ortaokul", dizin: join(KOK, "kurslar/ortaokul/site"), degisken: "ATOLYE_AYAR" }
];

function ayarDosyasi(degisken, deger) {
  return `/* Platform derlemesi tarafından üretildi (scripts/derle.mjs). Elle düzenleme; ayarlar/platform.json'u değiştir. */\nwindow.${degisken} = ${JSON.stringify(deger, null, 2)};\n`;
}

const ayar = ayarOku();
const mod = ayar.deneme ? "deneme" : ayar.supabaseUrl && ayar.supabaseKey ? "bulut" : "yerel";
/* Kurslar: bulut modunda aynı proje + ortak oturum anahtarı (tek giriş); deneme ve yerel modda hesapsız. */
const kursAyari = mod === "bulut" ? { supabaseUrl: ayar.supabaseUrl, supabaseKey: ayar.supabaseKey, storageKey: "sra-platform-auth" } : {};

console.log(`\nPlatform derleniyor · mod: ${mod}\n`);
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

console.log("• Portal");
sh(`npx vite build --outDir ${DIST} --emptyOutDir`, join(KOK, "apps/portal"));
writeFileSync(join(DIST, "ayarlar.js"), ayarDosyasi("SRA_AYAR", ayar));

{
  for (const k of KURSLAR) {
    console.log(`• Kurs: ${k.ad}`);
    if (!existsSync(join(k.dizin, "package.json"))) sh("git submodule update --init --depth 1", KOK);
    if (!existsSync(join(k.dizin, "node_modules"))) sh("npm ci --no-audit --no-fund", k.dizin);
    const hedef = join(DIST, k.ad);
    sh(`npx vite build --outDir ${hedef} --emptyOutDir`, k.dizin);
    writeFileSync(join(hedef, "ayarlar.js"), ayarDosyasi(k.degisken, kursAyari));
  }
}
console.log(`\n✓ Hazır: dist/  (npm run sun ile aç)\n`);
