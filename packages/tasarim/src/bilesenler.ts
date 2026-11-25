/* v1 bileşen fonksiyonları (stil yüklemez). Stil: index.ts (v1) ya da v2/uyum.css (v2 görünümü). */
import { IKONLAR, type IkonAdi } from "./ikonlar";
import logoUrl from "./logo.webp";

export type { IkonAdi };
export { IKONLAR };
export const LOGO = logoUrl;

export { el } from "./dom";
import { el } from "./dom";

export function ikon(ad: IkonAdi, sinif = ""): HTMLSpanElement {
  const s = el("span", ("sra-ikon " + sinif).trim(), { "aria-hidden": "true" });
  s.innerHTML = IKONLAR[ad];
  return s;
}

export type DugmeTuru = "ana" | "ikincil" | "hayalet";
export interface DugmeSecenek {
  metin: string;
  tur?: DugmeTuru;
  ikon?: IkonAdi;
  ikonSonda?: boolean;
  href?: string;
  kucuk?: boolean;
  blok?: boolean;
  tip?: "button" | "submit";
  id?: string;
}
export function dugme(s: DugmeSecenek): HTMLButtonElement | HTMLAnchorElement {
  const sinif = ["sra-dugme", "sra-dugme--" + (s.tur ?? "ana"), s.kucuk && "sra-dugme--kucuk", s.blok && "sra-dugme--blok"].filter(Boolean).join(" ");
  const e = s.href ? el("a", sinif, { href: s.href }) : el("button", sinif, { type: s.tip ?? "button" });
  if (s.id) e.id = s.id;
  const yazi = el("span", "sra-dugme__yazi", {}, s.metin);
  if (s.ikon && !s.ikonSonda) e.append(ikon(s.ikon));
  e.append(yazi);
  if (s.ikon && s.ikonSonda) e.append(ikon(s.ikon));
  return e;
}

export function rozet(metin: string, tur: "duz" | "renkli" | "koyu" = "duz", renk?: string): HTMLSpanElement {
  const r = el("span", "sra-rozet" + (tur === "duz" ? "" : " sra-rozet--" + tur), {}, metin);
  if (renk) r.style.setProperty("--renk", renk);
  return r;
}

export interface KursKartiSecenek {
  kimlik: string;
  baslik: string;
  etiket: string;
  aciklama: string;
  bilgi: string;
  bilgiIkon: IkonAdi;
  renk: string;
  gorsel: string | SVGElement | HTMLElement;
  gorselAlt?: string;
  href?: string;
  yakinda?: boolean;
}
export function kursKarti(s: KursKartiSecenek): HTMLElement {
  const kart = s.href && !s.yakinda ? el("a", "sra-kurs", { href: s.href }) : el("article", "sra-kurs sra-kurs--yakinda", { "aria-disabled": "true" });
  kart.dataset.kurs = s.kimlik;
  kart.style.setProperty("--renk", s.renk);
  const g = el("div", "sra-kurs__gorsel", {}, el("span", "sra-kurs__serit"));
  if (typeof s.gorsel === "string") g.append(el("img", "", { src: s.gorsel, alt: s.gorselAlt ?? "", loading: "eager", decoding: "async", width: "800", height: "500" }));
  else g.append(s.gorsel);
  if (s.yakinda) g.append(el("span", "sra-kurs__rozet", {}, rozet("Yakında", "koyu")));
  const alt = el("div", "sra-kurs__alt", {}, el("span", "sra-kurs__bilgi", {}, ikon(s.bilgiIkon), s.bilgi));
  if (!s.yakinda) alt.append(el("span", "sra-kurs__ok", { "aria-hidden": "true" }, ikon("ok-sag")));
  const govde = el("div", "sra-kurs__govde", {},
    el("span", "sra-kurs__etiket", {}, s.etiket),
    el("h3", "sra-kurs__baslik", {}, s.baslik),
    el("p", "sra-kurs__aciklama", {}, s.aciklama),
    alt);
  kart.append(g, govde);
  return kart;
}

export interface AlanSecenek {
  etiket: string;
  id: string;
  tip?: string;
  tur?: "duz" | "kod" | "pin";
  ipucu?: string;
  ozellik?: Record<string, string>;
}
export function alan(s: AlanSecenek): HTMLLabelElement {
  const girdi = el("input", "", { id: s.id, name: s.id, type: s.tip ?? "text", autocomplete: "off", ...(s.ozellik ?? {}) });
  const l = el("label", "sra-alan" + (s.tur && s.tur !== "duz" ? " sra-alan--" + s.tur : ""), { for: s.id }, s.etiket, girdi);
  if (s.ipucu) l.append(el("span", "sra-alan__ipucu", {}, s.ipucu));
  return l;
}

export type UyariTuru = "hata" | "basari" | "bilgi";
const UYARI_IKON: Record<UyariTuru, IkonAdi> = { hata: "uyari", basari: "tamam", bilgi: "bilgi" };
export function uyari(metin: string, tur: UyariTuru = "bilgi"): HTMLDivElement {
  const d = el("div", "sra-uyari sra-uyari--" + tur, { role: tur === "hata" ? "alert" : "status" }, ikon(UYARI_IKON[tur]));
  d.append(el("span", "", {}, metin));
  return d;
}

export function marka(href = "#"): HTMLAnchorElement {
  const a = el("a", "sra-marka", { href, "aria-label": "Sivas Robotik Akademi ana sayfa" },
    el("img", "", { src: LOGO, alt: "", width: "40", height: "40" }));
  a.append(el("span", "", {}, "Sivas Robotik Akademi", el("small", "", {}, "Eğitim Platformu")));
  return a;
}

export function ustBar(sag: Node[] = [], anaSayfa = "#"): HTMLElement {
  const ic = el("div", "sra-ustbar__ic sra-sarmal", {}, marka(anaSayfa), el("div", "sra-ustbar__sag", {}, ...sag));
  return el("header", "sra-ustbar", {}, ic);
}
