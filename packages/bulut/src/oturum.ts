/* Oturum: giriş, çıkış, "ben kimim?" ve öğretmenin sınıfları. Sunucuyu SunucuBaglantisi arayüzü üzerinden görür. */
import type { SunucuBaglantisi } from "./baglanti";
import { BulutHatasi } from "./hata";
import { kursMu, type KursKimligi } from "./katalog";
import { Kullanici, Ogrenci, Ogretmen, type Sinif } from "./kullanici";

interface BenCevabi {
  rol: "ogrenci" | "ogretmen" | null;
  pasif?: boolean;
  takma_ad?: string; sinif?: string; sinif_kod?: string; kurs?: string;
  ad?: string; mudur?: boolean;
  hata?: string;
}
interface SinifCevabi { id: string; ad: string; kod: string; kurs: string; ogrenci_sayisi: number; benim: boolean; sahip_ad: string }

/** Öğretmen hesabı açılmış ama ad ve kurum kodu girilmemiş (ya da erişimi kapatılmış). */
export class TamamlanmamisHesap {
  constructor(readonly pasif: boolean) {}
}

export class Oturum {
  constructor(private readonly b: SunucuBaglantisi) {}

  static kullaniciya(r: BenCevabi): Kullanici | null {
    if (r.rol === "ogrenci") {
      const kurs: KursKimligi = kursMu(r.kurs) ? r.kurs : "ortaokul";
      return new Ogrenci(r.takma_ad ?? "", r.sinif ?? "", r.sinif_kod ?? "", kurs);
    }
    if (r.rol === "ogretmen") return new Ogretmen(r.ad ?? "", !!r.mudur);
    return null;
  }

  /** Açık oturum varsa kim olduğu; yoksa null. */
  async kim(): Promise<Kullanici | null> {
    if (!(await this.b.oturum())) return null;
    return Oturum.kullaniciya(await this.b.rpc<BenCevabi>("platform_ben"));
  }

  async ogrenciGiris(kod: string, takmaAd: string, pin: string): Promise<Ogrenci> {
    if (!/^\d{4}$/.test(pin)) throw new BulutHatasi("gecersiz_giris");
    const s = await this.b.oturum();
    if (s && !s.anonim) await this.b.cikis(); // açık öğretmen oturumu öğrenci girişini engellemesin
    if (!(await this.b.oturum())) await this.b.anonimGiris();
    const r = await this.b.rpc<{ hata?: string }>("ogrenci_giris", { p_kod: kod.trim().toUpperCase(), p_takma_ad: takmaAd.trim(), p_pin: pin });
    if (r && r.hata) throw new BulutHatasi(r.hata);
    const k = Oturum.kullaniciya(await this.b.rpc<BenCevabi>("platform_ben"));
    if (!(k instanceof Ogrenci)) throw new BulutHatasi("oturum_yok");
    return k;
  }

  async ogretmenGiris(eposta: string, sifre: string): Promise<Ogretmen | TamamlanmamisHesap> {
    if (await this.b.oturum()) await this.cikis();
    await this.b.epostaGiris(eposta.trim(), sifre);
    const r = await this.b.rpc<BenCevabi>("platform_ben");
    const k = Oturum.kullaniciya(r);
    return k instanceof Ogretmen ? k : new TamamlanmamisHesap(!!r.pasif);
  }

  async ogretmenKaydol(eposta: string, sifre: string): Promise<{ onayGerekli: boolean }> {
    if (await this.b.oturum()) await this.b.cikis();
    return this.b.kaydol(eposta.trim(), sifre);
  }

  async ogretmenTamamla(ad: string, kurumKodu: string): Promise<Ogretmen> {
    await this.b.rpc("ogretmen_kaydol", { p_ad: ad.trim(), p_kurum_kodu: kurumKodu.trim() });
    const k = Oturum.kullaniciya(await this.b.rpc<BenCevabi>("platform_ben"));
    if (!(k instanceof Ogretmen)) throw new BulutHatasi("yetki_yok");
    return k;
  }

  /** E-posta onayından dönmüş ama öğretmen kaydını tamamlamamış hesap (öğrencinin anonim oturumu sayılmaz). */
  async tamamlanmamisHesap(): Promise<boolean> {
    const s = await this.b.oturum();
    if (!s || s.anonim) return false;
    const r = await this.b.rpc<BenCevabi>("platform_ben");
    return r.rol === null && !r.pasif;
  }

  async siniflarim(): Promise<Sinif[]> {
    const r = await this.b.rpc<SinifCevabi[]>("platform_siniflarim");
    return (r ?? []).map((s) => ({
      id: s.id, ad: s.ad, kod: s.kod, kurs: kursMu(s.kurs) ? s.kurs : "ortaokul",
      ogrenciSayisi: s.ogrenci_sayisi, benim: s.benim, sahipAd: s.sahip_ad
    }));
  }

  async sinifKursuAyarla(sinifId: string, kurs: KursKimligi): Promise<void> {
    await this.b.rpc("platform_sinif_kurs", { p_sinif: sinifId, p_kurs: kurs });
  }

  async cikis(): Promise<void> {
    try { await this.b.rpc("ogrenci_cikis"); } catch { /* öğretmen oturumunda anlamsız, sessizce geç */ }
    await this.b.cikis();
  }
}
