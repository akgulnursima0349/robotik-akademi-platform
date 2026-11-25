/* Bit: platformun maskotu. Junior'daki robot Bit'in v2 çizimi: kalın yuvarlak hatlar, akademi kırmızısı gövde, lavanta ekran,
   gece mavisi yüz. Kodla çizilir (SVG): hâller ayrı yüz ifadeleri, hareketler CSS ile ("hareketi azalt"ta durur). */
import { el } from "../dom";

export type MaskotHali = "anlatiyor" | "dusunuyor" | "ipucu" | "seviniyor" | "sasiriyor" | "bekliyor";
export const MASKOT_HALLERI: [MaskotHali, string][] = [
  ["anlatiyor", "anlatıyor"], ["dusunuyor", "düşünüyor"], ["ipucu", "ipucu veriyor"], ["seviniyor", "seviniyor"], ["sasiriyor", "şaşırdı"], ["bekliyor", "bekliyor"]
];

const G = "#17144A", K = "#E3262F", KT = "#A9161E", E = "#EEEAFF", S = "#FFC531";

const GOZ_NORMAL = `<g class="s2-maskot__goz"><ellipse cx="25" cy="38" rx="4.2" ry="5.2" fill="${G}"/><ellipse cx="39" cy="38" rx="4.2" ry="5.2" fill="${G}"/><circle cx="26.4" cy="36.2" r="1.4" fill="#fff"/><circle cx="40.4" cy="36.2" r="1.4" fill="#fff"/></g>`;
const YUZ: Record<MaskotHali, string> = {
  anlatiyor: GOZ_NORMAL + `<ellipse class="s2-maskot__agiz" cx="32" cy="48" rx="5" ry="3.6" fill="${G}"/>`,
  bekliyor: GOZ_NORMAL + `<path d="M26.5 47q5.5 4 11 0" stroke="${G}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  dusunuyor: `<g><ellipse cx="26.5" cy="36.5" rx="4" ry="5" fill="${G}"/><ellipse cx="40.5" cy="36.5" rx="4" ry="5" fill="${G}"/><circle cx="28" cy="34.4" r="1.4" fill="#fff"/><circle cx="42" cy="34.4" r="1.4" fill="#fff"/></g>`
    + `<path d="M28 48.5h9" stroke="${G}" stroke-width="2.8" stroke-linecap="round"/>`
    + `<g class="s2-maskot__dusunce" fill="${G}" opacity=".55"><circle cx="58" cy="14" r="2.2"/><circle cx="62.5" cy="8" r="2.8"/></g>`,
  ipucu: GOZ_NORMAL + `<path d="M25.5 46q6.5 6 13 0" stroke="${G}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  seviniyor: `<path d="M20.5 39.5q4.5-6 9 0M34.5 39.5q4.5-6 9 0" stroke="${G}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<path d="M24 45h16q-1 8-8 8t-8-8z" fill="${G}"/><path d="M28.5 50.5q3.5 2 7 0" stroke="#FF8A8F" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    + `<circle cx="19" cy="46" r="2.6" fill="#FF8A8F" opacity=".7"/><circle cx="45" cy="46" r="2.6" fill="#FF8A8F" opacity=".7"/>`
    + `<g class="s2-maskot__yildiz" fill="${S}"><path d="M5 10l1.6 3.3 3.6.5-2.6 2.5.6 3.6L5 18.2l-3.2 1.7.6-3.6L-.2 13.8l3.6-.5z"/><path d="M59 4l1.2 2.5 2.7.4-2 1.9.5 2.7L59 10.2l-2.4 1.3.5-2.7-2-1.9 2.7-.4z"/></g>`,
  sasiriyor: `<g><circle cx="25" cy="37.5" r="5.6" fill="#fff" stroke="${G}" stroke-width="2.4"/><circle cx="39" cy="37.5" r="5.6" fill="#fff" stroke="${G}" stroke-width="2.4"/><circle cx="25" cy="38" r="2.4" fill="${G}"/><circle cx="39" cy="38" r="2.4" fill="${G}"/></g>`
    + `<ellipse cx="32" cy="49" rx="3.4" ry="4.2" fill="${G}"/>`
    + `<path d="M56 14v8M56 26.5v.5" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`
};

/** Bit'in SVG'si (metin) */
export function maskotSvg(hal: MaskotHali = "bekliyor"): string {
  const ampul = hal === "ipucu"
    ? `<g class="s2-maskot__isik"><circle cx="32" cy="6.5" r="9" fill="${S}" opacity=".28"/><path d="M32 -3.5v3M21.5 6.5h3M39.5 6.5h3M24.5 -1l2 2M39.5 -1l-2 2" stroke="${S}" stroke-width="2" stroke-linecap="round"/></g>`
    : "";
  return `<svg viewBox="-2 -6 68 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
${ampul}<line x1="32" y1="8" x2="32" y2="17" stroke="${KT}" stroke-width="3.4" stroke-linecap="round"/>
<circle class="s2-maskot__anten" cx="32" cy="6.5" r="${hal === "ipucu" ? 5.4 : 4.4}" fill="${S}" stroke="${G}" stroke-width="1.6"/>
<rect x="1.5" y="33" width="7" height="16" rx="3.5" fill="${KT}"/><rect x="55.5" y="33" width="7" height="16" rx="3.5" fill="${KT}"/>
<rect x="7" y="16" width="50" height="45" rx="16" fill="${K}"/>
<rect x="7" y="54" width="50" height="7" rx="3.5" fill="${KT}" opacity=".55"/>
<rect x="13" y="23" width="38" height="31" rx="11" fill="${E}" stroke="${G}" stroke-width="2"/>
${YUZ[hal]}
</svg>`;
}

/** Bit bileşeni. sus: yalnız süs (ekran okuyucudan gizli); değilse "Bit, <hâl>" diye okunur. boy: 64, 96 ya da 160 px */
export function maskot(hal: MaskotHali = "bekliyor", boy: 64 | 96 | 160 = 96, sus = false): HTMLElement {
  const ad = MASKOT_HALLERI.find(([h]) => h === hal)![1];
  const m = el("span", `s2-maskot s2-maskot--${hal}`, sus ? { "aria-hidden": "true" } : { role: "img", "aria-label": `Bit ${ad}` });
  m.style.width = m.style.height = boy + "px";
  m.innerHTML = maskotSvg(hal);
  m.dataset.hal = hal;
  return m;
}
