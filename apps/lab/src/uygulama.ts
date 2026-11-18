/* Lab'in ortak durumu: platformla aynı ayar ve aynı oturum (tek giriş). */
import { baglantiKur, modBul, Oturum, type Kullanici, type Mod, type PlatformAyari, type SunucuBaglantisi } from "@sra/bulut";

declare global { interface Window { SRA_AYAR?: PlatformAyari } }

class Uygulama {
  readonly ayar: PlatformAyari = window.SRA_AYAR ?? {};
  readonly mod: Mod = modBul(this.ayar);
  readonly baglanti: SunucuBaglantisi | null = baglantiKur(this.ayar);
  readonly oturum: Oturum | null = this.baglanti ? new Oturum(this.baglanti) : null;
  kullanici: Kullanici | null = null;
  async yenile() { if (this.oturum) { try { this.kullanici = await this.oturum.kim(); } catch { this.kullanici = null; } } }
}
export const uygulama = new Uygulama();
