/* Izgara dünyası: kareler, yönler ve karlı/temiz sokaklar. DOM yok; simülasyonun saf çekirdeği. */
export type Yon = 0 | 1 | 2 | 3; // 0 kuzey (yukarı), 1 doğu, 2 güney, 3 batı
export const YON_AD = ["kuzey", "doğu", "güney", "batı"] as const;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;
export const solaDon = (y: Yon): Yon => ((y + 3) % 4) as Yon;
export const sagaDon = (y: Yon): Yon => ((y + 1) % 4) as Yon;

export type HucreTuru = "bina" | "yol" | "istasyon";
export interface Konum { x: number; y: number }

/** Harita sembolleri: '#' bina, '.' karlı yol, ' ' ya da '-' temiz yol, 'S' şarj istasyonu, 'R' robotun başladığı (karlı olmayan) yol. */
export class Izgara {
  readonly genislik: number;
  readonly yukseklik: number;
  private readonly tur: HucreTuru[];
  private readonly kar: boolean[];
  baslangic: Konum = { x: 0, y: 0 };

  constructor(harita: readonly string[]) {
    this.yukseklik = harita.length;
    this.genislik = Math.max(...harita.map((s) => s.length));
    this.tur = []; this.kar = [];
    for (let y = 0; y < this.yukseklik; y++) for (let x = 0; x < this.genislik; x++) {
      const c = harita[y][x] ?? "#";
      this.tur.push(c === "#" ? "bina" : c === "S" ? "istasyon" : "yol");
      this.kar.push(c === ".");
      if (c === "R") this.baslangic = { x, y };
    }
  }
  private i(x: number, y: number) { return y * this.genislik + x; }
  icinde(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.genislik && y < this.yukseklik; }
  hucre(x: number, y: number): HucreTuru { return this.icinde(x, y) ? this.tur[this.i(x, y)] : "bina"; }
  gecilebilir(x: number, y: number): boolean { return this.hucre(x, y) !== "bina"; }
  karVar(x: number, y: number): boolean { return this.icinde(x, y) && this.kar[this.i(x, y)]; }
  karTemizle(x: number, y: number): boolean {
    if (!this.karVar(x, y)) return false;
    this.kar[this.i(x, y)] = false;
    return true;
  }
  karKoy(x: number, y: number): void { if (this.icinde(x, y) && this.gecilebilir(x, y)) this.kar[this.i(x, y)] = true; }
  kalanKar(): number { return this.kar.filter(Boolean).length; }
  karlilar(): Konum[] {
    const r: Konum[] = [];
    for (let y = 0; y < this.yukseklik; y++) for (let x = 0; x < this.genislik; x++) if (this.karVar(x, y)) r.push({ x, y });
    return r;
  }
  kopya(): Izgara {
    const k = Object.create(Izgara.prototype) as Izgara;
    Object.assign(k, { genislik: this.genislik, yukseklik: this.yukseklik, tur: this.tur, kar: [...this.kar], baslangic: { ...this.baslangic } });
    return k;
  }
}

/** Sabit tohumlu rastgele sayı (mulberry32): aynı tohum, aynı maç. */
export function rastgele(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
