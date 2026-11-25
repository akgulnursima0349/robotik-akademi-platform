/* Atölye sayfası (tasarım sistemi v2): portal/#atolye/<kimlik>
   Atölyenin modülleri, her modülün dersleri ve öğrencinin nerede kaldığı. Seviye ana sayfadaki seçimden gelir: önerilen
   modüller önce. İlerleme atölyenin bugünkü kaydından okunur (Robotik: Lab'ın kaydı); dersler bugünkü ekranlarda açılır. */
import { dugme, el, hap, ikon, kok, parcaliIlerleme, yildizlar } from "@sra/tasarim/v2";
import { Ogrenci, Ogretmen } from "@sra/bulut";
import { atolyeOzeti, kaldigiYer, kayitOku, LAB_KAYIT_ANAHTARI, modulIlerlemesi, ROBOTIK, seviyeSirasi, type Atolye, type IlerlemeKaydi, type Modul } from "@sra/mufredat";
import { uygulama } from "../uygulama";
import { acilisSeviyesi, SEVIYE_ADLARI } from "../atolyeler";
import { stilEkle, ustCubuk } from "./ana-sayfa";

const ATOLYELER: Record<string, { atolye: Atolye; kayit: () => IlerlemeKaydi }> = {
  robotik: { atolye: ROBOTIK, kayit: () => { try { return kayitOku(localStorage.getItem(LAB_KAYIT_ANAHTARI)); } catch { return kayitOku(null); } } }
};
export const atolyeVarMi = (k: string) => k in ATOLYELER;

const STIL = `
.at-ust{background:var(--sra2-lavanta);border-radius:0 0 40px 40px;padding:18px clamp(16px,4vw,48px) 36px;position:relative}
.at-bas{max-width:1184px;margin:28px auto 0;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:32px;align-items:end}
.at-geri{display:inline-flex;align-items:center;gap:6px;font-weight:800;color:var(--sra2-mor-taban);text-decoration:none;margin-bottom:10px}
.at-geri .s2-ikon{width:18px;height:18px}
.at-bas h1{font-size:var(--sra2-boy-8);margin:0 0 10px}
.at-bas p{margin:0;max-width:56ch;font-size:var(--sra2-boy-3);font-weight:600;color:var(--sra2-murekkep-2)}
.at-ozet{display:flex;flex-direction:column;gap:12px}
.at-ozet__sayi{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;font-weight:800}
.at-ozet__sayi b{font:800 var(--sra2-boy-6)/1 var(--sra2-yazi-baslik)}
.at-ozet__sayi span{color:var(--sra2-murekkep-2)}
.at-govde{flex:1;width:100%;max-width:1280px;margin:0 auto;padding:32px clamp(16px,4vw,48px) 56px;display:flex;flex-direction:column;gap:22px}
.at-grup{font-size:var(--sra2-boy-5);margin:12px 0 0}
.at-grup small{display:block;font:700 var(--sra2-boy-2) var(--sra2-yazi);color:var(--sra2-murekkep-2);margin-top:2px}
.at-moduller{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));gap:20px;align-items:start}
.at-modul{display:flex;flex-direction:column;gap:12px}
.at-modul__ust{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.at-modul h3{font-size:var(--sra2-boy-5);margin:0}
.at-modul > p{margin:0;color:var(--sra2-murekkep-2);font-weight:600}
.at-modul__sayi{margin-left:auto;font-weight:800;color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1)}
.at-modul details summary{cursor:pointer;font-weight:800;min-height:44px;display:flex;align-items:center;gap:8px;list-style:none;color:var(--sra2-mor-taban)}
.at-modul details summary::-webkit-details-marker{display:none}
.at-modul details summary::before{content:"";width:10px;height:10px;border-right:3px solid currentColor;border-bottom:3px solid currentColor;transform:rotate(-45deg);transition:transform var(--sra2-hizli)}
.at-modul details[open] summary::before{transform:rotate(45deg)}
.at-dersler{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.at-ders{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 12px;border-radius:var(--sra2-kose-2);background:var(--sra2-krem);color:inherit;text-decoration:none}
a.at-ders:hover{background:var(--sra2-mor-acik)}
.at-ders__durum{width:36px;height:36px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--sra2-mor-acik);color:var(--sra2-mor-taban)}
.at-ders__durum .s2-ikon{width:18px;height:18px}
.at-ders.bitti .at-ders__durum{background:var(--sra2-yesil);color:#fff}
.at-ders.kilitli{opacity:.7}
.at-ders.kilitli .at-ders__durum{background:#EFEAE0;color:#605B78}
.at-ders[aria-current="step"]{background:var(--sra2-mor);color:#fff;box-shadow:0 4px 0 var(--sra2-mor-taban)}
.at-ders[aria-current="step"] .at-ders__durum{background:#fff;color:var(--sra2-mor)}
.at-ders[aria-current="step"] small{color:#fff}
.at-ders__metin{display:flex;flex-direction:column;min-width:0}
.at-ders__metin b{font-weight:800}
.at-ders__metin small{color:var(--sra2-murekkep-2);font-weight:700;font-size:var(--sra2-boy-1)}
.at-ders__son{margin-left:auto;flex:none;font-weight:800;font-size:var(--sra2-boy-1)}
.at-ders .s2-yildizlar .s2-ikon{width:20px;height:20px}
.at-ders[aria-current="step"] .s2-yildizlar .s2-ikon:not(.dolu){color:rgba(255,255,255,.45)}
@media (max-width:900px){.at-bas{grid-template-columns:1fr;gap:20px}}
.at-ozet .s2-dugme{white-space:normal;text-align:left;min-height:var(--sra2-hedef-buyuk);padding-block:8px;flex-wrap:wrap;row-gap:2px}
@media (max-width:560px){.at-ozet .s2-dugme__ek{display:none}}
`;

export function atolyeSayfasi(root: HTMLElement, kimlik: string): void {
  stilEkle();
  if (!document.getElementById("at-stil")) document.head.append(el("style", "", { id: "at-stil" }, STIL));
  const { atolye, kayit } = ATOLYELER[kimlik];
  const k = uygulama.kullanici;
  const hepsiAcik = k instanceof Ogretmen;
  const seviye = acilisSeviyesi((() => { try { return localStorage; } catch { return null; } })(), k instanceof Ogrenci ? k.kurs : undefined);
  const veri = kayit();
  const ozet = atolyeOzeti(atolye, veri, hepsiAcik);
  const yer = kaldigiYer(atolye, veri, seviye, hepsiAcik);
  const { onerilen, diger } = seviyeSirasi(atolye, seviye);
  const seviyeAdi = SEVIYE_ADLARI.find(([s]) => s === seviye)![1];

  const sayfa = kok(el("div", "as"), seviye);
  const devam = yer
    ? dugme({ metin: ozet.biten ? "Kaldığın yerden devam et" : "Başla", ek: yer.ders.ad, tur: "ana", ikon: "oynat", ikonSonda: true, href: yer.ders.adres, id: "at-devam" })
    : hap("Bütün dersler bitti", "yesil", "tamam");
  const ust = el("header", "at-ust", {}, ustCubuk(),
    el("section", "at-bas", { "aria-labelledby": "at-baslik" },
      el("div", "", {},
        el("a", "at-geri", { href: "#atolyeler" }, ikon("geri"), "Atölyeler"),
        el("h1", "s2-baslik", { id: "at-baslik" }, atolye.ad),
        el("p", "", {}, atolye.aciklama)),
      el("div", "s2-kart s2-kart--lavanta at-ozet", { id: "at-ozet" },
        el("div", "at-ozet__sayi", {}, el("b", "", {}, `${ozet.biten} / ${ozet.sayilan}`), el("span", "", {}, "ders bitti"),
          el("span", "", { style: "margin-left:auto" }, `${ozet.yildiz} / ${ozet.enCokYildiz} yıldız`)),
        parcaliIlerleme(ozet.sayilan, ozet.biten, !!yer, `${atolye.ad} atölyesi`),
        devam)));

  const modulKarti = (m: Modul) => {
    const mi = modulIlerlemesi(m, veri, hepsiAcik);
    const liste = el("ol", "at-dersler");
    for (const d of mi.dersler) {
      const simdi = yer?.ders === d.ders;
      const sinif = "at-ders " + (d.durum === "bitti" ? "bitti" : d.durum === "kilitli" ? "kilitli" : "");
      const son = d.ders.tur === "gorev"
        ? (d.durum === "kilitli" ? el("span", "at-ders__son", {}, "Önceki görevi bitir") : yildizlar(3, d.yildiz))
        : el("span", "at-ders__son", {}, d.ders.tur === "serbest" ? "Serbest çalışma" : d.durum === "bitti" ? (d.ders.tur === "lig" ? "Robotun kayıtlı" : "Bitti") : d.ders.tur === "lig" ? "Robotunu yaz" : "Rehber");
      const durumIkon = el("span", "at-ders__durum", { "aria-hidden": "true" }, ikon(d.durum === "bitti" ? "tamam" : d.durum === "kilitli" ? "kilit" : "oynat"));
      const metin = el("span", "at-ders__metin", {}, el("b", "", {}, d.ders.ad), el("small", "", {}, d.ders.ogretir),
        el("span", "s2-gizli", {}, d.durum === "bitti" ? " (bitti)" : d.durum === "kilitli" ? " (kilitli)" : ""));
      const satir = d.durum === "kilitli"
        ? el("div", sinif, { "aria-disabled": "true" }, durumIkon, metin, son)
        : el("a", sinif, { href: d.ders.adres }, durumIkon, metin, son);
      satir.dataset.ders = d.ders.anahtar || d.ders.kimlik;
      if (simdi) satir.setAttribute("aria-current", "step");
      liste.append(el("li", "", {}, satir));
    }
    const acik = yer?.modul === m || (!yer && m === onerilen[0]);
    const detay = el("details", "", acik ? { open: "" } : {}, el("summary", "", {}, `Dersler · ${mi.biten} / ${mi.sayilan} bitti`), liste);
    return el("article", "s2-kart at-modul", { "data-modul": m.kimlik, "aria-labelledby": `at-m-${m.kimlik}` },
      el("div", "at-modul__ust", {}, m.robot ? hap(m.robot, "mor", "robot") : null, mi.enCokYildiz ? el("span", "at-modul__sayi", {}, `${mi.yildiz} / ${mi.enCokYildiz} yıldız`) : null),
      el("h3", "s2-baslik", { id: `at-m-${m.kimlik}` }, m.ad),
      el("p", "", {}, m.aciklama),
      parcaliIlerleme(mi.sayilan, mi.biten, false, m.ad),
      detay);
  };

  const govde = el("main", "at-govde", { id: "ana" });
  if (onerilen.length) govde.append(
    el("h2", "s2-baslik at-grup", {}, `${seviyeAdi} için önerilen`, el("small", "", {}, "Seviyeyi ana sayfadan değiştirebilirsin.")),
    el("div", "at-moduller", { id: "at-onerilen" }, ...onerilen.map(modulKarti)));
  if (diger.length) govde.append(
    el("h2", "s2-baslik at-grup", {}, onerilen.length ? "Diğer modüller" : "Modüller", onerilen.length ? null : el("small", "", {}, `${seviyeAdi} için ayrı bir öneri yok; bütün modüller açık.`)),
    el("div", "at-moduller", { id: "at-diger" }, ...diger.map(modulKarti)));

  const alt = el("footer", "as-alt", {}, el("div", "", {},
    el("span", "", {}, "© Sivas Robotik Akademi"),
    el("span", "", {}, k instanceof Ogrenci ? "İlerleme hesabına kayıtlı" : "İlerleme bu cihazda")));
  sayfa.append(ust, govde, alt);
  root.replaceChildren(sayfa);
  document.title = `${atolye.ad} atölyesi · Sivas Robotik Akademi`;
}
