/* İlerleme eşitleyici: cihazdaki ilerlemeyi giriş yapmış öğrencinin bulut kaydıyla birleştirir ve değişiklikleri
   gecikmeli olarak yazar. Ağ hatasında artan bekleme ile yeniden dener; sayfa kapanırken son kez yazar. */
import type { Oturum, Uygulama } from "./oturum";

export interface Esitlenebilir<T> {
  veri(): T;
  /** Buluttan gelen kaydı cihazdakiyle birleştirir (kural uygulamaya özgü) */
  birlestir(uzak: T): void;
}
export type EsitlemeDurumu = "kapali" | "yukleniyor" | "kaydedildi" | "kaydediliyor" | "hata";

export class IlerlemeEsitleyici<T> {
  durum: EsitlemeDurumu = "kapali";
  private zaman: ReturnType<typeof setTimeout> | null = null;
  private kirli = false;
  private yaziyor = false;
  private deneme = 0;
  dinleyici: ((d: EsitlemeDurumu) => void) | null = null;

  constructor(private readonly oturum: Oturum, private readonly uygulama: Uygulama, private readonly kaynak: Esitlenebilir<T>, private readonly gecikme = 1200) {}

  /** Buluttaki kaydı çek, cihazdakiyle birleştir, birleşik hâli geri yaz */
  async baslat(): Promise<void> {
    this.ayarla("yukleniyor");
    try {
      const uzak = await this.oturum.ilerlemeGetir<T>(this.uygulama);
      if (uzak) this.kaynak.birlestir(uzak);
      this.ayarla("kaydedildi");
      this.degisti(0);
      if (typeof addEventListener === "function") addEventListener("pagehide", () => { if (this.kirli) void this.yaz(); });
    } catch { this.ayarla("hata"); }
  }
  /** Uygulama her değişiklikte çağırır */
  degisti(gecikme = this.gecikme) {
    if (this.durum === "kapali") return;
    this.kirli = true;
    if (this.zaman) clearTimeout(this.zaman);
    this.zaman = setTimeout(() => void this.yaz(), gecikme);
  }
  async yaz(): Promise<void> {
    if (this.yaziyor || !this.kirli) return;
    this.yaziyor = true; this.kirli = false; this.ayarla("kaydediliyor");
    try {
      await this.oturum.ilerlemeKaydet(this.uygulama, this.kaynak.veri());
      this.deneme = 0; this.ayarla("kaydedildi");
    } catch {
      this.kirli = true; this.ayarla("hata");
      this.deneme++;
      this.zaman = setTimeout(() => void this.yaz(), Math.min(30000, 1000 * 2 ** this.deneme));
    } finally { this.yaziyor = false; }
    if (this.kirli && this.durum !== "hata") this.degisti();
  }
  private ayarla(d: EsitlemeDurumu) { this.durum = d; this.dinleyici?.(d); }
}
