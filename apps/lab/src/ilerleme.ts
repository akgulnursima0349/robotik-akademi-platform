/* Bu cihazdaki Lab ilerlemesi: görev yıldızları, yazılan kodlar, lig robotu. Depolama kapalıysa bellekte tutulur. */
const ANAHTAR = "sra-lab-v1";
interface Veri { gorevler: Record<string, { yildiz: number; kod: string }>; lig: { ad: string; kod: string } | null }
let bellek: Veri = { gorevler: {}, lig: null };
try { const h = localStorage.getItem(ANAHTAR); if (h) bellek = { ...bellek, ...JSON.parse(h) }; } catch { /* depolama kapalı */ }
const yaz = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(bellek)); } catch { /* depolama kapalı */ } };

export const ilerleme = {
  yildiz: (k: string) => bellek.gorevler[k]?.yildiz ?? 0,
  kod: (k: string) => bellek.gorevler[k]?.kod,
  kodKaydet(k: string, kod: string) { bellek.gorevler[k] = { yildiz: this.yildiz(k), kod }; yaz(); },
  yildizKaydet(k: string, y: number, kod: string) { bellek.gorevler[k] = { yildiz: Math.max(y, this.yildiz(k)), kod }; yaz(); },
  toplamYildiz: () => Object.values(bellek.gorevler).reduce((t, g) => t + g.yildiz, 0),
  lig: () => bellek.lig,
  ligKaydet(ad: string, kod: string) { bellek.lig = { ad, kod }; yaz(); }
};
