/* Bu cihazdaki Lab ilerlemesi: görev yıldızları, deneme sayıları, yazılan kodlar, lig robotu.
   Giriş yapmış öğrencide buluta eşitlenir (IlerlemeEsitleyici). Depolama kapalıysa bellekte tutulur. */
const ANAHTAR = "sra-lab-v1";
interface GorevKaydi { yildiz: number; kod?: string; deneme?: number }
export interface LabVerisi { gorevler: Record<string, GorevKaydi>; lig: { ad: string; kod: string } | null; bayrak?: Record<string, boolean> }
let bellek: LabVerisi = { gorevler: {}, lig: null };
try { const h = localStorage.getItem(ANAHTAR); if (h) bellek = { ...bellek, ...JSON.parse(h) }; } catch { /* depolama kapalı */ }
let dinleyici: (() => void) | null = null;
const yaz = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(bellek)); } catch { /* depolama kapalı */ } dinleyici?.(); };
const kayit = (k: string): GorevKaydi => (bellek.gorevler[k] ??= { yildiz: 0 });

export const ilerleme = {
  yildiz: (k: string) => bellek.gorevler[k]?.yildiz ?? 0,
  kod: (k: string) => bellek.gorevler[k]?.kod,
  kodKaydet(k: string, kod: string) { kayit(k).kod = kod; yaz(); },
  denemeArttir(k: string) { const g = kayit(k); g.deneme = (g.deneme ?? 0) + 1; yaz(); },
  yildizKaydet(k: string, y: number, kod: string) { const g = kayit(k); g.yildiz = Math.max(y, g.yildiz); g.kod = kod; yaz(); },
  toplamYildiz: (on = "") => Object.entries(bellek.gorevler).filter(([k]) => on ? k.startsWith(on) : !k.startsWith("cizgi-") && !k.startsWith("lb-")).reduce((t, [, g]) => t + (g.yildiz ?? 0), 0),
  /** yıldızsız etkinlikler (kurulum rehberi bitti gibi) */
  bayrak: (k: string) => !!bellek.bayrak?.[k],
  bayrakKoy(k: string) { (bellek.bayrak ??= {})[k] = true; yaz(); },
  lig: () => bellek.lig,
  ligKaydet(ad: string, kod: string) { bellek.lig = { ad, kod }; yaz(); },
  /* eşitleme */
  veri: (): LabVerisi => JSON.parse(JSON.stringify(bellek)),
  birlestir(u: LabVerisi) {
    for (const [k, g] of Object.entries(u.gorevler ?? {})) {
      const y = kayit(k);
      y.yildiz = Math.max(y.yildiz ?? 0, g.yildiz ?? 0);
      y.deneme = Math.max(y.deneme ?? 0, g.deneme ?? 0);
      y.kod ??= g.kod;
    }
    bellek.lig ??= u.lig ?? null;
    for (const [k, v] of Object.entries(u.bayrak ?? {})) if (v) (bellek.bayrak ??= {})[k] = true;
    try { localStorage.setItem(ANAHTAR, JSON.stringify(bellek)); } catch { /* yok */ }
  },
  dinle(f: () => void) { dinleyici = f; }
};
