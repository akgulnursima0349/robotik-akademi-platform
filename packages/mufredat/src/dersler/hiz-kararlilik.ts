/* Çizgi İzleyen Robot · 5. ders: hız ile kararlılık dengesi. */
import type { DersTanimi } from "../ders";

export const HIZ_KARARLILIK: DersTanimi = {
  kimlik: "hiz-kararlilik",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "Hız mı, kararlılık mı?",
  kazanim: "Taban hız arttıkça kontrolün nasıl zorlaştığını açıklar; hızı, Kp'yi ve Kd'yi birlikte ayarlar.",
  sure: 35,
  robot: "SiroLine",
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Yarışta hızlı olmak isteriz. Ama taban hız artınca robot aynı sürede daha uzun yol gider. Çizgiden kaçtığını fark ettiğinde çoktan uzaklaşmıştır.",
      gorsel: { tur: "cizim", ad: "hiz-viraj" }
    },
    {
      bit: "dusunuyor",
      metin: "Hız değişince eski Kp ve Kd artık uymaz: robot ya virajdan kaçar ya da sallanmaya başlar. Bu yüzden hızı artırdıkça Kp ile Kd'yi de yeniden ayarlarız.",
      seslendirme: "Hız değişince eski K p ve K d artık uymaz: robot ya virajdan kaçar ya da sallanmaya başlar. Bu yüzden hızı artırdıkça K p ile K d'yi de yeniden ayarlarız.",
      gorsel: { tur: "sahne", ad: "siroline-siyah-zemin" },
      soru: {
        soru: "Taban hızı 100'den 200'e çıkardın, robot keskin virajda pistten çıkıyor. İlk ne denersin?",
        secenekler: [{ metin: "Kd'yi sıfırlamak" }, { metin: "Kp'yi biraz artırmak", dogru: true }, { metin: "Taban hızı 255 yapmak" }],
        aciklama: "Robot virajda yeterince dönemiyor: dönüşü güçlendirmek için Kp'yi biraz artırırsın. Sallanma başlarsa ardından Kd'yi düzeltirsin."
      }
    },
    {
      bit: "ipucu",
      metin: "Usta yarışçılar adım adım ilerler: hızı biraz artır, dene. Virajdan kaçıyorsa Kp'yi, sallanıyorsa Kd'yi düzelt. Her denemeyi ayar defterine yaz.",
      seslendirme: "Usta yarışçılar adım adım ilerler: hızı biraz artır, dene. Virajdan kaçıyorsa K p'yi, sallanıyorsa K d'yi düzelt. Her denemeyi ayar defterine yaz.",
      gorsel: { tur: "cizim", ad: "ayar-dongusu" }
    }
  ],
  dene: {
    bilesen: "cizgi-simulasyonu",
    ayar: { pist: "yaris", acik: ["taban", "kp", "kd"], sabit: {} },
    yonerge: "Yarış pistinde üç ayarı birlikte dene. Hızı artırınca robot nerede zorlanıyor? En az üç farklı ayar dene ve ayar defterine bak.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "lab", modul: "cizgi", gorev: "yaris",
    yonerge: "Lab'daki Yarış pistinde aynı fikri kodla yaz: hızı artır, fark (D) ile sallanmayı söndür ve en hızlı turu at."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }, { parca: "kronometre", adet: 1 }],
    adimlar: [
      "Önceki derslerde bulduğun Kp ve Kd ile başla; Taban Hız 100 olsun. Bir tur at ve süreyi kronometreyle ölç.",
      "Taban Hız'ı 20 artır, programı yükle ve tekrar dene.",
      "Robot virajdan kaçarsa Kp'yi, sallanırsa Kd'yi biraz değiştir.",
      "Her denemeyi ayar defterine yaz: Taban Hız, Kp, Kd ve süre."
    ],
    guvenlik: "Hızlı robot masadan düşebilir: pisti yerde kur ya da kenarlara engel koy."
  }
};
