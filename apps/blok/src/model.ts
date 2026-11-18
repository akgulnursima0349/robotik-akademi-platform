/* Blok programı: komut blokları ve içine blok alan "tekrarla". Çalıştırma doğrudan ızgara motorunda (Python'suz);
   aynı program Python'a da çevrilebilir ("Bunun Python'u"). */
import { KarKureme, RobotDurdu, type DurmaSebebi, type Kare } from "@sra/robot-motoru";

export type KomutTuru = "ileri" | "sol" | "sag";
export type BlokTuru = KomutTuru | "tekrar";
export interface KomutBlogu { id: string; tur: KomutTuru }
export interface TekrarBlogu { id: string; tur: "tekrar"; sayi: number; ic: Blok[] }
export type Blok = KomutBlogu | TekrarBlogu;

let sayac = 0;
export const yeniBlok = (tur: BlokTuru): Blok => (tur === "tekrar" ? { id: "b" + ++sayac, tur, sayi: 2, ic: [] } : { id: "b" + ++sayac, tur });

export const BLOK_AD: Record<BlokTuru, string> = { ileri: "ileri git", sol: "sola dön", sag: "sağa dön", tekrar: "tekrarla" };
const PY: Record<KomutTuru, string> = { ileri: "ileri()", sol: "sola_don()", sag: "saga_don()" };

/** Bütün blokların sayısı (tekrar bloğu da bir sayılır) */
export function blokSay(p: Blok[]): number {
  return p.reduce((t, b) => t + 1 + (b.tur === "tekrar" ? blokSay(b.ic) : 0), 0);
}

export function pythona(p: Blok[], girinti = ""): string {
  if (!p.length) return girinti ? girinti + "pass\n" : "";
  return p.map((b) => b.tur === "tekrar" ? `${girinti}for i in range(${b.sayi}):\n${pythona(b.ic, girinti + "    ")}` : `${girinti}${PY[b.tur]}\n`).join("");
}

/** Blok id'sini bul (program içinde, iç içe) */
export function bul(p: Blok[], id: string): { liste: Blok[]; i: number } | null {
  for (let i = 0; i < p.length; i++) {
    if (p[i].id === id) return { liste: p, i };
    const b = p[i];
    if (b.tur === "tekrar") { const r = bul(b.ic, id); if (r) return r; }
  }
  return null;
}

export interface CalismaSonucu { sim: KarKureme; bloklar: (string | null)[]; durdu: DurmaSebebi | null }

/** Programı motorda çalıştırır. İzdeki her kare için o kareyi üreten bloğun id'si (bloklar[i]) tutulur. */
export function calistir(p: Blok[], harita: readonly string[], yon: 0 | 1 | 2 | 3): CalismaSonucu {
  const sim = new KarKureme(harita, yon, 9999);
  const bloklar: (string | null)[] = [null];
  const yur = (liste: Blok[]) => {
    for (const b of liste) {
      if (b.tur === "tekrar") { for (let k = 0; k < b.sayi; k++) yur(b.ic); continue; }
      if (b.tur === "ileri") sim.ileri(); else if (b.tur === "sol") sim.solaDon(); else sim.sagaDon();
      while (bloklar.length < sim.iz.length) bloklar.push(b.id);
    }
  };
  try { yur(p); } catch (e) { if (!(e instanceof RobotDurdu)) throw e; while (bloklar.length < sim.iz.length) bloklar.push(bloklar.at(-1) ?? null); }
  return { sim, bloklar, durdu: sim.durdu };
}

export const yildizHesapla = (basarili: boolean, bloklar: number, enAz: number): 0 | 1 | 2 | 3 =>
  !basarili ? 0 : bloklar <= enAz ? 3 : bloklar <= enAz + 2 ? 2 : 1;

export type { Kare };
