/* Portalın ortak durumu: çalışma modu, oturum ve giriş yapmış kişi. Ekranlar buradan okur. */
import { baglantiKur, modBul, Oturum, type Kullanici, type Mod, type PlatformAyari } from "@sra/bulut";

declare global { interface Window { SRA_AYAR?: PlatformAyari } }

class Uygulama {
  readonly ayar: PlatformAyari = window.SRA_AYAR ?? {};
  readonly mod: Mod = modBul(this.ayar);
  readonly oturum: Oturum | null;
  kullanici: Kullanici | null = null;

  constructor() {
    const b = baglantiKur(this.ayar);
    this.oturum = b ? new Oturum(b) : null;
  }

  get hesapli(): boolean { return this.oturum !== null; }

  async yenile(): Promise<void> {
    if (!this.oturum) return;
    try { this.kullanici = await this.oturum.kim(); } catch { this.kullanici = null; }
  }

  /** Göreli bir hedefe git: "junior/" gibi bir yol ya da "#rota". */
  git(hedef: string): void {
    if (hedef.startsWith("#")) { location.hash = hedef.slice(1); return; }
    location.href = new URL(hedef, location.href.split("#")[0]).href;
  }

  async cikis(): Promise<void> {
    if (this.oturum) await this.oturum.cikis();
    this.kullanici = null;
  }
}

export const uygulama = new Uygulama();
