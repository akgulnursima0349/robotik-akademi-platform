/* İlkokul · Robot görevleri (mBot) modülünün çizimleri ve çizimli adımların metinleri.
   Metinler 1–4. sınıf için kısa cümlelerle; her adım sesli okunur. */
import type { Cizim, CizimRengi, Katman, Sekil } from "./gorseller";
import { kelime } from "./gorseller-labirent";

export const MBOT_METINLERI = {
  tekerTur: "Motor tekeri çevirir. Teker bir tur dönünce robot, tekerin çevresi kadar yol gider.",
  buyukTeker: "Büyük teker bir turda daha uzağa gider. Küçük teker daha az yol alır.",
  ikiTeker: "mBot'un iki tekeri var. İkisi aynı hızda dönerse robot düz gider. Biri yavaş dönerse robot o yana döner.",
  yerindeDon: "Bir teker ileri, öteki geri dönerse ne olur? Robot yerinde döner, hiç ilerlemez.",
  sensorler: "Sensör, robotun gözü gibidir. mBot'un üstünde ışık sensörü, altında çizgi sensörü, önünde mesafe sensörü var.",
  yanki: "Mesafe sensörü ses gibi bir dalga yollar. Dalga duvara çarpar ve geri gelir. Ne kadar çabuk gelirse duvar o kadar yakındır.",
  eger: "Robot karar verebilir. Eğer önü kapalıysa sağa döner. Değilse ileri gider.",
  surece: "Kaç adım gideceğini bilmiyorsan sürece kartını kullan. Önü açık olduğu sürece ileri git. Önü kapanınca robot durur.",
  enerji: "Robotun bataryası var. Karlı kare 2 enerji, temiz kare 1 enerji harcar. Şarj istasyonu bataryayı doldurur.",
  ikiGoz: "mBot'un altında iki göz var. İkisi de siyah çizgiyi görürse düz gider. Sol göz beyaza çıkarsa sağa döner. Sağ göz beyaza çıkarsa sola döner.",
  tasarim: "Şimdi sıra sende! Binaları, karlı sokakları ve şarj istasyonunu sen yerleştir. Sonra robotu kartlarla programla."
} as const;
type MetinAdi = keyof typeof MBOT_METINLERI;

const yazici = (ad: MetinAdi) => (sekil: Sekil, renk: CizimRengi, soz?: string): Katman => ({ sekil, renk, ...(soz ? { kelime: kelime(MBOT_METINLERI[ad], soz) } : {}) });
const kutu = (x: number, y: number, g: number, y2: number, dolgu?: CizimRengi, kose = 4): Sekil => ({ tur: "kutu", x, y, g, y2, dolgu, kose });
const cizgi = (...n: [number, number][]): Sekil => ({ tur: "cizgi", noktalar: n });
const ok = (...n: [number, number][]): Sekil => ({ tur: "ok", noktalar: n });
const yaz = (x: number, y: number, metin: string, hiza: "sol" | "orta" | "sag" = "sol"): Sekil => ({ tur: "etiket", x, y, metin, hiza });
const daire = (x: number, y: number, r: number, dolgu?: CizimRengi): Sekil => ({ tur: "daire", x, y, r, dolgu });
/** üstten mBot (x, y ortası; yukarı bakar) */
const robotUstten = (k: ReturnType<typeof yazici>, x: number, y: number, soz: string, renk: CizimRengi = "mor"): Katman[] => [
  k(kutu(x - 24, y - 16, 10, 34, "siyah", 3), "siyah", soz), k(kutu(x + 14, y - 16, 10, 34, "siyah", 3), "siyah", soz),
  k(kutu(x - 16, y - 26, 32, 50, renk, 6), renk, soz), k(daire(x - 7, y - 28, 5, "gri"), "gri", soz), k(daire(x + 7, y - 28, 5, "gri"), "gri", soz)
];

export const MBOT_CIZIMLERI: Record<string, Cizim> = {
  "teker-cevresi": (() => {
    const k = yazici("tekerTur");
    return {
      aciklama: "Bir teker ve altında düz bir çizgi: teker bir tur dönünce çevresi yere açılıyor; gidilen yol çevresi kadar.",
      katmanlar: [
        k(daire(90, 120, 50, "siyah"), "siyah", "Motor"), k(daire(90, 120, 30, "gri"), "gri", "Motor"), k(daire(90, 74, 6, "kirmizi"), "kirmizi", "tekeri"),
        k(cizgi([30, 176], [380, 176]), "murekkep", "tur"),
        k(ok([90, 200], [404 - 90, 200]), "mor", "yol"),
        k(daire(404 - 90, 120, 50, "siyah"), "siyah", "gider."), k(daire(404 - 90, 120, 30, "gri"), "gri", "gider."), k(daire(404 - 90, 74, 6, "kirmizi"), "kirmizi", "gider."),
        k(yaz(202, 232, "1 tur = tekerin çevresi", "orta"), "mor", "çevresi")
      ]
    };
  })(),
  "buyuk-kucuk-teker": (() => {
    const k = yazici("buyukTeker");
    return {
      aciklama: "Üstte büyük teker uzun bir ok kadar, altta küçük teker kısa bir ok kadar yol alıyor; ikisi de bir tur döndü.",
      katmanlar: [
        k(daire(60, 70, 40, "siyah"), "siyah", "Büyük"), k(daire(60, 70, 22, "gri"), "gri", "Büyük"),
        k(ok([110, 70], [370, 70]), "mor", "uzağa"), k(yaz(240, 52, "uzun yol", "orta"), "mor", "uzağa"),
        k(daire(60, 190, 22, "siyah"), "siyah", "Küçük"), k(daire(60, 190, 12, "gri"), "gri", "Küçük"),
        k(ok([92, 190], [210, 190]), "sari", "az"), k(yaz(150, 172, "kısa yol", "orta"), "sari", "az"),
        k(yaz(300, 200, "ikisi de 1 tur"), "murekkep", "yol")
      ]
    };
  })(),
  "iki-teker-hizlari": (() => {
    const k = yazici("ikiTeker");
    return {
      aciklama: "İki robot yan yana: solda iki teker aynı hızda, robot düz gidiyor; sağda sağ teker yavaş, robot sağa doğru dönüyor.",
      katmanlar: [
        ...robotUstten(k, 110, 180, "iki"),
        k(ok([110, 140], [110, 40]), "yesil", "aynı"), k(yaz(110, 236, "aynı hız: düz", "orta"), "yesil", "düz"),
        ...robotUstten(k, 290, 180, "Biri"),
        k(ok([290, 140], [300, 90], [340, 60]), "sari", "yavaş"),
        k(yaz(290, 236, "sağ teker yavaş: sağa döner", "orta"), "sari", "yana")
      ]
    };
  })(),
  "yerinde-donus": (() => {
    const k = yazici("yerindeDon");
    return {
      aciklama: "Üstten mBot: sol tekerde ileri oku, sağ tekerde geri oku; robotun çevresinde dönme oku.",
      katmanlar: [
        ...robotUstten(k, 200, 130, "Bir"),
        k(ok([171, 150], [171, 90]), "yesil", "ileri,"), k(yaz(140, 80, "ileri", "sag"), "yesil", "ileri,"),
        k(ok([229, 110], [229, 170]), "kirmizi", "geri"), k(yaz(262, 186, "geri"), "kirmizi", "geri"),
        k(ok([270, 70], [300, 120], [280, 180]), "mor", "yerinde"), k(yaz(200, 240, "yerinde döner", "orta"), "mor", "yerinde")
      ]
    };
  })(),
  "mbot-sensorleri": (() => {
    const k = yazici("sensorler");
    return {
      aciklama: "Yandan mBot: üstte ışık sensörü (güneş), altta çizgi sensörü (aşağı bakan göz), önde mesafe sensörü (iki göz).",
      katmanlar: [
        k(kutu(80, 110, 200, 60, "mor", 10), "mor", "Sensör"),
        k(daire(130, 180, 30, "siyah"), "siyah", "Sensör"), k(daire(130, 180, 14, "gri"), "gri", "Sensör"),
        k(daire(250, 175, 8, "gri"), "gri", "Sensör"),
        k(daire(200, 104, 8, "sari"), "sari", "ışık"), k(yaz(200, 70, "ışık sensörü", "orta"), "sari", "ışık"),
        k(kutu(240, 170, 30, 8, "mavi", 2), "mavi", "çizgi"), k(ok([255, 182], [255, 214]), "mavi", "çizgi"), k(yaz(200, 240, "çizgi sensörü", "sag"), "mavi", "çizgi"),
        k(kutu(282, 92, 12, 48, "mavi", 2), "mavi", "mesafe"), k(daire(300, 104, 9, "gri"), "gri", "mesafe"), k(daire(300, 128, 9, "gri"), "gri", "mesafe"),
        k(yaz(320, 80, "mesafe"), "mavi", "mesafe"), k(yaz(320, 100, "sensörü"), "mavi", "mesafe")
      ]
    };
  })(),
  "ultrasonik-yanki": (() => {
    const k = yazici("yanki");
    return {
      aciklama: "Solda mBot, sağda duvar; robottan duvara giden dalga oku ve duvardan robota geri dönen dalga oku.",
      katmanlar: [
        k(kutu(30, 110, 110, 50, "mor", 10), "mor", "Mesafe"), k(daire(150, 122, 9, "gri"), "gri", "Mesafe"), k(daire(150, 148, 9, "gri"), "gri", "Mesafe"),
        k(kutu(330, 40, 30, 190, "kahve", 4), "kahve", "duvara"),
        k({ tur: "isin", bas: [162, 122], son: [328, 122] }, "mavi", "yollar."),
        k({ tur: "isin", bas: [328, 148], son: [162, 148] }, "mavi", "geri"),
        k(yaz(245, 104, "gider", "orta"), "mavi", "yollar."), k(yaz(245, 178, "geri gelir", "orta"), "mavi", "geri"),
        k(yaz(200, 234, "çabuk gelirse: duvar yakın", "orta"), "kirmizi", "yakındır.")
      ]
    };
  })(),
  "eger-degilse": (() => {
    const k = yazici("eger");
    return {
      aciklama: "Karar şeması: ortada 'Önü kapalı mı?' sorusu; 'Evet' okuyla sağa dön kutusu, 'Hayır' okuyla ileri git kutusu.",
      katmanlar: [
        k(kutu(130, 20, 140, 60, "yesil", 30), "yesil", "karar"), k(yaz(200, 56, "Önü kapalı mı?", "orta"), "beyaz", "karar"),
        k(ok([160, 80], [90, 150]), "murekkep", "Eğer"), k(yaz(108, 112, "evet", "sag"), "murekkep", "Eğer"),
        k(kutu(20, 150, 140, 56, "mavi", 12), "mavi", "sağa"), k(yaz(90, 184, "↱ sağa dön", "orta"), "beyaz", "sağa"),
        k(ok([240, 80], [310, 150]), "murekkep", "Değilse"), k(yaz(292, 112, "hayır"), "murekkep", "Değilse"),
        k(kutu(240, 150, 140, 56, "mor", 12), "mor", "ileri"), k(yaz(310, 184, "↑ ileri git", "orta"), "beyaz", "ileri")
      ]
    };
  })(),
  "surece-dongu": (() => {
    const k = yazici("surece");
    return {
      aciklama: "Döngü şeması: 'Önü açık mı?' sorusundan 'evet' ile 'ileri git'e, oradan yeniden soruya dönen ok; 'hayır' ile 'dur'.",
      katmanlar: [
        k(kutu(120, 20, 160, 60, "kirmizi", 30), "kirmizi", "sürece"), k(yaz(200, 56, "Önü açık mı?", "orta"), "beyaz", "sürece"),
        k(ok([160, 80], [100, 150]), "murekkep", "açık"), k(yaz(112, 112, "evet", "sag"), "murekkep", "açık"),
        k(kutu(30, 150, 140, 56, "mor", 12), "mor", "ileri"), k(yaz(100, 184, "↑ ileri git", "orta"), "beyaz", "ileri"),
        k(ok([30, 178], [10, 178], [10, 50], [118, 50]), "mor", "git."), k(yaz(18, 240, "yeniden sor"), "mor", "git."),
        k(ok([240, 80], [300, 150]), "murekkep", "kapanınca"), k(yaz(286, 112, "hayır"), "murekkep", "kapanınca"),
        k(kutu(250, 150, 110, 56, "gri", 12), "gri", "durur."), k(yaz(305, 184, "dur", "orta"), "murekkep", "durur.")
      ]
    };
  })(),
  "batarya-enerji": (() => {
    const k = yazici("enerji");
    return {
      aciklama: "Solda batarya; ortada karlı kare (2 enerji) ve temiz kare (1 enerji); sağda şimşekli şarj istasyonu (batarya dolar).",
      katmanlar: [
        k(kutu(20, 70, 90, 140, "beyaz", 10), "murekkep", "bataryası"), k(kutu(50, 56, 30, 14, "murekkep", 3), "murekkep", "bataryası"),
        k(kutu(30, 150, 70, 50, "yesil", 6), "yesil", "bataryası"), k(kutu(30, 110, 70, 34, "yesil", 6), "yesil", "bataryası"),
        k(kutu(140, 60, 80, 80, "beyaz", 18), "gri", "Karlı"), k(yaz(180, 166, "karlı: 2", "orta"), "murekkep", "Karlı"),
        k(kutu(140, 180, 80, 50, "gri", 6), "gri", "temiz"), k(yaz(180, 248, "temiz: 1", "orta"), "murekkep", "temiz"),
        k(kutu(260, 80, 120, 120, "sari", 10), "sari", "Şarj"), k(yaz(320, 156, "⚡", "orta"), "murekkep", "Şarj"),
        k(yaz(320, 230, "batarya dolar", "orta"), "yesil", "doldurur.")
      ]
    };
  })(),
  "iki-goz-cizgi": (() => {
    const k = yazici("ikiGoz");
    const goz = (x: number, siyah: boolean, soz: string) => k(daire(x, 120, 9, siyah ? "sari" : "kirmizi"), siyah ? "sari" : "kirmizi", soz);
    return {
      aciklama: "Üç durum yan yana: siyah çizgi üstünde iki göz (düz git), sol göz beyazda (sağa dön), sağ göz beyazda (sola dön).",
      katmanlar: [
        k(kutu(52, 40, 26, 160, "siyah", 2), "siyah", "altında"), goz(56, true, "İkisi"), goz(74, true, "İkisi"), k(yaz(65, 232, "↑ düz", "orta"), "yesil", "düz"),
        k(kutu(192, 40, 26, 160, "siyah", 2), "siyah", "Sol"), goz(180, false, "Sol"), goz(198, true, "Sol"), k(yaz(200, 232, "↱ sağa", "orta"), "mavi", "sağa"),
        k(kutu(322, 40, 26, 160, "siyah", 2), "siyah", "Sağ göz"), goz(326, true, "Sağ göz"), goz(344, false, "Sağ göz"), k(yaz(335, 232, "↰ sola", "orta"), "mavi", "sola")
      ]
    };
  })(),
  "harita-tasarla": (() => {
    const k = yazici("tasarim"), b = 40, x0 = 40, y0 = 40;
    const hucre = (x: number, y: number, renk: CizimRengi, soz: string, k2 = 4) => k(kutu(x0 + x * b + 2, y0 + y * b + 2, b - 4, b - 4, renk, k2), renk, soz);
    return {
      aciklama: "Küçük bir ızgara harita: binalar (koyu), karlı sokaklar (beyaz), şarj istasyonu (sarı) ve robot; yanda araçların listesi.",
      katmanlar: [
        k(kutu(x0, y0, 5 * b, 4 * b, "gri", 4), "gri", "Şimdi"),
        ...[[0, 0], [1, 0], [3, 0], [4, 0], [3, 2], [4, 2], [0, 3]].map(([x, y]) => hucre(x, y, "murekkep", "Binaları")),
        ...[[2, 0], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2]].map(([x, y]) => hucre(x, y, "beyaz", "karlı", 10)),
        hucre(1, 3, "sari", "şarj"),
        k(kutu(x0 + 0 * b + 10, y0 + 1 * b + 8, 20, 26, "mor", 5), "mor", "robotu"),
        k(yaz(270, 70, "bina"), "murekkep", "Binaları"), k(yaz(270, 110, "kar"), "murekkep", "karlı"), k(yaz(270, 150, "şarj"), "sari", "şarj"),
        k(yaz(270, 190, "robot"), "mor", "robotu"), k(yaz(200, 240, "kartlarla programla", "orta"), "yesil", "kartlarla")
      ]
    };
  })()
};
