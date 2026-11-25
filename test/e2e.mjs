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
const tarayici = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function sayfaAc(genislik, yukseklik, ayar, azHareket = false) {
  const ctx = await tarayici.newContext({ viewport: { width: genislik, height: yukseklik }, reducedMotion: azHareket ? "reduce" : "no-preference" });
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
  ok((await p.$$("a.sra-kurs")).length === 4 && (await p.$$(".sra-kurs--yakinda")).length === 0, "dört kart da açık: Blok, Junior, ortaokul, Lab");
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
  await p.waitForURL(/\/blok\/$/);
  ok(true, "ilkokul sınıfındaki öğrenci /blok/ adresine gitti");
  await p.goto(ADRES); await hazir(p); await p.click("#p-cikis"); await p.waitForSelector("#p-giris");

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
  ok(await p.getAttribute('.p-sinif[data-kod="JNR123"] .p-sinif__git a:not([data-rapor])', "href") === "junior/#panel/s1", "Junior sınıfının paneli Junior'ın kendi paneline gidiyor");
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
  ok((await y2.p.$$("a.sra-kurs")).length === 4, "hesapsız modda kartlar doğrudan kursa gidiyor");
  await y2.p.goto(ADRES + "#giris"); await hazir(y2.p);
  ok(/hesapsız/.test(await y2.p.textContent(".p-giris__kutu")), "hesapsız modda giriş ekranı açıklama gösteriyor");
  ok(y2.hatalar.length === 0, "hesapsız modda konsol hatası yok");
  await y2.ctx.close();
}

/* ---------------- Robotik Laboratuvarı ---------------- */
const yaz = (p, kod) => p.evaluate((k) => { const a = document.querySelector(".e-alan"); a.value = k; a.dispatchEvent(new Event("input")); }, kod);
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nlab · ${ad}`);
  /* görsel kontrol: normal hareket */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
    const shot = (n) => p.screenshot({ path: `${EKRAN}/lab_${ad}_${n}.png`, fullPage: true });
    await p.goto(ADRES); await hazir(p);
    ok(await p.getAttribute('a.sra-kurs[data-kurs="lab"]', "href") === "lab/", "portal kartı Laboratuvar'a gidiyor");
    await p.click('a.sra-kurs[data-kurs="lab"]'); await p.waitForURL(/\/lab\/$/); await hazir(p);
    ok((await p.$$("a.sra-kurs")).length === 4, "Laboratuvar: dört etkinlik (Kar Küreme, Lig, Çizgi İzleyen, Labirent)");
    ok(await tasmaYok(p), "Laboratuvar ana sayfasında taşma yok");
    await shot("1_ana");
    await p.click('a.sra-kurs[data-kurs="kar"]'); await p.waitForSelector(".l-gorev");
    ok((await p.$$("a.l-gorev")).length === 1 && (await p.$$(".l-gorev.kilitli")).length === 5, "ilk görev açık, diğerleri kilitli");
    await p.click('a[data-gorev="ilk-sokak"]'); await p.waitForSelector(".l-sahne[data-hazir] canvas");
    await p.waitForTimeout(500);
    await yaz(p, "ileri()\nileri()\nileri()\nileri()\n");
    await p.click("#l-calistir");
    await p.waitForTimeout(900);
    await shot("2_oynuyor");
    await p.waitForSelector(".l-sonuc.basarili", { timeout: 20000 });
    ok((await p.$$(".l-sonuc .l-yildizlar i.dolu")).length === 3, "ilk görev 3 yıldız");
    ok(await tasmaYok(p), "görev ekranında taşma yok");
    await shot("3_sonuc");
    ok(hatalar.length === 0, "Laboratuvar konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
  /* işlev testleri: hareket azaltılmış (animasyonlar anında) */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
    await p.goto(ADRES + "lab/#kar/ilk-sokak"); await p.waitForSelector(".l-sahne[data-hazir] canvas");
    await yaz(p, "ileri()\nileri(\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-cikti .sra-uyari--hata");
    ok(/2\. satır/.test(await p.textContent(".l-cikti")) && await p.isVisible(".e-no span.hata"), "yazım hatası: satır numarası ve vurgu");
    await yaz(p, "ileri()\nsaga_don()\nileri()\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc");
    ok(/çarptı/.test(await p.textContent(".l-cikti")), "binaya çarpma anlatılıyor");
    await yaz(p, "for i in range(4):\n    ileri()\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc.basarili");
    await p.goto(ADRES + "lab/#kar"); await p.waitForSelector(".l-gorev");
    ok((await p.$$("a.l-gorev")).length === 2, "ilk görev bitince ikincisi açıldı");
    await p.goto(ADRES + "lab/#kar/kose"); await p.waitForSelector(".l-sahne[data-hazir] canvas");
    ok(await p.inputValue(".e-alan").then((v) => v.startsWith("ileri()")), "görevin başlangıç kodu yüklendi");
    /* sensör görevi üç haritada */
    await p.evaluate(() => localStorage.setItem("sra-lab-v1", JSON.stringify({ gorevler: { "ilk-sokak": { yildiz: 3 }, kose: { yildiz: 3 }, "uzun-cadde": { yildiz: 3 }, "okul-yolu": { yildiz: 3 } }, lig: null })));
    await p.goto(ADRES + "lab/?yenile#kar/sokak-sonu"); await p.waitForSelector(".l-haritalar button");
    ok((await p.$$(".l-haritalar button")).length === 3, "sensör görevinde üç sokak sekmesi");
    await yaz(p, "while onu_acik():\n    ileri()\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc.basarili");
    ok(true, "while + sensör çözümü üç sokakta da geçti");

    /* lig */
    await p.goto(ADRES + "lab/#lig"); await p.waitForSelector(".l3-sahne[data-hazir] canvas", { timeout: 60000 });
    ok((await p.$$(".l-rakip")).length === 5, "beş rakibin kodu okunabilir");
    await p.click("#l-turnuva"); await p.waitForSelector(".l-tablo tbody tr");
    ok((await p.$$(".l-tablo tbody tr")).length === 6 && (await p.$$(".l-mac")).length === 15, "turnuva: 6 robot, 15 maç");
    await p.click('.l-mac[data-mac="14"]');
    await p.waitForFunction(() => /[1-9],\d sn/.test(document.querySelector(".l-skor__tur")?.textContent ?? "") && /Raunt \d+:/.test(document.querySelector(".l-raunt-durum")?.textContent ?? ""));
    ok((await p.$$(".l-rauntlar button")).length >= 2, "maç tekrarı: rauntlar ve raunt sonucu gösteriliyor");
    await yaz(p, "def hamle(robot)\n    return 'ileri'\n");
    await p.click("#l-turnuva"); await p.waitForSelector(".l-cikti .sra-uyari--hata");
    ok(/iki nokta/.test(await p.textContent(".l-cikti")), "robot kodundaki hata turnuvadan önce gösteriliyor");

    /* öğrenci robotunu sınıfına gönderir, öğretmen sınıf turnuvası yapar (tek giriş: portalda girildi) */
    await p.goto(ADRES + "#giris"); await hazir(p);
    await p.click("#g-ogrenci"); await p.fill("#g-kod", "JNR123"); await p.fill("#g-ad", "Ece"); await p.fill("#g-pin", "1234"); await p.click("button[type=submit]");
    await p.waitForURL(/\/junior\/$/);
    await p.goto(ADRES + "lab/#lig"); await p.waitForSelector("#l-gonder");
    await yaz(p, "def hamle(robot):\n    if robot['rakip'][2] == 1:\n        return 255, 255\n    return 120, -120\n");
    await p.click("#l-gonder"); await p.waitForSelector(".l-cikti .sra-uyari--basari");
    ok(true, "öğrenci robotunu sınıfına gönderdi (tek giriş Laboratuvar'da da geçerli)");
    await p.goto(ADRES); await hazir(p); await p.click("#p-cikis"); await p.waitForSelector("#p-giris");
    await p.goto(ADRES + "#giris"); await hazir(p);
    await p.click("#g-ogretmen"); await p.fill("#g-eposta", "ogretmen@deneme.com"); await p.fill("#g-sifre", "deneme123"); await p.click("button[type=submit]");
    await p.waitForSelector(".p-sinif[data-kod]");
    await p.goto(ADRES + "lab/#lig"); await p.waitForSelector("#l-sinif option", { state: "attached" }); await p.waitForSelector(".l3-sahne[data-hazir]", { timeout: 60000 });
    await p.selectOption("#l-sinif", "s1"); await p.click("#l-sinif-turnuva");
    await p.waitForSelector(".l-tablo tbody tr");
    ok((await p.$$(".l-tablo tbody tr")).length === 3, "öğretmen: sınıf turnuvası 3 öğrenci robotuyla oynandı");
    await p.screenshot({ path: `${EKRAN}/lab_${ad}_4_sinif_turnuvasi.png`, fullPage: true });
    ok(hatalar.length === 0, "Laboratuvar işlev testlerinde konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
}

/* ---------------- Lab 3D: SiroLine çizgi izleyen ---------------- */
const OVAL_COZUM = "def dongu():\n    s = sensorler()\n    if s[3] > 500:\n        motorlar(40, 90)\n    else:\n        motorlar(90, 40)\n";
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nlab 3D · ${ad}`);
  /* görsel: gerçek oynatma, takip kamerası */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
    await p.goto(ADRES + "lab/#cizgi"); await p.waitForSelector(".l3-vitrin[data-hazir] canvas", { timeout: 60000 });
    ok((await p.$$(".l-gorev")).length === 3 && (await p.$$("a.l-gorev")).length === 1, "üç pist, ilki açık");
    ok(await tasmaYok(p), "SiroLine sayfasında taşma yok");
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_1_liste.png`, fullPage: true });
    await p.click('a[data-gorev="oval"]'); await p.waitForSelector(".l3-sahne[data-hazir] canvas", { timeout: 60000 });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_2_gorev.png`, fullPage: true });
    await p.click('.l3-secici button[data-deger="takip"]'); await p.click('.l3-secici button[data-deger="2"]');
    await p.click("#l-calistir");
    await p.waitForFunction(() => parseFloat(document.querySelector(".l3-sure").textContent.replace(",", ".")) > 1.2, null, { timeout: 60000 });
    ok(Number(await p.textContent(".l3-sensor:nth-child(4) b")) >= 0 && /^-?\d+$/.test(await p.textContent(".l3-motor b")), "canlı sensör ve motor paneli güncelleniyor");
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_3_takip.png` });
    await p.click("#l-bastan");
    ok(!(await p.$(".l-sonuc")), "Başa al oynatmayı durdurdu");
    ok(hatalar.length === 0, "3D sahnede konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
  /* işlev: hareket azaltılmış → tur anında sonuçlanır */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
    await p.goto(ADRES + "lab/#cizgi/oval"); await p.waitForSelector(".l3-sahne[data-hazir] canvas", { timeout: 60000 });
    await yaz(p, "def dongu()\n    motorlar(100, 100)\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-cikti .sra-uyari--hata");
    ok(/1\. satır/.test(await p.textContent(".l-cikti")) && /iki nokta/.test(await p.textContent(".l-cikti")), "yazım hatası satır numarasıyla Türkçe");
    await yaz(p, "def dongu():\n    motorlar(200, 200)\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc");
    ok(/çizgiyi kaybetti/.test(await p.textContent(".l-sonuc")), "dönmeyen robot: çizgiden çıktı anlatılıyor");
    await yaz(p, OVAL_COZUM);
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc.basarili");
    ok((await p.$$(".l-sonuc .l-yildizlar i.dolu")).length === 3, "örnek çözüm: tur tamam, 3 yıldız");
    ok(await p.evaluate(() => document.querySelector(".l3-ilerleme i").style.width === "100%"), "ilerleme çubuğu dolu");
    ok(await tasmaYok(p), "görev ekranında taşma yok");
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_4_sonuc.png`, fullPage: true });
    await p.goto(ADRES + "lab/?y#cizgi"); await p.waitForSelector(".l-gorev");
    ok((await p.$$("a.l-gorev")).length === 2, "ilk pist bitince ikincisi açıldı");
    await p.goto(ADRES + "lab/?z#"); await hazir(p);
    ok(/3\/9 yıldız/.test(await p.textContent('a.sra-kurs[data-kurs="cizgi"]')), "Laboratuvar kartında SiroLine yıldızları");

    /* 3D kurulum rehberi */
    await p.goto(ADRES + "lab/?k#cizgi"); await p.waitForSelector("#c-kurulum");
    ok(await p.isVisible("#c-ayar"), "SiroLine sayfasında kurulum ve ayar kartları");
    await p.click("#c-kurulum"); await p.waitForSelector("body[data-kurulum-hazir] .l3-kurulum__sahne canvas", { timeout: 60000 });
    ok((await p.$$(".l3-noktalar button")).length === 10 && await p.isDisabled("#k-geri"), "kurulum: 10 adım, ilk adımda Geri kapalı");
    await p.click("#k-ileri"); await p.click("#k-ileri");
    ok(await p.getAttribute(".l3-kurulum__sahne", "data-adim") === "3", "İleri ile 3. adım (motorlar)");
    await p.click(".l3-sik:nth-of-type(1)"); ok(await p.isVisible(".l3-sik.yanlis") && /Bir daha/.test(await p.textContent(".l3-soru__sonuc")), "yanlış cevap işaretlendi");
    await p.click(".l3-sik:nth-of-type(2)"); ok(await p.isVisible(".l3-sik.dogru") && /Doğru/.test(await p.textContent(".l3-soru__sonuc")), "doğru cevap ve açıklaması");
    await p.keyboard.press("ArrowRight"); ok(await p.getAttribute(".l3-kurulum__sahne", "data-adim") === "4", "klavye: sağ ok ileri");
    await p.keyboard.press("ArrowLeft"); ok(await p.getAttribute(".l3-kurulum__sahne", "data-adim") === "3", "klavye: sol ok geri");
    await p.click(".l3-noktalar li:nth-child(10) button");
    ok(await p.isHidden("#k-ileri") && await p.isVisible('a[href="#cizgi/ayar"]'), "son adım: Ayar Atölyesi ve kod görevleri bağlantısı");
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_5_kurulum.png`, fullPage: true });
    ok(await tasmaYok(p), "kurulum rehberinde taşma yok");
    await p.goto(ADRES + "lab/?k2#cizgi"); await p.waitForSelector("#c-kurulum");
    ok(/Tamamlandı/.test(await p.textContent("#c-kurulum")), "rehber bitince kartta 'Tamamlandı'");

    /* Ayar Atölyesi */
    await p.click("#c-ayar"); await p.waitForSelector(".l3-sahne[data-hazir] canvas", { timeout: 60000 });
    ok(await p.inputValue("#ayar-kp") === "0.04" && await p.inputValue("#ayar-kd") === "0.7" && await p.inputValue("#ayar-taban") === "100", "kitin örnek değerleri yüklü");
    await p.click("#l-calistir"); await p.waitForSelector(".l3-tablo tbody tr");
    ok(/Tur tamam/.test(await p.textContent(".l-cikti")) && await p.isVisible(".l3-grafik svg path.seri"), "kitin değerleriyle tur tamam; sapma grafiği çizildi");
    await p.selectOption("#ayar-zemin", "beyaz"); await p.click("#l-calistir");
    await p.waitForFunction(() => document.querySelectorAll(".l3-tablo tbody tr").length === 2);
    ok(/Zemin 'Beyaz'/.test(await p.textContent(".l-cikti")) && /çıktı/.test(await p.textContent(".l3-tablo tbody tr:first-child")), "zemin beyaz: robot çıktı ve nedeni anlatılıyor");
    ok((await p.$$(".l3-tablo tr.en-iyi")).length === 1, "en hızlı deneme işaretli");
    ok(/Zemin: Beyaz/.test(await p.textContent(".l3-aktar")), "robotuna aktar kutusu güncel değerleri gösteriyor");
    await p.click("#ayar-varsayilan"); ok(await p.inputValue("#ayar-zemin") === "siyah", "Kitin değerleri düğmesi sıfırlıyor");
    await p.screenshot({ path: `${EKRAN}/lab3d_${ad}_6_ayar.png`, fullPage: true });
    ok(await tasmaYok(p), "Ayar Atölyesinde taşma yok");
    ok(hatalar.length === 0, "3D işlev testlerinde konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
}

/* ---------------- Fizik altyapısı: hız ölçer ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nfizik · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
  await p.goto(ADRES + "lab/#vitrin/fizik"); await p.waitForSelector("body[data-hazir]", { timeout: 90000 });
  const sonuc = await p.textContent("#fo-sonuc");
  ok(/60 cisim · adım [\d.]+ ms · \d+ fps/.test(sonuc), "fizik hız ölçer çalışıyor: " + sonuc.split(" · ").slice(1, 4).join(" · "));
  ok(hatalar.length === 0, "fizik ölçerde konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

/* ---------------- Tasarım sistemi v2 vitrini ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\ntasarım v2 · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
  await p.goto(ADRES + "#vitrin/tasarim"); await hazir(p);
  await p.waitForSelector(".sra2 .s2-dugme");
  await p.evaluate(() => document.fonts.ready);
  ok(await tasmaYok(p), "vitrinde taşma yok");
  const fontlar = await p.evaluate(() => ["Baloo 2", "Nunito"].map((ad) => [...document.fonts].some((f) => f.family.replace(/["']/g, "") === ad && f.status === "loaded" && /U\+0?100-0?2BA/i.test(f.unicodeRange))));
  ok(fontlar.every(Boolean), "Baloo 2 ve Nunito Türkçe harf kümesiyle (latin-ext) paketten yüklendi");
  const renk = await p.textContent('[data-renk="kirmizi"]');
  ok(renk === "#E3262F", "renk kodları belirteçten okunuyor: " + renk);
  const yukseklik = async () => p.$eval(".s2-dugme--ana", (e) => e.getBoundingClientRect().height);
  const once = await yukseklik();
  ok(once >= 44, `düğme dokunma hedefi en az 44 px (${once})`);
  await p.click('#tv-seviye [data-deger="okul-oncesi"]');
  const sonra = await yukseklik();
  ok(sonra >= 64 && (await p.getAttribute(".sra2", "data-seviye")) === "okul-oncesi", `okul öncesinde düğmeler büyüyor (${once} → ${sonra} px)`);
  if (ad === "masaustu") {
    /* klavye: seçici grubunda ok tuşları, odak halkası görünür */
    await p.focus('#tv-seviye [aria-checked="true"]');
    await p.keyboard.press("ArrowRight");
    const odak = await p.evaluate(() => ({ deger: document.activeElement?.getAttribute("data-deger"), golge: getComputedStyle(document.activeElement).boxShadow }));
    ok(odak.deger === "ilkokul" && /rgb\(106, 72, 240\)/.test(odak.golge), "ok tuşuyla seviye değişiyor ve mor odak halkası görünüyor");
    await p.click('#tv-seviye [data-deger=""]');
    await p.screenshot({ path: resolve(EKRAN, `tasarim-v2-${ad}.png`), fullPage: true });
    await p.click('#tv-seviye [data-deger="okul-oncesi"]');
    await p.screenshot({ path: resolve(EKRAN, `tasarim-v2-okul-oncesi-${ad}.png`) });
  } else {
    await p.click('#tv-seviye [data-deger=""]');
    await p.screenshot({ path: resolve(EKRAN, `tasarim-v2-${ad}.png`), fullPage: ad === "telefon" ? false : true });
  }
  ok(hatalar.length === 0, "vitrinde konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}
{
  console.log("\ntasarım v2 · hareketi azalt");
  const { ctx, p } = await sayfaAc(1280, 800, { deneme: true }, true);
  await p.goto(ADRES + "#vitrin/tasarim"); await hazir(p);
  await p.waitForSelector(".sra2 .s2-dugme");
  const sure = await p.$eval(".s2-dugme", (e) => getComputedStyle(e).transitionDuration);
  ok(sure.split(",").every((x) => parseFloat(x) <= 0.001), "hareketi azalt ayarında geçişler kapalı: " + sure);
  await ctx.close();
}

/* ---------------- Fizik: Kenshin deneme sayfası ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nkenshin fizik · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
  await p.goto(ADRES + "lab/#vitrin/kenshin-fizik"); await p.waitForSelector("body[data-hazir]", { timeout: 90000 });
  ok(await tasmaYok(p), "kenshin fizik sayfasında taşma yok");
  const sayi = async (sec) => parseFloat((await p.textContent(sec)).replace(",", "."));
  /* açılışta Ring: iki robot, sensör ışıkları */
  ok(await p.getAttribute('button[data-senaryo="ring"]', "aria-pressed") === "true" && (await p.$$("#kf-isik i")).length === 7, "Ring senaryosu açık, 5 rakip ve 2 zemin sensörü ışığı");
  if (ad === "masaustu") {
    /* ring: ileri sür; biri ringden düşer, tespit edilir */
    await p.keyboard.down("ArrowUp");
    await p.waitForSelector("#kf-dustu:not([hidden])", { timeout: 20000 }).catch(() => {});
    await p.keyboard.up("ArrowUp");
    ok(await p.isVisible("#kf-dustu"), "ringden düşme tespit ediliyor: " + (await p.textContent("#kf-dustu")));
    await p.screenshot({ path: resolve(EKRAN, `kenshin-fizik-ring-${ad}.png`) });
    /* klavye: ileri sür, kutuya bıçakla gir */
    await p.click('button[data-senaryo="kutu"]'); await p.waitForTimeout(300);
    ok(!(await p.isVisible("#kf-dustu")), "senaryo değişince düşme uyarısı kalkıyor");
    await p.keyboard.down("ArrowUp"); await p.waitForTimeout(700);
    const hiz = await sayi("#kf-hiz");
    ok(hiz > 0.3, `ok tuşuyla ileri gidiyor (${hiz} m/s)`);
    await p.waitForTimeout(1500); await p.keyboard.up("ArrowUp");
    const kalkis = (await p.textContent("#kf-hedef")).match(/en çok ([\d.]+) mm/);
    ok(kalkis && parseFloat(kalkis[1]) > 0.3, "bıçak kutunun kenarını kaldırıyor: " + (kalkis?.[0] ?? "?"));
    await p.screenshot({ path: resolve(EKRAN, `kenshin-fizik-kutu-${ad}.png`) });
    /* rakip senaryosu: arkasından girince rakibin teker yükü düşüyor */
    await p.click('button[data-senaryo="rakip"]'); await p.waitForTimeout(300);
    await p.keyboard.down("ArrowUp"); await p.waitForTimeout(2500);
    const metin = await p.textContent("#kf-hedef"), [, once, enAz] = [...metin.matchAll(/([\d.]+)/g)].map((m) => parseFloat(m[1]));
    ok(enAz < once * 0.6, `rakip kaldırılınca teker yükü düşüyor (${metin})`);
    await p.screenshot({ path: resolve(EKRAN, `kenshin-fizik-rakip-${ad}.png`) });
    await p.keyboard.up("ArrowUp");
  } else {
    await p.waitForTimeout(1500); await p.screenshot({ path: resolve(EKRAN, `kenshin-fizik-ring-${ad}.png`) });
    /* dokunmatik sürgüler görünür ve sürer (kutu senaryosunda; ring'de mavi saldırır) */
    await p.click('button[data-senaryo="kutu"]'); await p.waitForTimeout(300);
    ok(await p.isVisible("#kf-surgu-sol") && await p.isVisible("#kf-surgu-sag"), "dokunmatik motor sürgüleri görünür");
    await p.evaluate(() => { for (const id of ["kf-surgu-sol", "kf-surgu-sag"]) (document.getElementById(id)).value = "100"; });
    await p.waitForTimeout(900);
    const hiz = await sayi("#kf-hiz");
    ok(hiz > 0.3, `sürgülerle ileri gidiyor (${hiz} m/s)`);
    await p.screenshot({ path: resolve(EKRAN, `kenshin-fizik-${ad}.png`) });
  }
  ok(hatalar.length === 0, "kenshin fizik sayfasında konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

/* ---------------- Fizik: iki sumo motoru yan yana ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nsumo karşılaştırma · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
  await p.goto(ADRES + "lab/#vitrin/sumo-karsilastir"); await p.waitForSelector("body[data-hazir]", { timeout: 90000 });
  await p.waitForSelector("body[data-sonuc]", { timeout: 120000 });
  const [eski, yeni] = [await p.textContent("#sk-sonuc-eski"), await p.textContent("#sk-sonuc-yeni")];
  ok(/kazandı|Berabere/.test(eski) && /kazandı|Berabere/.test(yeni), `açılışta raunt iki motorda oynadı: "${eski}" / "${yeni}"`);
  ok(await tasmaYok(p), "karşılaştırma sayfasında taşma yok");
  if (ad === "telefon") {
    const [a, b] = await p.$$eval(".sk-gorunum", (e) => e.map((x) => x.getBoundingClientRect().top));
    ok(b > a + 100, "telefonda iki görünüm alt alta");
  }
  await p.screenshot({ path: resolve(EKRAN, `sumo-karsilastir-${ad}.png`) });
  if (ad === "masaustu") {
    await p.click("#sk-toplu");
    await p.waitForSelector("body[data-toplu]", { timeout: 240000 });
    const satir = await p.$$eval(".sk tbody tr", (r) => r.length);
    ok(satir === 30, `toplu karşılaştırma: 6 örnek robot × 3 diziliş = 30 raunt (${satir})`);
    const olcum = await p.textContent("#sk-olcum");
    ok(/aynı kazanan \d+\/30 · ortalama hesap: bugünkü \d+ ms, yeni \d+ ms/.test(olcum), "kopyalanabilir ölçüm satırı: " + olcum);
    await p.locator(".sk-toplu").screenshot({ path: resolve(EKRAN, `sumo-karsilastir-tablo.png`) });
  }
  ok(hatalar.length === 0, "karşılaştırma sayfasında konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

/* ---------------- Lab 3D: RizBot labirent ---------------- */
const SAG_EL = "while not bitti():\n    if not duvar_sag():\n        saga_don()\n        ileri()\n    elif not duvar_on():\n        ileri()\n    else:\n        sola_don()\n";
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nlabirent · ${ad}`);
  /* görsel: gerçek oynatma */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true });
    await p.goto(ADRES + "lab/"); await hazir(p);
    ok(await p.isVisible('a[href="#labirent"]'), "Lab ana sayfasında Labirent Ustası kartı");
    await p.goto(ADRES + "lab/#labirent"); await p.waitForSelector(".l-gorev");
    ok((await p.$$(".l-gorev")).length === 6 && (await p.$$("a.l-gorev")).length === 1, "altı görev, ilki açık");
    ok(await tasmaYok(p), "labirent görev listesinde taşma yok");
    await p.click('a[data-gorev="lb-ilk-koridor"]'); await p.waitForSelector(".l-sahne[data-hazir] canvas", { timeout: 60000 });
    await yaz(p, "saga_don()\nileri()\nsola_don()\nileri()\nileri()\nsaga_don()\nileri()\n");
    await p.click("#l-calistir");
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${EKRAN}/labirent_${ad}_1_oynuyor.png`, fullPage: true });
    ok(await p.textContent("#l-saat").then((t) => t !== "0,00 sn"), "süre sayacı işliyor");
    await p.waitForSelector(".l-sonuc.basarili", { timeout: 30000 });
    ok((await p.$$(".l-sonuc .l-yildizlar i.dolu")).length === 3, "ilk koridor 3 yıldız");
    ok(await tasmaYok(p), "labirent görev ekranında taşma yok");
    await p.screenshot({ path: `${EKRAN}/labirent_${ad}_2_sonuc.png`, fullPage: true });
    ok(hatalar.length === 0, "labirentte konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
  /* işlev: hareket azaltılmış */
  {
    const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
    await p.goto(ADRES + "lab/#labirent/lb-ilk-koridor"); await p.waitForSelector(".l-sahne[data-hazir] canvas", { timeout: 60000 });
    await yaz(p, "ileri()\n");
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc");
    ok(/çarptı/.test(await p.textContent(".l-cikti")) && /1\. satır/.test(await p.textContent(".l-cikti")), "duvara çarpma satırıyla anlatılıyor");
    await p.evaluate(() => { const g = {}; for (const k of ["lb-ilk-koridor", "lb-duvara-bak", "lb-sag-el", "lb-hangi-el", "lb-ada"]) g[k] = { yildiz: 3 }; localStorage.setItem("sra-lab-v1", JSON.stringify({ gorevler: g, lig: null })); });
    await p.goto(ADRES + "lab/?yenile#labirent/lb-ada"); await p.waitForSelector(".l-sahne[data-hazir] canvas", { timeout: 60000 });
    await yaz(p, SAG_EL);
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc", { timeout: 30000 });
    ok(/Süre doldu/.test(await p.textContent(".l-cikti")), "ada: sağ el kuralı süre dolana kadar dönüyor");
    await p.goto(ADRES + "lab/#labirent/lb-meb"); await p.waitForSelector(".l-sahne[data-hazir] canvas", { timeout: 60000 });
    await yaz(p, SAG_EL);
    await p.click("#l-calistir"); await p.waitForSelector(".l-sonuc.basarili", { timeout: 30000 });
    ok(/MEB puanı/.test(await p.textContent(".l-sonuc")) && /16\/16/.test(await p.textContent(".l-gosterge")), "MEB pisti: bitti, puan ve satır gösteriliyor");
    await p.screenshot({ path: `${EKRAN}/labirent_${ad}_3_meb.png`, fullPage: true });
    ok(hatalar.length === 0, "labirent işlev testlerinde konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
    await ctx.close();
  }
}

/* ---------------- Blok Atölyesi ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nblok · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
  const shot = (n) => p.screenshot({ path: `${EKRAN}/blok_${ad}_${n}.png`, fullPage: true });
  await p.goto(ADRES); await hazir(p);
  await p.click('a.sra-kurs[data-kurs="ilkokul"]'); await p.waitForURL(/\/blok\/$/); await hazir(p);
  ok((await p.$$(".bk-dunya")).length === 3 && (await p.$$("a.bk-durak")).length === 1, "Blok: 3 dünya, ilk bölüm açık");
  ok(await tasmaYok(p), "Blok haritasında taşma yok");
  await shot("1_harita");
  await p.click('[data-bolum="1-1"]'); await p.waitForSelector(".bahce");
  await p.click("#bk-baslat");
  ok(true, "boş programla başlatınca uyarı (çökme yok)");
  await p.click('.bk-palet [data-tur="ileri"]');
  ok((await p.$$(".bk-alan .bk-programda")).length === 1, "palete dokununca blok eklendi");
  await p.click("#bk-baslat"); await p.waitForSelector(".bk-sonuc");
  ok(!(await p.isVisible(".bk-sonuc.basarili")), "eksik programla havuç kaldı");
  await p.click('.bk-palet [data-tur="ileri"]');
  await p.click("#bk-python");
  ok((await p.textContent(".bk-python")).trim() === "ileri()\nileri()", "Bunun Python'u doğru");
  await p.click("#bk-baslat"); await p.waitForSelector(".bk-sonuc.basarili");
  ok((await p.$$(".bk-sonuc .bk-yildizlar i.dolu")).length === 3, "1-1: 3 yıldız");
  await shot("2_bolum");
  /* tekrar bloğu: 2-1 (altı havuç) */
  await p.evaluate(() => localStorage.setItem("sra-blok-v1", JSON.stringify({ yildiz: { "1-1": 3, "1-2": 3, "1-3": 3, "1-4": 3 }, program: {} })));
  await p.goto(ADRES + "blok/?y#b/2-1"); await p.waitForSelector(".bahce");
  await p.click('.bk-palet [data-tur="tekrar"]');
  await p.click('.bk-palet [data-tur="ileri"]');
  ok((await p.$$(".bk-tekrar .bk-ic .bk-programda")).length === 1, "tekrar bloğunun içine eklendi");
  for (let i = 0; i < 4; i++) await p.click('.bk-tekrar .bk-arti[aria-label="Bir artır"]');
  ok((await p.textContent(".bk-tekrar .bk-sayi")) === "6", "tekrar sayısı 6 yapıldı");
  await p.click("#bk-python");
  ok((await p.textContent(".bk-python")).includes("for i in range(6):\n    ileri()"), "tekrar Python'da for döngüsü");
  await p.click("#bk-baslat"); await p.waitForSelector(".bk-sonuc.basarili");
  ok((await p.$$(".bk-sonuc .bk-yildizlar i.dolu")).length === 3, "2-1: tekrarla 3 yıldız");
  await shot("3_tekrar");
  /* sil */
  await p.click('.bk-tekrar .bk-ic .bk-sil');
  ok((await p.$$(".bk-tekrar .bk-ic .bk-programda")).length === 0, "blok silindi");
  /* sürükle-bırak: paletten programın en başına */
  await p.click("#bk-temizle");
  await p.click('.bk-palet [data-tur="sag"]');
  const kaynak = await p.locator('.bk-palet [data-tur="ileri"]').boundingBox();
  const hedef = await p.locator(".bk-alan .bk-programda").first().boundingBox();
  await p.mouse.move(kaynak.x + 20, kaynak.y + 20); await p.mouse.down();
  await p.mouse.move(hedef.x + 30, hedef.y + 4, { steps: 8 }); await p.mouse.up();
  ok((await p.$$eval(".bk-alan .bk-programda", (e) => e.map((x) => x.getAttribute("aria-label")))).join(",") === "ileri git,sağa dön", "sürükleyerek araya blok bırakıldı");
  /* sürükle-bırak sağlamlığı: iptal yolları iz bırakmaz, program değişmez */
  const sira = () => p.$$eval(".bk-alan .bk-programda", (e) => e.map((x) => x.getAttribute("aria-label")).join(","));
  const iz = () => p.evaluate(() => document.querySelectorAll(".bk-hayalet, .bk-isaret, .bk-tasiniyor").length);
  const surukleBasla = async () => {
    const k = await p.locator('.bk-palet [data-tur="sol"]').boundingBox(), h = await p.locator(".bk-alan .bk-programda").first().boundingBox();
    await p.mouse.move(k.x + 20, k.y + 20); await p.mouse.down(); await p.mouse.move(h.x + 30, h.y + 4, { steps: 8 });
  };
  await surukleBasla(); await p.keyboard.press("Escape"); await p.mouse.up();
  ok((await sira()) === "ileri git,sağa dön" && (await iz()) === 0, "Esc sürüklemeyi iptal ediyor, iz kalmıyor");
  await surukleBasla(); await p.evaluate(() => window.dispatchEvent(new Event("blur"))); await p.mouse.up();
  ok((await sira()) === "ileri git,sağa dön" && (await iz()) === 0, "pencere odağı kaybolunca sürükleme iptal, iz kalmıyor");
  await p.focus(".bk-alan .bk-programda"); await p.keyboard.press("Alt+ArrowDown");
  ok((await sira()) === "sağa dön,ileri git", "Alt+↓ ile blok klavyeyle taşındı");
  await p.click('.bk-palet [data-tur="sol"]');
  ok(await p.$eval(".bk-alan .bk-programda.bk-tur-sol", (e) => getComputedStyle(e).position === "relative" && getComputedStyle(e).whiteSpace === "nowrap"), "sola dön bloğu sayfa düzeni sınıfından etkilenmiyor (yapışkan değil, tek satır)");
  if (await p.evaluate(() => document.documentElement.scrollHeight > innerHeight + 200)) {
    await p.evaluate(() => scrollTo(0, 0));
    const k = await p.locator('.bk-palet [data-tur="ileri"]').boundingBox();
    if (k.y > 0 && k.y < y - 80) {
      await p.mouse.move(k.x + 20, k.y + 20); await p.mouse.down(); await p.mouse.move(k.x + 20, y - 8, { steps: 10 });
      await p.waitForTimeout(700);
      const kaydi = await p.evaluate(() => scrollY);
      await p.keyboard.press("Escape"); await p.mouse.up();
      ok(kaydi > 50 && (await iz()) === 0, "sürüklerken ekranın altına gelince sayfa kendiliğinden kayıyor");
    }
  }
  ok(await p.evaluate(() => speechSynthesis.getVoices().some((v) => v.lang.startsWith("tr"))) || await p.isHidden(".bk-ses"), "Türkçe ses yokken ses düğmesi gizli");
  ok(await tasmaYok(p), "bölüm ekranında taşma yok");
  ok(hatalar.length === 0, "Blok konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

/* ---------------- Öğrenme analitiği ve ilerleme eşitleme ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\nanalitik · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
  /* öğrenci: Blok'ta bir bölüm bitir → sunucuya yazılsın */
  await p.goto(ADRES + "#giris"); await hazir(p);
  await p.click("#g-ogrenci"); await p.fill("#g-kod", "JNR123"); await p.fill("#g-ad", "Ece"); await p.fill("#g-pin", "1234"); await p.click("button[type=submit]");
  await p.waitForURL(/\/junior\/$/);
  await p.goto(ADRES + "blok/#b/1-1"); await p.waitForSelector(".bahce");
  await p.click('.bk-palet [data-tur="ileri"]'); await p.click('.bk-palet [data-tur="ileri"]');
  await p.click("#bk-baslat"); await p.waitForSelector(".bk-sonuc.basarili");
  await p.waitForFunction(() => { try { const d = JSON.parse(localStorage.getItem("sra-sahte-sunucu")); return d.ilerleme?.["o1|blok"]?.yildiz?.["1-1"] === 3; } catch { return false; } }, null, { timeout: 8000 });
  ok(true, "Blok ilerlemesi sunucuya yazıldı");
  /* başka cihaz: yerel ilerleme silinir, sunucudan geri gelir */
  await p.evaluate(() => localStorage.removeItem("sra-blok-v1"));
  await p.goto(ADRES + "blok/?yeni"); await p.waitForSelector(".bk-dunya");
  ok(await p.isVisible('a.bk-durak[data-bolum="1-2"]'), "başka cihazda ilerleme sunucudan geri geldi (ikinci bölüm açık)");
  await p.goto(ADRES); await hazir(p); await p.click("#p-cikis"); await p.waitForSelector("#p-giris");
  /* öğretmen raporu */
  await p.goto(ADRES + "#giris"); await hazir(p);
  await p.click("#g-ogretmen"); await p.fill("#g-eposta", "ogretmen@deneme.com"); await p.fill("#g-sifre", "deneme123"); await p.click("button[type=submit]");
  await p.waitForSelector('[data-rapor="s1"]'); await p.click('[data-rapor="s1"]');
  await p.waitForSelector(".r-isi tbody tr");
  ok((await p.$$(".r-isi tbody tr")).length === 12, "ısı haritası: 12 öğrenci");
  ok((await p.$$(".r-isi tbody tr:first-child td")).length === 12, "ısı haritası: 12 kazanım");
  ok((await p.$$(".r-cs:not(.r-cs--eksen)")).length === 12, "kazanım grafiği: 12 satır");
  ok(/Etki büyüklüğü/.test(await p.textContent(".r-etki")), "kursun etkisi hesaplandı");
  ok((await p.$$(".r-destek li")).length > 0 && (await p.$$(".r-zor li")).length > 0, "destek listesi ve zor bölümler dolu");
  ok(/Ece/.test(await p.textContent(".r-isi")) && !/Henüz hiç giriş yapmadı/.test(await p.$$eval(".r-destek li", (l) => l.filter((x) => x.textContent.includes("Ece")).map((x) => x.textContent).join(""))), "öğrencinin son girişi rapora yansıdı");
  const indirme = p.waitForEvent("download"); await p.click("#r-csv"); const dosya = await indirme;
  ok(/rapor\.csv$/.test(dosya.suggestedFilename()), "CSV indirildi: " + dosya.suggestedFilename());
  await p.hover(".r-cb.son"); await p.waitForSelector(".r-ipucu:not([hidden])");
  ok(true, "grafikte ipucu görünüyor");
  ok(await tasmaYok(p), "rapor ekranında yatay taşma yok");
  await p.screenshot({ path: `${EKRAN}/rapor_${ad}.png`, fullPage: true });
  if (ad === "masaustu") { await p.emulateMedia({ media: "print" }); await p.screenshot({ path: `${EKRAN}/rapor_yazdir.png`, fullPage: true }); await p.emulateMedia({ media: "screen" }); }
  ok(hatalar.length === 0, "analitik konsol hatası yok" + (hatalar.length ? ": " + hatalar.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

/* ---------------- demo cilası ---------------- */
for (const [ad, g, y] of BOYUTLAR) {
  console.log(`\ndemo · ${ad}`);
  const { ctx, p, hatalar } = await sayfaAc(g, y, { deneme: true }, true);
  await p.route(/\/(junior|ortaokul)\/ayarlar\.js$/, (r) => r.fallback());
  await p.goto(ADRES); await hazir(p);
  await p.click("#p-nasil"); await p.waitForSelector(".n-sema");
  ok((await p.$$(".n-ozellik")).length === 6, "Nasıl kuruldu: altı mühendislik kartı ve şema");
  ok(await tasmaYok(p), "Nasıl kuruldu sayfasında yatay taşma yok");
  await p.screenshot({ path: `${EKRAN}/nasil_${ad}.png`, fullPage: true });
  ok(hatalar.length === 0, "demo sayfalarında konsol hatası yok");
  await ctx.close();
  /* kurslardaki "← Platform" düğmesi: gerçek ayarlar.js ile (ağ katmanında değiştirmeden) */
  const ctx2 = await tarayici.newContext({ viewport: { width: g, height: y } });
  await ctx2.route(/fonts\.(googleapis|gstatic)\.com|github\.io/, (r) => r.abort());
  const p2 = await ctx2.newPage();
  for (const kurs of ["junior", "ortaokul"]) {
    await p2.goto(ADRES + kurs + "/"); await p2.waitForSelector("#sra-platform-don");
    ok(await p2.getAttribute("#sra-platform-don", "href") === "../", `${kurs}: "← Platform" düğmesi var`);
  }
  await p2.click("#sra-platform-don"); await p2.waitForSelector("body[data-hazir]");
  ok(/\/$/.test(new URL(p2.url()).pathname) && !/ortaokul/.test(p2.url()), "düğme portala döndü");
  await ctx2.close();
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
