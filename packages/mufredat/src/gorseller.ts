/* Anlatım görselleri kataloğu: 3D sahne anları ve adım adım çizimler. Saf veri: çizdiren kod portalda (gorsel/), 3D modeller
   @sra/sahne paketinde. Derslerin anlatım adımları bu adlara başvurur; doğrulayıcı olmayan adı hata sayar. */

import { LABIRENT_CIZIMLERI } from "./gorseller-labirent";
import { MBOT_CIZIMLERI } from "./gorseller-mbot";
import { KONTROL_CIZIMLERI } from "./gorseller-kontrol";

/* ---------- 3D sahne anı ---------- */
export type SahneAcisi = "onden" | "yandan" | "ustten" | "alttan" | "yakin";
export interface SahneAni {
  robot: "SiroLine" | "Kenshin" | "RizBot" | "mBot" | "mBot2";
  aci: SahneAcisi;
  /** vurgulanan parça grubu (robot modelinin parça adı) ve sahnedeki etiketi */
  vurgu?: { parca: string; etiket: string };
  /** bant: beyaz kâğıtta siyah bant; beyaz-bant: siyah zeminde beyaz bant (sınıf pisti); labirent: MEB hücresi (siyah zemin, beyaz duvarlar) */
  zemin: "duz" | "bant" | "beyaz-bant" | "ring" | "labirent";
  /** küçük hareket: robot bandın üstünde yavaşça sağa sola kayar / sensörler nabız gibi parlar */
  hareket?: "salinim" | "nabiz";
  /** WebGL yokken ve ekran okuyucu için kısa açıklama */
  aciklama: string;
}
export const SAHNE_ANLARI: Record<string, SahneAni> = {
  "siroline-alttan": {
    robot: "SiroLine", aci: "alttan", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "sensor", etiket: "8 kızılötesi sensör" },
    aciklama: "SiroLine ters çevrilmiş; altındaki sekiz sensörlük şerit vurgulanıyor."
  },
  "siroline-bant-ustunde": {
    robot: "SiroLine", aci: "onden", zemin: "bant", hareket: "salinim",
    vurgu: { parca: "sensor", etiket: "Sensörler bandın üstünde" },
    aciklama: "SiroLine beyaz kâğıttaki siyah bandın üstünde yavaşça sağa sola kayıyor; sensörler bandı tarıyor."
  },
  "kenshin-ring": {
    robot: "Kenshin", aci: "onden", zemin: "ring",
    vurgu: { parca: "bicak", etiket: "Bıçak" },
    aciklama: "Kenshin 77 cm'lik dohyonun ortasında: siyah zemin, kenarda beyaz çizgi, ortada kahverengi başlangıç çizgileri. Öndeki bıçak vurgulu."
  },
  "kenshin-sensorler": {
    robot: "Kenshin", aci: "yakin", zemin: "ring", hareket: "nabiz",
    vurgu: { parca: "yanSensorler", etiket: "Yan rakip sensörleri" },
    aciklama: "Kenshin yakından: iki yanındaki siyah kutular yan rakip sensörleri; öndeki sensörler bıçağın arkasında."
  },
  "kenshin-tekerler": {
    robot: "Kenshin", aci: "yandan", zemin: "ring",
    vurgu: { parca: "tekerler", etiket: "Geniş lastik tekerler" },
    aciklama: "Kenshin yandan: geniş lastik tekerler zemine iyi tutunur; bıçak önde yere çok yakın."
  },
  "kenshin-baslatma": {
    robot: "Kenshin", aci: "yakin", zemin: "ring",
    vurgu: { parca: "baslatma", etiket: "Start modülü" },
    aciklama: "Kenshin yakından: üstündeki küçük kart, hakemin kumandasından gelen başla sinyalini alan start modülü."
  },
  "mbot-onden": {
    robot: "mBot", aci: "onden", zemin: "duz",
    aciklama: "mBot önden: mavi alüminyum gövde ve gülen yüz, üstte yarı saydam kutuda kartı, önde iki gümüş gözlü mesafe sensörü, arkada iki siyah teker."
  },
  "mbot-ultrasonik": {
    robot: "mBot", aci: "onden", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "ultrasonik", etiket: "Mesafe sensörü" },
    aciklama: "mBot önden, mesafe sensörü vurgulu: siyah kartın üstünde iki gümüş göz; biri dalgayı yollar, öteki geri geleni dinler."
  },
  "mbot-tekerler": {
    robot: "mBot", aci: "yandan", zemin: "duz",
    vurgu: { parca: "tekerler", etiket: "İki motor, iki teker" },
    aciklama: "mBot yandan: arkada iki büyük teker; her tekeri ayrı bir motor çevirir. Önde küçük bir bilye teker."
  },
  "mbot-cizgi-sensoru": {
    robot: "mBot", aci: "alttan", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "cizgiSensoru", etiket: "Çizgi sensörü: iki göz" },
    aciklama: "mBot ters çevrilmiş, altı görünüyor: önde çizgi sensörü ve yere bakan iki gözü; arkada iki teker."
  },
  "mbot-kart": {
    robot: "mBot", aci: "yakin", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "isikSensoru", etiket: "Işık sensörü" },
    aciklama: "mBot yakından: yarı saydam kutunun içinde mCore kartı (robotun beyni); kartın önünde iki renkli ışık ve ortada ışık sensörü."
  },
  "mbot2-onden": {
    robot: "mBot2", aci: "onden", zemin: "duz",
    aciklama: "mBot2 önden: mavi alüminyum şasi, üstte koyu gri pil kutusu (mBot2 Shield) ve onun üstünde ekranlı CyberPi kartı, önde mavi ışıklı iki gözlü mesafe sensörü, arkada iki büyük teker."
  },
  "mbot2-motorlar": {
    robot: "mBot2", aci: "yandan", zemin: "duz",
    vurgu: { parca: "motorlar", etiket: "Enkoderli motorlar" },
    aciklama: "mBot2 arkadan çapraz, motorlar vurgulu: her tekeri ayrı bir enkoderli motor çevirir; enkoder motorun kaç derece döndüğünü sayar."
  },
  "mbot2-cyberpi": {
    robot: "mBot2", aci: "yakin", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "cyberpi", etiket: "CyberPi" },
    aciklama: "mBot2 yakından, CyberPi vurgulu: ekranı, joystick'i, iki düğmesi ve beş ışığı olan kart. Kontrol döngüsü burada çalışır; jiroskop da bu kartın içinde."
  },
  "mbot2-quad-rgb": {
    robot: "mBot2", aci: "alttan", zemin: "duz", hareket: "nabiz",
    vurgu: { parca: "quadRgb", etiket: "Quad RGB sensör" },
    aciklama: "mBot2 ters çevrilmiş, altı görünüyor: önde dört gözlü Quad RGB sensör yere bakıyor; arkada iki teker ve motorlar."
  },
  "rizbot-labirentte": {
    robot: "RizBot", aci: "onden", zemin: "labirent", hareket: "nabiz",
    vurgu: { parca: "sensorler", etiket: "Kızılötesi duvar sensörleri" },
    aciklama: "RizBot bir labirent hücresinde: siyah zemin, solunda ve önünde 8 cm yüksek beyaz duvar, sağı açık. Sensörleri vurgulu."
  },
  "rizbot-sensorler": {
    robot: "RizBot", aci: "ustten", zemin: "labirent", hareket: "nabiz",
    vurgu: { parca: "sensorler", etiket: "Öne, çapraza ve yanlara bakan sensörler" },
    aciklama: "RizBot üstten: önde ileri bakan iki sensör, köşelerde çapraz bakan iki sensör, yanlarda birer yan sensör."
  },
  "rizbot-tekerler": {
    robot: "RizBot", aci: "yandan", zemin: "labirent",
    vurgu: { parca: "tekerler", etiket: "İki motor, iki teker" },
    aciklama: "RizBot yandan: iki motor iki tekeri ayrı ayrı çevirir; robot yerinde dönebilir."
  },
  "rizbot-fan": {
    robot: "RizBot", aci: "yakin", zemin: "labirent",
    vurgu: { parca: "fan", etiket: "Vakum fanı" },
    aciklama: "RizBot yakından: önündeki köprüde dik duran fan motoru ve altında fan çarkı. Fan robotu zemine bastırır, hızlı dönüşlerde kaymasın."
  },
  "siroline-siyah-zemin": {
    robot: "SiroLine", aci: "onden", zemin: "beyaz-bant", hareket: "salinim",
    vurgu: { parca: "sensor", etiket: "Siyah zemin, beyaz bant" },
    aciklama: "SiroLine sınıf pistindeki gibi siyah zeminde, beyaz bandın üstünde; sensör şeridi vurgulu."
  }
};

/* ---------- adım adım çizim ---------- */
/** Çizim alanı 400 × 260 birim. Renkler v2 paletinden ad olarak. */
export type CizimRengi = "murekkep" | "kirmizi" | "mor" | "yesil" | "sari" | "gri" | "beyaz" | "siyah" | "kahve" | "mavi";
export type Sekil =
  | { tur: "kutu"; x: number; y: number; g: number; y2: number; dolgu?: CizimRengi; kose?: number }
  | { tur: "daire"; x: number; y: number; r: number; dolgu?: CizimRengi }
  | { tur: "cizgi"; noktalar: [number, number][] }
  | { tur: "ok"; noktalar: [number, number][] }
  /** dalgalı ok: ışın */
  | { tur: "isin"; bas: [number, number]; son: [number, number]; soluk?: boolean }
  | { tur: "etiket"; x: number; y: number; metin: string; hiza?: "sol" | "orta" | "sag" };
export interface Katman {
  sekil: Sekil;
  renk: CizimRengi;
  /** metnin kaçıncı kelimesi okunurken belirsin (0'dan); yoksa sırası gelince */
  kelime?: number;
}
export interface Cizim { aciklama: string; katmanlar: Katman[] }

export const CIZIMLER: Record<string, Cizim> = {
  /* "Her sensörde iki parça vardır: gözümüzün göremediği kızılötesi ışığı yayan küçük bir lamba ve geri dönen ışığı ölçen bir alıcı." */
  "sensor-isik-yolu": {
    aciklama: "Sensörün kesiti: solda kızılötesi lamba, sağda alıcı. Lambadan çıkan ışın zemine iner, yansıyıp alıcıya döner.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 90, y: 40, g: 220, y2: 50, dolgu: "gri", kose: 10 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 200, y: 32, metin: "sensör", hiza: "orta" }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "daire", x: 140, y: 90, r: 14, dolgu: "kirmizi" }, renk: "murekkep", kelime: 7 },
      { sekil: { tur: "etiket", x: 126, y: 132, metin: "lamba", hiza: "sag" }, renk: "kirmizi", kelime: 12 },
      { sekil: { tur: "isin", bas: [140, 104], son: [200, 205] }, renk: "kirmizi", kelime: 9 },
      { sekil: { tur: "kutu", x: 40, y: 205, g: 320, y2: 22, dolgu: "beyaz", kose: 4 }, renk: "gri", kelime: 9 },
      { sekil: { tur: "etiket", x: 200, y: 250, metin: "zemin", hiza: "orta" }, renk: "murekkep", kelime: 9 },
      { sekil: { tur: "isin", bas: [200, 205], son: [260, 104] }, renk: "kirmizi", kelime: 15 },
      { sekil: { tur: "kutu", x: 246, y: 76, g: 28, y2: 28, dolgu: "mor", kose: 6 }, renk: "murekkep", kelime: 17 },
      { sekil: { tur: "etiket", x: 274, y: 132, metin: "alıcı", hiza: "sol" }, renk: "mor", kelime: 19 }
    ]
  },
  /* "Beyaz zemin ışığın çoğunu geri yansıtır. Siyah bant ise ışığın çoğunu yutar. Alıcıya dönen ışığın miktarı, sensörün altındaki rengi ele verir." */
  "beyaz-siyah-yansima": {
    aciklama: "İki sensör yan yana. Beyaz zeminin üstündeki sensöre kalın bir ışın geri döner; siyah bandın üstündekine ise çok zayıf bir ışın döner.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 20, y: 205, g: 170, y2: 24, dolgu: "beyaz", kose: 4 }, renk: "gri", kelime: 0 },
      { sekil: { tur: "etiket", x: 105, y: 250, metin: "beyaz zemin", hiza: "orta" }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "kutu", x: 65, y: 40, g: 80, y2: 40, dolgu: "gri", kose: 8 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "isin", bas: [85, 80], son: [105, 205] }, renk: "kirmizi", kelime: 2 },
      { sekil: { tur: "isin", bas: [105, 205], son: [125, 80] }, renk: "kirmizi", kelime: 4 },
      { sekil: { tur: "etiket", x: 105, y: 28, metin: "çok ışık döner", hiza: "orta" }, renk: "yesil", kelime: 5 },
      { sekil: { tur: "kutu", x: 210, y: 205, g: 170, y2: 24, dolgu: "siyah", kose: 4 }, renk: "murekkep", kelime: 6 },
      { sekil: { tur: "etiket", x: 295, y: 250, metin: "siyah bant", hiza: "orta" }, renk: "murekkep", kelime: 7 },
      { sekil: { tur: "kutu", x: 255, y: 40, g: 80, y2: 40, dolgu: "gri", kose: 8 }, renk: "murekkep", kelime: 6 },
      { sekil: { tur: "isin", bas: [275, 80], son: [295, 205] }, renk: "kirmizi", kelime: 9 },
      { sekil: { tur: "isin", bas: [295, 205], son: [315, 80], soluk: true }, renk: "kirmizi", kelime: 11 },
      { sekil: { tur: "etiket", x: 295, y: 28, metin: "az ışık döner", hiza: "orta" }, renk: "kirmizi", kelime: 11 }
    ]
  }
};


/* ---------- Çizgi İzleyen Robot modülünün çizimleri (2–6. dersler) ---------- */
const sensorX = (i: number) => 41 + i * 46;
Object.assign(CIZIMLER, {
  /* "Her sensörün bir sırası var… Sonuç sıfır ile yedi bin arasında bir konumdur." */
  "agirlikli-ortalama": {
    aciklama: "Sekiz sensör yan yana, altlarında sıra numaraları 0'dan 7'ye. Bant s[2]'nin altında: s[2] çok, s[1] ile s[3] az görüyor. Altta 0'dan 7000'e bir ölçek ve konum işareti yaklaşık 2200'de.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 134, y: 112, g: 18, y2: 42, dolgu: "siyah", kose: 2 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 380, y: 90, metin: "sensörün değeri", hiza: "sag" }, renk: "kirmizi", kelime: 16 },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ sekil: { tur: "kutu" as const, x: sensorX(i) - 17, y: 120, g: 34, y2: 26, dolgu: "gri" as const, kose: 5 }, renk: "murekkep" as const, kelime: 1 })),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ sekil: { tur: "etiket" as const, x: sensorX(i), y: 168, metin: String(i), hiza: "orta" as const }, renk: "mor" as const, kelime: i < 4 ? 6 : 9 })),
      { sekil: { tur: "kutu", x: sensorX(1) - 10, y: 108, g: 20, y2: 10, dolgu: "kirmizi", kose: 3 }, renk: "kirmizi", kelime: 24 },
      { sekil: { tur: "kutu", x: sensorX(2) - 10, y: 58, g: 20, y2: 60, dolgu: "kirmizi", kose: 3 }, renk: "kirmizi", kelime: 18 },
      { sekil: { tur: "kutu", x: sensorX(3) - 10, y: 92, g: 20, y2: 26, dolgu: "kirmizi", kose: 3 }, renk: "kirmizi", kelime: 24 },
      { sekil: { tur: "cizgi", noktalar: [[41, 205], [363, 205]] }, renk: "murekkep", kelime: 28 },
      { sekil: { tur: "etiket", x: 41, y: 232, metin: "0", hiza: "orta" }, renk: "murekkep", kelime: 29 },
      { sekil: { tur: "etiket", x: 363, y: 232, metin: "7000", hiza: "orta" }, renk: "murekkep", kelime: 31 },
      { sekil: { tur: "ok", noktalar: [[143, 178], [143, 198]] }, renk: "mor", kelime: 33 },
      { sekil: { tur: "daire", x: 143, y: 205, r: 7, dolgu: "mor" }, renk: "mor", kelime: 34 },
      { sekil: { tur: "etiket", x: 143, y: 250, metin: "konum ≈ 2200", hiza: "orta" }, renk: "mor", kelime: 35 }
    ]
  },
  /* "Hiçbir iki sensör birebir aynı değildir… Böylece bütün sensörler aynı ölçekle konuşur." */
  kalibrasyon: {
    aciklama: "İki sensörün ham okumaları farklı aralıklarda: s[0] 80 ile 880, s[1] 140 ile 960 arasında. Kalibrasyondan sonra ikisi de 0 ile 1000 arasında.",
    katmanlar: [
      { sekil: { tur: "etiket", x: 150, y: 28, metin: "ham okuma", hiza: "orta" }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 20, y: 96, metin: "s[0]", hiza: "sol" }, renk: "mor", kelime: 1 },
      { sekil: { tur: "cizgi", noktalar: [[90, 90], [200, 90]] }, renk: "gri", kelime: 2 },
      { sekil: { tur: "etiket", x: 20, y: 186, metin: "s[1]", hiza: "sol" }, renk: "mor", kelime: 2 },
      { sekil: { tur: "cizgi", noktalar: [[110, 180], [235, 180]] }, renk: "gri", kelime: 3 },
      { sekil: { tur: "daire", x: 90, y: 90, r: 9, dolgu: "beyaz" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "daire", x: 110, y: 180, r: 9, dolgu: "beyaz" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "etiket", x: 90, y: 122, metin: "80", hiza: "orta" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "etiket", x: 110, y: 212, metin: "140", hiza: "orta" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "daire", x: 200, y: 90, r: 9, dolgu: "siyah" }, renk: "murekkep", kelime: 22 },
      { sekil: { tur: "daire", x: 235, y: 180, r: 9, dolgu: "siyah" }, renk: "murekkep", kelime: 22 },
      { sekil: { tur: "etiket", x: 200, y: 122, metin: "880", hiza: "orta" }, renk: "murekkep", kelime: 22 },
      { sekil: { tur: "etiket", x: 235, y: 212, metin: "960", hiza: "orta" }, renk: "murekkep", kelime: 22 },
      { sekil: { tur: "ok", noktalar: [[255, 135], [285, 135]] }, renk: "mor", kelime: 25 },
      { sekil: { tur: "etiket", x: 340, y: 28, metin: "ayarlı", hiza: "orta" }, renk: "yesil", kelime: 26 },
      { sekil: { tur: "cizgi", noktalar: [[300, 90], [380, 90]] }, renk: "yesil", kelime: 27 },
      { sekil: { tur: "cizgi", noktalar: [[300, 180], [380, 180]] }, renk: "yesil", kelime: 27 },
      { sekil: { tur: "etiket", x: 300, y: 122, metin: "0", hiza: "orta" }, renk: "murekkep", kelime: 27 },
      { sekil: { tur: "etiket", x: 380, y: 122, metin: "1000", hiza: "orta" }, renk: "murekkep", kelime: 29 },
      { sekil: { tur: "etiket", x: 300, y: 212, metin: "0", hiza: "orta" }, renk: "murekkep", kelime: 27 },
      { sekil: { tur: "etiket", x: 380, y: 212, metin: "1000", hiza: "orta" }, renk: "murekkep", kelime: 29 },
      { sekil: { tur: "etiket", x: 340, y: 250, metin: "aynı ölçek", hiza: "orta" }, renk: "yesil", kelime: 35 }
    ]
  },
  /* "Robotun hedefi konumu 3500'de tutmak… Çizgi soldaysa hata eksi, sağdaysa artı çıkar." */
  "hata-duzeltme": {
    aciklama: "Üstte 0'dan 7000'e bir ölçek: hedef 3500 ortada, konum 2300'de; aradaki ok hata. Altta iki robot: çizgi solda olunca hata eksi, sağda olunca artı.",
    katmanlar: [
      { sekil: { tur: "cizgi", noktalar: [[40, 70], [360, 70]] }, renk: "murekkep", kelime: 2 },
      { sekil: { tur: "daire", x: 200, y: 70, r: 7, dolgu: "yesil" }, renk: "yesil", kelime: 6 },
      { sekil: { tur: "etiket", x: 200, y: 44, metin: "hedef 3500", hiza: "orta" }, renk: "yesil", kelime: 6 },
      { sekil: { tur: "daire", x: 145, y: 70, r: 7, dolgu: "mor" }, renk: "mor", kelime: 8 },
      { sekil: { tur: "etiket", x: 120, y: 44, metin: "konum", hiza: "sag" }, renk: "mor", kelime: 8 },
      { sekil: { tur: "ok", noktalar: [[192, 92], [153, 92]] }, renk: "kirmizi", kelime: 16 },
      { sekil: { tur: "etiket", x: 200, y: 122, metin: "hata = konum − 3500", hiza: "orta" }, renk: "kirmizi", kelime: 18 },
      { sekil: { tur: "kutu", x: 40, y: 168, g: 130, y2: 18, dolgu: "gri", kose: 5 }, renk: "murekkep", kelime: 26 },
      { sekil: { tur: "kutu", x: 52, y: 150, g: 14, y2: 54, dolgu: "siyah", kose: 2 }, renk: "murekkep", kelime: 27 },
      { sekil: { tur: "etiket", x: 105, y: 236, metin: "solda: hata −", hiza: "orta" }, renk: "kirmizi", kelime: 29 },
      { sekil: { tur: "kutu", x: 230, y: 168, g: 130, y2: 18, dolgu: "gri", kose: 5 }, renk: "murekkep", kelime: 30 },
      { sekil: { tur: "kutu", x: 334, y: 150, g: 14, y2: 54, dolgu: "siyah", kose: 2 }, renk: "murekkep", kelime: 30 },
      { sekil: { tur: "etiket", x: 295, y: 236, metin: "sağda: hata +", hiza: "orta" }, renk: "kirmizi", kelime: 31 }
    ]
  },
  /* "Kp çok küçükse robot virajda yeterince dönemez ve pistten çıkar. Kp çok büyükse … sağa sola sallanır." */
  "kp-izleri": {
    aciklama: "Üç pist parçası ve robotun izi. Kp küçükken iz virajda düz devam edip pistten çıkıyor; Kp büyükken iz çizginin iki yanında zikzak çiziyor; uygun Kp'de iz çizgiyi izliyor.",
    katmanlar: [
      { sekil: { tur: "etiket", x: 70, y: 24, metin: "Kp küçük", hiza: "orta" }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "cizgi", noktalar: [[60, 245], [60, 150], [66, 110], [84, 80], [112, 62], [128, 58]] }, renk: "siyah", kelime: 0 },
      { sekil: { tur: "ok", noktalar: [[64, 245], [64, 150], [70, 112], [76, 60]] }, renk: "mor", kelime: 5 },
      { sekil: { tur: "etiket", x: 52, y: 84, metin: "çıkar!", hiza: "sag" }, renk: "kirmizi", kelime: 9 },
      { sekil: { tur: "etiket", x: 200, y: 24, metin: "Kp büyük", hiza: "orta" }, renk: "murekkep", kelime: 11 },
      { sekil: { tur: "cizgi", noktalar: [[200, 245], [200, 50]] }, renk: "siyah", kelime: 11 },
      { sekil: { tur: "ok", noktalar: [[200, 245], [222, 215], [178, 180], [222, 145], [178, 110], [222, 75], [200, 52]] }, renk: "mor", kelime: 18 },
      { sekil: { tur: "etiket", x: 234, y: 160, metin: "sallanır", hiza: "sol" }, renk: "kirmizi", kelime: 23 },
      { sekil: { tur: "etiket", x: 330, y: 24, metin: "uygun Kp", hiza: "orta" }, renk: "yesil", kelime: 23 },
      { sekil: { tur: "cizgi", noktalar: [[320, 245], [320, 150], [326, 110], [344, 80], [372, 62], [388, 58]] }, renk: "siyah", kelime: 23 },
      { sekil: { tur: "ok", noktalar: [[324, 245], [323, 150], [329, 112], [346, 84], [372, 66], [384, 63]] }, renk: "yesil", kelime: 23 }
    ]
  },
  /* "Kp büyük olunca robot çizgiye hızla döner ama çizginin üstünden geçip öbür tarafa taşar…" */
  "sallanan-iz": {
    aciklama: "Düz bir çizgi ve robotun izi: iz çizgiye döner, üstünden geçip öbür yana taşar, geri döner ve yine taşar; dalga gibi sallanıyor.",
    katmanlar: [
      { sekil: { tur: "etiket", x: 24, y: 34, metin: "Kd = 0", hiza: "sol" }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "cizgi", noktalar: [[20, 140], [380, 140]] }, renk: "siyah", kelime: 0 },
      { sekil: { tur: "ok", noktalar: [[20, 200], [70, 160], [110, 100], [150, 90], [185, 130]] }, renk: "mor", kelime: 5 },
      { sekil: { tur: "etiket", x: 130, y: 76, metin: "taşar", hiza: "orta" }, renk: "kirmizi", kelime: 14 },
      { sekil: { tur: "ok", noktalar: [[185, 130], [225, 185], [265, 192], [300, 150], [335, 100], [375, 95]] }, renk: "mor", kelime: 16 },
      { sekil: { tur: "etiket", x: 262, y: 222, metin: "yine taşar", hiza: "orta" }, renk: "kirmizi", kelime: 19 },
      { sekil: { tur: "etiket", x: 376, y: 34, metin: "sallanma", hiza: "sag" }, renk: "kirmizi", kelime: 20 }
    ]
  },
  /* "Kd hatanın ne kadar hızlı değiştiğine bakar… Kd çarpı değişim dönüşü erkenden azaltır, tıpkı bir fren gibi." */
  "hata-grafigi": {
    aciklama: "Hatanın zamanla değişimi. Kd sıfırken hata sıfırın iki yanında uzun süre dalgalanıyor; Kd ile hata sıfıra yumuşakça iniyor ve orada kalıyor.",
    katmanlar: [
      { sekil: { tur: "ok", noktalar: [[40, 245], [40, 18]] }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 50, y: 30, metin: "hata", hiza: "sol" }, renk: "murekkep", kelime: 2 },
      { sekil: { tur: "ok", noktalar: [[40, 150], [385, 150]] }, renk: "murekkep", kelime: 2 },
      { sekil: { tur: "etiket", x: 385, y: 176, metin: "zaman", hiza: "sag" }, renk: "murekkep", kelime: 5 },
      { sekil: { tur: "cizgi", noktalar: [[40, 50], [80, 150], [105, 225], [135, 150], [160, 85], [190, 150], [215, 205], [245, 150], [270, 105], [300, 150], [325, 190], [355, 150], [380, 120]] }, renk: "kirmizi", kelime: 8 },
      { sekil: { tur: "etiket", x: 380, y: 56, metin: "Kd = 0", hiza: "sag" }, renk: "kirmizi", kelime: 10 },
      { sekil: { tur: "cizgi", noktalar: [[40, 50], [70, 100], [100, 132], [135, 146], [180, 150], [380, 150]] }, renk: "yesil", kelime: 22 },
      { sekil: { tur: "etiket", x: 380, y: 30, metin: "Kd ile", hiza: "sag" }, renk: "yesil", kelime: 23 },
      { sekil: { tur: "etiket", x: 118, y: 108, metin: "fren", hiza: "orta" }, renk: "yesil", kelime: 29 }
    ]
  },
  /* "Yarışta hızlı olmak isteriz. Ama taban hız artınca robot aynı sürede daha uzun yol gider…" */
  "hiz-viraj": {
    aciklama: "Bir viraj ve iki robot izi. Yavaş robotun izi virajı çizgiye yakın dönüyor; hızlı robotun izi viraja geç giriyor, dışarı taşıyor ve çizgiye uzaktan dönüyor.",
    katmanlar: [
      { sekil: { tur: "cizgi", noktalar: [[50, 250], [50, 130], [58, 92], [80, 60], [112, 40], [150, 32], [385, 32]] }, renk: "siyah", kelime: 0 },
      { sekil: { tur: "ok", noktalar: [[54, 250], [54, 130], [62, 95], [83, 64], [114, 45], [150, 37], [270, 37]] }, renk: "yesil", kelime: 1 },
      { sekil: { tur: "etiket", x: 118, y: 100, metin: "yavaş", hiza: "orta" }, renk: "yesil", kelime: 3 },
      { sekil: { tur: "ok", noktalar: [[46, 250], [46, 130], [44, 70], [40, 22], [60, 8], [120, 12], [200, 22], [300, 30], [380, 31]] }, renk: "kirmizi", kelime: 5 },
      { sekil: { tur: "etiket", x: 66, y: 172, metin: "hızlı", hiza: "sol" }, renk: "kirmizi", kelime: 7 },
      { sekil: { tur: "etiket", x: 260, y: 72, metin: "geç fark eder, dışarı taşar", hiza: "orta" }, renk: "kirmizi", kelime: 15 }
    ]
  },
  /* "Usta yarışçılar adım adım ilerler: hızı biraz artır, dene. Virajdan kaçıyorsa Kp'yi, sallanıyorsa Kd'yi düzelt. Her denemeyi ayar defterine yaz." */
  "ayar-dongusu": {
    aciklama: "Dört adımlı bir döngü: hızı artır, dene; robot virajdan kaçıyorsa Kp'yi, sallanıyorsa Kd'yi artır; sonucu ayar defterine yaz ve baştan başla.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 130, y: 14, g: 140, y2: 38, dolgu: "beyaz", kose: 12 }, renk: "mor", kelime: 2 },
      { sekil: { tur: "etiket", x: 200, y: 39, metin: "Hızı artır", hiza: "orta" }, renk: "murekkep", kelime: 5 },
      { sekil: { tur: "ok", noktalar: [[272, 42], [312, 100]] }, renk: "mor", kelime: 7 },
      { sekil: { tur: "kutu", x: 262, y: 104, g: 120, y2: 38, dolgu: "beyaz", kose: 12 }, renk: "mor", kelime: 8 },
      { sekil: { tur: "etiket", x: 322, y: 129, metin: "Dene", hiza: "orta" }, renk: "murekkep", kelime: 8 },
      { sekil: { tur: "ok", noktalar: [[312, 146], [274, 188]] }, renk: "mor", kelime: 9 },
      { sekil: { tur: "kutu", x: 100, y: 190, g: 200, y2: 62, dolgu: "beyaz", kose: 12 }, renk: "mor", kelime: 9 },
      { sekil: { tur: "etiket", x: 200, y: 214, metin: "Kaçıyorsa: Kp ↑", hiza: "orta" }, renk: "kirmizi", kelime: 10 },
      { sekil: { tur: "etiket", x: 200, y: 240, metin: "Sallanıyorsa: Kd ↑", hiza: "orta" }, renk: "kirmizi", kelime: 13 },
      { sekil: { tur: "ok", noktalar: [[126, 188], [88, 146]] }, renk: "mor", kelime: 16 },
      { sekil: { tur: "kutu", x: 18, y: 104, g: 128, y2: 38, dolgu: "beyaz", kose: 12 }, renk: "mor", kelime: 17 },
      { sekil: { tur: "etiket", x: 82, y: 129, metin: "Deftere yaz", hiza: "orta" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "ok", noktalar: [[88, 100], [128, 42]] }, renk: "mor", kelime: 20 }
    ]
  }
} satisfies Record<string, Cizim>);

/* ---------- Mini Sumo modülünün çizimleri ---------- */
const satir = (y: number, durum: string, hamle: string, kd: number, kh: number): Katman[] => [
  { sekil: { tur: "kutu", x: 14, y, g: 166, y2: 30, dolgu: "beyaz", kose: 8 }, renk: "mor", kelime: kd },
  { sekil: { tur: "etiket", x: 97, y: y + 21, metin: durum, hiza: "orta" }, renk: "murekkep", kelime: kd },
  { sekil: { tur: "ok", noktalar: [[184, y + 15], [206, y + 15]] }, renk: "mor", kelime: kh },
  { sekil: { tur: "kutu", x: 210, y, g: 176, y2: 30, dolgu: "beyaz", kose: 8 }, renk: "kirmizi", kelime: kh },
  { sekil: { tur: "etiket", x: 298, y: y + 21, metin: hamle, hiza: "orta" }, renk: "kirmizi", kelime: kh }
];
Object.assign(CIZIMLER, {
  /* "Mini sumoda iki robot yuvarlak bir ringde karşılaşır… kenarında 2,5 santimetrelik beyaz bir çizgi var." */
  "dohyo-olculeri": {
    aciklama: "Üstten dohyo: siyah zeminli daire, kenarında beyaz çizgi, ortada iki kahverengi başlangıç çizgisi; çapı 77 cm.",
    katmanlar: [
      { sekil: { tur: "daire", x: 125, y: 130, r: 112, dolgu: "beyaz" }, renk: "gri", kelime: 4 },
      { sekil: { tur: "daire", x: 125, y: 130, r: 102, dolgu: "siyah" }, renk: "siyah", kelime: 6 },
      { sekil: { tur: "kutu", x: 104, y: 116, g: 5, y2: 28, dolgu: "kahve", kose: 1 }, renk: "kahve", kelime: 9 },
      { sekil: { tur: "kutu", x: 141, y: 116, g: 5, y2: 28, dolgu: "kahve", kose: 1 }, renk: "kahve", kelime: 9 },
      { sekil: { tur: "cizgi", noktalar: [[13, 252], [237, 252]] }, renk: "mor", kelime: 15 },
      { sekil: { tur: "cizgi", noktalar: [[13, 244], [13, 258]] }, renk: "mor", kelime: 15 },
      { sekil: { tur: "cizgi", noktalar: [[237, 244], [237, 258]] }, renk: "mor", kelime: 15 },
      { sekil: { tur: "etiket", x: 250, y: 70, metin: "dohyo: 77 cm", hiza: "sol" }, renk: "mor", kelime: 16 },
      { sekil: { tur: "etiket", x: 250, y: 115, metin: "siyah zemin", hiza: "sol" }, renk: "murekkep", kelime: 19 },
      { sekil: { tur: "etiket", x: 250, y: 160, metin: "beyaz çizgi", hiza: "sol" }, renk: "murekkep", kelime: 24 },
      { sekil: { tur: "etiket", x: 250, y: 182, metin: "2,5 cm", hiza: "sol" }, renk: "murekkep", kelime: 24 },
      { sekil: { tur: "etiket", x: 250, y: 226, metin: "başlangıç", hiza: "sol" }, renk: "kahve", kelime: 27 },
      { sekil: { tur: "etiket", x: 250, y: 248, metin: "çizgileri", hiza: "sol" }, renk: "kahve", kelime: 27 }
    ]
  },
  /* "Kenshin'in beş rakip sensörü var… Her biri dar bir çizgi boyunca bakar ve 60 santimetreye kadar görür." */
  "sensor-gorus-alani": {
    aciklama: "Üstten Kenshin ve beş rakip sensörünün görüş çizgileri: iki yana birer çizgi, önde üç çizgi (sol ön, orta, sağ ön). Çizgilerin arasında kalan yerler kör nokta.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 175, y: 160, g: 50, y2: 50, dolgu: "mor", kose: 6 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "kutu", x: 175, y: 156, g: 50, y2: 6, dolgu: "gri", kose: 1 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "ok", noktalar: [[175, 185], [28, 185]] }, renk: "sari", kelime: 9 },
      { sekil: { tur: "etiket", x: 28, y: 176, metin: "sol yan", hiza: "sol" }, renk: "murekkep", kelime: 9 },
      { sekil: { tur: "ok", noktalar: [[225, 185], [372, 185]] }, renk: "sari", kelime: 9 },
      { sekil: { tur: "etiket", x: 372, y: 176, metin: "sağ yan", hiza: "sag" }, renk: "murekkep", kelime: 10 },
      { sekil: { tur: "ok", noktalar: [[188, 156], [160, 26]] }, renk: "sari", kelime: 12 },
      { sekil: { tur: "etiket", x: 152, y: 34, metin: "sol ön", hiza: "sag" }, renk: "murekkep", kelime: 13 },
      { sekil: { tur: "ok", noktalar: [[200, 156], [200, 18]] }, renk: "sari", kelime: 14 },
      { sekil: { tur: "ok", noktalar: [[212, 156], [240, 26]] }, renk: "sari", kelime: 16 },
      { sekil: { tur: "etiket", x: 248, y: 34, metin: "sağ ön", hiza: "sol" }, renk: "murekkep", kelime: 17 },
      { sekil: { tur: "etiket", x: 92, y: 110, metin: "kör nokta", hiza: "orta" }, renk: "kirmizi", kelime: 20 },
      { sekil: { tur: "etiket", x: 308, y: 110, metin: "kör nokta", hiza: "orta" }, renk: "kirmizi", kelime: 20 },
      { sekil: { tur: "etiket", x: 200, y: 245, metin: "menzil 60 cm", hiza: "orta" }, renk: "mor", kelime: 26 }
    ]
  },
  /* "Kenshin'in altında, önde iki zemin sensörü var… beyaz kenar çizgisine gelince bir olur." */
  "zemin-sensoru-kenar": {
    aciklama: "Üstten ringin kenarı: solda siyah zemin, ortada beyaz kenar çizgisi. Kenshin kenara gelmiş; önündeki iki zemin sensörü beyazı görüyor. Oklar geri çekilip dönmeyi gösteriyor.",
    katmanlar: [
      { sekil: { tur: "kutu", x: 0, y: 0, g: 300, y2: 260, dolgu: "siyah", kose: 0 }, renk: "siyah", kelime: 0 },
      { sekil: { tur: "kutu", x: 300, y: 0, g: 30, y2: 260, dolgu: "beyaz", kose: 0 }, renk: "gri", kelime: 0 },
      { sekil: { tur: "kutu", x: 212, y: 90, g: 80, y2: 80, dolgu: "mor", kose: 8 }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "kutu", x: 292, y: 90, g: 8, y2: 80, dolgu: "gri", kose: 1 }, renk: "murekkep", kelime: 1 },
      { sekil: { tur: "daire", x: 308, y: 104, r: 8, dolgu: "gri" }, renk: "murekkep", kelime: 4 },
      { sekil: { tur: "etiket", x: 288, y: 80, metin: "sol", hiza: "sag" }, renk: "beyaz", kelime: 8 },
      { sekil: { tur: "daire", x: 308, y: 156, r: 8, dolgu: "gri" }, renk: "murekkep", kelime: 4 },
      { sekil: { tur: "etiket", x: 288, y: 194, metin: "sağ", hiza: "sag" }, renk: "beyaz", kelime: 10 },
      { sekil: { tur: "daire", x: 308, y: 104, r: 8, dolgu: "sari" }, renk: "kirmizi", kelime: 19 },
      { sekil: { tur: "daire", x: 308, y: 156, r: 8, dolgu: "sari" }, renk: "kirmizi", kelime: 19 },
      { sekil: { tur: "etiket", x: 365, y: 136, metin: "dışarı", hiza: "orta" }, renk: "murekkep", kelime: 16 },
      { sekil: { tur: "ok", noktalar: [[205, 130], [110, 130]] }, renk: "sari", kelime: 20 },
      { sekil: { tur: "etiket", x: 158, y: 116, metin: "geri çekil", hiza: "orta" }, renk: "beyaz", kelime: 20 },
      { sekil: { tur: "ok", noktalar: [[100, 140], [80, 205]] }, renk: "sari", kelime: 20 },
      { sekil: { tur: "etiket", x: 92, y: 232, metin: "sonra dön", hiza: "orta" }, renk: "beyaz", kelime: 20 }
    ]
  },
  /* "İki robot burun buruna ittiğinde tekerlekler zemine tutunarak iter…" */
  "itme-kuvvetleri": {
    aciklama: "Yandan iki robot burun buruna: oklar itmeyi, tekerleklerin zemine tutunmasını ve robotun ağırlığını gösteriyor. Bıçaklar öne doğru eğik.",
    katmanlar: [
      { sekil: { tur: "cizgi", noktalar: [[10, 208], [390, 208]] }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "kutu", x: 50, y: 140, g: 120, y2: 52, dolgu: "mor", kose: 8 }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "cizgi", noktalar: [[170, 148], [194, 206]] }, renk: "gri", kelime: 0 },
      { sekil: { tur: "daire", x: 80, y: 194, r: 14, dolgu: "siyah" }, renk: "siyah", kelime: 1 },
      { sekil: { tur: "daire", x: 140, y: 194, r: 14, dolgu: "siyah" }, renk: "siyah", kelime: 1 },
      { sekil: { tur: "kutu", x: 230, y: 140, g: 120, y2: 52, dolgu: "kirmizi", kose: 8 }, renk: "murekkep", kelime: 2 },
      { sekil: { tur: "cizgi", noktalar: [[230, 148], [206, 206]] }, renk: "gri", kelime: 2 },
      { sekil: { tur: "daire", x: 260, y: 194, r: 14, dolgu: "siyah" }, renk: "siyah", kelime: 2 },
      { sekil: { tur: "daire", x: 320, y: 194, r: 14, dolgu: "siyah" }, renk: "siyah", kelime: 2 },
      { sekil: { tur: "ok", noktalar: [[70, 126], [170, 126]] }, renk: "mor", kelime: 4 },
      { sekil: { tur: "etiket", x: 120, y: 114, metin: "itme", hiza: "orta" }, renk: "mor", kelime: 4 },
      { sekil: { tur: "ok", noktalar: [[330, 126], [230, 126]] }, renk: "kirmizi", kelime: 4 },
      { sekil: { tur: "ok", noktalar: [[95, 226], [55, 226]] }, renk: "yesil", kelime: 7 },
      { sekil: { tur: "etiket", x: 50, y: 252, metin: "tutunma", hiza: "sol" }, renk: "yesil", kelime: 7 },
      { sekil: { tur: "ok", noktalar: [[110, 24], [110, 84]] }, renk: "murekkep", kelime: 18 },
      { sekil: { tur: "etiket", x: 122, y: 56, metin: "ağırlık", hiza: "sol" }, renk: "murekkep", kelime: 18 }
    ]
  },
  /* "Strateji, her durumda ne yapacağını önceden seçmektir… Sonra tablodaki hamleyi yapar." */
  "durum-hamle-tablosu": {
    aciklama: "İki sütunlu tablo: solda durumlar (kenar solda, kenar sağda, rakip önde, rakip solda, hiçbir şey), sağda her durumun hamlesi.",
    katmanlar: [
      { sekil: { tur: "etiket", x: 97, y: 22, metin: "durum", hiza: "orta" }, renk: "mor", kelime: 2 },
      { sekil: { tur: "etiket", x: 298, y: 22, metin: "hamle", hiza: "orta" }, renk: "kirmizi", kelime: 4 },
      ...satir(36, "Kenar solda", "Geri + sağa dön", 12, 19),
      ...satir(80, "Kenar sağda", "Geri + sola dön", 12, 19),
      ...satir(124, "Rakip önde", "Tam ileri", 15, 19),
      ...satir(168, "Rakip solda", "Sola dön", 15, 19),
      ...satir(212, "Hiçbir şey", "Dönerek ara", 16, 19)
    ]
  },
  /* "Lab'daki ligde robotlar Python ile yazılır… fonksiyon iki motorun gücünü döndürür." */
  "kartlardan-koda": {
    aciklama: "Solda bir kart: 'Rakip önde → Tam ileri'. Ok, sağdaki Python koduna gidiyor: def hamle(robot), if r[2] == 1, return [255, 255].",
    katmanlar: [
      { sekil: { tur: "kutu", x: 12, y: 64, g: 150, y2: 70, dolgu: "beyaz", kose: 12 }, renk: "mor", kelime: 0 },
      { sekil: { tur: "etiket", x: 87, y: 92, metin: "Rakip önde", hiza: "orta" }, renk: "murekkep", kelime: 0 },
      { sekil: { tur: "etiket", x: 87, y: 120, metin: "Tam ileri", hiza: "orta" }, renk: "kirmizi", kelime: 0 },
      { sekil: { tur: "ok", noktalar: [[166, 99], [194, 99]] }, renk: "mor", kelime: 3 },
      { sekil: { tur: "kutu", x: 198, y: 30, g: 194, y2: 170, dolgu: "siyah", kose: 12 }, renk: "murekkep", kelime: 3 },
      { sekil: { tur: "etiket", x: 210, y: 64, metin: "def hamle(robot):", hiza: "sol" }, renk: "beyaz", kelime: 10 },
      { sekil: { tur: "etiket", x: 226, y: 104, metin: "if r[2] == 1:", hiza: "sol" }, renk: "sari", kelime: 12 },
      { sekil: { tur: "etiket", x: 242, y: 144, metin: "return [255,255]", hiza: "sol" }, renk: "beyaz", kelime: 13 },
      { sekil: { tur: "etiket", x: 295, y: 236, metin: "iki motorun gücü", hiza: "orta" }, renk: "mor", kelime: 15 }
    ]
  }
} satisfies Record<string, Cizim>);

export const gorselVarMi = (tur: "sahne" | "cizim", ad: string) => (tur === "sahne" ? ad in SAHNE_ANLARI : ad in CIZIMLER);

/** Hangi katmanlar görünür. Ses okurken kelimeye göre (kelime: okunan kelimenin sırası), yoksa saniyeye göre (her katman
    sırası gelince, saniyede bir). Hareketi azalt açıksa ya da okuma bittiyse hepsi. Sonuç: görünen katmanların sıraları. */
/* labirent ve ilkokul (mBot) modüllerinin çizimleri ayrı dosyalarda (metinleriyle birlikte) */
Object.assign(CIZIMLER, LABIRENT_CIZIMLERI, MBOT_CIZIMLERI, KONTROL_CIZIMLERI);

export function gorunenKatmanlar(c: Cizim, o: { kelime?: number; saniye?: number; bitti?: boolean; azHareket?: boolean }): number[] {
  const hepsi = c.katmanlar.map((_, i) => i);
  if (o.azHareket || o.bitti) return hepsi;
  if (o.kelime !== undefined) {
    let enSon = -1;
    return hepsi.filter((i) => {
      const k = c.katmanlar[i].kelime;
      const goster = k === undefined ? i <= enSon + 1 : k <= o.kelime!;
      if (goster) enSon = i;
      return goster;
    });
  }
  const n = Math.floor((o.saniye ?? 0) / 1) + 1;
  /* saniye: aynı kelimeye bağlı katmanlar birlikte belirir */
  const gruplar = [...new Set(c.katmanlar.map((k, i) => k.kelime ?? 1000 + i))].sort((a, b) => a - b);
  const sinir = gruplar[Math.min(n, gruplar.length) - 1];
  return hepsi.filter((i) => (c.katmanlar[i].kelime ?? 1000 + i) <= sinir);
}
