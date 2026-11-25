/* Ders sayfasının anlatım görsellerini kayıt defterine bağlar. Çizim hemen kurulur; 3D sahne kodu yalnız sahneli bir adım
   açılınca indirilir (ayrı parça). */
import { CIZIMLER, SAHNE_ANLARI } from "@sra/mufredat";
import { el } from "@sra/tasarim/v2";
import type { GorselOynatici } from "../ekranlar/ders-sayfasi";
import { CIZIM_STILI, cizimKur } from "./cizim";

let stilVar = false;
const stil = (css: string) => { const s = document.createElement("style"); s.textContent = css; document.head.append(s); };

export function cizimGorseli(ad: string): GorselOynatici {
  if (!stilVar) { stil(CIZIM_STILI); stilVar = true; }
  const o = cizimKur(ad, CIZIMLER[ad]);
  return { kap: o.kap, olay: { basladi: o.basladi, kelime: o.kelime, bitti: o.bitti }, kapat: o.kapat };
}

let sahneStili = false;
export function sahneGorseli(ad: string): GorselOynatici {
  const kap = el("div", "sa-yer", { style: "width:100%;height:100%", "data-sahne-yer": ad }, el("span", "dr-yukleniyor", {}, "3D sahne yükleniyor…"));
  let kapandi = false, kapat = () => { kapandi = true; };
  void import("./sahne-ani").then(({ sahneAniKur, SAHNE_STILI }) => {
    if (kapandi) return;
    if (!sahneStili) { stil(SAHNE_STILI); sahneStili = true; }
    const o = sahneAniKur(ad, SAHNE_ANLARI[ad]);
    kap.replaceChildren(o.kap);
    kapat = o.kapat;
  });
  return { kap, kapat: () => kapat() };
}
