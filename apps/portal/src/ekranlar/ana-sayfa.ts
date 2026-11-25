/* Ana sayfa (tasarım sistemi v2): üst bant, seviye seçimi, seviyeye göre atölye kartları, nasıl çalışır, alt bilgi.
   Seviye: öğrencide sınıfının kursundan, değilse tarayıcıda hatırlanan; yoksa ilkokul. */
import { atolyeKarti, dugme, el, hap, ikon, kok, secici } from "@sra/tasarim/v2";
import { KURSLAR, Ogrenci, Ogretmen } from "@sra/bulut";
import logo from "@sra/tasarim/logo.webp";
import { uygulama } from "../uygulama";
import { acilisSeviyesi, SEVIYE_ADLARI, SEVIYE_ATOLYELERI, seviyeYaz, type Seviye } from "../atolyeler";

const STIL = `
.as{min-height:100vh;display:flex;flex-direction:column}
.as-ust{background:var(--sra2-lavanta);border-radius:0 0 40px 40px;padding:18px clamp(16px,4vw,48px) 44px;position:relative;overflow:hidden}
.as-ust.as-ust--kisa{padding-bottom:18px;border-radius:0 0 32px 32px}
/* alt sayfalarda geri bağlantısı (atölye ve ders sayfaları) */
.at-geri{display:inline-flex;align-items:center;gap:6px;font-weight:800;color:var(--sra2-mor-taban);text-decoration:none;margin-bottom:10px}
.at-geri .s2-ikon{width:18px;height:18px}
.as-ust__sus{position:absolute;inset:0;pointer-events:none}
.as-bar{position:relative;display:flex;align-items:center;gap:12px;max-width:1184px;margin:0 auto}
.as-marka{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;font:800 20px/1 var(--sra2-yazi-baslik)}
.as-marka img{width:48px;height:48px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 0 var(--sra2-lavanta-taban);background:#fff}
.as-marka span span{color:var(--sra2-kirmizi)}
.as-menu{display:flex;gap:4px;margin-left:28px;padding:0;list-style:none}
.as-menu a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:var(--sra2-kose-hap);color:var(--sra2-murekkep);text-decoration:none;font-weight:800}
.as-menu a:hover{background:rgba(255,255,255,.6)}
.as-menu a[aria-current="page"]{background:var(--sra2-gece);color:#fff}
.as-hesap{margin-left:auto;display:flex;align-items:center;gap:10px}
.as-kim{font-weight:800;max-width:18ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.as-menu-dugme{display:none}
.as-kahraman{position:relative;max-width:1184px;margin:36px auto 0;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:40px;align-items:center}
.as-kahraman h1{font-size:var(--sra2-boy-8);margin:0 0 14px}
.as-kahraman h1 span{color:var(--sra2-kirmizi)}
.as-kahraman p{margin:0 0 22px;max-width:52ch;font-size:var(--sra2-boy-3);font-weight:600;color:var(--sra2-murekkep-2)}
.as-eylem{display:flex;flex-wrap:wrap;gap:14px}
.as-yan{display:flex;flex-direction:column;gap:12px}
.as-yan h2{font-size:var(--sra2-boy-5);margin:0}
.as-yan p{margin:0;color:var(--sra2-murekkep-2);font-weight:700}
.as-robotlar{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0}
.as-govde{flex:1;width:100%;max-width:1280px;margin:0 auto;padding:36px clamp(16px,4vw,48px) 56px;display:flex;flex-direction:column;gap:48px}
.as-bolum-bas{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px 24px;margin-bottom:22px}
.as-bolum-bas h2{font-size:var(--sra2-boy-6);margin:0}
.as-bolum-bas p{margin:4px 0 0;color:var(--sra2-murekkep-2);font-weight:600}
.as-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px}
.as-izgara .s2-atolye{min-height:212px}
.as-adimlar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:0;padding:0;list-style:none}
.as-adimlar li{display:flex;flex-direction:column;gap:8px}
.as-adimlar b{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--sra2-sari);font:800 20px var(--sra2-yazi-baslik);box-shadow:0 4px 0 var(--sra2-sari-taban)}
.as-adimlar h3{font-size:var(--sra2-boy-4);margin:4px 0 0}
.as-adimlar p{margin:0;color:var(--sra2-murekkep-2);font-weight:600}
.as-nasil{display:flex;align-items:center;gap:16px;margin-top:18px;text-decoration:none;color:inherit}
.as-nasil span{display:flex;flex-direction:column}
.as-nasil small{color:var(--sra2-murekkep-2);font-weight:700;font-size:var(--sra2-boy-1)}
.as-nasil .s2-ikon{width:24px;height:24px}
.as-nasil .s2-ikon:last-child{margin-left:auto}
.as-alt{background:var(--sra2-gece);color:#fff;padding:22px clamp(16px,4vw,48px)}
.as-alt div{max-width:1184px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;font-weight:700;font-size:var(--sra2-boy-1)}
.as-alt span:last-child{color:var(--sra2-murekkep-acik)}
@media (max-width:900px){
  .as-kahraman{grid-template-columns:1fr;gap:24px}
  .as-adimlar{grid-template-columns:1fr}
}
.as-menu a,.as-marka span{white-space:nowrap}
@media (max-width:1000px){
  .as-menu-dugme{display:inline-flex}
  .as-menu{display:none;position:absolute;top:60px;left:0;right:0;z-index:5;flex-direction:column;gap:4px;margin:0;padding:10px;background:#fff;border-radius:var(--sra2-kose-3);box-shadow:0 8px 0 var(--sra2-lavanta-taban)}
  .as-menu.acik{display:flex}
  .as-menu a{width:100%}
}
@media (max-width:760px){
  .as-kim{display:none}
  .as-hesap .s2-dugme span:not(.s2-ikon){display:none}
  .as-hesap .s2-dugme{width:var(--sra2-hedef);padding:0}
  .as-izgara{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .as-izgara .s2-atolye{min-height:0}
  .as-marka{font-size:17px}
}
`;

const ADIMLAR: [string, string][] = [
  ["Öğretmen sınıf açar", "Her öğrenciye bir takma ad ve 4 haneli PIN verilir. E-posta istenmez."],
  ["Öğrenci tek kez girer", "Sınıf kodu ve PIN ile girer; platform onu kendi atölyesine götürür."],
  ["İlerleme her yerde aynı", "Okuldaki bilgisayarda başladığını evdeki tablette sürdürür."]
];

function depo(): Storage | null { try { return localStorage; } catch { return null; } }

export function anaSayfa(root: HTMLElement): void {
  stilEkle();
  const k = uygulama.kullanici;
  const ogrenci = k instanceof Ogrenci ? k : null;
  let seviye: Seviye = acilisSeviyesi(depo(), ogrenci?.kurs);
  const sayfa = kok(el("div", "as"), seviye);

  const bar = ustCubuk("atolyeler");

  /* ---------- kahraman ---------- */
  const eylem = el("div", "as-eylem");
  if (ogrenci) eylem.append(dugme({ metin: `${ogrenci.gorunenAd}, kursuna devam et`, tur: "ana", ikon: "oynat", ikonSonda: true, href: ogrenci.hedef(), id: "p-devam" }));
  else if (k) eylem.append(dugme({ metin: "Panellerim", tur: "ana", ikon: "panel", href: "#panellerim", id: "p-panellerim" }));
  else if (uygulama.hesapli) eylem.append(dugme({ metin: "Sınıf koduyla gir", tur: "ana", ikon: "giris", href: "#giris" }));
  const atolyelereGit = dugme({ metin: "Atölyeleri gör", href: "#atolyeler", id: "p-atolyelere" });
  atolyelereGit.addEventListener("click", (e) => { e.preventDefault(); document.getElementById("atolyeler")?.scrollIntoView({ behavior: "smooth" }); });
  eylem.append(atolyelereGit);

  let yan: HTMLElement;
  if (ogrenci) {
    const kurs = KURSLAR[ogrenci.kurs];
    yan = el("a", "s2-kart s2-kart--lavanta as-yan", { href: ogrenci.hedef(), style: "text-decoration:none;color:inherit", id: "p-devam-kart" },
      el("div", "", { style: "display:flex;align-items:center;gap:10px" }, hap("Devam ediyor"), el("span", "", { style: "margin-left:auto;font-weight:800;color:var(--sra2-murekkep-2)" }, kurs.siniflar)),
      el("h2", "s2-baslik", {}, kurs.ad),
      el("p", "", {}, `${ogrenci.sinif} sınıfı · kaldığın yerden açılır`));
  } else if (k) {
    yan = el("div", "s2-kart s2-kart--lavanta as-yan", {},
      el("h2", "s2-baslik", {}, "Sınıfların"),
      el("p", "", {}, "Panellerim'de sınıflarını aç, öğrencilerinin ilerlemesini ve zorlandıkları yerleri gör."));
  } else {
    yan = el("div", "s2-kart s2-kart--lavanta as-yan", {},
      el("h2", "s2-baslik", {}, "Atölyedeki robotlar, ekranda"),
      el("p", "", {}, "Derste kullandığımız robotların 3D ikizleri: gerçek ölçüler, gerçek fizik."),
      el("div", "as-robotlar", {}, hap("Kenshin · mini sumo", "mor"), hap("SiroLine · çizgi izleyen", "yesil"), hap("RizBot · labirent", "gece")),
      dugme({ metin: "Laboratuvara gir", kucuk: true, ikon: "ileri", ikonSonda: true, href: "lab/" }));
  }
  const ust = el("header", "as-ust", {},
    el("div", "as-ust__sus", { "aria-hidden": "true" }),
    bar,
    el("section", "as-kahraman", { "aria-labelledby": "as-baslik" },
      el("div", "", {},
        el("h1", "s2-baslik", { id: "as-baslik" }, "Robotunu kur, kodla, ", el("span", "", {}, "kazan!")),
        el("p", "", {}, "Kodlama, yapay zekâ ve robotik tek çatı altında. Atölyedeki robotların dijital ikizleriyle okul öncesinden liseye, her seviyeye kendi atölyesi."),
        eylem),
      yan));
  ust.querySelector(".as-ust__sus")!.innerHTML = `<svg width="100%" height="100%" preserveAspectRatio="xMaxYMax slice" viewBox="0 0 1280 520"><g fill="#E2DBFF"><circle cx="1180" cy="520" r="190"/><circle cx="930" cy="560" r="90"/></g></svg>`;

  /* ---------- atölyeler ---------- */
  const izgara = el("div", "as-izgara", { id: "as-izgara", "aria-live": "polite" });
  const doldur = () => {
    izgara.replaceChildren(...SEVIYE_ATOLYELERI[seviye].map((a) => {
      const kart = atolyeKarti({ kimlik: a.kimlik, ad: a.ad, aciklama: a.aciklama, href: a.hedef?.yol ?? "", kilitli: !a.hedef, secili: !!a.hedef && a.hedef.kurs === ogrenci?.kurs });
      kart.dataset.atolye = a.kimlik;
      if (a.hedef) kart.dataset.kurs = a.hedef.kurs;
      return kart;
    }));
  };
  const seviyeSec = secici("Seviyen", SEVIYE_ADLARI, seviye, (s) => { seviye = s; kok(sayfa, s); seviyeYaz(depo(), s); doldur(); });
  seviyeSec.id = "as-seviye";
  doldur();
  const atolyeler = el("section", "", { id: "atolyeler", "aria-labelledby": "atolyeler-baslik", style: "scroll-margin-top:16px" },
    el("div", "as-bolum-bas", {},
      el("div", "", {}, el("h2", "s2-baslik", { id: "atolyeler-baslik" }, "Atölyeler"),
        el("p", "", {}, ogrenci ? "Senin atölyen kırmızı. Diğer seviyelere de göz atabilirsin." : "Seviyeni seç, sana uygun atölyeleri gör. Seçimin bu cihazda hatırlanır.")),
      seviyeSec),
    izgara);

  /* ---------- nasıl çalışır ---------- */
  const nasil = el("section", "", { "aria-labelledby": "nasil-baslik" },
    el("div", "as-bolum-bas", {}, el("h2", "s2-baslik", { id: "nasil-baslik" }, "Nasıl çalışır?")),
    el("ol", "as-adimlar", {}, ...ADIMLAR.map(([b, a], i) => el("li", "s2-kart", {}, el("b", "", { "aria-hidden": "true" }, String(i + 1)), el("h3", "s2-baslik", {}, b), el("p", "", {}, a)))),
    el("a", "s2-kart as-nasil", { href: "#nasil", id: "p-nasil" }, ikon("kod"),
      el("span", "", {}, el("b", "", {}, "Nasıl kuruldu?"), el("small", "", {}, "Mimari, testler, çocuk verisi ilkeleri ve internetsiz çalışma")), ikon("ileri")));

  const alt = el("footer", "as-alt", {}, el("div", "", {},
    el("span", "", {}, "© Sivas Robotik Akademi"),
    el("span", "", {}, uygulama.mod === "bulut" ? "Hesaplar açık" : uygulama.mod === "deneme" ? "Deneme modu" : "Hesapsız mod · ilerleme bu cihazda")));

  sayfa.append(ust, el("main", "as-govde", { id: "ana" }, atolyeler, nasil), alt);
  root.replaceChildren(sayfa);
}

/** v2 sayfalarının ortak stili (ana sayfa ve atölye sayfaları) */
export function stilEkle(): void {
  if (!document.getElementById("as-stil")) document.head.append(el("style", "", { id: "as-stil" }, STIL));
}

/** Ortak üst çubuk: logo, menü (dar ekranda düğmeyle açılır), oturum. aktif: menüde vurgulanan bağlantı */
export function ustCubuk(aktif: "atolyeler" | "yok" = "yok"): HTMLElement {
  const k = uygulama.kullanici;
  const menu = el("ul", "as-menu", { id: "as-menu" },
    el("li", "", {}, el("a", "", { href: "#atolyeler", ...(aktif === "atolyeler" ? { "aria-current": "page" } : {}) }, "Atölyeler")),
    el("li", "", {}, el("a", "", { href: "lab/" }, "Robotik Laboratuvarı")),
    el("li", "", {}, el("a", "", { href: "lab/#lig" }, "Sumo Ligi")),
    el("li", "", {}, el("a", "", { href: k instanceof Ogretmen ? "#panellerim" : uygulama.hesapli ? "#giris" : "#nasil" }, "Öğretmen")));
  const menuDugme = dugme({ metin: "Menü", ikon: "menu", yalnizIkon: true, kucuk: true }) as HTMLButtonElement;
  menuDugme.classList.add("as-menu-dugme");
  menuDugme.setAttribute("aria-expanded", "false"); menuDugme.setAttribute("aria-controls", "as-menu");
  menuDugme.addEventListener("click", () => { const a = menu.classList.toggle("acik"); menuDugme.setAttribute("aria-expanded", String(a)); });
  menu.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("a")) { menu.classList.remove("acik"); menuDugme.setAttribute("aria-expanded", "false"); } });

  const hesap = el("div", "as-hesap");
  if (uygulama.hesapli) {
    if (k) {
      hesap.append(el("span", "as-kim", {}, k.gorunenAd));
      const c = dugme({ metin: "Çıkış", ikon: "cikis", kucuk: true, tur: "sessiz", id: "p-cikis" });
      c.addEventListener("click", async () => { await uygulama.cikis(); location.hash = ""; dispatchEvent(new HashChangeEvent("hashchange")); });
      hesap.append(c);
    } else hesap.append(dugme({ metin: "Giriş yap", ikon: "giris", kucuk: true, tur: "ana", href: "#giris", id: "p-giris" }));
  }
  hesap.append(menuDugme);
  return el("nav", "as-bar", { "aria-label": "Ana menü" },
    el("a", "as-marka", { href: "#" }, el("img", "", { src: logo, alt: "", width: "48", height: "48" }), el("span", "", {}, "Sivas Robotik ", el("span", "", {}, "Akademi"))),
    menu, hesap);

}
