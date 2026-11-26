/* Ders biçimi: her ders dört bölüm, Anlat → Dene → Görev → Gerçek robotta. Saf veri ve kurallar (DOM ve depolama yok).
   - Anlat: sıralı adımlar (metin, seslendirme, Bit'in hâli, görsel başvurusu, isteğe bağlı soru).
   - Dene: bir deney bileşenine başvuru ve "denendi" sayılma koşulu.
   - Görev: Lab görevine bağ (yıldız Lab'ın kaydından) ya da yerleşik görev (başlangıç kodu, ölçüt, yıldız eşikleri).
   - Gerçek robotta: sınıf etkinliği (malzeme, adımlar, güvenlik, öğretmen notu); öğrenci işaretler, öğretmen onaylar.
   İlerleme kaydı ders başına bölüm durumlarını tutar; iki cihazdaki kayıt "ileri olan kalır" kuralıyla birleşir.
   Öğretmen onayı bu kayıtta tutulmaz: öğrencinin yazdığı kayda güvenilemez. Onay öğretmenin kendi kaydından gelir (E5) ve
   durum hesabına ayrıca verilir. */
import { AYAR_ARALIKLARI, AYAR_PISTLERI, CIZGI_GOREVLERI, DERS_LABIRENTLERI, DURUMLAR, ROTA_GOREVLERI, SIS_GOREVLERI, GOREVLER, HAMLELER, HAZIR_RAKIPLER, LABIRENT_GOREVLERI, type AyarAdi, type AyarDegerlendirme, type Durum, type StratejiDegerlendirme, type StratejiKartlari } from "@sra/robot-motoru";
import type { Seviye } from "./model";
import { gorselVarMi } from "./gorseller";

export type BitHali = "anlatiyor" | "dusunuyor" | "ipucu" | "seviniyor" | "sasiriyor" | "bekliyor";
export const BIT_HALLERI: readonly BitHali[] = ["anlatiyor", "dusunuyor", "ipucu", "seviniyor", "sasiriyor", "bekliyor"];
export type Robot = "SiroLine" | "Kenshin" | "RizBot";

export interface Soru { soru: string; secenekler: { metin: string; dogru?: boolean }[]; aciklama: string }
export interface AnlatimAdimi {
  metin: string;
  /** ekrandakinden farklı okunacaksa (kısaltma, sembol, kod) */
  seslendirme?: string;
  bit: BitHali;
  /** görsel başvurusu: 3D sahne anı ya da çizim (biçimi E3'te); burada yalnız ad ve ayar */
  gorsel?: { tur: "sahne" | "cizim"; ad: string; ayar?: Record<string, unknown> };
  soru?: Soru;
}
/** Ders sayfasının tanıdığı deney bileşenleri (portaldaki kayıt defteri bu adlarla kurulur) */
export const DENEY_BILESEN_ADLARI = ["sensor-gostergesi", "kaydirici", "cizgi-simulasyonu", "ring-simulasyonu", "sensor-gorusu", "itme-deneyi", "kart-kodu",
  "duvar-sensoru", "kural-adim", "sisli-labirent", "ada-deneyi", "hiz-profili", "puan-hesaplayici"] as const;
export interface Deney {
  /** deney bileşeni: DENEY_BILESEN_ADLARI'ndan biri */
  bilesen: string;
  ayar: Record<string, unknown>;
  yonerge: string;
  /** "denendi" sayılması için: bileşenin bildirdiği olaylardan en az kaç farklı değer */
  enAzFarkliDeger: number;
}
export type Gorev =
  /** Lab görevi; modul "lig": Lab'daki Mini Sumo Ligi (robot ligde kayıtlıysa yapılmış sayılır, gorev "lig") */
  | { tur: "lab"; modul: "kar" | "cizgi" | "labirent" | "lig"; gorev: string; yonerge: string }
  | { tur: "yerlesik"; robot: Robot; yonerge: string; baslangicKodu: string; olcut: string; yildizEsikleri: [number, number, number] }
  /** ayar görevi: kod yok; kitin SiroLine bloğundaki değerler (Taban Hız, Kp, Kd) kaydırıcılarla, ders sayfasında koşulur */
  | { tur: "ayar"; pist: string; acik: AyarAdi[]; sabit: Partial<Record<AyarAdi, number>>; degerlendirme: AyarDegerlendirme; yonerge: string }
  /** strateji görevi: Kenshin'e kod yazmadan strateji kartları; hazır rakiplere karşı oynanır, ders sayfasında */
  | { tur: "strateji"; acik: Durum[]; sabit: Partial<StratejiKartlari>; degerlendirme: StratejiDegerlendirme; yonerge: string }
  /** sisli labirent görevi: kod yok; RizBot yön tuşlarıyla sürülür, yalnız geçilen hücreler görünür (robot-motoru: SIS_GOREVLERI) */
  | { tur: "sis"; gorev: string; yonerge: string }
  /** rota görevi: kod yok; hücrelere tıklayarak yol çizilir, süre RizBot'un hız profilinden (robot-motoru: ROTA_GOREVLERI) */
  | { tur: "rota"; gorev: string; yonerge: string };
export interface GercekRobotta { malzeme: { parca: string; adet: number }[]; adimlar: string[]; guvenlik?: string; ogretmenNotu?: string }

export interface DersTanimi {
  kimlik: string;
  atolye: string;
  modul: string;
  seviyeler: Seviye[];
  ad: string;
  kazanim: string;
  mebKazanim?: string;
  sure: number;
  robot?: Robot;
  anlat: AnlatimAdimi[];
  dene: Deney;
  gorev: Gorev;
  gercek?: GercekRobotta;
}

/* ---------- doğrulayıcı ---------- */
const LAB_GOREVLERI: Record<string, Set<string>> = {
  kar: new Set(GOREVLER.map((g) => g.kimlik)),
  cizgi: new Set(CIZGI_GOREVLERI.map((g) => g.kimlik)),
  labirent: new Set(LABIRENT_GOREVLERI.map((g) => g.kimlik)),
  lig: new Set(["lig"])
};
/** Lab görevinin ilerleme kaydındaki anahtarı (Lab'ın kendi biçimi) */
export const labAnahtari = (g: { modul: string; gorev: string }) => (g.modul === "cizgi" ? "cizgi-" + g.gorev : g.gorev);

/** Dersin biçim hataları (Türkçe); boş dizi → geçerli */
export function dersiDogrula(d: DersTanimi): string[] {
  const h: string[] = [];
  const y = (m: string) => h.push(`${d.kimlik || "(kimliksiz ders)"}: ${m}`);
  if (!/^[a-z0-9-]+$/.test(d.kimlik)) y("kimlik yalnız küçük harf, rakam ve tire olmalı");
  if (!d.ad?.trim()) y("ad boş");
  if (!d.kazanim?.trim()) y("kazanım boş");
  if (!d.seviyeler?.length) y("en az bir seviye olmalı");
  if (!(d.sure > 0 && d.sure <= 90)) y("süre 1–90 dakika olmalı");
  if (!d.anlat?.length) y("anlatım boş");
  d.anlat?.forEach((a, i) => {
    if (!a.metin?.trim()) y(`anlatım adımı ${i + 1}: metin boş`);
    if (!BIT_HALLERI.includes(a.bit)) y(`anlatım adımı ${i + 1}: Bit'in hâli tanınmıyor (${a.bit})`);
    if (a.gorsel && !gorselVarMi(a.gorsel.tur, a.gorsel.ad)) y(`anlatım adımı ${i + 1}: görsel katalogda yok (${a.gorsel.tur}/${a.gorsel.ad})`);
    if (a.soru) {
      const dogru = a.soru.secenekler.filter((s) => s.dogru).length;
      if (a.soru.secenekler.length < 2) y(`anlatım adımı ${i + 1}: soruda en az iki seçenek olmalı`);
      if (dogru !== 1) y(`anlatım adımı ${i + 1}: soruda tek bir doğru seçenek olmalı (${dogru} var)`);
      if (!a.soru.aciklama?.trim()) y(`anlatım adımı ${i + 1}: sorunun açıklaması boş`);
    }
  });
  if (!d.dene) y("Dene bölümü eksik");
  else {
    if (!d.dene.bilesen?.trim()) y("Dene: deney bileşeni belirtilmemiş");
    else if (!(DENEY_BILESEN_ADLARI as readonly string[]).includes(d.dene.bilesen)) y(`Dene: deney bileşeni tanınmıyor (${d.dene.bilesen})`);
    else if (d.dene.bilesen === "kaydirici") {
      const a = d.dene.ayar as { en?: number; ust?: number; adim?: number };
      if (!(typeof a.en === "number" && typeof a.ust === "number" && a.en < a.ust && (a.adim ?? 1) > 0)) y("Dene: kaydırıcının alt ve üst sınırı ya da adımı geçersiz");
    }
    if (!d.dene.yonerge?.trim()) y("Dene: yönerge boş");
    if (!(d.dene.enAzFarkliDeger >= 1)) y("Dene: en az bir değer denenmeli");
  }
  if (d.dene?.bilesen === "ring-simulasyonu" || d.dene?.bilesen === "kart-kodu") kartBiciminiDenetle(d.dene.ayar as { acik?: Durum[]; sabit?: Record<string, string> }, (m) => y("Dene: " + m));
  if (d.dene?.bilesen === "cizgi-simulasyonu") ayarBiciminiDenetle(d.dene.ayar as { pist?: string; acik?: AyarAdi[]; sabit?: Record<string, number> }, (m) => y("Dene: " + m));
  if (["kural-adim", "sisli-labirent"].includes(d.dene?.bilesen)) {
    const a = d.dene.ayar as { harita?: string; kural?: string };
    if (!a.harita || !(a.harita in DERS_LABIRENTLERI)) y(`Dene: labirent tanınmıyor (${a.harita})`);
    if (d.dene.bilesen === "kural-adim" && !["sag-el", "sol-el"].includes(String(a.kural))) y(`Dene: kural tanınmıyor (${a.kural})`);
  }
  if (!d.gorev) y("Görev bölümü eksik");
  else if (d.gorev.tur === "sis" || d.gorev.tur === "rota") {
    if (!((d.gorev.tur === "sis" ? SIS_GOREVLERI : ROTA_GOREVLERI) as Record<string, unknown>)[d.gorev.gorev]) y(`Görev: böyle bir ${d.gorev.tur === "sis" ? "sisli labirent" : "rota"} görevi yok (${d.gorev.gorev})`);
    if (!d.gorev.yonerge?.trim()) y("Görev: yönerge boş");
  }
  else if (d.gorev.tur === "lab") {
    if (!LAB_GOREVLERI[d.gorev.modul]?.has(d.gorev.gorev)) y(`Görev: Lab'da böyle bir görev yok (${d.gorev.modul}/${d.gorev.gorev})`);
    if (!d.gorev.yonerge?.trim()) y("Görev: yönerge boş");
  } else if (d.gorev.tur === "strateji") {
    kartBiciminiDenetle(d.gorev, (m) => y("Görev: " + m));
    if (!d.gorev.degerlendirme.rakipler.length || d.gorev.degerlendirme.rakipler.some((r) => !(r in HAZIR_RAKIPLER))) y("Görev: rakip tanınmıyor");
    if (!d.gorev.yonerge?.trim()) y("Görev: yönerge boş");
  } else if (d.gorev.tur === "ayar") {
    ayarBiciminiDenetle(d.gorev, (m) => y("Görev: " + m));
    const [a, b, c] = d.gorev.degerlendirme.esikler;
    if (!(a >= b && b >= c && c > 0)) y("Görev: yıldız eşikleri büyükten küçüğe olmalı (1, 2, 3 yıldız)");
    if (!d.gorev.yonerge?.trim()) y("Görev: yönerge boş");
  } else {
    const [a, b, c] = d.gorev.yildizEsikleri;
    if (!d.gorev.baslangicKodu?.trim() || !d.gorev.olcut?.trim()) y("Görev: başlangıç kodu ve ölçüt gerekli");
    if (!(a <= b && b <= c)) y("Görev: yıldız eşikleri küçükten büyüğe olmalı");
  }
  if (d.gercek) {
    if (!d.gercek.adimlar.length) y("Gerçek robotta: adım yok");
    if (d.gercek.malzeme.some((m) => !(m.adet > 0) || !m.parca.trim())) y("Gerçek robotta: malzeme adı ve adedi gerekli");
    for (const m of d.gercek.malzeme) if (m.parca.trim() && !(m.parca in PARCALAR)) y(`Gerçek robotta: parça listede yok (${m.parca})`);
  }
  return h;
}
/** Strateji kartlarının alanları: açık durumlar ve sabit kartlar tanınıyor */
function kartBiciminiDenetle(a: { acik?: Durum[]; sabit?: Partial<Record<string, string>> }, y: (m: string) => void) {
  const durumlar = new Set<string>(DURUMLAR.map((x) => x.k));
  if (!a.acik?.length) y("en az bir durum açık olmalı");
  for (const k of a.acik ?? []) if (!durumlar.has(k)) y(`durum tanınmıyor (${k})`);
  for (const [k, v] of Object.entries(a.sabit ?? {})) {
    if (!durumlar.has(k)) y(`sabit kartın durumu tanınmıyor (${k})`);
    if (!(String(v) in HAMLELER)) y(`hamle tanınmıyor (${v})`);
  }
}
/** Çizgi simülasyonu ve ayar görevinin ortak alanları: pist var, açık ayarlar tanınıyor, her ayarın bir değeri var */
function ayarBiciminiDenetle(a: { pist?: string; acik?: AyarAdi[]; sabit?: Partial<Record<string, number>> }, y: (m: string) => void) {
  if (!a.pist || !(a.pist in AYAR_PISTLERI)) y(`pist tanınmıyor (${a.pist})`);
  if (!a.acik?.length) y("en az bir ayar açık olmalı");
  for (const k of a.acik ?? []) if (!(k in AYAR_ARALIKLARI)) y(`ayar tanınmıyor (${k})`);
  for (const [k, v] of Object.entries(a.sabit ?? {})) {
    const r = AYAR_ARALIKLARI[k as AyarAdi];
    if (!r) y(`sabit ayar tanınmıyor (${k})`);
    else if (!(typeof v === "number" && v >= r.en && v <= r.ust)) y(`${r.ad} ${r.en}–${r.ust} arasında olmalı`);
  }
}
/** Bir ders listesinde yinelenen kimlikler */
export function yinelenenKimlikler(dersler: DersTanimi[]): string[] {
  const gorulen = new Set<string>(), tekrar = new Set<string>();
  for (const d of dersler) (gorulen.has(d.kimlik) ? tekrar : gorulen).add(d.kimlik);
  return [...tekrar];
}

/* ---------- ilerleme kaydı ---------- */
export interface DersKaydi {
  anlat?: { adim: number; bitti: boolean };
  dene?: { degerler: number; bitti: boolean };
  /** yalnız yerleşik görevde; Lab görevinin yıldızı Lab'ın kaydındadır */
  gorev?: { yildiz: number };
  gercek?: { ogrenci: boolean };
  /** son çalışma (ISO zaman) */
  son?: string;
}
export interface DersKayitlari { dersler: Record<string, DersKaydi> }
export const DERS_KAYIT_ANAHTARI = "sra-ders-v1";

const sayi = (x: unknown, en: number, ust: number) => { const n = Math.floor(Number(x)); return Number.isFinite(n) ? Math.max(en, Math.min(ust, n)) : en; };
function kaydiTemizle(v: unknown): DersKaydi {
  const k = (v && typeof v === "object" ? v : {}) as Record<string, any>;
  const r: DersKaydi = {};
  if (k.anlat && typeof k.anlat === "object") r.anlat = { adim: sayi(k.anlat.adim, 0, 999), bitti: k.anlat.bitti === true };
  if (k.dene && typeof k.dene === "object") r.dene = { degerler: sayi(k.dene.degerler, 0, 9999), bitti: k.dene.bitti === true };
  if (k.gorev && typeof k.gorev === "object") r.gorev = { yildiz: sayi(k.gorev.yildiz, 0, 3) };
  if (k.gercek && typeof k.gercek === "object") r.gercek = { ogrenci: k.gercek.ogrenci === true };
  if (typeof k.son === "string" && !Number.isNaN(Date.parse(k.son))) r.son = k.son;
  return r;
}
/** Kayıt metnini (ya da buluttan gelen nesneyi) okur; bozuk ya da eksikse boş kayıt */
export function dersKayitlariOku(ham: string | object | null | undefined): DersKayitlari {
  try {
    const v = typeof ham === "string" ? JSON.parse(ham) : ham;
    const d = v && typeof v === "object" && (v as any).dersler && typeof (v as any).dersler === "object" ? (v as any).dersler : {};
    return { dersler: Object.fromEntries(Object.entries(d).filter(([k]) => /^[a-z0-9-]+$/.test(k)).map(([k, x]) => [k, kaydiTemizle(x)])) };
  } catch { return { dersler: {} }; }
}

const ileri = <T>(a: T | undefined, b: T | undefined, bil: (x: T, y: T) => T): T | undefined => (a && b ? bil(a, b) : a ?? b);
/** İki dersin kaydını birleştirir: her alanın ileri olanı kalır */
export function dersKaydiBirlestir(a: DersKaydi, b: DersKaydi): DersKaydi {
  const r: DersKaydi = {};
  const an = ileri(a.anlat, b.anlat, (x, y) => ({ adim: Math.max(x.adim, y.adim), bitti: x.bitti || y.bitti })); if (an) r.anlat = an;
  const de = ileri(a.dene, b.dene, (x, y) => ({ degerler: Math.max(x.degerler, y.degerler), bitti: x.bitti || y.bitti })); if (de) r.dene = de;
  const go = ileri(a.gorev, b.gorev, (x, y) => ({ yildiz: Math.max(x.yildiz, y.yildiz) })); if (go) r.gorev = go;
  const ge = ileri(a.gercek, b.gercek, (x, y) => ({ ogrenci: x.ogrenci || y.ogrenci })); if (ge) r.gercek = ge;
  const son = [a.son, b.son].filter(Boolean).sort().pop(); if (son) r.son = son;
  return r;
}
export function dersKayitlariBirlestir(a: DersKayitlari, b: DersKayitlari): DersKayitlari {
  const r: DersKayitlari = { dersler: { ...a.dersler } };
  for (const [k, v] of Object.entries(b.dersler)) r.dersler[k] = r.dersler[k] ? dersKaydiBirlestir(r.dersler[k], v) : v;
  return r;
}

/* ---------- durum ve XP ---------- */
export interface DersDurumuOzeti { anlat: boolean; dene: boolean; gorevYildiz: number; gorev: boolean; gercek: boolean; onayli: boolean; bitti: boolean; adim: number }
/** labYildizi: Lab görevine bağlı derste Lab'ın kaydındaki yıldız; onayli: öğretmenin kendi kaydından (E5) */
export function dersDurumu(d: DersTanimi, k: DersKaydi | undefined, labYildizi = 0, onayli = false): DersDurumuOzeti {
  const anlat = !!k?.anlat?.bitti, dene = !!k?.dene?.bitti;
  const gorevYildiz = d.gorev.tur === "lab" ? labYildizi : k?.gorev?.yildiz ?? 0;
  const gorev = gorevYildiz > 0;
  /* öğretmen, öğrenci "Sınıfta yaptım" demeden de onaylayabilir (işaretlemeyi unutmuş olabilir): onay gerçek robot etkinliğini de bitirir */
  return { anlat, dene, gorevYildiz, gorev, gercek: !!k?.gercek?.ogrenci || onayli, onayli, bitti: anlat && dene && gorev, adim: k?.anlat?.adim ?? 0 };
}

export const XP = { anlat: 10, dene: 10, gorev: 20, yildiz: 10, gercek: 20, onay: 10 } as const;
/** Dersin kazandırdığı deneyim puanı (kayıttan hesaplanır; ayrı puan kaydı yok) */
export function dersXp(s: DersDurumuOzeti): number {
  return (s.anlat ? XP.anlat : 0) + (s.dene ? XP.dene : 0) + (s.gorev ? XP.gorev + s.gorevYildiz * XP.yildiz : 0) + (s.gercek ? XP.gercek : 0) + (s.onayli ? XP.onay : 0);
}
/** Toplam XP'den seviye: her seviye bir öncekinden 50 puan daha fazla ister (100, 150, 200…) */
export function seviyeHesapla(xp: number): { seviye: number; doluluk: number } {
  let s = 1, gereken = 100, kalan = Math.max(0, xp);
  while (kalan >= gereken) { kalan -= gereken; s++; gereken += 50; }
  return { seviye: s, doluluk: kalan / gereken };
}

/* ---------- bölümlerin açılışı ---------- */
export type DersBolumu = "anlat" | "dene" | "gorev" | "gercek";
export const DERS_BOLUMLERI: [DersBolumu, string][] = [["anlat", "Anlat"], ["dene", "Dene"], ["gorev", "Görev"], ["gercek", "Gerçek robotta"]];
/** Hangi bölüm açık: Anlat ve Gerçek robotta her zaman; Dene anlatım bitince; Görev deneme bitince (deney bileşeni henüz yoksa
    deneme atlanabilir, ama ders yine de tamamlanmaz). Öğretmende hepsi açık. */
export function bolumAcik(s: DersDurumuOzeti, b: DersBolumu, o: { ogretmen?: boolean; deneyVar?: boolean } = {}): boolean {
  if (o.ogretmen || b === "anlat" || b === "gercek") return true;
  if (b === "dene") return s.anlat;
  return s.anlat && (s.dene || o.deneyVar === false);
}
/** Ders açılınca gösterilecek bölüm: ilk bitmemiş ve açık olan; hepsi bittiyse Anlat */
export function ilkBolum(s: DersDurumuOzeti, o: { ogretmen?: boolean; deneyVar?: boolean } = {}): DersBolumu {
  const bitmis: Record<DersBolumu, boolean> = { anlat: s.anlat, dene: s.dene, gorev: s.gorev, gercek: s.gercek };
  return (["anlat", "dene", "gorev"] as DersBolumu[]).find((b) => !bitmis[b] && bolumAcik(s, b, o)) ?? "anlat";
}

/* ---------- gerçek robotta: parça adları ---------- */
/** Ders malzemelerinde geçen parçalar (Robot Atölyesi kataloğu G'de bunu genişletir) */
export const PARCALAR: Record<string, string> = {
  siroline: "SiroLine çizgi izleyen robot",
  kenshin: "Kenshin mini sumo robotu",
  rizbot: "RizBot labirent robotu",
  "siyah-elektrik-bandi": "Siyah elektrik bandı",
  "beyaz-a4-kagit": "Beyaz A4 kâğıt",
  "cizgi-pisti": "Sınıfın çizgi pisti (siyah zemin, beyaz bant)",
  "kamerali-telefon": "Kameralı bir telefon ya da tablet",
  "kronometre": "Kronometre (telefonunki de olur)",
  "sumo-ringi": "Mini sumo ringi (77 cm dohyo)",
  "cetvel": "Cetvel ya da şerit metre",
  "mutfak-tartisi": "Mutfak tartısı",
  "karton-kutu": "Küçük karton kutu (yaklaşık 10 cm)",
  "maskeleme-bandi": "Kâğıt bant (yere hücre çizmek için)",
  "karton-duvar": "Karton şerit ya da kitap (labirent duvarı için)",
  "el-feneri": "El feneri (telefonunki de olur)",
  "beyaz-karton": "Beyaz karton",
  "siyah-karton": "Siyah karton",
  "yapiskan-not": "Yapışkan not kâğıdı (bir deste)",
  "renkli-kalem": "Kurşun kalem ve renkli kalem",
  "kagit-labirent": "Yazdırılmış ya da çizilmiş kâğıt labirent"
};
