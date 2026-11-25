/* Ortak ses servisi: tarayıcının kendi Türkçe sesiyle (internetsiz, ücretsiz) metin okur.
   - Türkçe ses yoksa sessiz kalır; metin her zaman ekrandadır, ses düğmesi gizlenir.
   - Okurken söylenen kelimeyi bildirir (kelime vurgusu); ses motoru kelime sınırı bildirmiyorsa vurgu olmaz, okuma sürer.
   - Ayarlar (açık/kapalı, hız) tarayıcıda hatırlanır. Ses motoru dışarıdan verilebilir (testlerde sahte motor). */

export type SesHizi = "yavas" | "normal";
export interface SesAyari { acik: boolean; hiz: SesHizi }

/** Web Speech API'nin kullandığımız parçası */
export interface SesMotoru {
  sesler(): { lang: string; name: string }[];
  konus(metin: string, ayar: { ses: { lang: string; name: string }; hiz: number; perde: number }, olay: { kelime: (karakter: number) => void; bitti: () => void }): void;
  sustur(): void;
  seslerDegisince(f: () => void): void;
}

/** Tarayıcının Web Speech API'si; yoksa null */
export function tarayiciMotoru(): SesMotoru | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const s = window.speechSynthesis;
  return {
    sesler: () => s.getVoices(),
    konus(metin, ayar, olay) {
      const u = new SpeechSynthesisUtterance(metin);
      u.voice = ayar.ses as SpeechSynthesisVoice; u.lang = ayar.ses.lang; u.rate = ayar.hiz; u.pitch = ayar.perde;
      u.onboundary = (e) => { if (e.name === "word" || e.name === undefined) olay.kelime(e.charIndex); };
      u.onend = () => olay.bitti(); u.onerror = () => olay.bitti();
      s.speak(u);
    },
    sustur: () => s.cancel(),
    seslerDegisince: (f) => s.addEventListener?.("voiceschanged", f)
  };
}

/** Metnin kelimeleri ve her kelimenin başladığı karakter */
export function kelimeler(metin: string): { kelime: string; bas: number }[] {
  const r: { kelime: string; bas: number }[] = [];
  for (const m of metin.matchAll(/\S+/g)) r.push({ kelime: m[0], bas: m.index! });
  return r;
}
/** karakter konumundan kelime sırası (sınır olayı kelimenin başını ya da içini gösterebilir) */
export function kelimeSirasi(k: { bas: number }[], karakter: number): number {
  let i = -1;
  for (let j = 0; j < k.length && k[j].bas <= karakter; j++) i = j;
  return Math.max(0, i);
}

/** Okul öncesinde ses açıksa yönerge kendiliğinden okunur; diğer seviyelerde düğmeyle */
export const kendiligindenOkunsunMu = (seviye: string | undefined, acik: boolean) => acik && seviye === "okul-oncesi";

const HIZ: Record<SesHizi, number> = { yavas: 0.75, normal: 0.92 };
type Depo = Pick<Storage, "getItem" | "setItem">;

export class SesServisi {
  private ses: { lang: string; name: string } | null = null;
  private dinleyiciler = new Set<() => void>();
  private surum = 0;
  /** şu an okunan metnin numarası; yoksa 0 */
  okunan = 0;

  constructor(private motor: SesMotoru | null, private depo: Depo | null, private anahtar = "sra-ses") {
    this.sesBul();
    motor?.seslerDegisince(() => { this.sesBul(); this.bildir(); });
  }
  private sesBul() { this.ses = this.motor?.sesler().find((v) => v.lang?.toLowerCase().startsWith("tr")) ?? null; }
  private bildir() { this.dinleyiciler.forEach((f) => f()); }

  /** Türkçe ses var mı (yoksa ses düğmeleri gizlenir) */
  get var(): boolean { return !!this.ses; }

  get ayar(): SesAyari {
    try {
      const h = this.depo?.getItem(this.anahtar);
      if (h === "kapali") return { acik: false, hiz: "normal" };          // eski Blok biçimi
      if (h === "acik" || !h) return { acik: true, hiz: "normal" };
      const v = JSON.parse(h);
      return { acik: v.acik !== false, hiz: v.hiz === "yavas" ? "yavas" : "normal" };
    } catch { return { acik: true, hiz: "normal" }; }
  }
  set ayar(a: SesAyari) {
    try { this.depo?.setItem(this.anahtar, JSON.stringify(a)); } catch { /* depolama kapalı: yalnız bu ziyaret */ }
    if (!a.acik) this.durdur();
    this.bildir();
  }
  get acik() { return this.ayar.acik; }
  set acik(v: boolean) { this.ayar = { ...this.ayar, acik: v }; }

  /** Metni okur. zorla: ses kapalıyken de (kullanıcı "Dinle"ye bastıysa). Dönen numara: bu okumanın kimliği; ses yoksa 0. */
  oku(metin: string, o: { zorla?: boolean; kelime?: (sira: number) => void; bitti?: () => void } = {}): number {
    const a = this.ayar;
    if (!this.motor || !this.ses || (!a.acik && !o.zorla)) return 0;
    this.motor.sustur();
    const no = ++this.surum;
    this.okunan = no;
    const k = kelimeler(metin);
    this.motor.konus(metin, { ses: this.ses, hiz: HIZ[a.hiz], perde: 1.05 }, {
      kelime: (c) => { if (this.okunan === no) o.kelime?.(kelimeSirasi(k, c)); },
      bitti: () => { if (this.okunan === no) { this.okunan = 0; o.bitti?.(); this.bildir(); } }
    });
    this.bildir();
    return no;
  }
  durdur() {
    if (!this.okunan) return;
    this.okunan = 0;
    this.motor?.sustur();
    this.bildir();
  }
  degisince(f: () => void) { this.dinleyiciler.add(f); return () => { this.dinleyiciler.delete(f); }; }
}

let ortak: SesServisi | null = null;
/** Sayfanın ortak ses servisi (tarayıcı motoru, platform ayarı) */
export function sesServisi(): SesServisi {
  if (!ortak) { let d: Depo | null = null; try { d = localStorage; } catch { /* kapalı */ } ortak = new SesServisi(tarayiciMotoru(), d); }
  return ortak;
}
