/* Blok Atölyesi ekranları: dünya haritası ve bölüm ekranı. Az yazı, büyük düğmeler, sesli yönerge. */
import { dugme, el, ikon, ustBar } from "@sra/tasarim";
import { Ogretmen } from "@sra/bulut";
import { Bahce } from "./bahce";
import { bitSvg } from "./bit";
import { BOLUMLER, DUNYALAR, type Bolum } from "@sra/robot-motoru";
import { Duzenleyici } from "./duzenleyici";
import { ilerleme } from "./ilerleme";
import { blokSay, calistir, pythona, yildizHesapla } from "./model";
import { ses } from "./ses";
import { uygulama } from "./uygulama";

const ustKisim = (...sag: Node[]) => {
  const b = ustBar([...sag, el("a", "sra-dugme sra-dugme--hayalet sra-dugme--kucuk", { href: "../#atolye/kodla-oyna", "aria-label": "Platforma dön" }, ikon("panel"), el("span", "sra-dugme__yazi", {}, "Platform"))], "../");
  b.querySelector(".sra-marka small")!.textContent = "Blok Atölyesi";
  return b;
};
const acikMi = (b: Bolum) => { const i = BOLUMLER.indexOf(b); return i === 0 || ilerleme.yildiz(BOLUMLER[i - 1].kimlik) > 0 || uygulama.kullanici instanceof Ogretmen; };
const yildizlar = (n: number) => el("span", "bk-yildizlar", { "aria-label": `${n} / 3 yıldız` }, ...[0, 1, 2].map((i) => el("i", i < n ? "dolu" : "")));

function sesDugmesi(metin: () => string) {
  const b = el("button", "bk-ses", { type: "button", "aria-label": "Yönergeyi sesli oku" });
  b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  b.addEventListener("click", () => ses.oku(metin(), true));
  b.hidden = !ses.var;
  ses.degisince(() => (b.hidden = !ses.var));
  return b;
}

export function harita(root: HTMLElement) {
  const ana = el("main", "bk-harita sra-sarmal", { id: "ana" });
  const merhaba = el("section", "bk-merhaba sra-belir", {});
  merhaba.innerHTML = bitSvg("mutlu", "bit bk-bit-buyuk");
  const yazi = "Merhaba! Ben Bit. Bana yolu bloklarla göster, birlikte havuç toplayalım!";
  merhaba.append(el("div", "bk-balon", {}, el("p", "", {}, yazi), sesDugmesi(() => yazi)));
  ana.append(merhaba);
  for (const d of DUNYALAR) {
    const bolumler = BOLUMLER.filter((b) => b.dunya === d.no);
    const kart = el("section", "bk-dunya sra-kart sra-belir", { "data-dunya": String(d.no) });
    kart.style.setProperty("--renk", d.renk);
    kart.append(el("header", "", {}, el("span", "bk-dunya-no", {}, String(d.no)), el("div", "", {}, el("h2", "", {}, d.ad), el("p", "", {}, d.ogrettigi))));
    const yol = el("ol", "bk-yol");
    for (const b of bolumler) {
      const acik = acikMi(b), y = ilerleme.yildiz(b.kimlik);
      const ic = [el("span", "bk-durak-no", {}, String(b.sira)), acik ? yildizlar(y) : el("span", "bk-kilit", { "aria-label": "kilitli" }, ikon("kilit"))];
      yol.append(el("li", "", {}, acik ? el("a", "bk-durak" + (y ? " bitti" : ""), { href: `#b/${b.kimlik}`, "data-bolum": b.kimlik, "aria-label": `${d.ad}, bölüm ${b.sira}: ${b.ad}` }, ...ic) : el("span", "bk-durak kilitli", { "aria-label": `Bölüm ${b.sira} kilitli` }, ...ic)));
    }
    kart.append(yol);
    ana.append(kart);
  }
  root.replaceChildren(ustKisim(), ana);
  if (ses.var && !sessionStorage.getItem("sra-blok-merhaba")) { try { sessionStorage.setItem("sra-blok-merhaba", "1"); } catch { /* yok */ } ses.oku(yazi); }
}

export function bolumEkrani(root: HTMLElement, kimlik: string) {
  const b = BOLUMLER.find((x) => x.kimlik === kimlik);
  if (!b || !acikMi(b)) { location.hash = ""; return; }
  const d = DUNYALAR[b.dunya - 1];
  const duz = new Duzenleyici(b.palet, ilerleme.program(b.kimlik) ?? []);
  const bahce = new Bahce();
  bahce.yukle(b.harita, b.yon);
  const sayac = el("span", "bk-sayac", { "aria-live": "polite" });
  const sayacGuncelle = () => { const n = blokSay(duz.program); sayac.textContent = `${n} blok`; sayac.classList.toggle("az", n > 0 && n <= b.enAz); };
  const python = el("pre", "bk-python", { hidden: "" });
  duz.degisince = () => { ilerleme.programKaydet(b.kimlik, duz.program); sayacGuncelle(); python.textContent = pythona(duz.program) || "# Program boş"; };
  sayacGuncelle();

  const baslat = dugme({ metin: "Başlat", id: "bk-baslat" }) as HTMLButtonElement;
  baslat.classList.add("bk-baslat");
  baslat.prepend(el("span", "bk-oynat", { "aria-hidden": "true" }));
  const sifirla = dugme({ metin: "Sıfırla", tur: "ikincil", id: "bk-sifirla" });
  const pyDugme = dugme({ metin: "Bunun Python'u", tur: "hayalet", kucuk: true, ikon: "kod", id: "bk-python" });
  pyDugme.addEventListener("click", () => { python.hidden = !python.hidden; python.textContent = pythona(duz.program) || "# Program boş"; pyDugme.setAttribute("aria-expanded", String(!python.hidden)); });
  const sonuc = el("div", "bk-sonuc-kap", { "aria-live": "polite" });

  const yonerge = el("div", "bk-yonerge", {}, el("div", "bk-yonerge-bit"), el("p", "", {}, b.yonerge), sesDugmesi(() => b.yonerge));
  yonerge.querySelector(".bk-yonerge-bit")!.innerHTML = bitSvg("mutlu", "bit");
  const sahne = el("section", "bk-sahne sra-kart", {}, bahce.svg);
  const kod = el("section", "bk-kod sra-kart", {},
    el("div", "bk-kod-bas", {}, el("h2", "", {}, "Bloklar"), sayac),
    duz.palet,
    el("div", "bk-kod-bas", {}, el("h2", "", {}, "Programın"), el("button", "bk-temizle", { type: "button", id: "bk-temizle" }, "Hepsini sil")),
    duz.alan,
    el("div", "bk-eylem", {}, baslat, sifirla, pyDugme),
    python);
  kod.querySelector("#bk-temizle")!.addEventListener("click", () => duz.temizle());
  const bas = el("div", "bk-bolum-bas sra-sarmal", {},
    el("a", "bk-geri", { href: "#", "aria-label": "Bölümlere dön" }, "←"),
    el("div", "", {}, el("p", "bk-ust", { style: `color:${d.renk}` }, `${d.ad} · ${b.sira}`), el("h1", "", {}, b.ad)));
  root.replaceChildren(ustKisim(), el("main", "bk-bolum", { id: "ana" }, bas, el("div", "bk-izgara sra-sarmal", {}, el("div", "bk-sol-sutun", {}, yonerge, sahne), kod), sonuc));
  setTimeout(() => ses.oku(b.yonerge), 300);

  let oynuyor = false;
  const bitir = () => { oynuyor = false; duz.kilitli = false; baslat.disabled = false; duz.vurgula(null); };
  sifirla.addEventListener("click", () => { bahce.durdur(); bahce.yukle(b.harita, b.yon); sonuc.replaceChildren(); bitir(); });
  baslat.addEventListener("click", async () => {
    if (oynuyor) return;
    if (!duz.program.length) { ses.oku("Önce blok ekle!", true); duz.alan.classList.add("bk-salla"); setTimeout(() => duz.alan.classList.remove("bk-salla"), 500); return; }
    oynuyor = true; duz.kilitli = true; baslat.disabled = true; sonuc.replaceChildren();
    ilerleme.denemeArttir(b.kimlik);
    bahce.yukle(b.harita, b.yon);
    const r = calistir(duz.program, b.harita, b.yon);
    const tamam = await bahce.oynat(r.sim.iz, (i) => duz.vurgula(r.bloklar[i]));
    if (!tamam) return;
    const basarili = !r.durdu && r.sim.izgara.kalanKar() === 0;
    const n = blokSay(duz.program), y = yildizHesapla(basarili, n, b.enAz);
    if (basarili) { ilerleme.yildizKaydet(b.kimlik, y); bahce.sevin(); } else bahce.uzul();
    const metin = basarili
      ? y === 3 ? "Harika! En az blokla bitirdin!" : `Bitirdin! Daha az blokla dene: ${b.enAz} blok yeter.`
      : r.durdu === "carpma" ? "Ah! Bit ağaca çarptı. Yolu kontrol et." : "Bazı havuçlar kaldı. Biraz daha blok ekle!";
    ses.oku(metin);
    const i = BOLUMLER.indexOf(b), sonraki = BOLUMLER[i + 1];
    const kart = el("div", "bk-sonuc sra-kart sra-belir" + (basarili ? " basarili" : ""), { role: "status" }, yildizlar(y), el("p", "", {}, metin));
    const eylem = el("div", "bk-eylem", {});
    if (basarili && sonraki) eylem.append(dugme({ metin: "Sonraki bölüm", ikon: "ok-sag", ikonSonda: true, href: `#b/${sonraki.kimlik}` }));
    else if (basarili) eylem.append(dugme({ metin: "Bölümlere dön", href: "#" }));
    const tekrar = dugme({ metin: "Tekrar dene", tur: "ikincil" });
    tekrar.addEventListener("click", () => sifirla.click());
    eylem.append(tekrar); kart.append(eylem);
    sonuc.append(kart);
    kart.scrollIntoView({ block: "nearest", behavior: "smooth" });
    duz.kilitli = false; baslat.disabled = false; oynuyor = false; duz.vurgula(null);
  });
  window.addEventListener("hashchange", () => { bahce.durdur(); speechSynthesis?.cancel?.(); }, { once: true });
}
