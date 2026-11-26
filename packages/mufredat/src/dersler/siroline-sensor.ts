/* Örnek ders: SiroLine'ın gözleri, kızılötesi sensör (ortaokul · Robotik · Çizgi İzleyen Robot). */
import type { DersTanimi } from "../ders";

export const SIROLINE_SENSOR: DersTanimi = {
  kimlik: "siroline-sensor",
  atolye: "robotik",
  modul: "cizgi",
  seviyeler: ["ortaokul"],
  ad: "SiroLine'ın gözleri: kızılötesi sensör",
  kazanim: "Kızılötesi yansıma sensörünün siyah ve beyaz yüzeyi nasıl ayırt ettiğini açıklar.",
  sure: 25,
  robot: "SiroLine",
  anlat: [
    {
      bit: "anlatiyor",
      metin: "SiroLine çizgiyi bizim gibi gözle görmez, ışıkla bulur. Altında yan yana sıralanmış sekiz küçük sensör var.",
      gorsel: { tur: "sahne", ad: "siroline-alttan", ayar: { vurgu: "sensorler" } }
    },
    {
      bit: "anlatiyor",
      metin: "Her sensörde iki parça vardır: gözümüzün göremediği kızılötesi ışığı yayan küçük bir lamba ve geri dönen ışığı ölçen bir alıcı.",
      gorsel: { tur: "cizim", ad: "sensor-isik-yolu" }
    },
    {
      bit: "dusunuyor",
      metin: "Beyaz zemin ışığın çoğunu geri yansıtır. Siyah bant ise ışığın çoğunu yutar. Alıcıya dönen ışığın miktarı, sensörün altındaki rengi ele verir.",
      gorsel: { tur: "cizim", ad: "beyaz-siyah-yansima" },
      soru: {
        soru: "Sensör siyah bandın tam üstündeyken alıcıya dönen ışık için hangisi doğru?",
        secenekler: [{ metin: "Çok ışık döner" }, { metin: "Az ışık döner", dogru: true }, { metin: "Renk fark etmez, hep aynı döner" }],
        aciklama: "Siyah yüzey kızılötesi ışığın çoğunu emer; alıcıya az ışık döner. SiroLine bu farkla çizgiyi bulur."
      }
    },
    {
      bit: "ipucu",
      metin: "Lab'da sensörleri s[0]'dan s[7]'ye kadar okursun. Hangi sensörün siyahı gördüğüne bakarak çizginin robotun neresinde kaldığını anlarsın.",
      seslendirme: "Lab'da sensörleri s sıfırdan s yediye kadar okursun. Hangi sensörün siyahı gördüğüne bakarak çizginin robotun neresinde kaldığını anlarsın.",
      gorsel: { tur: "sahne", ad: "siroline-bant-ustunde", ayar: { sensorIsiklari: true } }
    }
  ],
  dene: {
    bilesen: "sensor-gostergesi",
    ayar: { robot: "SiroLine", sensorSayisi: 8, zemin: "beyaz-uzerinde-siyah-bant", zeminSecilir: true, surukle: true },
    yonerge: "SiroLine'ı bandın üstünde sağa sola kaydır ve sensör ışıklarını izle. Çizgiyi en az üç farklı sensörün altına getir. Sonra sınıftaki pisti seç: siyah zeminde beyaz bant varken sayılar nasıl değişiyor?",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "lab", modul: "cizgi", gorev: "oval",
    yonerge: "Oval pistte ilk turu at. Ortadaki sensörlerden hangisi siyahı görüyorsa robotu o yöne çevir."
  },
  gercek: {
    malzeme: [{ parca: "siroline", adet: 1 }, { parca: "cizgi-pisti", adet: 1 }, { parca: "kamerali-telefon", adet: 1 }],
    adimlar: [
      "SiroLine'ı aç ve pistin üstüne koy. Motorları çalıştırma; robotu elinle hareket ettireceksin.",
      "Telefonun ön kamerasını aç ve robotun altındaki sensörlere tut. Gözünle göremediğin kızılötesi lambalar ekranda mor ışık olarak parlar.",
      "Robotu öyle bir yere koy ki beyaz bant tam ortadaki iki sensörün, s[3] ile s[4]'ün altında kalsın. Robotu, bandı ve sensörleri defterine çiz.",
      "Öğretmenin çizgi izleme programını yükleyince robotu pistte çalıştır. Robot banttan kaçarken hangi yöne döndüğünü izle ve defterine yaz."
    ],
    guvenlik: "Robotu kaldırırken tekerlekleri tut; motorlar beklenmedik anda çalışırsa robot masadan düşebilir.",
    ogretmenNotu: "Son adım için robota kitin çizgi izleme programını (Zemin: Siyah) dersten önce yükleyin. Kızılötesi ışığı çoğu telefonun ön kamerası gösterir; arka kamera çoğu zaman filtreler, önceden bir telefonla deneyin."
  }
};
