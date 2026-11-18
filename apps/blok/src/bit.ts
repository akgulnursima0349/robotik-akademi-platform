/* Bit: Junior'daki robot karakterin aynısı (üç kurs aynı karakteri paylaşır). */
const AGIZ: Record<string, string> = {
  mutlu: '<path d="M24 39q8 7 16 0" stroke="#172036" stroke-width="3" fill="none" stroke-linecap="round"/>',
  vay: '<ellipse cx="32" cy="41" rx="5" ry="4" fill="#172036"/>',
  uzgun: '<path d="M25 43q7-5 14 0" stroke="#172036" stroke-width="3" fill="none" stroke-linecap="round"/>'
};
export type Ruh = "mutlu" | "vay" | "uzgun";
export const bitIc = (ruh: Ruh = "mutlu") => `
  <line x1="32" y1="4" x2="32" y2="12" stroke="#188a85" stroke-width="3"/><circle cx="32" cy="5" r="4" fill="#d7262e"/>
  <rect x="8" y="12" width="48" height="42" rx="14" fill="#22a6a0"/><rect x="14" y="20" width="36" height="28" rx="10" fill="#e9fbf9"/>
  <ellipse class="goz" cx="24" cy="30" rx="4" ry="5" fill="#172036"/><ellipse class="goz" cx="40" cy="30" rx="4" ry="5" fill="#172036"/>${AGIZ[ruh]}
  <rect x="2" y="28" width="6" height="14" rx="3" fill="#188a85"/><rect x="56" y="28" width="6" height="14" rx="3" fill="#188a85"/>`;
export const bitSvg = (ruh: Ruh = "mutlu", sinif = "bit") => `<svg class="${sinif}" viewBox="0 0 64 64" aria-hidden="true">${bitIc(ruh)}</svg>`;
