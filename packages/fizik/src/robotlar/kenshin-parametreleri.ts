/* Kenshin mini sumo robotunun fizik parametreleri.
   Her değerin kaynağı yanında: [ölçüldü] dijital kumpas / tartı, [ürün] sivasrobotik.com.tr ürün sayfası, [tahmin] mühendislik tahmini.
   Ölçüm kılavuzundan gelen değerler yalnız bu dosyada değiştirilir. Birimler: metre, kilogram, saniye, newton. */
export const KENSHIN_FIZIK = {
  /** toplam kütle [ürün] 470 g */
  kutle: 0.47,
  /** tekerler ve göbekleri dahil tek teker kütlesi [tahmin] */
  tekerKutlesi: 0.015,
  /** kütle merkezi, robot ekseninde (x ileri, y yukarı) [tahmin: pil ve motorların yerinden]; denge testiyle ölçülecek */
  kutleMerkezi: { x: -0.008, y: 0.014, z: 0 },
  /** boy: teker arkası → bıçak ucu [ölçüldü] 98,4 mm; en: bıçak [ölçüldü] 100 mm */
  boy: 0.0984,
  en: 0.1,
  /** teker çapı 30 mm [ürün], eni 23 mm [ölçüldü, fotoğraftan] */
  tekerYaricap: 0.015,
  tekerEni: 0.023,
  /** teker ekseni: robotun arkasından teker yarıçapı kadar önde [ölçüldü]; tekerler dış kenara dayalı */
  tekerX: -0.035,
  tekerZ: 0.0385,
  /** bıçak: uç zeminde, eğim ≈ 49° (uç 50 mm önde, üst 37 mm yükseklikte, 32 mm geride) [ölçüldü, fotoğraftan] */
  bicak: { ucX: 0.05, ustX: 0.016, ustY: 0.037, ucBosluk: 0.0004 },
  /** gövdenin zeminden yüksekliği (alt plaka) [fotoğraftan] */
  tabanBoslugu: 0.0025,
  motor: {
    /** teker boştaki devri 800 rpm [ürün] */
    bosDevir: (800 * 2 * Math.PI) / 60,
    /** teker milindeki durma torku, N·m [tahmin: mikro redüktörlü motor sınıfı]; itme kuvveti ölçümüyle kalibre edilecek */
    durmaTorku: 0.05,
    /** komutun motora yansıma zaman sabiti, sn [tahmin] */
    gecikme: 0.03,
    /** bu oranın altındaki PWM tekeri döndürmez [tahmin] */
    oluBolge: 0.06
  },
  malzeme: {
    /** silikon lastik ile ring: tutuş [tahmin]; eğik düzlem testiyle ölçülecek */
    lastik: { ad: "kenshin-lastik", surtunme: 1.0, sekme: 0.05 },
    /** çelik bıçak, kapton bantlı uç [tahmin] */
    bicak: { ad: "kenshin-bicak", surtunme: 0.25, sekme: 0.02 },
    govde: { ad: "kenshin-govde", surtunme: 0.35, sekme: 0.1 }
  }
} as const;
