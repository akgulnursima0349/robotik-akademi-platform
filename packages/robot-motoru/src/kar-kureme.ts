/* Kar Küreme: bataryalı robot karlı sokakları açar. Komutlar simülasyonu ilerletir ve her adım ize yazılır;
   sahne bu izi oynatır. Aynı komutlar her zaman aynı izi üretir. */
import { DX, DY, Izgara, sagaDon, solaDon, type Konum, type Yon } from "./izgara";

export const ENERJI = { karliKare: 2, temizKare: 1, donus: 0 } as const;
export const ADIM_SINIRI = 500;

export type Olay = "basla" | "ileri" | "sol" | "sag" | "sarj" | "carpma" | "batarya" | "cok_adim";
export interface Kare { x: number; y: number; yon: Yon; batarya: number; olay: Olay; temizlenen?: Konum; satir?: number }
export type DurmaSebebi = "carpma" | "batarya" | "cok_adim";

/** Program simülasyonu durdurduğunda fırlatılır (çarpma, batarya bitmesi). Python köprüsü bunu yakalar. */
export class RobotDurdu extends Error {
  constructor(readonly sebep: DurmaSebebi) {
    super(sebep === "carpma" ? "Robot bir binaya çarptı." : sebep === "batarya" ? "Batarya bitti, robot durdu." : "Robot çok fazla adım attı.");
    this.name = "RobotDurdu";
  }
}

export class KarKureme {
  readonly izgara: Izgara;
  x: number; y: number; yon: Yon; batarya: number;
  readonly kapasite: number;
  harcanan = 0;
  readonly iz: Kare[] = [];
  durdu: DurmaSebebi | null = null;
  /** Python köprüsü komutun hangi satırdan geldiğini buraya yazar (izde gösterilir). */
  satir = 0;

  constructor(harita: readonly string[], yon: Yon, batarya: number) {
    this.izgara = new Izgara(harita);
    ({ x: this.x, y: this.y } = this.izgara.baslangic);
    this.yon = yon; this.batarya = this.kapasite = batarya;
    this.kaydet("basla");
  }
  private kaydet(olay: Olay, temizlenen?: Konum) {
    this.iz.push({ x: this.x, y: this.y, yon: this.yon, batarya: this.batarya, olay, temizlenen, satir: this.satir || undefined });
  }
  private dur(s: DurmaSebebi): never { this.durdu = s; this.kaydet(s); throw new RobotDurdu(s); }
  private sayac() { if (this.iz.length > ADIM_SINIRI) this.dur("cok_adim"); }

  ileri(): void {
    if (this.durdu) throw new RobotDurdu(this.durdu);
    this.sayac();
    const nx = this.x + DX[this.yon], ny = this.y + DY[this.yon];
    if (!this.izgara.gecilebilir(nx, ny)) this.dur("carpma");
    const maliyet = this.izgara.karVar(nx, ny) ? ENERJI.karliKare : ENERJI.temizKare;
    if (this.batarya < maliyet) this.dur("batarya");
    this.x = nx; this.y = ny; this.batarya -= maliyet; this.harcanan += maliyet;
    const temiz = this.izgara.karTemizle(nx, ny);
    this.kaydet("ileri", temiz ? { x: nx, y: ny } : undefined);
    if (this.izgara.hucre(nx, ny) === "istasyon" && this.batarya < this.kapasite) { this.batarya = this.kapasite; this.kaydet("sarj"); }
  }
  solaDon(): void { if (this.durdu) throw new RobotDurdu(this.durdu); this.sayac(); this.yon = solaDon(this.yon); this.kaydet("sol"); }
  sagaDon(): void { if (this.durdu) throw new RobotDurdu(this.durdu); this.sayac(); this.yon = sagaDon(this.yon); this.kaydet("sag"); }

  /* sensörler: iz yazmaz, enerji harcamaz */
  onuAcik(): boolean { return this.izgara.gecilebilir(this.x + DX[this.yon], this.y + DY[this.yon]); }
  onundeKarVar(): boolean { return this.izgara.karVar(this.x + DX[this.yon], this.y + DY[this.yon]); }
  istasyondaMi(): boolean { return this.izgara.hucre(this.x, this.y) === "istasyon"; }
}

/* ---------- görevler ---------- */
export interface Gorev {
  kimlik: string;
  sira: number;
  ad: string;
  ogrettigi: string;
  hikaye: string;
  /** Birden fazla harita: program hepsinde çalışmalı (sensör görevleri). İlk harita sahnede gösterilir. */
  haritalar: string[][];
  yon: Yon;
  batarya: number;
  /** 2. yıldız: harcanan enerji bu sınırı geçmemeli (ilk haritada) */
  enerjiSiniri: number;
  /** 3. yıldız: boş olmayan, yorum olmayan satır sayısı */
  satirSiniri: number;
  komutlar: string[];
  baslangicKodu: string;
  ipucu: string;
  cozum: string;
}

export interface GorevSonucu {
  basarili: boolean;
  sebep?: DurmaSebebi | "kar_kaldi" | "hata";
  kalanKar: number;
  harcanan: number;
  satir: number;
  yildiz: 0 | 1 | 2 | 3;
  yildizlar: { bitti: boolean; enerji: boolean; kisa: boolean };
}

export const satirSay = (kod: string) => kod.split("\n").filter((l) => { const t = l.trim(); return t && !t.startsWith("#"); }).length;

export function degerlendir(g: Gorev, simler: KarKureme[], kod: string, hata?: DurmaSebebi | "hata"): GorevSonucu {
  const ilk = simler[0];
  const kalan = simler.reduce((t, s) => t + s.izgara.kalanKar(), 0);
  const durdu = simler.find((s) => s.durdu)?.durdu;
  const sebep = hata ?? durdu ?? (kalan > 0 ? "kar_kaldi" : undefined);
  const basarili = !sebep;
  const satir = satirSay(kod);
  const y = { bitti: basarili, enerji: basarili && ilk.harcanan <= g.enerjiSiniri, kisa: basarili && satir <= g.satirSiniri };
  return { basarili, sebep, kalanKar: kalan, harcanan: ilk.harcanan, satir, yildizlar: y, yildiz: (Number(y.bitti) + Number(y.enerji) + Number(y.kisa)) as 0 | 1 | 2 | 3 };
}
