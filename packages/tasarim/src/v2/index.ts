/* Tasarım sistemi v2 ("Oyun"): fontlar, belirteçler, bileşenler ve küçük DOM yardımcıları.
   Kullanım: sayfanın kök öğesine .sra2 sınıfı (ve gerekiyorsa data-seviye) verilir; bileşenler bu kökün içinde çalışır.
   v1 (stil.css) ile birlikte yüklenebilir; v1 sayfaları etkilenmez. */
/* her ağırlık dosyası alt kümeleri unicode-range ile tanımlar: tarayıcı yalnız sayfadaki harflerin kümesini indirir
   (Türkçe için latin + latin-ext). Fontlar paketle gelir, internetten çekilmez. */
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/jetbrains-mono/500.css";
import "./belirtecler.css";
import "./bilesenler.css";
import { el } from "../dom";
import { IKONLAR2, type Ikon2 } from "./ikonlar";
import { maskot, type MaskotHali } from "./maskot";
import { kelimeler, kendiligindenOkunsunMu, sesServisi, type SesServisi } from "./ses";

export { el, IKONLAR2, type Ikon2 };
export { maskot, maskotSvg, MASKOT_HALLERI, type MaskotHali } from "./maskot";
export { SesServisi, sesServisi, tarayiciMotoru, kelimeler, kelimeSirasi, kendiligindenOkunsunMu, type SesMotoru, type SesAyari, type SesHizi } from "./ses";
export type Seviye = "okul-oncesi" | "ilkokul" | "ortaokul" | "lise";
export const SEVIYELER: [Seviye, string][] = [["okul-oncesi", "Okul öncesi"], ["ilkokul", "İlkokul"], ["ortaokul", "Ortaokul"], ["lise", "Lise"]];

/** Kök öğeyi v2'ye bağlar: .sra2 sınıfı ve seviye */
export function kok(e: HTMLElement, seviye?: Seviye): HTMLElement {
  e.classList.add("sra2");
  if (seviye) e.dataset.seviye = seviye; else delete e.dataset.seviye;
  return e;
}

export function ikon(ad: Ikon2, sinif = ""): HTMLSpanElement {
  const s = el("span", ("s2-ikon " + sinif).trim(), { "aria-hidden": "true" });
  s.innerHTML = IKONLAR2[ad];
  return s;
}

/* ---------- düğme ---------- */
export type DugmeTuru = "ana" | "ikincil" | "ipucu" | "mor" | "sessiz";
export interface DugmeAyari {
  metin: string;
  tur?: DugmeTuru;
  ikon?: Ikon2;
  ikonSonda?: boolean;
  /** metnin yanında küçük ek (ör. "−5 XP") */
  ek?: string;
  kucuk?: boolean;
  /** yalnız ikon görünür; metin erişilebilir ad olur */
  yalnizIkon?: boolean;
  href?: string;
  devreDisi?: boolean;
  yukleniyor?: boolean;
  id?: string;
}
export function dugme(a: DugmeAyari): HTMLButtonElement | HTMLAnchorElement {
  const sinif = ["s2-dugme", a.tur && a.tur !== "ikincil" && "s2-dugme--" + a.tur, a.kucuk && "s2-dugme--kucuk", a.yalnizIkon && "s2-dugme--ikon"].filter(Boolean).join(" ");
  const d = a.href ? el("a", sinif, { href: a.href }) : el("button", sinif, { type: "button" });
  if (a.id) d.id = a.id;
  const ik = a.yukleniyor ? ikon("yukleniyor") : a.ikon ? ikon(a.ikon) : null;
  if (a.yalnizIkon) { d.setAttribute("aria-label", a.metin); if (ik) d.append(ik); }
  else {
    if (ik && !a.ikonSonda) d.append(ik);
    d.append(el("span", "", {}, a.metin));
    if (a.ek) d.append(el("span", "s2-dugme__ek", {}, a.ek));
    if (ik && a.ikonSonda) d.append(ik);
  }
  if (a.devreDisi) { if (d instanceof HTMLButtonElement) d.disabled = true; else { d.setAttribute("aria-disabled", "true"); d.removeAttribute("href"); } }
  if (a.yukleniyor) d.setAttribute("aria-busy", "true");
  return d;
}

/* ---------- atölye kartı ---------- */
export type AtolyeKimligi = "bilgisayar" | "blok" | "python" | "cpp" | "arduino" | "robotik";
const ATOLYE_IKON: Record<AtolyeKimligi, Ikon2> = { bilgisayar: "bilgisayar", blok: "yapboz", python: "terminal", cpp: "kod", arduino: "islemci", robotik: "robot" };
export interface AtolyeAyari { kimlik: AtolyeKimligi; ad: string; aciklama: string; href: string; secili?: boolean; kilitli?: boolean }
export function atolyeKarti(a: AtolyeAyari): HTMLAnchorElement {
  const k = el("a", "s2-atolye" + (a.kilitli ? " s2-atolye--kilitli" : ""), { href: a.href, style: `--atolye: var(--sra2-atolye-${a.kimlik})` },
    el("span", "s2-atolye__ikon", {}, ikon(a.kilitli ? "kilit" : ATOLYE_IKON[a.kimlik])),
    el("span", "s2-atolye__ad", {}, a.ad),
    el("span", "s2-atolye__aciklama", {}, a.kilitli ? "Yakında" : a.aciklama));
  if (a.secili) k.setAttribute("aria-current", "true");
  if (a.kilitli) { k.setAttribute("aria-disabled", "true"); k.removeAttribute("href"); }
  return k;
}

/* ---------- hap, XP, rozet, seviye ---------- */
export function hap(metin: string, tur: "sari" | "mor" | "yesil" | "gece" = "sari", ik?: Ikon2): HTMLSpanElement {
  return el("span", "s2-hap" + (tur === "sari" ? "" : " s2-hap--" + tur), {}, ik ? ikon(ik) : null, metin);
}
export function xpHap(xp: number): HTMLSpanElement {
  return el("span", "s2-hap s2-xp", { "aria-label": `${xp > 0 ? "+" : ""}${xp} deneyim puanı` }, ikon("yildiz"), `${xp > 0 ? "+" : ""}${xp} XP`);
}
export function rozet(ad: string, ik: Ikon2, kilitli = false): HTMLElement {
  return el("figure", "s2-rozet" + (kilitli ? " s2-rozet--kilitli" : ""), { style: "margin:0" },
    el("span", "s2-rozet__daire", {}, ikon(kilitli ? "kilit" : ik)),
    el("figcaption", "", {}, ad, kilitli ? el("span", "s2-gizli", {}, " (kilitli)") : null));
}
export function seviyeGostergesi(seviye: number, unvan: string, doluluk: number): HTMLElement {
  const y = Math.round(Math.max(0, Math.min(1, doluluk)) * 100);
  return el("div", "s2-seviye", {},
    el("span", "s2-seviye__no", { "aria-hidden": "true" }, String(seviye)),
    el("span", "s2-seviye__yazi", {}, `Seviye ${seviye} · ${unvan}`,
      el("span", "s2-seviye__cubuk", { role: "progressbar", "aria-label": "Sonraki seviyeye", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(y) }, el("span", "", { style: `width:${y}%` }))));
}

/* ---------- ilerleme ---------- */
/** parçalı çubuk: biten, şimdiki ve kalan parçalar */
export function parcaliIlerleme(toplam: number, biten: number, simdiki = false, etiket = "İlerleme"): HTMLElement {
  const p = el("div", "s2-ilerleme", { role: "progressbar", "aria-label": etiket, "aria-valuemin": "0", "aria-valuemax": String(toplam), "aria-valuenow": String(biten), "aria-valuetext": `${toplam} parçadan ${biten} tanesi bitti` });
  for (let i = 0; i < toplam; i++) p.append(el("span", i < biten ? "bitti" : i === biten && simdiki ? "simdi" : ""));
  return p;
}
export function yildizlar(toplam: number, dolu: number): HTMLElement {
  const y = el("span", "s2-yildizlar", { role: "img", "aria-label": `${toplam} yıldızdan ${dolu} tanesi kazanıldı` });
  for (let i = 0; i < toplam; i++) y.append(ikon("yildiz", i < dolu ? "dolu" : ""));
  return y;
}

/* ---------- seçiciler ---------- */
/** Ok tuşlarıyla gezinme: grup içindeki öğeler arasında odağı taşır (roving tabindex). */
function okGezinme(kap: HTMLElement, ogeler: HTMLElement[], sec: (i: number) => void) {
  kap.addEventListener("keydown", (e) => {
    const i = ogeler.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const n = ogeler.length;
    const yeni = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (yeni < 0) return;
    e.preventDefault();
    sec(yeni);
    ogeler[yeni].focus();
  });
}

/** Tek seçimli grup (radiogroup): seviye seçimi gibi. */
export function secici<T extends string>(ad: string, secenekler: [T, string][], ilk: T, degisince: (d: T) => void): HTMLElement {
  const kap = el("div", "s2-secici", { role: "radiogroup", "aria-label": ad });
  const dugmeler = secenekler.map(([d, m]) => el("button", "", { type: "button", role: "radio", "data-deger": d }, m));
  const sec = (i: number, bildir = true) => {
    dugmeler.forEach((b, j) => { b.setAttribute("aria-checked", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    if (bildir) degisince(secenekler[i][0]);
  };
  dugmeler.forEach((b, i) => b.addEventListener("click", () => sec(i)));
  okGezinme(kap, dugmeler, sec);
  sec(Math.max(0, secenekler.findIndex(([d]) => d === ilk)), false);
  kap.append(...dugmeler);
  return kap;
}

/** Sekmeler: tablist + paneller. Ok tuşlarıyla gezinir, seçilen sekmenin paneli görünür. */
export function sekmeler(ad: string, sekme: { ad: string; icerik: Node }[], ilk = 0): HTMLElement {
  const kimlik = "s2s-" + Math.random().toString(36).slice(2, 8);
  const liste = el("div", "s2-sekmeler", { role: "tablist", "aria-label": ad });
  const basliklar = sekme.map((s, i) => el("button", "", { type: "button", role: "tab", id: `${kimlik}-t${i}`, "aria-controls": `${kimlik}-p${i}` }, s.ad));
  const paneller = sekme.map((s, i) => el("div", "s2-sekme-paneli", { role: "tabpanel", id: `${kimlik}-p${i}`, "aria-labelledby": `${kimlik}-t${i}`, tabindex: "0" }, s.icerik));
  const sec = (i: number) => {
    basliklar.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    paneller.forEach((p, j) => { p.hidden = i !== j; });
  };
  basliklar.forEach((b, i) => b.addEventListener("click", () => sec(i)));
  okGezinme(liste, basliklar, sec);
  sec(ilk);
  liste.append(...basliklar);
  return el("div", "s2-sekme-kap", {}, liste, ...paneller);
}

/* ---------- adım göstergesi ---------- */
export const DERS_ADIMLARI = ["Anlat", "Dene", "Görev", "Gerçek robotta"] as const;
export function adimGostergesi(simdiki: number, adimlar: readonly string[] = DERS_ADIMLARI): HTMLOListElement {
  const ol = el("ol", "s2-adimlar", { "aria-label": "Dersin bölümleri" });
  adimlar.forEach((a, i) => {
    const li = el("li", i < simdiki ? "bitti" : "");
    if (i === simdiki) li.setAttribute("aria-current", "step");
    if (i > 0) li.append(el("span", "s2-adimlar__cizgi", { "aria-hidden": "true" }));
    li.append(el("span", "s2-adimlar__ad", {}, i < simdiki ? ikon("tamam") : null, a, i < simdiki ? el("span", "s2-gizli", {}, " (bitti)") : null));
    ol.append(li);
  });
  return ol;
}

/* ---------- bildirim şeridi ---------- */
export type BildirimTuru = "basari" | "ipucu" | "hata" | "bilgi";
const BILDIRIM_IKON: Record<BildirimTuru, Ikon2> = { basari: "tamam", ipucu: "ampul", hata: "hata", bilgi: "bilgi" };
export function bildirim(tur: BildirimTuru, baslik: string, metin: string, eylem?: HTMLElement): HTMLElement {
  return el("div", "s2-bildirim" + (tur === "bilgi" ? "" : " s2-bildirim--" + tur), { role: tur === "hata" ? "alert" : "status" },
    el("span", "s2-bildirim__ikon", {}, ikon(BILDIRIM_IKON[tur])),
    el("p", "", { style: "margin:0" }, el("strong", "", {}, baslik), metin),
    eylem ? el("span", "s2-bildirim__eylem", {}, eylem) : null);
}

/* ---------- kod çerçevesi (koyu) ---------- */
export function kodCercevesi(dosya: string, kod: string): HTMLElement {
  return el("figure", "s2-kod", { style: "margin:0" }, el("figcaption", "s2-kod__ust", {}, dosya), el("pre", "", {}, el("code", "", {}, kod)));
}

/* ---------- konuşma balonu ---------- */
export interface KonusmaAyari {
  metin: string;
  /** ekrandakinden farklı okunacaksa (sembol, kod); bu durumda kelime vurgusu yapılmaz */
  seslendirme?: string;
  hal?: MaskotHali;
  /** okul öncesinde ve ses açıksa sayfaya eklenince kendiliğinden okunur (seviye kökten okunur) */
  kendiliginden?: boolean;
  ses?: SesServisi;
  /** okuma olayları (anlatım çizimleri kelimeye göre belirsin diye) */
  olay?: { basladi?: () => void; kelime?: (sira: number) => void; bitti?: () => void };
}
/** Bit + konuşma balonu + "Dinle" düğmesi. Okurken söylenen kelime vurgulanır. Türkçe ses yoksa düğme yok, metin hep görünür. */
export function konusmaBalonu(a: KonusmaAyari): HTMLElement {
  const ses = a.ses ?? sesServisi();
  const k = kelimeler(a.metin);
  const metin = el("p", "s2-balon__metin");
  k.forEach((w, i) => { if (i) metin.append(" "); metin.append(el("span", "", { "data-i": String(i) }, w.kelime)); });
  const balon = el("div", "s2-balon", { role: "status" }, metin);
  const kap = el("div", "s2-konusma", {}, maskot(a.hal ?? "anlatiyor", 96, true), balon);
  let no = 0;
  const vurgu = (i: number) => metin.querySelectorAll("span").forEach((s, j) => s.classList.toggle("okunan", j === i));
  const dinle = dugme({ metin: "Dinle", tur: "ana", ikon: "ses", kucuk: true }) as HTMLButtonElement;
  dinle.classList.add("s2-dinle");
  dinle.setAttribute("aria-pressed", "false");
  const durum = (okuyor: boolean) => {
    dinle.setAttribute("aria-pressed", String(okuyor));
    dinle.querySelector("span:not(.s2-ikon)")!.textContent = okuyor ? "Durdur" : "Dinle";
    if (!okuyor) vurgu(-1);
  };
  const oku = (zorla: boolean) => {
    no = ses.oku(a.seslendirme ?? a.metin, {
      zorla,
      kelime: (i) => { if (!a.seslendirme) vurgu(i); a.olay?.kelime?.(i); },
      bitti: () => { durum(false); a.olay?.bitti?.(); }
    });
    if (no) { durum(true); if (!a.seslendirme) vurgu(0); a.olay?.basladi?.(); }
  };
  dinle.addEventListener("click", () => { if (no && ses.okunan === no) { ses.durdur(); durum(false); a.olay?.bitti?.(); } else oku(true); });
  const goster = () => { dinle.hidden = !ses.var; };
  goster();
  ses.degisince(() => { goster(); if (no && ses.okunan !== no) durum(false); });
  balon.append(dinle);
  if (a.kendiliginden !== false) queueMicrotask(() => {
    const seviye = (kap.closest(".sra2") as HTMLElement | null)?.dataset.seviye;
    if (kendiligindenOkunsunMu(seviye, ses.acik)) oku(false);
  });
  return kap;
}

/** Ses ayarları: açık/kapalı anahtarı ve hız */
export function sesAyarlari(ses: SesServisi = sesServisi()): HTMLElement {
  const anahtar = el("button", "s2-anahtar", { type: "button", role: "switch", "aria-checked": String(ses.acik), id: "s2-ses-anahtar" }, el("span", "s2-anahtar__yuva", { "aria-hidden": "true" }), "Sesli anlatım");
  anahtar.addEventListener("click", () => { ses.acik = !ses.acik; });
  const hiz = secici("Okuma hızı", [["normal", "Normal"], ["yavas", "Yavaş"]], ses.ayar.hiz, (h) => { ses.ayar = { ...ses.ayar, hiz: h }; });
  const kap = el("div", "s2-ses-ayar", {}, anahtar, hiz);
  ses.degisince(() => { anahtar.setAttribute("aria-checked", String(ses.acik)); });
  if (!ses.var) kap.append(el("span", "", { style: "font-weight:700;color:var(--sra2-murekkep-2)" }, "Bu tarayıcıda Türkçe ses yok; metinler ekranda."));
  return kap;
}
