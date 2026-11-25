/* Ders ilerlemesinin bu cihazdaki kaydı (sra-ders-v1). Bulut eşitleyicisine (IlerlemeEsitleyici, uygulama "dersler") kaynak olur:
   veri() buluta gidecek kayıt, birlestir() buluttan geleni "ileri olan kalır" kuralıyla katar. Depolama dışarıdan verilir. */
import { DERS_KAYIT_ANAHTARI, dersKaydiBirlestir, dersKayitlariBirlestir, dersKayitlariOku, type DersKaydi, type DersKayitlari } from "./ders";

type Depo = Pick<Storage, "getItem" | "setItem">;

export class DersDeposu {
  private v: DersKayitlari;
  private dinleyiciler = new Set<() => void>();
  constructor(private readonly depo: Depo | null, private readonly saat: () => Date = () => new Date()) {
    let ham: string | null = null;
    try { ham = depo?.getItem(DERS_KAYIT_ANAHTARI) ?? null; } catch { /* kapalı */ }
    this.v = dersKayitlariOku(ham);
  }
  kayit(kimlik: string): DersKaydi { return this.v.dersler[kimlik] ?? {}; }
  /** Dersin kaydına bir ilerleme ekler (geri gidilmez: birleştirme kuralı uygulanır) */
  ilerle(kimlik: string, ek: DersKaydi): void {
    this.v.dersler[kimlik] = dersKaydiBirlestir(this.kayit(kimlik), { ...ek, son: this.saat().toISOString() });
    this.yaz();
  }
  veri(): DersKayitlari { return JSON.parse(JSON.stringify(this.v)); }
  birlestir(uzak: unknown): void { this.v = dersKayitlariBirlestir(this.v, dersKayitlariOku(uzak as object)); this.yaz(); }
  degisince(f: () => void) { this.dinleyiciler.add(f); return () => { this.dinleyiciler.delete(f); }; }
  private yaz() {
    try { this.depo?.setItem(DERS_KAYIT_ANAHTARI, JSON.stringify(this.v)); } catch { /* kapalı: bellekte sürer */ }
    this.dinleyiciler.forEach((f) => f());
  }
}
