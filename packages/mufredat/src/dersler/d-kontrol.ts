/* Çizgi İzleyen Robot · 4. ders: türev (D) kontrol, salınımı söndürmek. */
import type { DersTanimi } from "../ders";

export const D_KONTROL: DersTanimi = {
  kimlik: "d-kontrol",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "D kontrol: sallanmayı söndürmek",
  kazanim: "Türev (D) teriminin hatanın değişimine tepki vererek salınımı nasıl azalttığını açıklar; Kd'yi deneyle ayarlar.",
  sure: 35,
  robot: "SiroLine",
  anlat: [
    {
      bit: "sasiriyor",
      metin: "Kp büyük olunca robot çizgiye hızla döner ama çizginin üstünden geçip öbür tarafa taşar. Sonra geri döner, yine taşar: sallanma başlar.",
      seslendirme: "K p büyük olunca robot çizgiye hızla döner ama çizginin üstünden geçip öbür tarafa taşar. Sonra geri döner, yine taşar: sallanma başlar.",
      gorsel: { tur: "cizim", ad: "sallanan-iz" }
    },
    {
      bit: "dusunuyor",
      metin: "Kd hatanın ne kadar hızlı değiştiğine bakar: değişim eşittir hata eksi son hata. Robot çizgiye hızla yaklaşırken değişim büyüktür. Kd çarpı değişim dönüşü erkenden azaltır, tıpkı bir fren gibi.",
      seslendirme: "K d hatanın ne kadar hızlı değiştiğine bakar: değişim eşittir hata eksi son hata. Robot çizgiye hızla yaklaşırken değişim büyüktür. K d çarpı değişim dönüşü erkenden azaltır, tıpkı bir fren gibi.",
      gorsel: { tur: "cizim", ad: "hata-grafigi" },
      soru: {
        soru: "Robot çizgiye hızla yaklaşıyor, hata hızla küçülüyor. D terimi ne yapar?",
        secenekler: [{ metin: "Dönüşü artırır" }, { metin: "Dönüşü azaltır, fren gibi davranır", dogru: true }, { metin: "Hiçbir şey yapmaz" }],
        aciklama: "Hata küçülürken değişim ters işaretlidir; Kd × değişim düzeltmeyi azaltır. Robot çizgiyi geçmeden yumuşakça oturur."
      }
    },
    {
      bit: "ipucu",
      metin: "Kd'nin de fazlası zararlıdır: çok büyük Kd her küçük titreşime tepki verir, robot titrer ve yavaşlar. Gerçek robotta en iyi değer simülasyondakinden farklı olabilir; o yüzden adım adım dene.",
      seslendirme: "K d'nin de fazlası zararlıdır: çok büyük K d her küçük titreşime tepki verir, robot titrer ve yavaşlar. Gerçek robotta en iyi değer simülasyondakinden farklı olabilir; o yüzden adım adım dene.",
      gorsel: { tur: "sahne", ad: "siroline-siyah-zemin" }
    }
  ],
  dene: {
    bilesen: "cizgi-simulasyonu",
    ayar: { pist: "s-viraj", acik: ["kd"], sabit: { kp: 0.06, taban: 100 } },
    yonerge: "Kp 0,06: robot sallanıyor. Kd'yi artırarak sallanmayı söndür. En az üç farklı Kd dene; çok büyük Kd'de ne oluyor?",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "ayar", pist: "s-viraj", acik: ["kd"], sabit: { kp: 0.06, taban: 100 },
    degerlendirme: { olcut: "sapma", esikler: [15, 6, 3], enCokSure: 5 },
    yonerge: "Sallanan robotu Kd ile sakinleştir. Tur 5 saniyede bitmeli; ortalama sapma 15 milimetrenin altındaysa bir, 6'nın altındaysa iki, 3'ün altındaysa üç yıldız."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }],
    adimlar: [
      "mBlock'ta Kd'yi 0 yap ve Kp'yi robotun sallanmaya başladığı bir değere çıkar (önceki derste bulduğunun iki-üç katı).",
      "Robotu pistte çalıştır ve sallanmayı izle.",
      "Kp'yi değiştirmeden Kd'yi adım adım artır; her seferinde programı yükleyip dene.",
      "Sallanmanın kaybolduğu en küçük Kd'yi ve çok büyük Kd'de ne olduğunu defterine yaz."
    ],
    guvenlik: "Programı yüklerken robotu kapalı tut ya da tekerlekleri havada olsun."
  }
};
