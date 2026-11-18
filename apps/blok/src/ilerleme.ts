/* Blok Atölyesi ilerlemesi (bu cihazda). */
import type { Blok } from "./model";
const ANAHTAR = "sra-blok-v1";
interface Veri { yildiz: Record<string, number>; program: Record<string, Blok[]> }
let v: Veri = { yildiz: {}, program: {} };
try { const h = localStorage.getItem(ANAHTAR); if (h) v = { ...v, ...JSON.parse(h) }; } catch { /* yok */ }
const yaz = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch { /* yok */ } };
export const ilerleme = {
  yildiz: (k: string) => v.yildiz[k] ?? 0,
  yildizKaydet(k: string, y: number) { v.yildiz[k] = Math.max(y, v.yildiz[k] ?? 0); yaz(); },
  program: (k: string): Blok[] | null => v.program[k] ?? null,
  programKaydet(k: string, p: Blok[]) { v.program[k] = p; yaz(); },
  toplam: () => Object.values(v.yildiz).reduce((t, y) => t + y, 0)
};
