/* Labirent (RizBot): MEB "Labirent Ustası" pistine göre hücre hücre ilerleyen robot.
   - Hücre 200 mm, duvar 18 mm. Zemin siyah, duvarlar beyaz; bitiş hücresinde beyaz alan.
   - Komutlar ize yazılır, sahne izi oynatır. Aynı kod ve aynı labirent her zaman aynı izi verir.
   - Süre robotun hız profilinden hesaplanır: art arda ileri() komutları tek bir düz koşu sayılır (robot hücre aralarında durmaz),
     dönüşlerde robot durup yerinde döner. Böylece az dönüşlü yol daha hızlıdır. */
import { DX, DY, rastgele, sagaDon, solaDon, type Yon } from "./izgara";

export const HUCRE_MM = 200;
export const DUVAR_MM = 18;
export const DUVAR_YUKSEKLIK_MM = 80;
/** RizBot hız profili (tahmini; ürün sayfasında hız bilgisi yok): düzde en çok 1 m/s, ivme 2,5 m/s², 90° dönüş 0,35 sn, 180° dönüş 0,6 sn */
export const RIZBOT = { azamiHiz: 1.0, ivme: 2.5, donus90: 0.35, donus180: 0.6 } as const;
export const LABIRENT_ADIM_SINIRI = 1500;

/** Bir düz koşunun süresi (duruştan duruşa, yamuk hız profili). */
export function kosuSuresi(hucre: number): number {
  if (hucre <= 0) return 0;
  const d = (hucre * HUCRE_MM) / 1000, { azamiHiz: v, ivme: a } = RIZBOT;
  return d >= (v * v) / a ? d / v + v / a : 2 * Math.sqrt(d / a);
}
/** Koşunun başından itibaren s metre gidildiğinde geçen süre (koşu toplam d metre). */
function konumZamani(s: number, d: number): number {
  const { azamiHiz: v, ivme: a } = RIZBOT;
  const tepe = Math.min(v, Math.sqrt(a * d));           // ulaşılan en yüksek hız
  const hizlanma = (tepe * tepe) / (2 * a);              // hızlanırken gidilen yol
  if (s <= hizlanma) return Math.sqrt((2 * s) / a);
  const sabit = d - 2 * hizlanma;
  if (s <= hizlanma + sabit) return tepe / a + (s - hizlanma) / tepe;
  const kalan = d - s;
  return kosuSuresi(d / (HUCRE_MM / 1000)) - Math.sqrt((2 * kalan) / a);
}

/* ---------- harita ---------- */
/** Duvar bitleri: K=1, D=2, G=4, B=8 (yön numarasıyla 1 << yön) */
export interface LabirentHaritasi { genislik: number; yukseklik: number; duvar: number[]; baslangic: { x: number; y: number }; bitis: { x: number; y: number } }

/** Metin harita: her hücre "+---+" düzeninde 4 karakter. Hücre ortasında 'B' başlangıç, 'F' bitiş.
 *  +---+---+
 *  | F     |
 *  +   +---+
 *  | B     |
 *  +---+---+  */
export function haritaOku(satirlar: readonly string[]): LabirentHaritasi {
  const yukseklik = (satirlar.length - 1) / 2, genislik = (satirlar[0].length - 1) / 4;
  if (!Number.isInteger(yukseklik) || !Number.isInteger(genislik)) throw new Error("Labirent haritası bozuk");
  const duvar: number[] = [];
  let baslangic = { x: 0, y: yukseklik - 1 }, bitis = { x: genislik - 1, y: 0 };
  const c = (s: number, k: number) => satirlar[s]?.[k] ?? " ";
  for (let y = 0; y < yukseklik; y++) for (let x = 0; x < genislik; x++) {
    let d = 0;
    if (c(2 * y, 4 * x + 2) === "-") d |= 1;
    if (c(2 * y + 1, 4 * x + 4) === "|") d |= 2;
    if (c(2 * y + 2, 4 * x + 2) === "-") d |= 4;
    if (c(2 * y + 1, 4 * x) === "|") d |= 8;
    duvar.push(d);
    const m = c(2 * y + 1, 4 * x + 2);
    if (m === "B") baslangic = { x, y };
    if (m === "F") bitis = { x, y };
  }
  return { genislik, yukseklik, duvar, baslangic, bitis };
}

/** Haritayı metne çevirir (testte ve üretilen labirentlerde). */
export function haritaYaz(h: LabirentHaritasi): string[] {
  const r: string[] = [];
  const d = (x: number, y: number) => h.duvar[y * h.genislik + x];
  for (let y = 0; y < h.yukseklik; y++) {
    let ust = "", orta = "";
    for (let x = 0; x < h.genislik; x++) {
      ust += "+" + (d(x, y) & 1 ? "---" : "   ");
      const m = h.baslangic.x === x && h.baslangic.y === y ? "B" : h.bitis.x === x && h.bitis.y === y ? "F" : " ";
      orta += (d(x, y) & 8 ? "|" : " ") + " " + m + " ";
    }
    r.push(ust + "+", orta + (d(h.genislik - 1, y) & 2 ? "|" : " "));
  }
  let alt = "";
  for (let x = 0; x < h.genislik; x++) alt += "+" + (d(x, h.yukseklik - 1) & 4 ? "---" : "   ");
  r.push(alt + "+");
  return r;
}

/** Mükemmel labirent üretir (her hücreye tek yol; sağ el kuralı çözer). Sabit tohum: hep aynı labirent. */
export function labirentUret(genislik: number, yukseklik: number, tohum: number, baslangic = { x: 0, y: yukseklik - 1 }, bitis = { x: genislik - 1, y: 0 }): string[] {
  const rnd = rastgele(tohum);
  const duvar = new Array(genislik * yukseklik).fill(15);
  const gorulen = new Array(genislik * yukseklik).fill(false);
  const yigin = [baslangic];
  gorulen[baslangic.y * genislik + baslangic.x] = true;
  while (yigin.length) {
    const { x, y } = yigin[yigin.length - 1];
    const secenek = ([0, 1, 2, 3] as Yon[]).filter((yn) => { const nx = x + DX[yn], ny = y + DY[yn]; return nx >= 0 && ny >= 0 && nx < genislik && ny < yukseklik && !gorulen[ny * genislik + nx]; });
    if (!secenek.length) { yigin.pop(); continue; }
    const yn = secenek[Math.floor(rnd() * secenek.length)];
    const nx = x + DX[yn], ny = y + DY[yn];
    duvar[y * genislik + x] &= ~(1 << yn);
    duvar[ny * genislik + nx] &= ~(1 << ((yn + 2) % 4));
    gorulen[ny * genislik + nx] = true;
    yigin.push({ x: nx, y: ny });
  }
  return haritaYaz({ genislik, yukseklik, duvar, baslangic, bitis });
}

/* ---------- simülasyon ---------- */
export type LabirentOlayi = "basla" | "ileri" | "sol" | "sag" | "geri" | "bak" | "carpma" | "bitis" | "cok_adim" | "sure";
export type Taraf = "on" | "sol" | "sag";
export interface LabirentKaresi {
  x: number; y: number; yon: Yon; olay: LabirentOlayi;
  /** olayın bittiği an (sn, yarış başından) */
  t: number;
  satir?: number;
  /** "bak": hangi sensör okundu ve duvar var mıydı */
  sensor?: { taraf: Taraf; duvar: boolean };
}
export type LabirentDurmasi = "carpma" | "cok_adim" | "sure";

export class LabirentDurdu extends Error {
  constructor(readonly sebep: LabirentDurmasi | "bitis") {
    super(sebep === "carpma" ? "RizBot duvara çarptı." : sebep === "cok_adim" ? "Robot çok fazla adım attı; aynı yollarda dönüp duruyor olabilir."
      : sebep === "sure" ? "Süre doldu, robot bitişe ulaşamadı." : "Robot bitişe ulaştı.");
    this.name = "LabirentDurdu";
  }
}

export class Labirent {
  readonly h: LabirentHaritasi;
  x: number; y: number; yon: Yon;
  readonly iz: LabirentKaresi[] = [];
  durdu: LabirentDurmasi | null = null;
  /** bitişe varış anı (sn) */
  bitisZamani: number | null = null;
  /** en uzak satır (MEB: başlangıç satırı 1) */
  enUzakSatir: number;
  satir = 0;
  private kapali = 0;   // kapanmış koşu ve dönüşlerin toplam süresi
  private kosu = 0;     // sürmekte olan düz koşunun hücre sayısı
  private adim = 0;

  constructor(harita: readonly string[], yon: Yon = 0, readonly sureSiniri = 90) {
    this.h = haritaOku(harita);
    ({ x: this.x, y: this.y } = this.h.baslangic);
    this.yon = yon;
    this.enUzakSatir = this.satirNo(this.y);
    this.kaydet("basla");
  }
  satirNo(y: number) { return this.h.yukseklik - y; }
  get sure() { return this.kapali + kosuSuresi(this.kosu); }
  duvarVar(x: number, y: number, yon: Yon): boolean { return (this.h.duvar[y * this.h.genislik + x] & (1 << yon)) !== 0; }
  private kaydet(olay: LabirentOlayi, sensor?: LabirentKaresi["sensor"]) {
    this.iz.push({ x: this.x, y: this.y, yon: this.yon, olay, t: this.sure, satir: this.satir || undefined, sensor });
  }
  private dur(s: LabirentDurmasi): never { this.kosuKapat(); this.durdu = s; this.kaydet(s); throw new LabirentDurdu(s); }
  private kosuKapat() { this.kapali += kosuSuresi(this.kosu); this.kosu = 0; }
  private hazir() {
    if (this.bitisZamani !== null) throw new LabirentDurdu("bitis");
    if (this.durdu) throw new LabirentDurdu(this.durdu);
    if (++this.adim > LABIRENT_ADIM_SINIRI) this.dur("cok_adim");
  }
  private sureBak() { if (this.sure > this.sureSiniri) this.dur("sure"); }

  ileri(): void {
    this.hazir();
    if (this.duvarVar(this.x, this.y, this.yon)) this.dur("carpma");
    this.x += DX[this.yon]; this.y += DY[this.yon]; this.kosu++;
    this.enUzakSatir = Math.max(this.enUzakSatir, this.satirNo(this.y));
    this.kaydet("ileri");
    if (this.x === this.h.bitis.x && this.y === this.h.bitis.y) {
      this.kosuKapat();
      if (this.sure > this.sureSiniri) this.dur("sure");
      this.bitisZamani = this.sure; this.kaydet("bitis");
      throw new LabirentDurdu("bitis");
    }
    this.sureBak();
  }
  private don(olay: "sol" | "sag" | "geri") {
    this.hazir(); this.kosuKapat();
    this.yon = olay === "sol" ? solaDon(this.yon) : olay === "sag" ? sagaDon(this.yon) : sagaDon(sagaDon(this.yon));
    this.kapali += olay === "geri" ? RIZBOT.donus180 : RIZBOT.donus90;
    this.kaydet(olay); this.sureBak();
  }
  solaDon() { this.don("sol"); }
  sagaDon() { this.don("sag"); }
  geriDon() { this.don("geri"); }

  /** sensör: iz yazar (sahnede ışın gösterilir), süre harcamaz */
  duvar(taraf: Taraf): boolean {
    if (this.bitisZamani !== null || this.durdu) return true;
    const yn = taraf === "on" ? this.yon : taraf === "sol" ? solaDon(this.yon) : sagaDon(this.yon);
    const d = this.duvarVar(this.x, this.y, yn);
    if (this.iz.length < LABIRENT_ADIM_SINIRI * 4) this.kaydet("bak", { taraf, duvar: d });
    return d;
  }
  bittiMi(): boolean { return this.bitisZamani !== null; }
  konum(): [number, number] { return [this.x, this.y]; }
  komsu(taraf: Taraf | "geri"): [number, number] {
    const yn = taraf === "on" ? this.yon : taraf === "sol" ? solaDon(this.yon) : taraf === "sag" ? sagaDon(this.yon) : sagaDon(sagaDon(this.yon));
    return [this.x + DX[yn], this.y + DY[yn]];
  }

  /** Program bitti: süre sınırı kontrolü (bitişe ulaşmadan duran program için) */
  bitir(): void { this.kosuKapat(); }

  /** Oynatma için her karenin başlangıç ve bitiş anı: düz koşu içindeki hücreler hız profiline göre zamanlanır. */
  zamanla(): { bas: number; son: number }[] {
    const r: { bas: number; son: number }[] = [];
    let t = 0;
    for (let i = 0; i < this.iz.length; i++) {
      const k = this.iz[i];
      if (k.olay !== "ileri") { const son = k.olay === "bak" || k.olay === "basla" ? t : Math.max(t, k.t); r.push({ bas: t, son }); t = son; continue; }
      /* koşuyu bul: bu ve ardışık ileri kareleri (araya sensör okuması girebilir) */
      const kosu: number[] = [];
      let j = i;
      for (; j < this.iz.length; j++) { const o = this.iz[j].olay; if (o === "ileri") kosu.push(j); else if (o !== "bak") break; }
      const d = (kosu.length * HUCRE_MM) / 1000, bas = t;
      let onceki = bas, n = 0;
      for (let m = i; m < j; m++) {
        if (this.iz[m].olay === "bak") { r.push({ bas: onceki, son: onceki }); continue; }
        n++;
        const son = bas + konumZamani((n * HUCRE_MM) / 1000, d);
        r.push({ bas: onceki, son }); onceki = son;
      }
      t = onceki; i = j - 1;
    }
    return r;
  }
}

/* ---------- görev ve değerlendirme ---------- */
export interface LabirentGorevi {
  kimlik: string; sira: number; ad: string; ogrettigi: string; hikaye: string;
  /** program hepsinde çalışmalı; ilki sahnede gösterilir */
  haritalar: string[][];
  /** yarış süresi sınırı (sn): aşılırsa bitiremedi */
  sureSiniri: number;
  /** 2. yıldız: ilk labirentte bitiş süresi en fazla bu (sn) */
  yildizSuresi: number;
  /** 3. yıldız: boş olmayan, yorum olmayan satır sayısı */
  satirSiniri: number;
  /** MEB puanı gösterilsin mi */
  meb?: boolean;
  komutlar: string[];
  baslangicKodu: string;
  ipucu: string;
  cozum: string;
}

export interface LabirentSonucu {
  basarili: boolean;
  sebep?: LabirentDurmasi | "bitmedi" | "hata";
  sure: number;
  /** MEB puanı: bitirdiyse süre, bitiremediyse 200 + (satır sayısı − ulaşılan satır) × 10 */
  puan: number;
  enUzakSatir: number;
  satir: number;
  yildiz: 0 | 1 | 2 | 3;
  yildizlar: { bitti: boolean; hizli: boolean; kisa: boolean };
}

const satirSay = (kod: string) => kod.split("\n").filter((l) => { const t = l.trim(); return t && !t.startsWith("#"); }).length;

export function labirentDegerlendir(g: LabirentGorevi, simler: Labirent[], kod: string, hata?: "hata"): LabirentSonucu {
  const ilk = simler[0];
  const durma = simler.find((s) => s.durdu)?.durdu;
  const bitmeyen = simler.some((s) => !s.bittiMi()) || simler.length < g.haritalar.length;
  const sebep = durma ?? hata ?? (bitmeyen ? "bitmedi" : undefined);
  const basarili = !sebep;
  const sure = ilk.bitisZamani ?? Math.min(ilk.sure, ilk.sureSiniri);
  const puan = ilk.bitisZamani !== null ? Math.round(ilk.bitisZamani * 100) / 100 : 200 + (ilk.h.yukseklik - ilk.enUzakSatir) * 10;
  const satir = satirSay(kod);
  const y = { bitti: basarili, hizli: basarili && (ilk.bitisZamani ?? Infinity) <= g.yildizSuresi, kisa: basarili && satir <= g.satirSiniri };
  return { basarili, sebep, sure, puan, enUzakSatir: ilk.enUzakSatir, satir, yildizlar: y, yildiz: (Number(y.bitti) + Number(y.hizli) + Number(y.kisa)) as 0 | 1 | 2 | 3 };
}
