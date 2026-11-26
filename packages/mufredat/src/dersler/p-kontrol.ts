/* Çizgi İzleyen Robot · 3. ders: oransal (P) kontrol, hata ve Kp. */
import type { DersTanimi } from "../ders";

export const P_KONTROL: DersTanimi = {
  kimlik: "p-kontrol",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "P kontrol: ne kadar uzaksan o kadar dön",
  kazanim: "Oransal kontrolde hata ile düzeltme arasındaki ilişkiyi açıklar; Kp'nin küçük ve büyük değerlerinin etkisini deneyle gösterir.",
  sure: 35,
  robot: "SiroLine",
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Robotun hedefi konumu 3500'de tutmak. Konum ile 3500 arasındaki farka hata deriz: hata eşittir konum eksi 3500. Çizgi soldaysa hata eksi, sağdaysa artı çıkar.",
      seslendirme: "Robotun hedefi konumu üç bin beş yüzde tutmak. Konum ile üç bin beş yüz arasındaki farka hata deriz: hata eşittir konum eksi üç bin beş yüz. Çizgi soldaysa hata eksi, sağdaysa artı çıkar.",
      gorsel: { tur: "cizim", ad: "hata-duzeltme" }
    },
    {
      bit: "dusunuyor",
      metin: "Düzeltme eşittir Kp çarpı hata. Sol motor taban hıza düzeltmeyi ekler, sağ motor çıkarır. Hata büyükse robot sert, küçükse yumuşak döner.",
      seslendirme: "Düzeltme eşittir K p çarpı hata. Sol motor taban hıza düzeltmeyi ekler, sağ motor çıkarır. Hata büyükse robot sert, küçükse yumuşak döner.",
      gorsel: { tur: "sahne", ad: "siroline-siyah-zemin" },
      soru: {
        soru: "Kp = 0,02 ve hata = 1000 ise düzeltme kaç olur?",
        secenekler: [{ metin: "2" }, { metin: "20", dogru: true }, { metin: "200" }],
        aciklama: "0,02 × 1000 = 20. Taban hız 100 ise sol motor 120, sağ motor 80 güçle döner: robot sağa, çizgiye doğru döner."
      }
    },
    {
      bit: "sasiriyor",
      metin: "Kp çok küçükse robot virajda yeterince dönemez ve pistten çıkar. Kp çok büyükse her küçük hatada sert döner ve sağa sola sallanır.",
      seslendirme: "K p çok küçükse robot virajda yeterince dönemez ve pistten çıkar. K p çok büyükse her küçük hatada sert döner ve sağa sola sallanır.",
      gorsel: { tur: "cizim", ad: "kp-izleri" }
    },
    {
      bit: "ipucu",
      metin: "Doğru Kp ne çok küçük ne çok büyüktür. Deneyde Kp'yi değiştir, robotun izine ve hata grafiğine bak: iyi ayarda hata sıfırın çevresinde küçük kalır.",
      seslendirme: "Doğru K p ne çok küçük ne çok büyüktür. Deneyde K p'yi değiştir, robotun izine ve hata grafiğine bak: iyi ayarda hata sıfırın çevresinde küçük kalır.",
      gorsel: { tur: "sahne", ad: "siroline-bant-ustunde" }
    }
  ],
  dene: {
    bilesen: "cizgi-simulasyonu",
    ayar: { pist: "s-viraj", acik: ["kp"], sabit: { kd: 0, taban: 100 } },
    yonerge: "Kd sıfır: yalnız P var. Kp'yi önce çok küçük, sonra çok büyük seç ve robotu koştur. En az üç farklı Kp dene; izi ve hata grafiğini karşılaştır.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "ayar", pist: "s-viraj", acik: ["kp"], sabit: { kd: 0, taban: 100 },
    degerlendirme: { olcut: "sapma", esikler: [40, 20, 14] },
    yonerge: "S virajlarını robot çizgiden olabildiğince az saparak bitirsin. Ortalama sapma 40 milimetrenin altındaysa bir, 20'nin altındaysa iki, 14'ün altındaysa üç yıldız."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }],
    adimlar: [
      "mBlock'ta SiroLine programını aç. \"Ayarla Taban Hız, Ek Hız, Kp, Kd\" bloğunda Kd'yi 0, Ek Hız'ı 0 yap; Taban Hız 100 kalsın.",
      "Kp'yi çok küçük bir değere ayarla, programı yükle ve robotu pistte çalıştır. Virajlarda ne oluyor?",
      "Kp'yi büyük bir değere ayarla ve tekrar dene. Robotun hareketini defterine çiz.",
      "Arada bir Kp bul: robot pisti en az sallanarak bitirsin. Bulduğun değeri defterine yaz."
    ],
    guvenlik: "Programı yüklerken robotu kapalı tut ya da tekerlekleri havada olsun.",
    ogretmenNotu: "Simülasyonda iyi sonuç Kp 0,015–0,02 civarındadır; gerçek robotta döngü hızı ve pist farklı olduğu için değer değişebilir. Amaç küçük ve büyük Kp'nin farkını gözlemlemektir."
  }
};
