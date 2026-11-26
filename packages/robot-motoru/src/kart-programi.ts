/* İlkokul kart programı: çocuk kartlara dokunarak program dizer; program Kar Küreme şehrinde koşar.
   Kartlar: ileri, sağa dön, sola dön, tekrarla (n kez), eğer (koşul) / değilse, sürece (koşul).
   Kar Küreme motoru (kar-kureme.ts) değişmez; enerji kuralları aynıdır. kartProgramiPython() aynı programın Python karşılığını
   verir: Lab'daki Python köprüsünde aynı izi üretir (testle). */
import { KarKureme, RobotDurdu, type DurmaSebebi } from "./kar-kureme";
import type { Yon } from "./izgara";

export type Kosul = "onu-kapali" | "onu-acik" | "kar-var";
export type Kart =
  | { tur: "ileri" }
  | { tur: "sag" }
  | { tur: "sol" }
  | { tur: "tekrarla"; kez: number; ic: Kart[] }
  | { tur: "eger"; kosul: Kosul; ic: Kart[]; degilse: Kart[] }
  | { tur: "surece"; kosul: Kosul; ic: Kart[] };
export type KartTuru = Kart["tur"];

export const KART_ADLARI: Record<KartTuru, string> = {
  ileri: "İleri git", sag: "Sağa dön", sol: "Sola dön", tekrarla: "Tekrarla", eger: "Eğer", surece: "Sürece tekrarla"
};
export const KOSUL_ADLARI: Record<Kosul, string> = { "onu-kapali": "önü kapalıysa", "onu-acik": "önü açıksa", "kar-var": "önünde kar varsa" };
/** sürece kartında koşul "… olduğu sürece" diye okunur */
export const SURECE_ADLARI: Record<Kosul, string> = { "onu-kapali": "önü kapalı olduğu sürece", "onu-acik": "önü açık olduğu sürece", "kar-var": "önünde kar olduğu sürece" };
export const TEKRAR_SINIRI = { en: 2, ust: 9 } as const;
/** kart değerlendirme sınırı: içi boş "sürece" gibi sonsuz döngüleri durdurur */
export const DEGERLENDIRME_SINIRI = 3000;

/** Programdaki kart sayısı (iç içe kartlar dahil) */
export function kartSay(p: readonly Kart[]): number {
  return p.reduce((t, k) => t + 1 + ("ic" in k ? kartSay(k.ic) : 0) + (k.tur === "eger" ? kartSay(k.degilse) : 0), 0);
}
/** Programda bu türden kart var mı */
export function kartVar(p: readonly Kart[], tur: KartTuru): boolean {
  return p.some((k) => k.tur === tur || ("ic" in k && kartVar(k.ic, tur)) || (k.tur === "eger" && kartVar(k.degilse, tur)));
}

export type KartSonu = DurmaSebebi | "sonsuz";
export interface KartKosusu {
  sim: KarKureme;
  /** her eylemde (ileri, dön) ya da koşul sorulduğunda çalışan kart ve o anki iz uzunluğu */
  akis: { kart: Kart; iz: number; kosul?: boolean }[];
  durdu: KartSonu | null;
}
class Sonsuz extends Error {}
const kosulBak = (sim: KarKureme, k: Kosul) => (k === "onu-kapali" ? !sim.onuAcik() : k === "onu-acik" ? sim.onuAcik() : sim.onundeKarVar());

export function kartCalistir(harita: readonly string[], yon: Yon, batarya: number, program: readonly Kart[]): KartKosusu {
  const sim = new KarKureme(harita, yon, batarya);
  const akis: KartKosusu["akis"] = [];
  let sayac = 0;
  const say = () => { if (++sayac > DEGERLENDIRME_SINIRI) throw new Sonsuz(); };
  const kos = (liste: readonly Kart[]) => {
    for (const k of liste) {
      say();
      switch (k.tur) {
        case "ileri": sim.ileri(); akis.push({ kart: k, iz: sim.iz.length }); break;
        case "sag": sim.sagaDon(); akis.push({ kart: k, iz: sim.iz.length }); break;
        case "sol": sim.solaDon(); akis.push({ kart: k, iz: sim.iz.length }); break;
        case "tekrarla": for (let i = 0; i < k.kez; i++) { say(); kos(k.ic); } break;
        case "eger": { const c = kosulBak(sim, k.kosul); akis.push({ kart: k, iz: sim.iz.length, kosul: c }); kos(c ? k.ic : k.degilse); break; }
        case "surece": for (;;) { const c = kosulBak(sim, k.kosul); akis.push({ kart: k, iz: sim.iz.length, kosul: c }); if (!c) break; say(); kos(k.ic); } break;
      }
    }
  };
  let durdu: KartSonu | null = null;
  try { kos(program); } catch (e) {
    if (e instanceof RobotDurdu) durdu = e.sebep;
    else if (e instanceof Sonsuz) durdu = "sonsuz";
    else throw e;
  }
  return { sim, akis, durdu };
}

/** Aynı programın Python karşılığı (Lab'daki Kar Küreme komutlarıyla) */
export function kartProgramiPython(p: readonly Kart[]): string {
  const satirlar: string[] = [];
  const kosulPy = (k: Kosul) => (k === "onu-kapali" ? "not onu_acik()" : k === "onu-acik" ? "onu_acik()" : "onunde_kar_var()");
  const yaz = (liste: readonly Kart[], g: string, derin: number) => {
    if (!liste.length) { satirlar.push(g + "pass"); return; }
    for (const k of liste) {
      if (k.tur === "ileri") satirlar.push(g + "ileri()");
      else if (k.tur === "sag") satirlar.push(g + "saga_don()");
      else if (k.tur === "sol") satirlar.push(g + "sola_don()");
      else if (k.tur === "tekrarla") { satirlar.push(`${g}for ${"ijkmn"[derin % 5]} in range(${k.kez}):`); yaz(k.ic, g + "    ", derin + 1); }
      else if (k.tur === "eger") {
        satirlar.push(`${g}if ${kosulPy(k.kosul)}:`); yaz(k.ic, g + "    ", derin);
        if (k.degilse.length) { satirlar.push(g + "else:"); yaz(k.degilse, g + "    ", derin); }
      } else { satirlar.push(`${g}while ${kosulPy(k.kosul)}:`); yaz(k.ic, g + "    ", derin); }
    }
  };
  yaz(p, "", 0);
  return satirlar.join("\n") + "\n";
}

/* ---------- kart görevleri ---------- */
export interface KartGorevi {
  kimlik: string;
  /** program hepsinde çalışmalı; ilk harita ekranda gösterilir */
  haritalar: string[][];
  yon: Yon;
  batarya: number;
  /** palette görünen kartlar */
  kartlar: KartTuru[];
  /** 2. yıldız: ilk haritada harcanan enerji en çok bu kadar */
  enerjiSiniri: number;
  /** 3. yıldız: kart sayısı en çok bu kadar */
  enAzKart: number;
  /** testte üç yıldız alan örnek program */
  cozum: Kart[];
}
const I: Kart = { tur: "ileri" }, SAG: Kart = { tur: "sag" }, SOL: Kart = { tur: "sol" };
const tekrar = (kez: number, ...ic: Kart[]): Kart => ({ tur: "tekrarla", kez, ic });

export const KART_GOREVLERI: Record<string, KartGorevi> = {
  /* 1 · motor ve tekerlek: düz sokak, yalnız ileri */
  "mb-duz-sokak": {
    kimlik: "mb-duz-sokak", haritalar: [["#########", "#R......#", "#########"]], yon: 1, batarya: 30,
    kartlar: ["ileri"], enerjiSiniri: 12, enAzKart: 6, cozum: [I, I, I, I, I, I]
  },
  /* 2 · dönmek: iki köşeli sokak */
  "mb-koseler": {
    kimlik: "mb-koseler", haritalar: [["########", "#R..####", "###.####", "###....#", "########"]], yon: 1, batarya: 30,
    kartlar: ["ileri", "sag", "sol"], enerjiSiniri: 14, enAzKart: 9, cozum: [I, I, SAG, I, I, SOL, I, I, I]
  },
  /* 4 · eğer–değilse: aynı program iki sokakta; köşede önü kapanınca sağa döner */
  "mb-eger": {
    kimlik: "mb-eger", haritalar: [["#######", "#R....#", "#####.#", "#####.#", "#######"], ["#####", "#R..#", "###.#", "###.#", "###.#", "#####"]], yon: 1, batarya: 30,
    kartlar: ["ileri", "sag", "sol", "tekrarla", "eger"], enerjiSiniri: 12, enAzKart: 4,
    cozum: [tekrar(7, { tur: "eger", kosul: "onu-kapali", ic: [SAG], degilse: [I] })]
  },
  /* 5 · döngü ve sensör: uzunlukları farklı iki sokak, tek program */
  "mb-surece": {
    kimlik: "mb-surece", haritalar: [["#######", "#R...##", "####.##", "####.##", "####.##", "#######"], ["#########", "#R......#", "#######.#", "#########"]], yon: 1, batarya: 40,
    kartlar: ["ileri", "sag", "sol", "tekrarla", "surece"], enerjiSiniri: 12, enAzKart: 5,
    cozum: [{ tur: "surece", kosul: "onu-acik", ic: [I] }, SAG, { tur: "surece", kosul: "onu-acik", ic: [I] }]
  },
  /* 6 · enerji: batarya caddeye yetmez; ortadaki şarj istasyonuna uğra */
  "mb-sarj": {
    kimlik: "mb-sarj", haritalar: [["############", "#R.........#", "#####S######", "############"]], yon: 1, batarya: 14,
    kartlar: ["ileri", "sag", "sol", "tekrarla"], enerjiSiniri: 24, enAzKart: 10,
    cozum: [tekrar(4, I), SAG, I, tekrar(2, SOL), I, SAG, tekrar(5, I)]
  }
};
export interface KartSonucu {
  basarili: boolean;
  sebep?: KartSonu | "kar_kaldi";
  kalanKar: number;
  harcanan: number;
  kart: number;
  yildiz: 0 | 1 | 2 | 3;
  kosular: KartKosusu[];
}
export function kartDegerlendir(g: Pick<KartGorevi, "haritalar" | "yon" | "batarya" | "enerjiSiniri" | "enAzKart">, program: readonly Kart[]): KartSonucu {
  const kosular = g.haritalar.map((h) => kartCalistir(h, g.yon, g.batarya, program));
  const sebep = kosular.find((k) => k.durdu)?.durdu ?? (kosular.some((k) => k.sim.izgara.kalanKar() > 0) ? "kar_kaldi" : undefined);
  const basarili = !sebep, kart = kartSay(program), harcanan = kosular[0].sim.harcanan;
  const yildiz = (basarili ? 1 + Number(harcanan <= g.enerjiSiniri) + Number(kart <= g.enAzKart) : 0) as 0 | 1 | 2 | 3;
  return { basarili, sebep, kalanKar: kosular.reduce((t, k) => t + k.sim.izgara.kalanKar(), 0), harcanan, kart, yildiz, kosular };
}
export const KART_HATA_YAZILARI: Record<NonNullable<KartSonucu["sebep"]>, string> = {
  carpma: "Robot bir binaya çarptı. Dönmeyi unuttun mu?",
  batarya: "Batarya bitti! Şarj istasyonuna uğramak gerekiyor.",
  cok_adim: "Robot çok uzun yürüdü ve durdu.",
  sonsuz: "Program hiç bitmiyor: döngünün içi robotu hiç değiştirmiyor.",
  kar_kaldi: "Program bitti ama sokakta hâlâ kar var."
};

/* ---------- harita tasarımcısı ---------- */
/** Tasarım ızgarası: 9 × 7; kenarlar her zaman bina */
export const TASARIM = { genislik: 9, yukseklik: 7 } as const;
/** Haritayı kısa koda çevirir: iç hücreler 4'lük tabanda paketlenir; "1-" sürüm öneki */
export function haritaKodla(harita: readonly string[]): string {
  /* hücre değerleri: 0 bina, 1 karlı yol, 2 temiz yol (robotun hücresi de), 3 şarj istasyonu; robotun yeri ayrıca yazılır */
  const hucreler: number[] = [];
  for (let y = 1; y < TASARIM.yukseklik - 1; y++) for (let x = 1; x < TASARIM.genislik - 1; x++) {
    const c = harita[y]?.[x] ?? "#";
    hucreler.push(c === "." ? 1 : c === "S" ? 3 : c === "#" ? 0 : 2);
  }
  const r = harita.findIndex((s) => s.includes("R"));
  const rx = r >= 0 ? harita[r].indexOf("R") : 1;
  let s = "";
  for (let i = 0; i < hucreler.length; i += 2) s += "0123456789abcdef"[hucreler[i] * 4 + (hucreler[i + 1] ?? 0)];
  return `1-${rx}${Math.max(r, 1)}-${s}`;
}
/** Kodu haritaya çevirir; bozuk kodda null */
export function haritaCoz(kod: string): string[] | null {
  const m = /^1-([1-7])([1-5])-([0-9a-f]+)$/.exec(kod.trim().toLowerCase());
  const icSayi = (TASARIM.genislik - 2) * (TASARIM.yukseklik - 2);
  if (!m || m[3].length !== Math.ceil(icSayi / 2)) return null;
  const hucreler: number[] = [];
  for (const h of m[3]) { const v = parseInt(h, 16); hucreler.push(v >> 2, v & 3); }
  const rx = +m[1], ry = +m[2];
  const satirlar: string[] = [];
  for (let y = 0; y < TASARIM.yukseklik; y++) {
    let s = "";
    for (let x = 0; x < TASARIM.genislik; x++) {
      if (x === 0 || y === 0 || x === TASARIM.genislik - 1 || y === TASARIM.yukseklik - 1) { s += "#"; continue; }
      if (x === rx && y === ry) { s += "R"; continue; }
      const v = hucreler[(y - 1) * (TASARIM.genislik - 2) + (x - 1)];
      s += "#. S"[v];
    }
    satirlar.push(s);
  }
  return satirlar;
}
/** Boş tasarım: ortası temiz yol, robot sol üstte */
export function bosTasarim(): string[] {
  return Array.from({ length: TASARIM.yukseklik }, (_, y) => Array.from({ length: TASARIM.genislik }, (_, x) =>
    x === 0 || y === 0 || x === TASARIM.genislik - 1 || y === TASARIM.yukseklik - 1 ? "#" : x === 1 && y === 1 ? "R" : " ").join(""));
}
/** Tasarım görevi: kendi haritanı kartlarla temizle. 1 yıldız: en az 4 karlı kare temizlendi; 2: en az 8; 3: tekrarla, eğer ya da sürece kartı da kullanıldı. */
export const TASARIM_PILI = 40;
export function tasarimYildizi(harita: readonly string[], program: readonly Kart[]): { yildiz: 0 | 1 | 2 | 3; kar: number; sonuc: KartSonucu } {
  const kar = harita.join("").split(".").length - 1;
  const sonuc = kartDegerlendir({ haritalar: [harita as string[]], yon: 1, batarya: TASARIM_PILI, enerjiSiniri: Infinity, enAzKart: Infinity }, program);
  if (!sonuc.basarili || kar < 4) return { yildiz: 0, kar, sonuc };
  const dongu = kartVar(program, "tekrarla") || kartVar(program, "eger") || kartVar(program, "surece");
  return { yildiz: (kar >= 8 ? (dongu ? 3 : 2) : 1) as 1 | 2 | 3, kar, sonuc };
}
