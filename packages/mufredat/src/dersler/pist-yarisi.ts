/* Çizgi İzleyen Robot · 6. ders: sınıf pistine hazırlık, ayar defteri ve yarış. */
import type { DersTanimi } from "../ders";

export const PIST_YARISI: DersTanimi = {
  kimlik: "pist-yarisi",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "Pist yarışı ve ayar atölyesi",
  kazanim: "Gerçek pist için ayar planı yapar; denemelerini kaydederek en hızlı ve kararlı ayarı bulur.",
  sure: 40,
  robot: "SiroLine",
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Sınıftaki pist siyah zemin üstünde beyaz bant. Kitte Zemin seçimini Siyah yapınca robot beyaz bandı arar; konum ve PID hesabı aynı kalır.",
      seslendirme: "Sınıftaki pist siyah zemin üstünde beyaz bant. Kitte zemin seçimini siyah yapınca robot beyaz bandı arar; konum ve P I D hesabı aynı kalır.",
      gorsel: { tur: "sahne", ad: "siroline-siyah-zemin" }
    },
    {
      bit: "dusunuyor",
      metin: "Yarışta tek bir şanslı tur yetmez: robot her seferinde pisti bitirmeli. Kararlı ayar, robotun sallanmadan ve pistten çıkmadan bitirdiği ayardır.",
      gorsel: { tur: "sahne", ad: "siroline-bant-ustunde" },
      soru: {
        soru: "A ayarı turu 1,3 saniyede bitiriyor ama on denemenin dördünde pistten çıkıyor. B ayarı 1,5 saniyede bitiriyor ve hiç çıkmıyor. Yarışa hangisiyle girersin?",
        secenekler: [{ metin: "A ayarıyla" }, { metin: "B ayarıyla", dogru: true }],
        aciklama: "Pistten çıkan tur sayılmaz. B her seferinde bitirir; hızını sonra adım adım artırabilirsin."
      }
    },
    {
      bit: "ipucu",
      metin: "Ayar defteri tut: her denemede hızı, Kp'yi, Kd'yi ve süreyi yaz. Bir seferde yalnız tek şeyi değiştir; neyin işe yaradığını ancak böyle anlarsın.",
      seslendirme: "Ayar defteri tut: her denemede hızı, K p'yi, K d'yi ve süreyi yaz. Bir seferde yalnız tek şeyi değiştir; neyin işe yaradığını ancak böyle anlarsın.",
      gorsel: { tur: "cizim", ad: "ayar-dongusu" }
    }
  ],
  dene: {
    bilesen: "cizgi-simulasyonu",
    ayar: { pist: "siyah-zemin", acik: ["taban", "kp", "kd"], sabit: {} },
    yonerge: "Siyah zeminli pistte kitin örnek değerleriyle başla (Taban Hız 100, Kp 0,04, Kd 0,7). Bir seferde tek ayarı değiştir; en az dört deneme yap ve ayar defterine bak.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "ayar", pist: "siyah-zemin", acik: ["taban", "kp", "kd"], sabit: {},
    degerlendirme: { olcut: "sure", esikler: [5, 1.8, 1.45], enCokSapma: 15 },
    yonerge: "Siyah zeminli pistte en hızlı kararlı turu at: robot çizgiden ortalama 15 milimetreden fazla sapmamalı. Tur 5 saniyenin altındaysa bir, 1,8'in altındaysa iki, 1,45'in altındaysa üç yıldız."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }, { parca: "kronometre", adet: 1 }],
    adimlar: [
      "mBlock'ta \"Zemin: Siyah\" seçili olsun. Dene bölümünde bulduğun ayarlarla başla.",
      "Her ayarı üç kez dene ve süreleri kronometreyle ölç. Üçünde de bitirirse ayar kararlıdır.",
      "Ayar defterine Taban Hız, Kp, Kd ve üç süreyi yaz.",
      "Sınıf yarışına en iyi kararlı ayarınla katıl."
    ],
    guvenlik: "Hızlı robot masadan düşebilir: pisti yerde kur ya da kenarlara engel koy.",
    ogretmenNotu: "Yarışta her öğrenciye üç tur hakkı verin; bitirilen en iyi tur sayılır. Simülasyondaki değerler gerçek pist için yalnız başlangıç noktasıdır."
  }
};
