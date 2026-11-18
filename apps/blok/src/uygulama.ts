import { baglantiKur, modBul, Oturum, type Kullanici, type PlatformAyari } from "@sra/bulut";
declare global { interface Window { SRA_AYAR?: PlatformAyari } }
class Uygulama {
  readonly ayar: PlatformAyari = window.SRA_AYAR ?? {};
  readonly mod = modBul(this.ayar);
  readonly oturum: Oturum | null = (() => { const b = baglantiKur(this.ayar); return b ? new Oturum(b) : null; })();
  kullanici: Kullanici | null = null;
  async yenile() { if (this.oturum) { try { this.kullanici = await this.oturum.kim(); } catch { this.kullanici = null; } } }
}
export const uygulama = new Uygulama();
