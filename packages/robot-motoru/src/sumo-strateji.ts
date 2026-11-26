/* Strateji kartları: kod yazmadan Kenshin'e taktik vermek. Her duruma bir hamle seçilir; kartlar bir SumoBeyni'ne
   (ders sayfası) ve aynı davranan Python koduna (Lab'daki lig) çevrilir. Hazır rakipler ve strateji görevinin hesabı da burada.
   Deterministik: aynı kartlar, aynı rakip, aynı tohum → aynı raunt. */
import { DIZILISLER, rauntOyna, RAUNT_SURESI, type Dizilis, type RauntSonucu, type SumoBeyni, type SumoGirdi, type SumoOzellik } from "./sumo";

/** Durumlar, öncelik sırasıyla (üstteki önce bakılır) */
export const DURUMLAR = [
  { k: "kenar-sol", ad: "Kenar solda", aciklama: "Sol zemin sensörü (ya da ikisi birden) beyaz kenarı görüyor." },
  { k: "kenar-sag", ad: "Kenar sağda", aciklama: "Sağ zemin sensörü beyaz kenarı görüyor." },
  { k: "rakip-onde", ad: "Rakip önde", aciklama: "Orta sensör rakibi görüyor." },
  { k: "rakip-solda", ad: "Rakip solda", aciklama: "Sol ön ya da sol yan sensör rakibi görüyor." },
  { k: "rakip-sagda", ad: "Rakip sağda", aciklama: "Sağ ön ya da sağ yan sensör rakibi görüyor." },
  { k: "hicbiri", ad: "Hiçbir şey görmüyorum", aciklama: "Ne rakip ne kenar." }
] as const;
export type Durum = (typeof DURUMLAR)[number]["k"];

export const HAMLELER = {
  "tam-ileri": { ad: "Tam ileri", pwm: [255, 255] },
  "yavas-ileri": { ad: "Yavaş ileri", pwm: [120, 120] },
  "sola-don": { ad: "Yerinde sola dön", pwm: [-170, 170] },
  "saga-don": { ad: "Yerinde sağa dön", pwm: [170, -170] },
  "sola-kavis": { ad: "Sola kavis", pwm: [70, 230] },
  "saga-kavis": { ad: "Sağa kavis", pwm: [230, 70] },
  "geri-sola": { ad: "Geri çekil, sola dön", pwm: [-200, -200] },
  "geri-saga": { ad: "Geri çekil, sağa dön", pwm: [-200, -200] },
  "bekle": { ad: "Bekle", pwm: [0, 0] }
} as const satisfies Record<string, { ad: string; pwm: readonly [number, number] }>;
export type Hamle = keyof typeof HAMLELER;
export type StratejiKartlari = Record<Durum, Hamle>;

/** "Geri çekil ve dön": 250 ms geri, sonra 250 ms yerinde dön (bu sürede başka karta bakılmaz) */
export const GERI_SURESI = 250, DONUS_SURESI = 250;

export const BASLANGIC_KARTLARI: StratejiKartlari = {
  "kenar-sol": "bekle", "kenar-sag": "bekle", "rakip-onde": "bekle", "rakip-solda": "bekle", "rakip-sagda": "bekle", hicbiri: "bekle"
};

export function durumBul(g: SumoGirdi): Durum {
  const [sy, so, o, sgo, sgy] = g.rakip;
  if (g.kenar[0]) return "kenar-sol";
  if (g.kenar[1]) return "kenar-sag";
  if (o) return "rakip-onde";
  if (so || sy) return "rakip-solda";
  if (sgo || sgy) return "rakip-sagda";
  return "hicbiri";
}

/** Kartlardan robot beyni. Her raunt için yeni bir beyin kurulur (geri çekilme sayacı rauntlar arasında taşınmasın). */
export function kartBeyni(k: StratejiKartlari): SumoBeyni {
  let kacisBitis = -1, donusYonu = 0, sonT = -1;
  return (g) => {
    const t = g.zaman;
    if (t < sonT) kacisBitis = -1; // yeni raunt: zaman başa döndü
    sonT = t;
    if (t < kacisBitis) {
      if (t < kacisBitis - DONUS_SURESI) return [-200, -200];
      return donusYonu < 0 ? [-170, 170] : [170, -170];
    }
    const h = k[durumBul(g)];
    if (h === "geri-sola" || h === "geri-saga") {
      kacisBitis = t + GERI_SURESI + DONUS_SURESI;
      donusYonu = h === "geri-sola" ? -1 : 1;
      return [-200, -200];
    }
    const [sol, sag] = HAMLELER[h].pwm;
    return [sol, sag];
  };
}

/** Kartların Lab'daki ligde aynı davranan Python kodu (hamle(robot)) */
export function kartlardanPython(k: StratejiKartlari, ad = "Kartlarla yazılmış robotum"): string {
  const satir = (h: Hamle, girinti: string) => {
    if (h === "geri-sola" || h === "geri-saga")
      return `${girinti}kacis_bitis = t + ${GERI_SURESI + DONUS_SURESI}\n${girinti}donus_yonu = ${h === "geri-sola" ? -1 : 1}\n${girinti}return [-200, -200]`;
    const [sol, sag] = HAMLELER[h].pwm;
    return `${girinti}return [${sol}, ${sag}]`;
  };
  const kosullar: [Durum, string][] = [
    ["kenar-sol", 'robot["kenar"][0] == 1'],
    ["kenar-sag", 'robot["kenar"][1] == 1'],
    ["rakip-onde", "r[2] == 1"],
    ["rakip-solda", "r[1] == 1 or r[0] == 1"],
    ["rakip-sagda", "r[3] == 1 or r[4] == 1"]
  ];
  return `# ${ad}
# Strateji kartlarından üretildi.
# Kenshin her 20 ms'de hamle(robot) çalıştırır.

kacis_bitis = -1   # geri çekil ve dön: bitiş (ms)
donus_yonu = 0     # -1 sola, 1 sağa
son_t = -1         # önceki çağrının zamanı

def hamle(robot):
    global kacis_bitis, donus_yonu, son_t
    t = robot["zaman"]
    if t < son_t:
        kacis_bitis = -1
    son_t = t
    r = robot["rakip"]  # sol yan, sol ön, orta, sağ ön, sağ yan
    if t < kacis_bitis:
        if t < kacis_bitis - ${DONUS_SURESI}:
            return [-200, -200]      # geri çekil
        if donus_yonu < 0:
            return [-170, 170]       # sola dön
        return [170, -170]           # sağa dön
${kosullar.map(([d, kosul], i) => `    ${i ? "elif" : "if"} ${kosul}:   # ${DURUMLAR.find((x) => x.k === d)!.ad}\n${satir(k[d], "        ")}`).join("\n")}
    else:   # Hiçbir şey görmüyorum
${satir(k.hicbiri, "        ")}
`;
}

/* ---------- hazır rakipler ---------- */
export const HAZIR_RAKIPLER = {
  bekleyen: {
    ad: "Bekleyen", aciklama: "Hiç kıpırdamaz; ringin ortasında bir kutu gibi durur.",
    kartlar: { "kenar-sol": "bekle", "kenar-sag": "bekle", "rakip-onde": "bekle", "rakip-solda": "bekle", "rakip-sagda": "bekle", hicbiri: "bekle" }
  },
  arayan: {
    ad: "Dönerek arayan", aciklama: "Yerinde dönerek arar; görünce üstüne yürür, kenarı görünce geri çekilir.",
    kartlar: { "kenar-sol": "geri-saga", "kenar-sag": "geri-sola", "rakip-onde": "tam-ileri", "rakip-solda": "sola-don", "rakip-sagda": "saga-don", hicbiri: "saga-don" }
  },
  saldiran: {
    ad: "Saldıran", aciklama: "Ringde ileri gider; rakibi gördüğü an tam güçle saldırır.",
    kartlar: { "kenar-sol": "geri-saga", "kenar-sag": "geri-sola", "rakip-onde": "tam-ileri", "rakip-solda": "sola-kavis", "rakip-sagda": "saga-kavis", hicbiri: "yavas-ileri" }
  },
  kacan: {
    ad: "Kaçan", aciklama: "Rakibi görünce yana kaçar, kenardan uzak durmaya çalışır.",
    kartlar: { "kenar-sol": "geri-saga", "kenar-sag": "geri-sola", "rakip-onde": "saga-kavis", "rakip-solda": "saga-kavis", "rakip-sagda": "sola-kavis", hicbiri: "yavas-ileri" }
  }
} as const satisfies Record<string, { ad: string; aciklama: string; kartlar: StratejiKartlari }>;
export type HazirRakip = keyof typeof HAZIR_RAKIPLER;

/* ---------- strateji görevi ---------- */
/** "kalmak": düşmediğin her raunt bir yıldız; "yenmek": rakibi düşürdüğün her raunt bir yıldız;
    "mac": her rakibe karşı üç rauntluk maç, kazandığın her maç bir yıldız */
export type StratejiOlcutu = "kalmak" | "yenmek" | "mac";
export interface StratejiDegerlendirme {
  olcut: StratejiOlcutu; rakipler: HazirRakip[];
  /** rakibin özellikleri (ör. daha ağır ya da daha iyi tutunan rakip); verilmezse Kenshin */
  rakipOzellik?: Partial<SumoOzellik>;
}
/** MEB kuralı: raunt başladıktan sonra hareket etmeyen robot raundu kaybeder. Simülasyonda: tekerleklerin toplam yolu bu kadarın altındaysa. */
export const HAREKET_ESIGI = 50;
export const hareketEtti = (s: RauntSonucu, i: 0 | 1) => { const r = s.kareler[s.kareler.length - 1].robotlar[i]; return Math.abs(r.solYol) + Math.abs(r.sagYol) >= HAREKET_ESIGI; };
export interface StratejiRauntu { rakip: HazirRakip; dizilis: Dizilis; sonuc: RauntSonucu; iyi: boolean }
export const STRATEJI_TOHUMU = 11;

/** Kartları rakiplere karşı oynatır; yıldız ve oynanan rauntlar */
export function stratejiDegerlendir(k: StratejiKartlari, d: StratejiDegerlendirme): { yildiz: number; rauntlar: StratejiRauntu[] } {
  const rauntlar: StratejiRauntu[] = [];
  if (d.olcut === "mac") {
    /* sumoMaci ile aynı kural: en fazla 3 raunt, iki raundu alan kazanır */
    let yildiz = 0;
    d.rakipler.forEach((r, i) => {
      const puan = [0, 0];
      for (let j = 0; j < 3 && puan[0] < 2 && puan[1] < 2; j++) {
        const sonuc = rauntOyna([kartBeyni(k), kartBeyni(HAZIR_RAKIPLER[r].kartlar)], DIZILISLER[j], (STRATEJI_TOHUMU + i) * 7 + j, RAUNT_SURESI, [{}, d.rakipOzellik ?? {}]);
        if (sonuc.kazanan !== null) puan[sonuc.kazanan]++;
        rauntlar.push({ rakip: r, dizilis: DIZILISLER[j], sonuc, iyi: sonuc.kazanan === 0 });
      }
      if (puan[0] > puan[1]) yildiz++;
    });
    return { yildiz: Math.min(3, yildiz), rauntlar };
  }
  const r = d.rakipler[0];
  DIZILISLER.forEach((diz, i) => {
    const sonuc = rauntOyna([kartBeyni(k), kartBeyni(HAZIR_RAKIPLER[r].kartlar)], diz, STRATEJI_TOHUMU * 7 + i, RAUNT_SURESI, [{}, d.rakipOzellik ?? {}]);
    const iyi = d.olcut === "kalmak" ? sonuc.kazanan !== 1 && hareketEtti(sonuc, 0) : sonuc.kazanan === 0;
    rauntlar.push({ rakip: r, dizilis: diz, sonuc, iyi });
  });
  return { yildiz: rauntlar.filter((x) => x.iyi).length, rauntlar };
}
