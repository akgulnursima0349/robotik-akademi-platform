/* Çizgi İzleyen Robot · 2. ders: sensör okumalarından çizginin konumu (ağırlıklı ortalama) ve kalibrasyon. */
import type { DersTanimi } from "../ders";

export const CIZGI_KONUMU: DersTanimi = {
  kimlik: "cizgi-konumu",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "Çizgi nerede? Kalibrasyon ve konum",
  kazanim: "Sensör okumalarından çizginin konumunu ağırlıklı ortalamayla hesaplar; kalibrasyonun amacını açıklar.",
  sure: 30,
  robot: "SiroLine",
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Sekiz sensör sekiz ayrı sayı verir. Ama robotun tek bir şeye karar vermesi gerekir: çizgi tam olarak nerede?",
      gorsel: { tur: "sahne", ad: "siroline-siyah-zemin" }
    },
    {
      bit: "dusunuyor",
      metin: "Her sensörün bir sırası var: en soldaki 0, en sağdaki 7. Sırayı 1000 ile çarpar, sensörün değeriyle tartarız. Çizgiyi çok gören sensör hesaba çok, az gören az katılır. Sonuç 0 ile 7000 arasında bir konumdur.",
      seslendirme: "Her sensörün bir sırası var: en soldaki sıfır, en sağdaki yedi. Sırayı bin ile çarpar, sensörün değeriyle tartarız. Çizgiyi çok gören sensör hesaba çok, az gören az katılır. Sonuç sıfır ile yedi bin arasında bir konumdur.",
      gorsel: { tur: "cizim", ad: "agirlikli-ortalama" },
      soru: {
        soru: "Çizgi tam s[3] ile s[4]'ün arasındaysa konum kaç çıkar?",
        secenekler: [{ metin: "0" }, { metin: "3500", dogru: true }, { metin: "7000" }],
        aciklama: "s[3] ile s[4] çizgiyi eşit görür: 3000 ile 4000'in tam ortası 3500. Robotun hedefi konumu 3500'de tutmaktır."
      }
    },
    {
      bit: "anlatiyor",
      metin: "Hiçbir iki sensör birebir aynı değildir; ışık ve zemin de sınıftan sınıfa değişir. Kalibrasyonda robot her sensörün gördüğü en açık ve en koyu değeri ölçer, sonra okumaları 0 ile 1000 arasına yayar. Böylece bütün sensörler aynı ölçekle konuşur.",
      seslendirme: "Hiçbir iki sensör birebir aynı değildir; ışık ve zemin de sınıftan sınıfa değişir. Kalibrasyonda robot her sensörün gördüğü en açık ve en koyu değeri ölçer, sonra okumaları sıfır ile bin arasına yayar. Böylece bütün sensörler aynı ölçekle konuşur.",
      gorsel: { tur: "cizim", ad: "kalibrasyon" }
    },
    {
      bit: "ipucu",
      metin: "Çizgi hiçbir sensörün altında değilse robot onu en son gördüğü tarafta sanar: konum 0 ya da 7000 olur. Böylece virajdan taşan robot hangi yöne döneceğini bilir.",
      seslendirme: "Çizgi hiçbir sensörün altında değilse robot onu en son gördüğü tarafta sanar: konum sıfır ya da yedi bin olur. Böylece virajdan taşan robot hangi yöne döneceğini bilir.",
      gorsel: { tur: "sahne", ad: "siroline-bant-ustunde" }
    }
  ],
  dene: {
    bilesen: "sensor-gostergesi",
    ayar: { robot: "SiroLine", sensorSayisi: 8, zemin: "beyaz-uzerinde-siyah-bant", zeminSecilir: true, hesap: true, surukle: true },
    yonerge: "Robotu kaydır ve hesabı izle. Çizgiyi önce ortaya, sonra iki uca götür: konum ne zaman 0'a, 3500'e ve 7000'e yaklaşıyor? En az dört farklı sensörü dene.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "lab", modul: "cizgi", gorev: "s-viraj",
    yonerge: "Lab'daki S virajlarında cizgi_konumu() sana bu hesabın sonucunu verir, ama daha kolay bir ölçekle: −100 solda, 0 ortada, 100 sağda. Dönüşü konuma göre ayarla ve turu bitir."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }],
    adimlar: [
      "Öğretmenin çizgi izleme programını yükledikten sonra SiroLine'ı aç. Robotu gövdesinden tut; tekerlekler havada dönsün.",
      "Robotu bandın birkaç milimetre üstünde tut ve bandı soldaki sensörlerin altına getir. Hangi teker hızlandı, hangisi yavaşladı?",
      "Şimdi bandı sağdaki sensörlerin altına getir. Tekerlerin hızı nasıl değişti?",
      "Bandı tam ortaya getir: iki teker aynı hızda mı dönüyor? Üç gözlemini defterine yaz."
    ],
    guvenlik: "Dönen tekerlere parmağını değdirme; robotu yalnız gövdesinden tut.",
    ogretmenNotu: "Programda kalibrasyon adımı varsa önce onu yapın. Beklenen gözlem: çizgi soldayken sol teker yavaşlar, sağ teker hızlanır (robot sola döner); ortadayken iki teker eşit döner."
  }
};
