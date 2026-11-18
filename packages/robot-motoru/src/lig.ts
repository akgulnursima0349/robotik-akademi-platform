/* Sınıf Robot Ligi: iki robot 9×9 karlı meydanda kar topu toplar. Her turda iki beyin de durumu görür ve bir hamle seçer;
   hamleler aynı anda uygulanır. Kar topları sabit tohumla dağılır: aynı beyinler, aynı tohum → aynı maç. */
import { DX, DY, rastgele, sagaDon, solaDon, YON_AD, type Konum, type Yon } from "./izgara";

export const ARENA = 9;
export const TUR_SAYISI = 60;
export const TOP_SAYISI = 15;
export type Hamle = "ileri" | "sola" | "saga" | "bekle";
export const HAMLELER: readonly Hamle[] = ["ileri", "sola", "saga", "bekle"];

/** Bir robotun her turda gördüğü durum (Python'a sözlük olarak geçer). */
export interface Durum {
  x: number; y: number; yon: string; puan: number;
  rakip_x: number; rakip_y: number; rakip_puan: number;
  toplar: [number, number][];
  en_yakin_top: [number, number] | null;
  onu_acik: boolean;
  tur: number; kalan_tur: number;
}
export type Beyin = (d: Durum) => Hamle | string;

export interface Oyuncu { kimlik: string; ad: string; sahip?: string; beyin: Beyin }
export interface RobotKare { x: number; y: number; yon: Yon; puan: number; hamle: Hamle }
export interface MacKaresi { tur: number; robotlar: [RobotKare, RobotKare]; toplar: Konum[]; toplanan: Konum[] }
export interface MacSonucu {
  puan: [number, number];
  /** 0 ya da 1: kazanan oyuncunun sırası; null beraberlik */
  kazanan: 0 | 1 | null;
  kareler: MacKaresi[];
  hatalar: [string | null, string | null];
  tohum: number;
}

const BASLANGIC: [RobotKare, RobotKare] = [
  { x: 0, y: 4, yon: 1, puan: 0, hamle: "bekle" },
  { x: 8, y: 4, yon: 3, puan: 0, hamle: "bekle" }
];

/** 7 çift ayna-simetrik top + ortada bir top = 15. Simetri iki robota da eşit şans verir. */
export function topDagit(tohum: number): Konum[] {
  const r = rastgele(tohum), toplar: Konum[] = [{ x: 4, y: 4 }], dolu = new Set(["0,4", "8,4", "4,4"]);
  while (toplar.length < TOP_SAYISI) {
    const x = Math.floor(r() * 4), y = Math.floor(r() * ARENA);
    const a = `${x},${y}`;
    if (dolu.has(a)) continue;
    dolu.add(a); dolu.add(`${ARENA - 1 - x},${ARENA - 1 - y}`);
    toplar.push({ x, y }, { x: ARENA - 1 - x, y: ARENA - 1 - y });
  }
  return toplar;
}

const mesafe = (a: Konum, b: Konum) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const icinde = (x: number, y: number) => x >= 0 && y >= 0 && x < ARENA && y < ARENA;

function durumYap(ben: RobotKare, rakip: RobotKare, toplar: Konum[], tur: number): Durum {
  const enYakin = toplar.length ? toplar.reduce((a, b) => (mesafe(ben, b) < mesafe(ben, a) ? b : a)) : null;
  return {
    x: ben.x, y: ben.y, yon: YON_AD[ben.yon], puan: ben.puan,
    rakip_x: rakip.x, rakip_y: rakip.y, rakip_puan: rakip.puan,
    toplar: toplar.map((t) => [t.x, t.y]),
    en_yakin_top: enYakin ? [enYakin.x, enYakin.y] : null,
    onu_acik: icinde(ben.x + DX[ben.yon], ben.y + DY[ben.yon]),
    tur, kalan_tur: TUR_SAYISI - tur
  };
}

export function macOyna(a: Beyin, b: Beyin, tohum: number): MacSonucu {
  const r: [RobotKare, RobotKare] = [{ ...BASLANGIC[0] }, { ...BASLANGIC[1] }];
  let toplar = topDagit(tohum);
  const kareler: MacKaresi[] = [{ tur: 0, robotlar: [{ ...r[0] }, { ...r[1] }], toplar: [...toplar], toplanan: [] }];
  const hatalar: [string | null, string | null] = [null, null];
  const beyinler = [a, b];

  for (let tur = 1; tur <= TUR_SAYISI && toplar.length; tur++) {
    const hamleler = ([0, 1] as const).map((i) => {
      try {
        const h = String(beyinler[i](durumYap(r[i], r[1 - i], toplar, tur))).toLowerCase().trim();
        if ((HAMLELER as readonly string[]).includes(h)) return h as Hamle;
        hatalar[i] ??= `${tur}. tur: "${h}" diye bir hamle yok. Hamleler: ileri, sola, saga, bekle.`;
      } catch (e) {
        hatalar[i] ??= `${tur}. tur: ${e instanceof Error ? e.message : String(e)}`;
      }
      return "bekle" as Hamle;
    }) as [Hamle, Hamle];

    /* dönüşler önce; sonra ileri hareketlerin hedefleri */
    const hedef = r.map((k, i) => {
      k.hamle = hamleler[i];
      if (hamleler[i] === "sola") k.yon = solaDon(k.yon);
      if (hamleler[i] === "saga") k.yon = sagaDon(k.yon);
      if (hamleler[i] !== "ileri") return { x: k.x, y: k.y };
      const nx = k.x + DX[k.yon], ny = k.y + DY[k.yon];
      return icinde(nx, ny) ? { x: nx, y: ny } : { x: k.x, y: k.y };
    });
    const ayni = hedef[0].x === hedef[1].x && hedef[0].y === hedef[1].y;
    const yerDegis = hedef[0].x === r[1].x && hedef[0].y === r[1].y && hedef[1].x === r[0].x && hedef[1].y === r[0].y;
    for (const i of [0, 1] as const) {
      const j = 1 - i;
      const rakibinYeri = hedef[i].x === r[j].x && hedef[i].y === r[j].y && hedef[j].x === r[j].x && hedef[j].y === r[j].y;
      if (!ayni && !yerDegis && !rakibinYeri) { r[i].x = hedef[i].x; r[i].y = hedef[i].y; }
    }
    const toplanan: Konum[] = [];
    for (const k of r) {
      const t = toplar.find((t) => t.x === k.x && t.y === k.y);
      if (t) { k.puan++; toplanan.push(t); toplar = toplar.filter((x) => x !== t); }
    }
    kareler.push({ tur, robotlar: [{ ...r[0] }, { ...r[1] }], toplar: [...toplar], toplanan });
  }
  const puan: [number, number] = [r[0].puan, r[1].puan];
  return { puan, kazanan: puan[0] > puan[1] ? 0 : puan[1] > puan[0] ? 1 : null, kareler, hatalar, tohum };
}

/* ---------- turnuva: herkes herkesle bir maç ---------- */
export interface TabloSatiri { kimlik: string; ad: string; sahip?: string; o: number; g: number; b: number; m: number; atilan: number; yenen: number; puan: number }
export interface TurnuvaMaci { ev: number; dep: number; sonuc: MacSonucu }
export interface TurnuvaSonucu { maclar: TurnuvaMaci[]; tablo: TabloSatiri[] }

export function turnuva(oyuncular: Oyuncu[], anaTohum = 2026): TurnuvaSonucu {
  const maclar: TurnuvaMaci[] = [];
  const t: TabloSatiri[] = oyuncular.map((o) => ({ kimlik: o.kimlik, ad: o.ad, sahip: o.sahip, o: 0, g: 0, b: 0, m: 0, atilan: 0, yenen: 0, puan: 0 }));
  for (let i = 0; i < oyuncular.length; i++) for (let j = i + 1; j < oyuncular.length; j++) {
    const s = macOyna(oyuncular[i].beyin, oyuncular[j].beyin, anaTohum * 1000 + i * 31 + j);
    maclar.push({ ev: i, dep: j, sonuc: s });
    const [a, b] = [t[i], t[j]];
    a.o++; b.o++;
    a.atilan += s.puan[0]; a.yenen += s.puan[1]; b.atilan += s.puan[1]; b.yenen += s.puan[0];
    if (s.kazanan === 0) { a.g++; b.m++; a.puan += 3; }
    else if (s.kazanan === 1) { b.g++; a.m++; b.puan += 3; }
    else { a.b++; b.b++; a.puan++; b.puan++; }
  }
  const tablo = [...t].sort((x, y) => y.puan - x.puan || (y.atilan - y.yenen) - (x.atilan - x.yenen) || y.atilan - x.atilan || x.ad.localeCompare(y.ad, "tr"));
  return { maclar, tablo };
}
