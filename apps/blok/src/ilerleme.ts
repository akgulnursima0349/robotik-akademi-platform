/* Blok Atölyesi ilerlemesi (bu cihazda; giriş yapmış öğrencide buluta eşitlenir). */
import type { Blok } from "./model";
const ANAHTAR = "sra-blok-v1";
export interface BlokVerisi { yildiz: Record<string, number>; deneme: Record<string, number>; program: Record<string, Blok[]> }
let v: BlokVerisi = { yildiz: {}, deneme: {}, program: {} };
try { const h = localStorage.getItem(ANAHTAR); if (h) v = { ...v, ...JSON.parse(h) }; } catch { /* yok */ }
let dinleyici: (() => void) | null = null;
const sakla = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch { /* yok */ } };
const yaz = () => { sakla(); dinleyici?.(); };
export const ilerleme = {
  yildiz: (k: string) => v.yildiz[k] ?? 0,
  yildizKaydet(k: string, y: number) { v.yildiz[k] = Math.max(y, v.yildiz[k] ?? 0); yaz(); },
  denemeArttir(k: string) { v.deneme[k] = (v.deneme[k] ?? 0) + 1; yaz(); },
  program: (k: string): Blok[] | null => v.program[k] ?? null,
  programKaydet(k: string, p: Blok[]) { v.program[k] = p; sakla(); },
  toplam: () => Object.values(v.yildiz).reduce((t, y) => t + y, 0),
  /* buluta yalnızca yıldız ve deneme gider; programlar bu cihazda kalır */
  veri: () => ({ yildiz: { ...v.yildiz }, deneme: { ...v.deneme } }),
  birlestir(u: Partial<BlokVerisi>) {
    for (const [k, y] of Object.entries(u.yildiz ?? {})) v.yildiz[k] = Math.max(y, v.yildiz[k] ?? 0);
    for (const [k, d] of Object.entries(u.deneme ?? {})) v.deneme[k] = Math.max(d, v.deneme[k] ?? 0);
    sakla();
  },
  dinle(f: () => void) { dinleyici = f; }
};
