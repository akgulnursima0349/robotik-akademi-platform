/* Portalın uçtan uca testleri: masaüstü, tablet ve telefonda.
   Önce: npm run derle  (ayar fark etmez; ayarlar.js her testte ağ katmanında değiştirilir)
   Çalıştır: npm run e2e     ·  SADECE=masaustu  ·  EKRAN=klasör (ekran görüntüleri) */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const KOK = resolve(import.meta.dirname, "..");
const PORT = 4300 + Math.floor(Math.random() * 500);
const ADRES = `http://localhost:${PORT}/`;
const EKRAN = process.env.EKRAN || resolve(KOK, ".ekran");
mkdirSync(EKRAN, { recursive: true });

const BOYUTLAR = [["masaustu", 1280, 860], ["tablet", 820, 1180], ["telefon", 390, 844]].filter(([a]) => !process.env.SADECE || process.env.SADECE === a);
let basarisiz = 0;
const ok = (kosul, mesaj) => { console.log(`  ${kosul ? "✓" : "✗"} ${mesaj}`); if (!kosul) basarisiz++; };

const sunucu = spawn(process.execPath, [resolve(KOK, "scripts/sun.mjs")], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
const tarayici = await chromium.launch();

async function sayfaAc(genislik, yukseklik, ayar) {
  const ctx = await tarayici.newContext({ viewport: { width: genislik, height: yukseklik } });
  const hatalar = [];
  await ctx.route(/\/ayarlar\.js$/, (r) => {
    const yol = new URL(r.request().url()).pathname;
    const degisken = yol.startsWith("/junior/") ? "JUNIOR_AYAR" : yol.startsWith("/ortaokul/") ? "ATOLYE_AYAR" : "SRA_AYAR";
    r.fulfill({ contentType: "text/javascript", body: `window.${degisken} = ${degisken === "SRA_AYAR" ? JSON.stringify(ayar) : "{}"};` });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|colab\.research|github\.io/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
  return { ctx, p, hatalar };
}
const hazir = (p) => p.waitForSelector("body[data-hazir]");
const tasmaYok = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\n${ad} (${g}px)`);

  /* --- deneme modu: sahte sunucu --- */
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
  const shot = (n) => p.screenshot({ path: `${EKRAN}/${ad}_${n}.png`, fullPage: true });
  await p.goto(ADRES); await hazir(p);
  ok((await p.$$(".sra-kurs")).length === 4, "dört kurs kartı");
  ok((await p.$$("a.sra-kurs")).length === 2 && (await p.$$(".sra-kurs--yakinda")).length === 2, "iki açık kurs, iki 'yakında'");
  ok(await p.isVisible("#p-giris"), "üst barda Giriş yap");
  ok(await tasmaYok(p), "yatay taşma yok");
  await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await shot("1_karsilama");

  await p.click('a.sra-kurs[data-kurs="junior"]');
  await p.waitForURL(/\/junior\/$/);
  await p.waitForFunction(() => document.querySelector("#app")?.children.length > 0);
  ok(true, "Junior kartı /junior/ adresini açtı ve Junior çalıştı");
  await p.goBack(); await hazir(p);
  await p.click('a.sra-kurs[data-kurs="ortaokul"]');
  await p.waitForURL(/\/ortaokul\/$/);
  await p.waitForFunction(() => document.querySelector("#app, body")?.innerText.length > 20);
  ok(true, "Python Atölyesi kartı /ortaokul/ adresini açtı");
  await p.goto(ADRES + "#giris"); await hazir(p);

  /* öğrenci girişi */
  await p.click("#g-ogrenci");
  await p.fill("#g-kod", "jnr123"); await p.fill("#g-ad", "Ece"); await p.fill("#g-pin", "12");
  await p.click("button[type=submit]");
  ok(/4 rakam/.test(await p.textContent(".sra-uyari")), "PIN biçimi sunucuya gitmeden denetleniyor");
  await p.fill("#g-pin", "9999"); await p.click("button[type=submit]");
  await p.waitForFunction(() => /hatalı/.test(document.querySelector(".sra-uyari")?.textContent ?? ""));
  ok(await p.inputValue("#g-pin") === "", "yanlış PIN: sade mesaj, PIN alanı temizlendi");
  ok((await p.textContent("button[type=submit]")).trim() === "Giriş yap", "giriş düğmesinin yazısı hatadan sonra düzgün");
  await shot("2_giris_hata");
  await p.fill("#g-pin", "1234"); await p.click("button[type=submit]");
  await p.waitForURL(/\/junior\/$/);
  ok(true, "Junior sınıfındaki öğrenci girişten sonra doğrudan /junior/ adresine gitti");
  await p.goto(ADRES); await hazir(p);
  ok(/Ece, kursuna devam et/.test(await p.textContent("#p-devam")), "portala dönünce oturum açık: 'kursuna devam et'");
  await p.click("#p-cikis"); await p.waitForSelector("#p-giris");
  ok(true, "çıkış yapınca Giriş yap düğmesi geri geldi");

  await p.goto(ADRES + "#giris"); await hazir(p);
  await p.click("#g-ogrenci");
  ok(await p.inputValue("#g-kod") === "JNR123", "son sınıf kodu hatırlanıyor");
  await p.fill("#g-kod", "ORT456"); await p.fill("#g-ad", "mert"); await p.fill("#g-pin", "5678"); await p.click("button[type=submit]");
  await p.waitForURL(/\/ortaokul\/$/);
  ok(true, "ortaokul sınıfındaki öğrenci /ortaokul/ adresine gitti");
  await p.goto(ADRES); await hazir(p); await p.click("#p-cikis"); await p.waitForSelector("#p-giris");

  await p.goto(ADRES + "#giris"); await hazir(p);
  await p.click("#g-ogrenci");
  await p.fill("#g-kod", "BLK789"); await p.fill("#g-ad", "Ada"); await p.fill("#g-pin", "1111"); await p.click("button[type=submit]");
  await p.waitForSelector(".p-yakinda");
  ok(/Blok Atölyesi hazırlanıyor/.test(await p.textContent(".p-yakinda h1")), "henüz açılmamış kursun öğrencisi 'hazırlanıyor' ekranına gitti");
  await shot("3_yakinda");
  await p.click("#p-cikis"); await p.waitForSelector("#p-giris");

  /* öğretmen girişi ve Panellerim */
  await p.goto(ADRES + "#giris"); await hazir(p);
  await p.click("#g-ogretmen");
  await p.fill("#g-eposta", "ogretmen@deneme.com"); await p.fill("#g-sifre", "yanlis"); await p.click("button[type=submit]");
  await p.waitForFunction(() => /hatalı/.test(document.querySelector(".sra-uyari")?.textContent ?? ""));
  ok(true, "yanlış şifre sade mesajla reddedildi");
  await p.fill("#g-sifre", "deneme123"); await p.click("button[type=submit]");
  await p.waitForSelector(".p-sinif[data-kod]");
  ok(await p.evaluate(() => location.hash) === "#panellerim", "öğretmen Panellerim'e gitti");
  ok((await p.$$('.p-kursgrup[data-kurs="junior"] .p-sinif[data-kod]')).length === 1 && (await p.$$('.p-kursgrup[data-kurs="ortaokul"] .p-sinif[data-kod]')).length === 1, "sınıflar kurslara göre gruplandı");
  ok(await p.getAttribute('.p-sinif[data-kod="JNR123"] .p-sinif__git a', "href") === "junior/#panel/s1", "Junior sınıfının paneli Junior'ın kendi paneline gidiyor");
  ok(await tasmaYok(p), "Panellerim'de yatay taşma yok");
  ok(await p.evaluate(() => document.querySelector(".sra-ustbar__ic").getBoundingClientRect().height < 80), "oturum açıkken üst bar tek satır");
  await shot("4_panellerim");
  await p.selectOption('.p-sinif[data-kod="ORT456"] select', "junior");
  await p.waitForFunction(() => document.querySelectorAll('.p-kursgrup[data-kurs="junior"] .p-sinif[data-kod]').length === 2);
  ok(true, "sınıfın kursu değiştirildi, sınıf Junior grubuna taşındı");
  await p.reload(); await p.waitForSelector(".p-sinif[data-kod]");
  ok((await p.$$('.p-kursgrup[data-kurs="junior"] .p-sinif[data-kod]')).length === 2, "değişiklik sayfa yenilenince de duruyor");
  await p.click("#p-cikis"); await p.waitForSelector("#p-giris");
  await p.goto(ADRES + "#panellerim"); await hazir(p);
  ok(await p.evaluate(() => location.hash) === "#giris", "girişsiz Panellerim giriş ekranına yönlendiriyor");

  /* yeni öğretmen hesabı */
  await p.click("#g-ogretmen"); await p.click("#g-kayit");
  await p.fill("#g-eposta", `yeni-${ad}@deneme.com`); await p.fill("#g-sifre", "gizli123"); await p.click("button[type=submit]");
  await p.waitForSelector("#g-adsoyad");
  await p.fill("#g-adsoyad", "Yeni Öğretmen"); await p.fill("#g-kurum", "YANLIS"); await p.click("button[type=submit]");
  await p.waitForFunction(() => /Kurum kodu/.test(document.querySelector(".sra-uyari")?.textContent ?? ""));
  await p.fill("#g-kurum", "DENEME-KURUM"); await p.click("button[type=submit]");
  await p.waitForSelector(".p-panel .sra-uyari, .p-sinif[data-kod]");
  ok(/Henüz sınıfın yok/.test(await p.textContent(".p-panel")), "yeni öğretmen hesabı açıldı; boş Panellerim");
  ok(hatalar.length === 0, "konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 3).join(" | ") : ""));
  await ctx.close();

  /* --- yerel mod: hesap yok --- */
  const y2 = await sayfaAc(g, y, {});
  await y2.p.goto(ADRES); await hazir(y2.p);
  ok(!(await y2.p.isVisible("#p-giris")), "hesapsız modda Giriş yap düğmesi yok");
  ok((await y2.p.$$("a.sra-kurs")).length === 2, "hesapsız modda kurs kartları doğrudan kursa gidiyor");
  await y2.p.goto(ADRES + "#giris"); await hazir(y2.p);
  ok(/hesapsız/.test(await y2.p.textContent(".p-giris__kutu")), "hesapsız modda giriş ekranı açıklama gösteriyor");
  ok(y2.hatalar.length === 0, "hesapsız modda konsol hatası yok");
  await y2.ctx.close();
}

/* tasarım sistemi örnek sayfası */
{
  const { ctx, p, hatalar } = await sayfaAc(1280, 860, {});
  await p.goto(ADRES + "ornekler.html");
  await p.waitForSelector(".o-bolum");
  ok((await p.$$(".o-bolum")).length >= 8, "\nornekler.html bütün bileşen bölümlerini gösteriyor");
  await p.screenshot({ path: `${EKRAN}/ornekler.png`, fullPage: true });
  ok(hatalar.length === 0, "ornekler.html konsol hatası yok");
  await ctx.close();
}

await tarayici.close();
sunucu.kill();
console.log(basarisiz ? `\n${basarisiz} madde başarısız` : "\nBütün maddeler geçti");
process.exit(basarisiz ? 1 : 0);
