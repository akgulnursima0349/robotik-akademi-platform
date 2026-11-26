/* Labirent modülünün dersleri için motor parçaları (ders sayfasındaki deneyler ve kodsuz görevler).
   Lab'daki labirent motoru (labirent.ts) değişmez; buradakiler onun üstüne kurulur ve aynı süre hesabını kullanır:
   - kuralKos: sağ el, sol el ve hafızalı robot kurallarının TS karşılığı; her kararın hangi dalı çalıştırdığı kaydedilir.
   - Sisli labirent: çocuk robotu yön tuşlarıyla sürer, yalnız geçtiği hücrelerin duvarlarını görür (kod yok).
   - Rota: çocuk hücrelere tıklayarak yol çizer; süre ve hız profili RizBot'un hız ayarından hesaplanır (kod yok).
   - MEB puanı: Labirent Ustası kuralı. */
import { DX, DY, sagaDon, solaDon, type Yon } from "./izgara";
import { haritaOku, HUCRE_MM, kosuSuresi, Labirent, LabirentDurdu, labirentUret, RIZBOT, type HizAyari, type LabirentHaritasi, type Taraf } from "./labirent";
import { LABIRENT_GOREVLERI } from "./labirent-gorevler";

const gorevHaritasi = (k: string, i = 0) => LABIRENT_GOREVLERI.find((g) => g.kimlik === k)!.haritalar[i];

/** Hız profili deneyinin labirenti: en kısa yol merdiven gibi kıvrılır (8 hücre, 7 dönüş);
    kenardan dolaşan yol 12 hücre ama 2 dönüş, ve daha hızlı. Arada karışık yollar ve çıkmazlar var. */
const HIZ = [
  "+---+---+---+---+---+---+",
  "|                       |",
  "+   +---+---+---+---+   +",
  "|   |                   |",
  "+   +---+---+---+---+   +",
  "|           |         F |",
  "+   +---+   +   +---+---+",
  "|   |   |               |",
  "+   +   +   +---+---+---+",
  "|   |       |           |",
  "+   +   +---+---+   +---+",
  "| B                     |",
  "+---+---+---+---+---+---+"
];

/** Ders deneylerinde ve görevlerinde kullanılan labirentler (ad → metin harita) */
export const DERS_LABIRENTLERI: Record<string, readonly string[]> = {
  /** Lab'daki "Sağ el kuralı" görevinin ilk labirenti: ders ile görev aynı labirentten başlar */
  "sag-el": gorevHaritasi("lb-sag-el"),
  ada: gorevHaritasi("lb-ada"),
  "sis-1": labirentUret(5, 5, 21),
  "sis-2": labirentUret(6, 5, 33),
  hiz: HIZ,
  /** Rota görevi: en kısa yol (10 hücre) 7,4 sn; en hızlı yol 12 hücre ve 4 dönüşle 5,7 sn */
  rota: [
    "+---+---+---+---+---+---+",
    "|               |     F |",
    "+   +---+---+   +   +   +",
    "|   |       |       |   |",
    "+   +   +   +   +---+   +",
    "|               |   |   |",
    "+---+---+   +   +   +   +",
    "|           |           |",
    "+   +---+   +---+---+   +",
    "|       |               |",
    "+   +   +---+---+---+   +",
    "| B |                   |",
    "+---+---+---+---+---+---+"
  ]
};

/* ---------- kurallar ---------- */
export type KuralAdi = "sag-el" | "sol-el" | "hafiza";
export const KURAL_ADLARI: Record<KuralAdi, string> = { "sag-el": "Sağ el kuralı", "sol-el": "Sol el kuralı", hafiza: "Hafızalı robot" };
/** Kuralların Python karşılığı (Lab'daki örnek çözümlerle aynı); deneyde çalışan dal vurgulanır */
export const KURAL_KODLARI: Record<KuralAdi, string> = {
  "sag-el": gorevCozumu("lb-sag-el"),
  "sol-el": gorevCozumu("lb-hangi-el"),
  hafiza: gorevCozumu("lb-ada")
};
function gorevCozumu(k: string) { return LABIRENT_GOREVLERI.find((g) => g.kimlik === k)!.cozum; }
/** Her dalın koddaki satırları (1'den): sağ el ve sol el için 0: yan açık, 1: ön açık, 2: ikisi de kapalı */
export const KURAL_DAL_SATIRLARI: Record<"sag-el" | "sol-el", number[][]> = { "sag-el": [[2, 3, 4], [5, 6], [7, 8]], "sol-el": [[2, 3, 4], [5, 6], [7, 8]] };

export interface KuralAdimi {
  /** sağ el / sol el: 0 yan açık, 1 ön açık, 2 ikisi kapalı; hafızalı robot: seçilen taraf */
  dal: number | Taraf | "geri";
  /** bu kararın izdeki ilk ve son karesi (dahil) */
  izBas: number; izSon: number;
  x: number; y: number; yon: Yon;
}
export interface KuralKosusu {
  sim: Labirent;
  adimlar: KuralAdimi[];
  /** hafızalı robot: hücre → kaç kez gelindi (son durum) */
  ziyaret: Map<string, number>;
  /** başlangıç hücresine kaç kez geri gelindi (ada'da sağ el kuralının turları) */
  baslangicaDonus: number;
}
/** Kuralı labirentte koşar. Ada'da sağ el bitmez: süre sınırı ya da karar sınırı onu durdurur. */
export function kuralKos(harita: readonly string[], kural: KuralAdi, o: { sureSiniri?: number; kararSiniri?: number } = {}): KuralKosusu {
  const sim = new Labirent(harita, 0, o.sureSiniri ?? 600);
  const adimlar: KuralAdimi[] = [];
  const ziyaret = new Map<string, number>();
  const anahtar = (x: number, y: number) => `${x},${y}`;
  const { x: bx, y: by } = sim.h.baslangic;
  let donus = 0;
  const yan: Taraf = kural === "sol-el" ? "sol" : "sag";
  const sonuGuncelle = () => { const son = adimlar[adimlar.length - 1]; if (son) Object.assign(son, { izSon: sim.iz.length - 1, x: sim.x, y: sim.y, yon: sim.yon }); };
  try {
    for (let n = 0; n < (o.kararSiniri ?? 2000) && !sim.bittiMi(); n++) {
      const izBas = sim.iz.length;
      const adim = (dal: KuralAdimi["dal"]) => { adimlar.push({ dal, izBas, izSon: izBas, x: sim.x, y: sim.y, yon: sim.yon }); };
      if (kural === "hafiza") {
        const k = anahtar(sim.x, sim.y);
        ziyaret.set(k, (ziyaret.get(k) ?? 0) + 1);
        let secim: Taraf | "geri" = "geri", enAz = 1000;
        for (const t of ["sag", "on", "sol"] as Taraf[]) {
          if (!sim.duvar(t)) {
            const [kx, ky] = sim.komsu(t);
            const m = ziyaret.get(anahtar(kx, ky)) ?? 0;
            if (m < enAz) { secim = t; enAz = m; }
          }
        }
        adim(secim);
        if (secim === "sag") sim.sagaDon(); else if (secim === "sol") sim.solaDon(); else if (secim === "geri") sim.geriDon();
        sim.ileri();
      } else if (!sim.duvar(yan)) { adim(0); if (yan === "sag") sim.sagaDon(); else sim.solaDon(); sim.ileri(); }
      else if (!sim.duvar("on")) { adim(1); sim.ileri(); }
      else { adim(2); if (yan === "sag") sim.solaDon(); else sim.sagaDon(); }
      sonuGuncelle();
      if (sim.x === bx && sim.y === by && sim.iz[sim.iz.length - 1].olay === "ileri") donus++;
    }
  } catch (e) {
    if (!(e instanceof LabirentDurdu)) throw e;
    sonuGuncelle();
  }
  sim.bitir();
  return { sim, adimlar, ziyaret, baslangicaDonus: donus };
}

/* ---------- sisli labirent (kod yok) ---------- */
export type SisSonucu = "gitti" | "duvar" | "bitti";
/** Yön tuşlarıyla sürülen robot: yalnız geçilen hücrelerin duvarları görünür; her hücreye kaç kez girildiği sayılır. */
export class SisliLabirent {
  readonly h: LabirentHaritasi;
  x: number; y: number;
  /** hücre geçişi sayısı (duvara çarpma sayılmaz) */
  adim = 0;
  readonly ziyaret = new Map<string, number>();
  bitti = false;
  constructor(readonly harita: readonly string[]) {
    this.h = haritaOku(harita);
    ({ x: this.x, y: this.y } = this.h.baslangic);
    this.ziyaret.set(`${this.x},${this.y}`, 1);
  }
  duvarVar(x: number, y: number, yon: Yon) { return (this.h.duvar[y * this.h.genislik + x] & (1 << yon)) !== 0; }
  /** hücrenin duvarları görülmüş mü (robot o hücrede bulundu) */
  goruldu(x: number, y: number) { return this.ziyaret.has(`${x},${y}`); }
  git(yon: Yon): SisSonucu {
    if (this.bitti) return "bitti";
    if (this.duvarVar(this.x, this.y, yon)) return "duvar";
    this.x += DX[yon]; this.y += DY[yon]; this.adim++;
    const k = `${this.x},${this.y}`;
    this.ziyaret.set(k, (this.ziyaret.get(k) ?? 0) + 1);
    if (this.x === this.h.bitis.x && this.y === this.h.bitis.y) { this.bitti = true; return "bitti"; }
    return "gitti";
  }
}
export interface SisGorevi { haritalar: string[]; /** 2. ve 3. yıldız: iki labirentteki toplam adım en çok bu kadar */ esikler: [number, number] }
export const SIS_GOREVLERI: Record<string, SisGorevi> = {
  /* eşikler: 3. yıldız sağ el ve sol el kuralının (sistemli keşif) toplamından büyük olanı; 2. yıldız onun 1,5 katı */
  "sis-1": { haritalar: ["sis-1", "sis-2"], esikler: [0, 0] }
};
/** Sistemli keşfin (el kuralı) adım sayısı: eşikler buradan hesaplanır */
export function elKuraliAdimi(harita: readonly string[], kural: "sag-el" | "sol-el"): number {
  const k = kuralKos(harita, kural);
  return k.sim.iz.filter((z) => z.olay === "ileri").length;
}
{
  const g = SIS_GOREVLERI["sis-1"];
  const uc = g.haritalar.reduce((t, h) => t + Math.max(elKuraliAdimi(DERS_LABIRENTLERI[h], "sag-el"), elKuraliAdimi(DERS_LABIRENTLERI[h], "sol-el")), 0);
  g.esikler = [Math.ceil(uc * 1.5), uc];
}
/** adimlar: her labirentteki adım sayısı, bitmediyse null */
export function sisYildizi(g: SisGorevi, adimlar: (number | null)[]): 0 | 1 | 2 | 3 {
  if (adimlar.length < g.haritalar.length || adimlar.some((a) => a === null)) return 0;
  const t = (adimlar as number[]).reduce((a, b) => a + b, 0);
  return t <= g.esikler[1] ? 3 : t <= g.esikler[0] ? 2 : 1;
}

/* ---------- rota ve hız profili (kod yok) ---------- */
export type Hucre = [number, number];
export interface RotaSonucu {
  /** yol duvardan geçmiyor, kopuk değil, başlangıçtan başlıyor */
  gecerli: boolean;
  hata?: string;
  /** bitişe ulaştı mı */
  tamam: boolean;
  sure: number;
  hucre: number;
  donus: number;
  /** düz koşuların hücre sayıları, sırasıyla */
  kosular: number[];
}
/** Robot başlangıçta kuzeye bakar. Yolun ilk hücresi başlangıç hücresidir. Süre Lab'daki labirent motoruyla aynı hesaptır. */
export function rotaHesapla(harita: readonly string[] | LabirentHaritasi, yol: readonly Hucre[], p: Readonly<HizAyari> = RIZBOT): RotaSonucu {
  const h = Array.isArray(harita) ? haritaOku(harita as readonly string[]) : (harita as LabirentHaritasi);
  const bos: RotaSonucu = { gecerli: false, tamam: false, sure: 0, hucre: 0, donus: 0, kosular: [] };
  if (!yol.length || yol[0][0] !== h.baslangic.x || yol[0][1] !== h.baslangic.y) return { ...bos, hata: "Yol başlangıç hücresinden başlamalı." };
  let yon: Yon = 0, sure = 0, kosu = 0, donus = 0;
  const kosular: number[] = [];
  const kapat = () => { if (kosu) { sure += kosuSuresi(kosu, p); kosular.push(kosu); kosu = 0; } };
  for (let i = 1; i < yol.length; i++) {
    const [ax, ay] = yol[i - 1], [bx, by] = yol[i];
    const d = ([0, 1, 2, 3] as Yon[]).find((y) => DX[y] === bx - ax && DY[y] === by - ay);
    if (d === undefined) return { ...bos, hata: `${i}. adımda yol kopuk: hücreler yan yana olmalı.` };
    if (h.duvar[ay * h.genislik + ax] & (1 << d)) return { ...bos, hata: `${i}. adımda yol duvardan geçiyor.` };
    if (d !== yon) {
      kapat();
      sure += d === sagaDon(sagaDon(yon)) ? p.donus180 : p.donus90;
      donus++; yon = d;
    }
    kosu++;
  }
  kapat();
  const [sx, sy] = yol[yol.length - 1];
  return { gecerli: true, tamam: sx === h.bitis.x && sy === h.bitis.y, sure, hucre: yol.length - 1, donus, kosular };
}
/** Hız-zaman eğrisi (grafik için): düz koşularda hızlan, sabit git, yavaşla; dönüşte hız 0. */
export function hizProfili(harita: readonly string[], yol: readonly Hucre[], p: Readonly<HizAyari> = RIZBOT): { t: number; v: number }[] {
  const r = rotaHesapla(harita, yol, p);
  if (!r.gecerli) return [];
  const h = haritaOku(harita);
  const noktalar: { t: number; v: number }[] = [{ t: 0, v: 0 }];
  let t = 0, yon: Yon = 0, kosu = 0;
  const kapat = () => {
    if (!kosu) return;
    const d = (kosu * HUCRE_MM) / 1000, T = kosuSuresi(kosu, p);
    const tepe = Math.min(p.azamiHiz, Math.sqrt(p.ivme * d)), ta = tepe / p.ivme;
    noktalar.push({ t: t + ta, v: tepe });
    if (T - 2 * ta > 1e-9) noktalar.push({ t: t + T - ta, v: tepe });
    t += T; noktalar.push({ t, v: 0 }); kosu = 0;
  };
  for (let i = 1; i < yol.length; i++) {
    const d = ([0, 1, 2, 3] as Yon[]).find((y) => DX[y] === yol[i][0] - yol[i - 1][0] && DY[y] === yol[i][1] - yol[i - 1][1])!;
    if (d !== yon) { kapat(); t += d === sagaDon(sagaDon(yon)) ? p.donus180 : p.donus90; noktalar.push({ t, v: 0 }); yon = d; }
    kosu++;
  }
  kapat();
  void h;
  return noktalar;
}
/** En hızlı rota (yıldız eşiklerini ölçmek için): durum = hücre, yön, sürmekte olan düz koşunun uzunluğu. */
export function enHizliRota(harita: readonly string[], p: Readonly<HizAyari> = RIZBOT): { sure: number; yol: Hucre[] } {
  const h = haritaOku(harita);
  type D = { x: number; y: number; yon: Yon; n: number };
  const k = (s: D) => `${s.x},${s.y},${s.yon},${s.n}`;
  const mesafe = new Map<string, number>(), onceki = new Map<string, string>(), durum = new Map<string, D>();
  const bas: D = { x: h.baslangic.x, y: h.baslangic.y, yon: 0, n: 0 };
  mesafe.set(k(bas), 0); durum.set(k(bas), bas);
  const acik = new Set([k(bas)]), kapali = new Set<string>();
  while (acik.size) {
    let en = "", em = Infinity;
    for (const a of acik) { const m = mesafe.get(a)!; if (m < em) { em = m; en = a; } }
    acik.delete(en); kapali.add(en);
    const s = durum.get(en)!;
    if (s.x === h.bitis.x && s.y === h.bitis.y) {
      const yol: Hucre[] = [];
      let c: string | undefined = en, son = "";
      while (c) { const z = durum.get(c)!; const hk = `${z.x},${z.y}`; if (hk !== son) yol.unshift([z.x, z.y]); son = hk; c = onceki.get(c); }
      return { sure: em, yol };
    }
    const komsular: [D, number][] = [];
    if (!(h.duvar[s.y * h.genislik + s.x] & (1 << s.yon))) komsular.push([{ x: s.x + DX[s.yon], y: s.y + DY[s.yon], yon: s.yon, n: s.n + 1 }, kosuSuresi(s.n + 1, p) - kosuSuresi(s.n, p)]);
    for (const [y, c] of [[sagaDon(s.yon), p.donus90], [solaDon(s.yon), p.donus90], [sagaDon(sagaDon(s.yon)), p.donus180]] as [Yon, number][]) komsular.push([{ x: s.x, y: s.y, yon: y, n: 0 }, c]);
    for (const [z, c] of komsular) {
      const zk = k(z);
      if (kapali.has(zk)) continue;
      const m = em + c;
      if (m < (mesafe.get(zk) ?? Infinity)) { mesafe.set(zk, m); onceki.set(zk, en); durum.set(zk, z); acik.add(zk); }
    }
  }
  return { sure: Infinity, yol: [] };
}
export interface RotaGorevi { harita: string; /** 1, 2, 3 yıldız için en çok süre (sn) */ esikler: [number, number, number] }
export const ROTA_GOREVLERI: Record<string, RotaGorevi> = { "rota-1": { harita: "rota", esikler: [0, 0, 0] } };
{
  const g = ROTA_GOREVLERI["rota-1"], en = enHizliRota(DERS_LABIRENTLERI[g.harita]).sure;
  /* 1 yıldız: bitişe ulaşan her yol; 2 yıldız: en hızlının %25 fazlası; 3 yıldız: en hızlıya 0,1 sn yakın */
  g.esikler = [Infinity, Math.round(en * 1.25 * 100) / 100, Math.round((en + 0.1) * 100) / 100];
}
export function rotaYildizi(g: RotaGorevi, r: RotaSonucu): 0 | 1 | 2 | 3 {
  if (!r.gecerli || !r.tamam) return 0;
  return r.sure <= g.esikler[2] ? 3 : r.sure <= g.esikler[1] ? 2 : 1;
}
/** Hız profili deneyinin iki hazır yolu ("hiz" labirentinde): biri kısa ama çok dönüşlü, öbürü uzun ama az dönüşlü */
export const HAZIR_ROTALAR: Record<string, { ad: string; yol: Hucre[] }> = {
  merdiven: { ad: "Kısa yol: merdiven", yol: [[0, 5], [1, 5], [1, 4], [2, 4], [2, 3], [3, 3], [3, 2], [4, 2], [5, 2]] },
  kenar: { ad: "Uzun yol: kenardan", yol: [[0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [5, 1], [5, 2]] }
};

/* ---------- MEB puanı ---------- */
/** MEB Labirent Ustası: bitiren robotun puanı süresi (+ müdahale başına 10 sn); bitiremeyenin 200 + (satır sayısı − ulaştığı satır) × 10. Düşük puan iyidir. */
export function mebPuani(o: { bitti: boolean; sure: number; enUzakSatir: number; mudahale?: number; satirSayisi?: number }): number {
  if (o.bitti) return Math.round((o.sure + 10 * (o.mudahale ?? 0)) * 100) / 100;
  return 200 + ((o.satirSayisi ?? 16) - o.enUzakSatir) * 10;
}
