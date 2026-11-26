/* Mini Sumo modülü (Kenshin): altı ders. Kurallar MEB Robot Yarışması 2026 mini sumo kategorisinden; fizik Lab'daki ligin aynısı. */
import type { DersTanimi } from "../ders";

const ORTAK = { atolye: "robotik", modul: "sumo", seviyeler: ["ortaokul"], robot: "Kenshin" } as const;
const HEPSI = ["kenar-sol", "kenar-sag", "rakip-onde", "rakip-solda", "rakip-sagda", "hicbiri"] as const;
const BIRINCI_DERS_SABIT = { "kenar-sol": "bekle", "kenar-sag": "bekle", "rakip-solda": "sola-don", "rakip-sagda": "saga-don" } as const;

export const SUMO_KURALLARI: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "sumo-kurallari",
  ad: "Sumo kuralları ve ring",
  kazanim: "Mini sumo yarışmasının ring, robot ve maç kurallarını açıklar.",
  sure: 30,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Mini sumoda iki robot yuvarlak bir ringde karşılaşır; amaç rakibi ringin dışına itmektir. Ringin adı dohyo: 77 santimetre çapında, siyah zeminli, kenarında 2,5 santimetrelik beyaz bir çizgi var.",
      gorsel: { tur: "cizim", ad: "dohyo-olculeri" }
    },
    {
      bit: "dusunuyor",
      metin: "Robot en çok 10 santimetreye 10 santimetre olabilir ve en çok 500 gram gelebilir; yüksekliği serbesttir. Kenshin 10 × 10 santimetre ve yaklaşık 470 gram: sınırların içinde ama çok yakın.",
      gorsel: { tur: "sahne", ad: "kenshin-ring" },
      soru: {
        soru: "Bir robot tartıda 520 gram geliyor. Ne olur?",
        secenekler: [{ metin: "Yarışabilir; ağır olmak avantajdır" }, { metin: "Yarışamaz; önce hafifletilmeli", dogru: true }, { metin: "Yalnız ilk raunda çıkabilir" }],
        aciklama: "Kural en çok 500 gram diyor; tartıdan geçemeyen robot ringe çıkamaz. Ağırlık itmede işe yarar ama sınırın içinde kalmalı."
      }
    },
    {
      bit: "anlatiyor",
      metin: "Robotlar kahverengi başlangıç çizgilerinin arkasına konur. Hakem iki robotu kumandayla aynı anda başlatır; Kenshin'in start modülü bu sinyali alır. Robot ilk 10 saniyede hareket etmezse raundu kaybeder.",
      gorsel: { tur: "sahne", ad: "kenshin-baslatma" }
    },
    {
      bit: "ipucu",
      metin: "Maç üç raunttur; iki raundu alan kazanır. Ringin dışına düşen ya da 10 saniye kıpırdamayan robot raundu kaybeder. Simülasyonda raunt kısa olsun diye 10 saniye sürer.",
      gorsel: { tur: "cizim", ad: "dohyo-olculeri" }
    }
  ],
  dene: {
    bilesen: "ring-simulasyonu",
    ayar: { acik: ["rakip-onde", "hicbiri"], sabit: BIRINCI_DERS_SABIT, rakip: "bekleyen" },
    yonerge: "Bu derste iki kartı sen seçiyorsun: 'Rakip önde' ve 'Hiçbir şey görmüyorum'. Önce ikisini de 'Tam ileri' yap; sonra başka hamleler dene. Üç başlangıcın her birinde ne oluyor? En az üç deneme yap.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "strateji", acik: ["rakip-onde", "hicbiri"], sabit: BIRINCI_DERS_SABIT,
    degerlendirme: { olcut: "kalmak", rakipler: ["bekleyen"] },
    yonerge: "Ringde kal ama kıpırda: kural gereği hareket etmeyen robot raundu kaybeder. Üç başlangıcın her birinde ringde kalırsan bir yıldız."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 1 }, { parca: "sumo-ringi", adet: 1 }, { parca: "cetvel", adet: 1 }, { parca: "mutfak-tartisi", adet: 1 }],
    adimlar: [
      "Ringi incele: çapını, beyaz çizginin enini ve başlangıç çizgilerinin yerini cetvelle ölç.",
      "Kenshin'i cetvelle ölç ve tartıyla tart. Sınırların içinde mi?",
      "Öğretmenin iki robotu kumandayla başlatırken izle: start modülü sinyali alınca robotlar ne yapıyor?",
      "Kuralları kendi cümlelerinle defterine yaz: ring, robot, başlangıç ve raunt."
    ],
    guvenlik: "Robotu gövdesinden tut; bıçağa ve dönen tekerleklere parmağını yaklaştırma.",
    ogretmenNotu: "Kenshin'de seçilebilen başlangıç taktikleri var (ürün sayfasına göre sekiz tane); bu derste yalnız start modülüyle başlatmayı gösterin. Kurallar MEB Robot Yarışması 2026 mini sumo kategorisinden."
  }
};

export const RAKIBI_GORMEK: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "rakibi-gormek",
  ad: "Rakibi görmek",
  kazanim: "Kenshin'in rakip sensörlerinin yönlerini, menzilini ve kör noktalarını açıklar.",
  sure: 30,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Kenshin'in beş rakip sensörü var: solda ve sağda birer yan sensör, önde sol ön, orta ve sağ ön. Her biri dar bir çizgi boyunca bakar ve 60 santimetreye kadar görür.",
      gorsel: { tur: "cizim", ad: "sensor-gorus-alani" }
    },
    {
      bit: "dusunuyor",
      metin: "Sensör bir şey görünce 1, görmeyince 0 verir. Lab'da bunu robot[\"rakip\"] dizisinde okursun: sol yan, sol ön, orta, sağ ön, sağ yan.",
      seslendirme: "Sensör bir şey görünce bir, görmeyince sıfır verir. Lab'da bunu robot rakip dizisinde okursun: sol yan, sol ön, orta, sağ ön, sağ yan.",
      gorsel: { tur: "sahne", ad: "kenshin-sensorler" },
      soru: {
        soru: "robot[\"rakip\"] = [0, 0, 1, 0, 0] ise rakip nerede?",
        secenekler: [{ metin: "Solda" }, { metin: "Tam önde", dogru: true }, { metin: "Arkada" }],
        aciklama: "Yalnız orta sensör 1 veriyor: rakip tam karşında. Saldırma zamanı!"
      }
    },
    {
      bit: "sasiriyor",
      metin: "Sensörlerin arasındaki boşluklara kör nokta denir. Rakip tam arkadaysa ya da iki ışının arasında kalırsa Kenshin onu göremez. Bu yüzden hiçbir şey görmeyen robot dönerek aramalıdır.",
      gorsel: { tur: "cizim", ad: "sensor-gorus-alani" }
    }
  ],
  dene: {
    bilesen: "sensor-gorusu",
    ayar: {},
    yonerge: "Rakibi ringde sürükle (ok tuşlarıyla da kayar). Hangi sensörler görüyor? Bir kör nokta bul: rakip yakında ama hiçbir sensör görmüyor. En az dört farklı sensör birleşimi dene.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "strateji", acik: ["rakip-onde", "rakip-solda", "rakip-sagda", "hicbiri"], sabit: { "kenar-sol": "bekle", "kenar-sag": "bekle" },
    degerlendirme: { olcut: "yenmek", rakipler: ["bekleyen"] },
    yonerge: "Bekleyen rakibi bul ve ringden çıkar. Görmüyorsan dönerek ara, görünce ona dön ve saldır. Üç başlangıcın her birinde kazanırsan bir yıldız."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 1 }, { parca: "karton-kutu", adet: 1 }],
    adimlar: [
      "Öğretmenin, rakibi görünce o yöne dönen bir program yükler. Kenshin'i masaya koy; tekerlekleri havada kalsın.",
      "Kutuyu robotun önünde, solunda ve sağında tut: tekerlekler hangi yöne dönmeye çalışıyor?",
      "Kutuyu arkaya ve iki sensörün arasına koy: robot fark ediyor mu?",
      "Gördüğün kör noktaları robotun çiziminin üstüne işaretle."
    ],
    guvenlik: "Tekerlekler dönerken robotu gövdesinden sıkı tut; tekerleğe ve bıçağa dokunma.",
    ogretmenNotu: "Rakibi gören sensöre göre dönen kısa bir programı mBlock'ta Kenshin uzantısının sensör ve motor bloklarıyla hazırlayın. Sensörlerin üstünde gösterge ışığı varsa onu da gösterin."
  }
};

export const RINGDE_KALMAK: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "ringde-kalmak",
  ad: "Ringde kalmak",
  kazanim: "Zemin sensörleriyle beyaz kenarı fark edip ringde kalmayı sağlayan kuralı kurar.",
  sure: 30,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Kenshin'in altında, önde iki zemin sensörü var: biri solda, biri sağda. Siyah zeminde 0 verir; beyaz kenar çizgisine gelince 1 olur.",
      seslendirme: "Kenshin'in altında, önde iki zemin sensörü var: biri solda, biri sağda. Siyah zeminde sıfır verir; beyaz kenar çizgisine gelince bir olur.",
      gorsel: { tur: "cizim", ad: "zemin-sensoru-kenar" }
    },
    {
      bit: "dusunuyor",
      metin: "Kenarı gören robot hemen durursa da tehlikededir: rakip onu dışarı itebilir. En iyisi geri çekilip ringin ortasına doğru dönmektir.",
      gorsel: { tur: "sahne", ad: "kenshin-ring" },
      soru: {
        soru: "Sol zemin sensörü beyazı gördü. Ringin ortası hangi tarafta kalır?",
        secenekler: [{ metin: "Sağda ve arkada", dogru: true }, { metin: "Solda ve önde" }, { metin: "Tam önde" }],
        aciklama: "Kenar solda ve önde; ringin ortası ters yönde, sağda ve arkada kalır. Bu yüzden geri çekilip sağa dönmek iyi bir hamledir."
      }
    },
    {
      bit: "ipucu",
      metin: "Kenar kuralları her şeyden önce gelir: rakip önünde olsa bile kenardaysan önce kendini kurtar. Kartlarda kenar satırları bu yüzden en üstte.",
      gorsel: { tur: "cizim", ad: "zemin-sensoru-kenar" }
    }
  ],
  dene: {
    bilesen: "ring-simulasyonu",
    ayar: { acik: [...HEPSI], rakip: "kacan", rakipSecilir: true },
    yonerge: "Kenar kartlarını önce 'Tam ileri' yap ve raundu oynat; sonra 'Geri çekil, sağa dön' gibi bir hamle seç. Ne değişti? En az üç deneme yap.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "strateji", acik: [...HEPSI], sabit: {},
    degerlendirme: { olcut: "kalmak", rakipler: ["kacan"] },
    yonerge: "Kaçan rakibe karşı üç başlangıcın hepsinde ringde kal. Kenar kartlarını iyi seç; geri çekilmeyi unutma. Her başlangıç bir yıldız."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 1 }, { parca: "sumo-ringi", adet: 1 }],
    adimlar: [
      "Öğretmenin, kenarı görünce geri çekilip dönen bir program yükler.",
      "Kenshin'i ringin ortasına koy ve başlat: kenara gelince ne yapıyor?",
      "Kenshin'i kenara doğru eğik bir açıyla gönder: hangi zemin sensörü önce görüyor, robot hangi yöne dönüyor?",
      "Gözlemlerini defterine çiz."
    ],
    guvenlik: "Ringin çevresinde, düşen robotu yakalayacak biri dursun.",
    ogretmenNotu: "Kenar kuralını mBlock'ta Kenshin uzantısının zemin sensörü bloklarıyla, diğer kurallardan önce gelen bir 'eğer' olarak kurun."
  }
};

export const ITME_FIZIGI: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "itme-fizigi",
  ad: "İtme fiziği: tutuş, ağırlık, bıçak",
  kazanim: "İtişmede ağırlığın, lastik tutuşunun ve bıçağın rolünü deneyle açıklar.",
  sure: 35,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "İki robot burun buruna ittiğinde tekerlekler zemine tutunarak iter. Lastik ne kadar iyi tutunuyorsa ve robot ne kadar ağırsa, o kadar güçlü iter.",
      gorsel: { tur: "cizim", ad: "itme-kuvvetleri" }
    },
    {
      bit: "dusunuyor",
      metin: "Bıçak yere çok yakın, eğik bir plakadır. Rakibin altına girince onu hafifçe kaldırır; kaldırılan robotun tekerlekleri zemine iyi basamaz ve tutuşunu kaybeder.",
      gorsel: { tur: "sahne", ad: "kenshin-ring" },
      soru: {
        soru: "Rakibin bıçağı senin robotunun altına girdi. Ne olur?",
        secenekler: [{ metin: "Tutuşun artar" }, { metin: "Tutuşun azalır, kolay itilirsin", dogru: true }, { metin: "Hiçbir şey değişmez" }],
        aciklama: "Kaldırılan robotun tekerlekleri zemine az basar; tutuşu düşer ve rakip onu kolayca iter."
      }
    },
    {
      bit: "ipucu",
      metin: "Kurallar ağırlığa üst sınır koyar ve keskin bıçağı yasaklar: bıçak kâğıdı kesmeyecek kadar körleştirilir. Kazanmanın yolu sınırın içinde iyi tutunmak ve rakibi önden, bıçakla karşılamaktır.",
      gorsel: { tur: "sahne", ad: "kenshin-tekerler" }
    }
  ],
  dene: {
    bilesen: "itme-deneyi",
    ayar: {},
    yonerge: "Ağırlığı, lastik tutuşunu ve bıçağı değiştir, iki robotu birbirine sür. Kim itiyor? En az üç farklı ayar dene.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "strateji", acik: [...HEPSI], sabit: {},
    degerlendirme: { olcut: "kalmak", rakipler: ["saldiran"] },
    yonerge: "Saldıran rakip tam güçle geliyor. Onu önden, bıçağınla karşıla ve ringde kal. Üç başlangıcın her birinde ringde kalırsan bir yıldız."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 2 }, { parca: "sumo-ringi", adet: 1 }, { parca: "mutfak-tartisi", adet: 1 }, { parca: "beyaz-a4-kagit", adet: 1 }],
    adimlar: [
      "Kenshin'in bıçağına, tekerleklerine ve gövdesine bak; ağırlığını tartıyla ölç.",
      "Öğretmeninle iki Kenshin'i önce kâğıdın üstünde, sonra ringin üstünde burun buruna sür. Hangisinde daha güçlü itiyorlar?",
      "Öğretmenin bıçağa kâğıt testi yaparken izle: bıçak kâğıdı kesmemeli.",
      "Bir robotun yanından itildiğinde ne olduğunu gözle ve defterine yaz."
    ],
    guvenlik: "Motorlar çalışırken tekerleklere ve bıçağa elini yaklaştırma; itişmeyi öğretmeninle birlikte yap.",
    ogretmenNotu: "Kâğıt üstünde lastikler kayar, ring yüzeyinde tutunur: farkı göstermek için iki robotu aynı programla (tam ileri) çalıştırın."
  }
};

export const SUMO_STRATEJI: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "sumo-strateji",
  ad: "Strateji: saldırı, kaçış, karşılama",
  kazanim: "Durum–hamle tablosuyla bir sumo stratejisi kurar ve farklı rakiplere göre düzeltir.",
  sure: 40,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Strateji, her durumda ne yapacağını önceden seçmektir. Kenshin her 20 milisaniyede bakar: kenar var mı, rakip nerede? Sonra tablodaki hamleyi yapar.",
      gorsel: { tur: "cizim", ad: "durum-hamle-tablosu" }
    },
    {
      bit: "dusunuyor",
      metin: "Saldıran rakibe yanını dönersen seni kolayca iter. Kaçan rakibi kovalarken kenara fazla yaklaşırsan kendin düşersin. Her rakip için en iyi hamle başka olabilir.",
      gorsel: { tur: "sahne", ad: "kenshin-ring" },
      soru: {
        soru: "Rakip yanında ve tam güçle sana geliyor. Hangisi daha iyi?",
        secenekler: [{ metin: "Yerinde dönüp yüzünü ona çevirmek", dogru: true }, { metin: "Olduğun yerde beklemek" }, { metin: "Ondan uzağa düz gitmek" }],
        aciklama: "Bıçağın önde: rakibi önden karşılarsan onu sen kaldırırsın. Yandan ya da arkadan yakalanan robot kolay itilir."
      }
    },
    {
      bit: "ipucu",
      metin: "Gerçek Kenshin'de raundun başı için seçilebilen başlangıç taktikleri var: doğrudan saldırmak, bir yana dönmek, beklemek ya da açı almak gibi. Kartlar aynı fikrin raunt boyunca süren hâlidir.",
      gorsel: { tur: "sahne", ad: "kenshin-baslatma" }
    }
  ],
  dene: {
    bilesen: "ring-simulasyonu",
    ayar: { acik: [...HEPSI], rakip: "arayan", rakipSecilir: true },
    yonerge: "Dört hazır rakibe karşı kartlarını dene. Her rakip için hangi kartı değiştirdin? En az dört deneme yap.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "strateji", acik: [...HEPSI], sabit: {},
    degerlendirme: { olcut: "mac", rakipler: ["arayan", "saldiran", "kacan"] },
    yonerge: "Üç hazır rakiple üçer rauntluk maç yap: Dönerek arayan, Saldıran ve Kaçan. Yendiğin her rakip bir yıldız. Aynı kartlarla üçünü de yenmeye çalış."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 2 }, { parca: "sumo-ringi", adet: 1 }],
    adimlar: [
      "Kartlarındaki stratejiyi defterine tablo olarak yaz: durum ve hamle.",
      "Öğretmeninle birlikte stratejini mBlock'ta Kenshin bloklarıyla kur.",
      "Bir arkadaşının robotuna karşı üç raunt yap.",
      "Kaybettiğin raundu düşün: hangi durumda hangi hamleyi değiştirirsin?"
    ],
    guvenlik: "Ringin çevresinde, düşen robotu yakalayacak biri dursun.",
    ogretmenNotu: "Durum–hamle tablosunu mBlock'ta Kenshin uzantısının sensör ve motor bloklarıyla iç içe 'eğer–değilse' bloklarına çevirin; kenar satırları en üstte olmalı."
  }
};

export const SUMO_LIG: DersTanimi = {
  ...ORTAK, seviyeler: [...ORTAK.seviyeler],
  kimlik: "sumo-lig",
  ad: "Lig: stratejini koda çevir",
  kazanim: "Strateji kartlarını Python koduna çevirir ve kodun her parçasının hangi karta karşılık geldiğini açıklar.",
  sure: 40,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Lab'daki ligde robotlar Python ile yazılır. Kenshin her 20 milisaniyede hamle(robot) fonksiyonunu çalıştırır; fonksiyon iki motorun gücünü döndürür.",
      seslendirme: "Lab'daki ligde robotlar Python ile yazılır. Kenshin her 20 milisaniyede hamle fonksiyonunu çalıştırır; fonksiyon iki motorun gücünü döndürür.",
      gorsel: { tur: "cizim", ad: "kartlardan-koda" }
    },
    {
      bit: "dusunuyor",
      metin: "Her kart kodda bir \"eğer\" satırıdır: if kenar solda, elif rakip önde… Kartların öncelik sırası, koddaki koşulların sırasıdır.",
      seslendirme: "Her kart kodda bir eğer satırıdır: if kenar solda, elif rakip önde. Kartların öncelik sırası, koddaki koşulların sırasıdır.",
      gorsel: { tur: "cizim", ad: "durum-hamle-tablosu" },
      soru: {
        soru: "Kodda 'rakip önde' koşulu kenar koşullarından önce yazılırsa ne olur?",
        secenekler: [{ metin: "Hiçbir şey değişmez" }, { metin: "Rakibi gören robot kenarda olsa bile ileri gider ve düşebilir", dogru: true }, { metin: "Robot hiç hareket etmez" }],
        aciklama: "Koşullar sırayla denenir; ilk tutan çalışır. Kenar kontrolü önde değilse rakibi kovalayan robot kendini ringden atabilir."
      }
    },
    {
      bit: "ipucu",
      metin: "Ligde sınıfının robotları ve hazır rakipler var. Kodunu Lab'da değiştirebilirsin: hızları, süreleri ya da yeni durumları dene.",
      gorsel: { tur: "sahne", ad: "kenshin-ring" }
    }
  ],
  dene: {
    bilesen: "kart-kodu",
    ayar: { acik: [...HEPSI] },
    yonerge: "Kartlarını seç ve kodun nasıl değiştiğini izle. Hazır olunca robotuna bir ad ver ve Lab'daki lige götür.",
    enAzFarkliDeger: 1
  },
  gorev: {
    tur: "lab", modul: "lig", gorev: "lig",
    yonerge: "Lab'daki Mini Sumo Ligi'nde turnuvayı başlat: robotun ligde kaydedilir. İstersen kodunu değiştirip yeniden dene."
  },
  gercek: {
    malzeme: [{ parca: "kenshin", adet: 1 }, { parca: "sumo-ringi", adet: 1 }],
    adimlar: [
      "Lab'daki kodunla mBlock'taki bloklarını karşılaştır: her if satırı hangi bloğa karşılık geliyor?",
      "Sınıf turnuvasında robotunla yarış.",
      "Turnuvadan sonra en çok kazanan stratejiyi sınıfla birlikte incele."
    ],
    ogretmenNotu: "Lab'da \"Sınıf turnuvası\" ile öğrencilerin gönderdiği robotları tahtada yarıştırabilirsiniz."
  }
};

export const SUMO_DERSLERI: DersTanimi[] = [SUMO_KURALLARI, RAKIBI_GORMEK, RINGDE_KALMAK, ITME_FIZIGI, SUMO_STRATEJI, SUMO_LIG];
