/* Tarayıcı içi sahte sunucu: testlerde ve deneme modunda gerçek Supabase'in yerini tutar.
   Yalnızca platformun kullandığı RPC'leri, gerçek SQL'deki kurallarla aynı biçimde uygular. */
import type { OturumBilgisi, SunucuBaglantisi } from "./baglanti";
import { BulutHatasi } from "./hata";
import { kursMu, type KursKimligi } from "./katalog";

interface SOgretmen { id: string; eposta: string; sifre: string; ad: string | null; mudur: boolean; aktif: boolean }
interface SSinif { id: string; ogretmenId: string; ad: string; kod: string; kurs: KursKimligi }
interface SOgrenci { id: string; sinifId: string; takmaAd: string; pin: string }
interface Durum {
  ogretmenler: SOgretmen[];
  siniflar: SSinif[];
  ogrenciler: SOgrenci[];
  kurumKodu: string;
  mudurKodu: string;
  labRobotlar: Record<string, { ad: string; kod: string; guncelleme: string }>;
  /** açık oturum: öğretmen kimliği ya da anonim öğrenci oturumu */
  oturum: { uid: string; anonim: boolean; ogrenciId?: string } | null;
  hatali: Record<string, number>;
}

/* deneme sınıfında hazır iki öğrenci robotu (öğretmenin sınıf turnuvası boş kalmasın) */
const ORNEK_SINIF_ROBOTU_1 = `def hamle(robot):
    hedef = robot["en_yakin_top"]
    if hedef is None:
        return "bekle"
    if hedef[0] > robot["x"] and robot["yon"] != "doğu":
        return "saga"
    if hedef[0] < robot["x"] and robot["yon"] != "batı":
        return "sola"
    if hedef[0] == robot["x"] and hedef[1] != robot["y"]:
        if robot["yon"] == "doğu" or robot["yon"] == "batı":
            return "saga"
    return "ileri"
`;
const ORNEK_SINIF_ROBOTU_2 = `def hamle(robot):
    if robot["onu_acik"]:
        return "ileri"
    if robot["tur"] % 2 == 0:
        return "saga"
    return "sola"
`;

export const DENEME_HESAPLARI = {
  ogretmen: { eposta: "ogretmen@deneme.com", sifre: "deneme123" },
  mudur: { eposta: "mudur@deneme.com", sifre: "deneme123" },
  kurumKodu: "DENEME-KURUM",
  ogrenciler: [
    { kod: "JNR123", ad: "Ece", pin: "1234", kurs: "junior" },
    { kod: "ORT456", ad: "Mert", pin: "5678", kurs: "ortaokul" },
    { kod: "BLK789", ad: "Ada", pin: "1111", kurs: "ilkokul" }
  ]
} as const;

function tohum(): Durum {
  return {
    ogretmenler: [
      { id: "t1", eposta: DENEME_HESAPLARI.ogretmen.eposta, sifre: DENEME_HESAPLARI.ogretmen.sifre, ad: "Deneme Öğretmen", mudur: false, aktif: true },
      { id: "t2", eposta: DENEME_HESAPLARI.mudur.eposta, sifre: DENEME_HESAPLARI.mudur.sifre, ad: "Deneme Müdür", mudur: true, aktif: true }
    ],
    siniflar: [
      { id: "s1", ogretmenId: "t1", ad: "5-A Junior", kod: "JNR123", kurs: "junior" },
      { id: "s2", ogretmenId: "t1", ad: "7-B Python", kod: "ORT456", kurs: "ortaokul" },
      { id: "s3", ogretmenId: "t2", ad: "2-C Bloklar", kod: "BLK789", kurs: "ilkokul" }
    ],
    ogrenciler: [
      { id: "o1", sinifId: "s1", takmaAd: "Ece", pin: "1234" },
      { id: "o2", sinifId: "s2", takmaAd: "Mert", pin: "5678" },
      { id: "o3", sinifId: "s3", takmaAd: "Ada", pin: "1111" },
      { id: "o4", sinifId: "s1", takmaAd: "Deniz", pin: "2345" },
      { id: "o5", sinifId: "s1", takmaAd: "Kuzey", pin: "3456" }
    ],
    labRobotlar: {
      o4: { ad: "Kar Kaplanı", kod: ORNEK_SINIF_ROBOTU_1, guncelleme: "2026-11-18T10:00:00Z" },
      o5: { ad: "Buzkıran", kod: ORNEK_SINIF_ROBOTU_2, guncelleme: "2026-11-18T10:05:00Z" }
    },
    kurumKodu: DENEME_HESAPLARI.kurumKodu,
    mudurKodu: "DENEME-MUDUR",
    oturum: null,
    hatali: {}
  };
}

/** Basit kalıcılık: sayfa yenilense de sahte oturum sürer (yalnızca deneme modu). */
export interface Depo { oku(): string | null; yaz(v: string): void }
export const bellekDeposu = (): Depo => { let v: string | null = null; return { oku: () => v, yaz: (x: string) => { v = x; } }; };
export const tarayiciDeposu = (anahtar = "sra-sahte-sunucu"): Depo => ({
  oku: () => { try { return localStorage.getItem(anahtar); } catch { return null; } },
  yaz: (v) => { try { localStorage.setItem(anahtar, v); } catch { /* depolama kapalı: bellekte kalır */ } }
});

let sayac = 100;
const yeniId = (on: string) => on + ++sayac;

export class SahteBaglanti implements SunucuBaglantisi {
  private d: Durum;
  constructor(private readonly depo: Depo = bellekDeposu(), private readonly gecikme = 0) {
    const ham = depo.oku();
    this.d = ham ? (JSON.parse(ham) as Durum) : tohum();
  }
  private kaydet() { this.depo.yaz(JSON.stringify(this.d)); }
  private async bekle() { if (this.gecikme) await new Promise((r) => setTimeout(r, this.gecikme)); }

  private ogretmen(): SOgretmen | undefined {
    const o = this.d.oturum;
    return o && !o.anonim ? this.d.ogretmenler.find((t) => t.id === o.uid) : undefined;
  }
  private aktifOgretmen(): SOgretmen {
    const t = this.ogretmen();
    if (!t || !t.ad || !t.aktif) throw new BulutHatasi("yetki_yok");
    return t;
  }

  async oturum(): Promise<OturumBilgisi | null> {
    return this.d.oturum ? { anonim: this.d.oturum.anonim } : null;
  }
  async anonimGiris() { await this.bekle(); this.d.oturum = { uid: yeniId("anon"), anonim: true }; this.kaydet(); }
  async epostaGiris(eposta: string, sifre: string) {
    await this.bekle();
    const t = this.d.ogretmenler.find((x) => x.eposta === eposta.toLowerCase() && x.sifre === sifre);
    if (!t) throw new BulutHatasi("Invalid login credentials");
    this.d.oturum = { uid: t.id, anonim: false }; this.kaydet();
  }
  async kaydol(eposta: string, sifre: string) {
    await this.bekle();
    if (sifre.length < 6) throw new BulutHatasi("Password should be at least 6 characters");
    if (this.d.ogretmenler.some((x) => x.eposta === eposta.toLowerCase())) throw new BulutHatasi("User already registered");
    const t: SOgretmen = { id: yeniId("t"), eposta: eposta.toLowerCase(), sifre, ad: null, mudur: false, aktif: true };
    this.d.ogretmenler.push(t);
    this.d.oturum = { uid: t.id, anonim: false }; this.kaydet();
    return { onayGerekli: false };
  }
  async cikis() { this.d.oturum = null; this.kaydet(); }

  async rpc<T>(ad: string, p: Record<string, unknown> = {}): Promise<T> {
    await this.bekle();
    const sonuc = this.calistir(ad, p);
    this.kaydet();
    return sonuc as T;
  }

  private calistir(ad: string, p: Record<string, unknown>): unknown {
    const o = this.d.oturum;
    if (!o) throw new BulutHatasi("giris_gerekli");
    switch (ad) {
      case "platform_ben": {
        const t = this.ogretmen();
        if (t) return t.ad ? (t.aktif ? { rol: "ogretmen", id: t.id, ad: t.ad, mudur: t.mudur } : { rol: null, pasif: true }) : { rol: null };
        const og = this.d.ogrenciler.find((x) => x.id === o.ogrenciId);
        if (!og) return { rol: null };
        const s = this.d.siniflar.find((x) => x.id === og.sinifId)!;
        return { rol: "ogrenci", takma_ad: og.takmaAd, sinif: s.ad, sinif_kod: s.kod, kurs: s.kurs };
      }
      case "ogrenci_giris": {
        if (this.ogretmen()) throw new BulutHatasi("ogretmen_hesabi");
        const kod = String(p.p_kod ?? "").trim().toUpperCase();
        const ad = String(p.p_takma_ad ?? "").trim().toLowerCase().replace(/\s+/g, " ");
        const anahtar = kod + "|" + ad;
        if ((this.d.hatali[anahtar] ?? 0) >= 8) return { hata: "cok_deneme" };
        const s = this.d.siniflar.find((x) => x.kod === kod);
        const og = s && this.d.ogrenciler.find((x) => x.sinifId === s.id && x.takmaAd.toLowerCase() === ad);
        if (!s || !og || og.pin !== String(p.p_pin ?? "")) {
          this.d.hatali[anahtar] = (this.d.hatali[anahtar] ?? 0) + 1;
          return { hata: "gecersiz_giris" };
        }
        delete this.d.hatali[anahtar];
        o.ogrenciId = og.id;
        return { rol: "ogrenci", takma_ad: og.takmaAd, sinif: s.ad, sinif_kod: s.kod };
      }
      case "ogrenci_cikis": { delete o.ogrenciId; return null; }
      case "ogretmen_kaydol": {
        const t = this.ogretmen();
        if (!t) throw new BulutHatasi("giris_gerekli");
        const kurum = String(p.p_kurum_kodu ?? "").trim();
        if (kurum !== this.d.kurumKodu && kurum !== this.d.mudurKodu) throw new BulutHatasi("kurum_kodu_hatali");
        t.ad = String(p.p_ad ?? "").trim(); t.mudur = kurum === this.d.mudurKodu;
        return { rol: "ogretmen", id: t.id, ad: t.ad, mudur: t.mudur };
      }
      case "platform_siniflarim": {
        const t = this.aktifOgretmen();
        return this.d.siniflar
          .filter((s) => t.mudur || s.ogretmenId === t.id)
          .map((s) => ({
            id: s.id, ad: s.ad, kod: s.kod, kurs: s.kurs, benim: s.ogretmenId === t.id,
            sahip_ad: this.d.ogretmenler.find((x) => x.id === s.ogretmenId)?.ad ?? "",
            ogrenci_sayisi: this.d.ogrenciler.filter((x) => x.sinifId === s.id).length
          }));
      }
      case "platform_sinif_kurs": {
        const t = this.aktifOgretmen();
        const s = this.d.siniflar.find((x) => x.id === p.p_sinif);
        if (!s || !(t.mudur || s.ogretmenId === t.id)) throw new BulutHatasi("yetki_yok");
        if (!kursMu(p.p_kurs)) throw new BulutHatasi("kurs_gecersiz");
        s.kurs = p.p_kurs;
        return null;
      }
      case "lab_robot_kaydet": {
        if (!o.ogrenciId) throw new BulutHatasi("oturum_yok");
        const kod = String(p.p_kod ?? ""), ad = String(p.p_ad ?? "").trim();
        if (!ad || ad.length > 40 || kod.length > 4000) throw new BulutHatasi("veri_gecersiz");
        this.d.labRobotlar ??= {};
        this.d.labRobotlar[o.ogrenciId] = { ad, kod, guncelleme: new Date().toISOString() };
        return null;
      }
      case "lab_robotum": {
        if (!o.ogrenciId) throw new BulutHatasi("oturum_yok");
        const r = this.d.labRobotlar?.[o.ogrenciId];
        return r ? { ad: r.ad, kod: r.kod } : null;
      }
      case "lab_sinif_robotlari": {
        const t = this.aktifOgretmen();
        const s = this.d.siniflar.find((x) => x.id === p.p_sinif);
        if (!s || !(t.mudur || s.ogretmenId === t.id)) throw new BulutHatasi("yetki_yok");
        return this.d.ogrenciler.filter((x) => x.sinifId === s.id && this.d.labRobotlar?.[x.id])
          .map((x) => ({ takma_ad: x.takmaAd, ...this.d.labRobotlar[x.id] }));
      }
      default:
        throw new BulutHatasi("bilinmeyen_islev:" + ad);
    }
  }
}
