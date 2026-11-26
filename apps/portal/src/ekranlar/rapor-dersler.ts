/* Sınıf raporunda "Dersler" kartı: öğrenci × ders tablosu, her hücrede dersin dört bölümü ve öğretmen onayı.
   Hesaplar @sra/mufredat'ta (ders-raporu, testli); bu dosya gösterir ve onayı sunucuya yazar. */
import { el } from "@sra/tasarim/bilesenler";
import { hataMetni, type RaporSatiri } from "@sra/bulut";
import { DERSLER, dersHucresi, dersSinifOzeti, HUCRE_DURUMLARI, type DersHucresi, type DersTanimi, type HucreDurumu } from "@sra/mufredat";
import type { Seviye } from "@sra/tasarim/v2";

/** Gösterilecek dersler: sınıfın seviyesindekiler ve herhangi bir öğrencinin başladığı ya da onay aldığı dersler */
export function raporDersleri(satirlar: RaporSatiri[], seviye: Seviye | null): DersTanimi[] {
  return DERSLER.filter((d) => (seviye && d.seviyeler.includes(seviye)) || satirlar.some((s) => dersHucresi(d, s).durum !== "baslamadi"));
}

const tarih = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "—");
const BOLUMLER: [keyof Pick<DersHucresi["ozet"], "anlat" | "dene" | "gorev" | "gercek">, string, string][] =
  [["anlat", "A", "Anlat"], ["dene", "D", "Dene"], ["gorev", "G", "Görev"], ["gercek", "R", "Gerçek robotta"]];
export type Onaylayici = (ogrenciId: string, ders: string, onay: boolean) => Promise<void>;

export function derslerKarti(satirlar: RaporSatiri[], dersler: DersTanimi[], onayla: Onaylayici): HTMLElement {
  const kart = el("section", "r-kart sra-kart rd", { "aria-labelledby": "rd-b", id: "r-dersler" });
  const hata = el("p", "rd-hata", { role: "alert", hidden: "" });
  const ciz = () => {
    const ozetler = dersler.map((d) => {
      const o = dersSinifOzeti(d, satirlar);
      return el("li", "", { "data-ders": d.kimlik }, el("b", "", {}, d.ad), ": ",
        `${o.ogrenci} öğrenci · ${o.bitiren} bitirdi · `,
        el("span", o.onayBekleyen ? "rd-vurgu" : "", {}, `${o.onayBekleyen} onay bekliyor`), ` · ${o.onaylanan} onaylandı`);
    });
    const tablo = el("table", "rd-tablo", { "aria-label": "Öğrencilerin ders ilerlemesi" },
      el("thead", "", {}, el("tr", "", {}, el("th", "", { scope: "col" }, "Öğrenci"), ...dersler.map((d) => el("th", "", { scope: "col" }, d.ad)))),
      el("tbody", "", {}, ...satirlar.map((s) => el("tr", "", { "data-ogrenci": s.id }, el("th", "", { scope: "row" }, s.takma_ad),
        ...dersler.map((d) => el("td", "", {}, hucre(s, d)))))));
    kart.replaceChildren(
      el("div", "r-kart-bas", {}, el("h2", "", { id: "rd-b" }, "Dersler"),
        el("div", "r-lejant rd-lejant", {}, ...(Object.keys(HUCRE_DURUMLARI) as HucreDurumu[]).map((k) => el("span", "", {}, el("i", `rd-d rd-d--${k}`, { "aria-hidden": "true" }, HUCRE_DURUMLARI[k].simge), HUCRE_DURUMLARI[k].ad)))),
      el("ul", "rd-ozet", {}, ...ozetler),
      el("p", "rd-aciklama", {}, "Hücreye dokununca ayrıntı açılır. A: Anlat, D: Dene, G: Görev, R: Gerçek robotta. Öğrenci işaretlemeyi unuttuysa onayı ayrıntıdan verebilirsiniz."),
      el("div", "rd-kap", {}, tablo), hata);
  };
  const hucre = (s: RaporSatiri, d: DersTanimi): HTMLElement => {
    const h = dersHucresi(d, s), bilgi = HUCRE_DURUMLARI[h.durum];
    const isaretler = el("span", "rd-bolumler", { "aria-hidden": "true" }, ...BOLUMLER.map(([b, harf]) => el("i", h.ozet[b] ? "tamam" : "", {}, harf)));
    const onayDugmesi = (onay: boolean, sinif: string) => {
      const b = el("button", sinif, { type: "button", "data-onay": String(onay) }, onay ? "Onayla" : "Onayı geri al");
      b.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        b.disabled = true; hata.hidden = true;
        try {
          await onayla(s.id, d.kimlik, onay);
          const o = { ...(s.onaylar ?? {}) };
          if (onay) o[d.kimlik] = new Date().toISOString(); else delete o[d.kimlik];
          s.onaylar = o;
          ciz();
          (kart.querySelector(`tr[data-ogrenci="${s.id}"] .rd-ozet-dugme`) as HTMLElement | null)?.focus();
        } catch (err) { b.disabled = false; hata.textContent = hataMetni(err); hata.hidden = false; }
      });
      return b;
    };
    const bolumSatiri = ([b, , ad]: (typeof BOLUMLER)[number]) => {
      const deger = b === "anlat" ? (h.ozet.anlat ? "bitti" : h.adim ? `${h.adim + 1}. adımda` : "başlamadı")
        : b === "dene" ? (h.ozet.dene ? "bitti" : h.denenen ? `${h.denenen} değer denedi` : "başlamadı")
        : b === "gorev" ? (h.ozet.gorev ? `${h.ozet.gorevYildiz} / 3 yıldız` : "yapılmadı")
        : h.ozet.onayli ? "öğretmen onayladı" : h.ozet.gercek ? "sınıfta yaptım dedi" : "işaretlenmedi";
      return el("li", "", {}, el("span", "", {}, ad), el("b", "", {}, deger));
    };
    const ayrinti = el("details", "rd-hucre", { "data-durum": h.durum, "data-ders": d.kimlik },
      el("summary", "rd-ozet-dugme", { "aria-label": `${s.takma_ad}, ${d.ad}: ${bilgi.ad}` },
        el("span", `rd-d rd-d--${h.durum}`, { "aria-hidden": "true" }, bilgi.simge), el("span", "rd-durum", {}, bilgi.ad.split(",")[0]), isaretler),
      el("div", "rd-ayrinti", {},
        el("b", "", {}, `${s.takma_ad} · ${d.ad}`),
        el("ul", "", {}, ...BOLUMLER.map(bolumSatiri), el("li", "", {}, el("span", "", {}, "Son çalışma"), el("b", "", {}, tarih(h.son)))),
        h.ozet.onayli ? onayDugmesi(false, "rd-geri") : onayDugmesi(true, "rd-onayla")));
    return el("div", "rd-hucre-kap", {}, ayrinti, h.durum === "onay-bekliyor" ? onayDugmesi(true, "rd-onayla rd-onayla--hizli") : null);
  };
  ciz();
  return kart;
}

export const RAPOR_DERSLER_STILI = `
.rd-ozet{margin:0;padding:0;list-style:none;display:grid;gap:4px;color:var(--sra2-murekkep-2)}
.rd-ozet b{color:var(--sra2-murekkep)}
.rd-vurgu{color:var(--sra2-kirmizi-taban);font-weight:800}
.rd-aciklama{margin:0;font-size:var(--sra2-boy-1);color:var(--sra2-murekkep-2)}
.rd-kap{overflow-x:auto;padding-bottom:4px}
.rd-tablo{border-collapse:separate;border-spacing:0 6px;min-width:100%}
.rd-tablo thead th{font-size:var(--sra2-boy-1);color:var(--sra2-murekkep-2);text-align:left;padding:0 8px;font-weight:800}
.rd-tablo tbody th{vertical-align:top;padding-top:10px !important;text-align:left;font-weight:800;padding:0 12px 0 0;white-space:nowrap;position:sticky;left:0;background:#fff;z-index:1}
.rd-tablo td{padding:0 8px 0 0;vertical-align:top}
.rd-hucre-kap{display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap}
.rd-hucre{position:relative}
.rd-hucre[open] + .rd-onayla--hizli{display:none}
.rd-ozet-dugme{list-style:none;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 10px;border-radius:12px;border:2px solid var(--sra2-lavanta-2);background:#fff;cursor:pointer;font-weight:700;white-space:nowrap}
.rd-ozet-dugme::-webkit-details-marker{display:none}
.rd-ozet-dugme:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:2px}
.rd-hucre[open] .rd-ozet-dugme{border-color:var(--sra2-mor)}
.r-lejant.rd-lejant i.rd-d,.rd-d{width:22px;height:22px;border-radius:6px}
.rd-d{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:6px;font-style:normal;font-weight:800;font-size:13px}
.rd-d--baslamadi{background:#EEEAF6;color:#5A5478}
.rd-d--suruyor{background:var(--sra2-sari-acik);color:#6B4B00}
.rd-d--bitti{background:var(--sra2-yesil-acik);color:var(--sra2-yesil-taban)}
.rd-d--onay-bekliyor{background:var(--sra2-kirmizi);color:#fff}
.rd-d--onaylandi{background:var(--sra2-yesil);color:#fff}
.rd-durum{font-size:var(--sra2-boy-1)}
.rd-bolumler{display:inline-flex;gap:3px}
.rd-bolumler i{font:800 11px var(--sra2-yazi-kod);width:18px;height:18px;display:inline-grid;place-items:center;border-radius:4px;background:#F3F1F8;color:#8C87A6;font-style:normal}
.rd-bolumler i.tamam{background:var(--sra2-mor);color:#fff}
.rd-ayrinti{margin-top:6px;min-width:240px;max-width:320px;padding:14px;border-radius:14px;background:#fff;border:2px solid var(--sra2-mor);box-shadow:0 10px 30px rgba(23,20,74,.18);display:grid;gap:10px}
.rd-ayrinti ul{margin:0;padding:0;list-style:none;display:grid;gap:4px}
.rd-ayrinti li{display:flex;justify-content:space-between;gap:12px;font-size:var(--sra2-boy-1)}
.rd-ayrinti li span{color:var(--sra2-murekkep-2)}
.rd-onayla,.rd-geri{min-height:40px;padding:6px 14px;border-radius:12px;font:800 var(--sra2-boy-1) var(--sra2-yazi);cursor:pointer;border:0}
.rd-onayla{background:var(--sra2-yesil);color:#fff;box-shadow:0 3px 0 var(--sra2-yesil-taban)}
.rd-geri{background:#fff;color:var(--sra2-murekkep);border:2px solid var(--sra2-lavanta-2)}
.rd-onayla:disabled,.rd-geri:disabled{opacity:.6;cursor:wait}
.rd-onayla:focus-visible,.rd-geri:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:2px}
@media (max-width:600px){.rd-durum{display:none}.rd-tablo tbody th{font-size:var(--sra2-boy-1)}}
.rd-hata{margin:0;color:var(--sra2-hata);font-weight:700}
@media print{.rd-onayla,.rd-geri{display:none}}
`;
