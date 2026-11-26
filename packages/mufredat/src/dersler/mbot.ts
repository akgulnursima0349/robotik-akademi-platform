/* İlkokul · Robot görevleri (mBot): sekiz ders, 1–4. sınıf. Her adım sesli okunur, cümleler kısa.
   Görevler ders sayfasında, kodsuz: kart programı (Kar Küreme şehri), bilmece, çizgi tablosu ve harita tasarımı.
   "Gerçek robotta" adımları mBot ve mBlock ile; blok adları şimdilik genel ("ileri git bloğu"). */
import type { DersTanimi } from "../ders";
import { MBOT_METINLERI as M } from "../gorseller-mbot";

const ORTAK = { atolye: "robotik", modul: "mbot", robot: "mBot" } as const;
const seviyeler = () => ["ilkokul" as const];
const MBLOCK = "Blok adları sınıftaki mBlock'un Türkçe arayüzünde biraz farklı olabilir; çocuklara bloğun rengini ve yerini gösterin.";
const ROBOT_MALZEME = [{ parca: "mbot", adet: 1 }, { parca: "mblock-cihaz", adet: 1 }];

export const MOTOR_VE_TEKER: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "motor-ve-teker",
  ad: "Motor ve tekerlek",
  kazanim: "Motorun tekeri çevirdiğini, tekerin bir turda çevresi kadar yol aldığını söyler; büyük tekerin daha uzağa gittiğini deneyle gösterir.",
  sure: 30,
  anlat: [
    { bit: "anlatiyor", metin: "Bu robotun adı mBot. Mavi bir gövdesi, iki tekeri ve birkaç sensörü var.", gorsel: { tur: "sahne", ad: "mbot-onden" } },
    { bit: "anlatiyor", metin: M.tekerTur, gorsel: { tur: "cizim", ad: "teker-cevresi" } },
    {
      bit: "dusunuyor", metin: M.buyukTeker, gorsel: { tur: "cizim", ad: "buyuk-kucuk-teker" },
      soru: {
        soru: "İki robotun tekerleri birer tur döndü. Hangisi daha uzağa gitti?",
        secenekler: [{ metin: "Tekeri büyük olan", dogru: true }, { metin: "Tekeri küçük olan" }, { metin: "İkisi aynı yere" }],
        aciklama: "Büyük tekerin çevresi daha uzun. Bir turda çevresi kadar yol alır."
      }
    },
    { bit: "ipucu", metin: "mBot'un tekeri yaklaşık 6 santimetre. Bir turda yaklaşık 20 santimetre gider: bir cetvel boyu kadar!", gorsel: { tur: "sahne", ad: "mbot-tekerler" } }
  ],
  dene: {
    bilesen: "teker", ayar: {},
    yonerge: "Tekerin boyunu ve tur sayısını değiştir. Teker ne kadar yol gidiyor? Üç farklı ayar dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kart", gorev: "mb-duz-sokak", yonerge: "Gece kar yağdı! Robotu ileri git kartlarıyla sür ve sokaktaki bütün karı temizle." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "cetvel", adet: 1 }, { parca: "maskeleme-bandi", adet: 1 }],
    adimlar: [
      "mBot'un tekerine bir parça kâğıt bant yapıştırıp işaret koy.",
      "Robotu yere koy, tekeri elinle tam bir tur çevirerek ilerlet. Ne kadar gitti? Cetvelle ölç.",
      "mBlock'ta \"ileri git\" bloğuyla robotu 1 saniye sür. Gittiği yolu yere bantla işaretle.",
      "Hızı artırıp yeniden dene: işaret nereye geldi?"
    ],
    guvenlik: "Robotu masanın kenarından uzakta çalıştır; düşebilir.",
    ogretmenNotu: "Teker çevresi yaklaşık 20 cm (çap ≈ 6,4 cm). Deneydeki teker boyunu değiştirme işi gerçek robotta yapılamaz; farklı boyda bir kapakla teker yuvarlayarak gösterebilirsiniz. " + MBLOCK
  }
};

export const DONMEK: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "donmek",
  ad: "Dönmek",
  kazanim: "İki tekerin hızı farklı olunca robotun döndüğünü, tekerler ters dönünce yerinde döndüğünü söyler.",
  sure: 30,
  anlat: [
    { bit: "anlatiyor", metin: M.ikiTeker, gorsel: { tur: "cizim", ad: "iki-teker-hizlari" } },
    {
      bit: "dusunuyor", metin: M.yerindeDon, gorsel: { tur: "cizim", ad: "yerinde-donus" },
      soru: {
        soru: "Sol teker hızlı, sağ teker yavaş dönüyor. Robot ne yapar?",
        secenekler: [{ metin: "Düz gider" }, { metin: "Sağa doğru döner", dogru: true }, { metin: "Sola doğru döner" }],
        aciklama: "Hızlı teker daha çok yol alır, robot yavaş tekerin yanına doğru döner: sağa."
      }
    },
    { bit: "ipucu", metin: "Programda dönmek kolay: Sağa dön ya da Sola dön kartı robotu yerinde çeyrek tur çevirir.", gorsel: { tur: "sahne", ad: "mbot-tekerler" } }
  ],
  dene: {
    bilesen: "iki-teker", ayar: {},
    yonerge: "Sol ve sağ tekerin hızını değiştir. Robot düz mü gidiyor, dönüyor mu, yerinde mi dönüyor? Üç farklı hareket bul.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kart", gorev: "mb-koseler", yonerge: "Sokak iki kez kıvrılıyor. İleri git, sağa dön ve sola dön kartlarıyla bütün karı temizle." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "maskeleme-bandi", adet: 1 }],
    adimlar: [
      "İki arkadaş el ele tutuşup \"iki teker\" olun. İkiniz de aynı hızda yürüyün: düz gidiyor musunuz?",
      "Şimdi biriniz yavaş, öteki hızlı yürüsün. Hangi yana döndünüz?",
      "mBlock'ta sol ve sağ motor hızını ayrı ayrı veren bloğu bul. Sol 50, sağ 20 yap ve robotu çalıştır.",
      "Sol 50, sağ -50 yap. Robot ne yaptı?"
    ],
    guvenlik: "El ele yürürken yavaş olun; çevrede eşya olmasın.",
    ogretmenNotu: "mBot'ta iki motor ayrı ayrı sürülebilir. Yerde kâğıt bantla bir köşe çizip robotu o köşeyi dönecek şekilde programlatabilirsiniz. " + MBLOCK
  }
};

export const SENSOR_NE_GORUR: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "sensor-ne-gorur",
  ad: "Sensör ne görür?",
  kazanim: "mBot'un ışık, çizgi ve mesafe sensörlerinin neyi algıladığını söyler; bir durumda sensörün ne göstereceğini tahmin eder.",
  sure: 30,
  anlat: [
    { bit: "anlatiyor", metin: M.sensorler, gorsel: { tur: "cizim", ad: "mbot-sensorleri" } },
    { bit: "anlatiyor", metin: "Işık sensörü odanın aydınlık mı karanlık mı olduğunu bilir. Çizgi sensörü yerin siyah mı beyaz mı olduğunu görür.", gorsel: { tur: "sahne", ad: "mbot-kart" } },
    { bit: "sasiriyor", metin: M.yanki, gorsel: { tur: "cizim", ad: "ultrasonik-yanki" } },
    {
      bit: "dusunuyor", metin: "Yarasalar da karanlıkta böyle yol bulur! Peki robot bir duvara yaklaşırsa ne olur?",
      gorsel: { tur: "sahne", ad: "mbot-onden" },
      soru: {
        soru: "mBot duvara yaklaştı. Mesafe sensörü ne gösterir?",
        secenekler: [{ metin: "Daha küçük bir sayı", dogru: true }, { metin: "Daha büyük bir sayı" }, { metin: "Hiç değişmez" }],
        aciklama: "Duvar yaklaştıkça dalga daha çabuk geri gelir; sensör daha küçük bir uzaklık gösterir."
      }
    }
  ],
  dene: {
    bilesen: "sensor-gezdirme", ayar: {},
    yonerge: "mBot'u masada gezdir: siyah bandın üstüne, lambanın altına, duvarın yanına götür. Sensörler ne görüyor? Dört farklı durum bul.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "bilmece",
    yonerge: "Beş bilmece var. Robot o yerde olsaydı sensörü ne gösterirdi? İlk denemede bilmeye çalış.",
    sorular: [
      { soru: "mBot karanlık bir dolabın içinde. Işık sensörü ne gösterir?", secenekler: ["Büyük bir sayı", "Küçük bir sayı"], dogru: 1, aciklama: "Karanlıkta ışık az; ışık sensörü küçük bir sayı gösterir." },
      { soru: "mBot beyaz kâğıdın üstünde. Çizgi sensörü ne görür?", secenekler: ["Siyah", "Beyaz"], dogru: 1, aciklama: "Beyaz kâğıt ışığı geri yansıtır; sensör beyaz görür." },
      { soru: "mBot siyah bandın tam üstünde. Çizgi sensörü ne görür?", secenekler: ["Siyah", "Beyaz", "Hiçbir şey"], dogru: 0, aciklama: "Siyah bant ışığı yutar; sensör siyah görür." },
      { soru: "Önünde hiç engel olmayan uzun bir koridor var. Mesafe sensörü ne gösterir?", secenekler: ["Çok küçük bir sayı", "Büyük bir sayı"], dogru: 1, aciklama: "Engel uzakta: dalga geç gelir, sayı büyüktür." },
      { soru: "mBot'un önüne bir kitap koydun, araları bir parmak kadar. Hangi sensör bunu anlar?", secenekler: ["Işık sensörü", "Çizgi sensörü", "Mesafe sensörü"], dogru: 2, aciklama: "Öndeki engeli mesafe sensörü görür: kitap çok yakın." }
    ]
  },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "siyah-elektrik-bandi", adet: 1 }, { parca: "beyaz-a4-kagit", adet: 1 }, { parca: "el-feneri", adet: 1 }],
    adimlar: [
      "Beyaz kâğıda siyah bant yapıştır.",
      "mBlock'ta sensör değerini ekranda gösteren bloğu kullan. Robotu kâğıdın ve bandın üstünde gezdir: sayı nasıl değişiyor?",
      "El fenerini mBot'un üstüne tut, sonra elinle gölge yap. Işık sensörünün sayısı ne oldu?",
      "Elini mBot'un önünde yavaşça yaklaştır. Mesafe sensörünün sayısı küçülüyor mu?"
    ],
    guvenlik: "El fenerini kimsenin gözüne tutma.",
    ogretmenNotu: "mBot'un ışık sensörü kartın üstünde, çizgi sensörü önde altta, ultrasonik mesafe sensörü önde. Ultrasonik sensör yaklaşık 3 cm'den yakını iyi ölçemez. " + MBLOCK
  }
};

export const EGER_DEGILSE: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "eger-degilse",
  ad: "Eğer–değilse",
  kazanim: "Robotun sensöre bakarak iki seçenekten birini yaptığı programı (eğer–değilse) kartlarla kurar.",
  sure: 35,
  anlat: [
    { bit: "anlatiyor", metin: M.eger, gorsel: { tur: "cizim", ad: "eger-degilse" } },
    {
      bit: "dusunuyor", metin: "Bunu biz de yaparız: Eğer yağmur yağıyorsa şemsiye alırım, değilse almam.", gorsel: { tur: "cizim", ad: "eger-degilse" },
      soru: {
        soru: "\"Eğer önü kapalıysa sağa dön, değilse ileri git.\" Robotun önü açık. Ne yapar?",
        secenekler: [{ metin: "Sağa döner" }, { metin: "İleri gider", dogru: true }, { metin: "Durur" }],
        aciklama: "Önü kapalı değil, öyleyse \"değilse\" kısmı çalışır: robot ileri gider."
      }
    },
    { bit: "ipucu", metin: "Eğer kartını Tekrarla kartının içine koyarsan robot her adımda yeniden bakar ve karar verir.", gorsel: { tur: "cizim", ad: "eger-degilse" } }
  ],
  dene: {
    bilesen: "karar", ayar: {},
    yonerge: "Robotun önüne bina koy ve kaldır. Eğer kartının hangi kolu çalışıyor? İkisini de dene.",
    enAzFarkliDeger: 2
  },
  gorev: { tur: "kart", gorev: "mb-eger", yonerge: "İki sokak var, ikisinde de aynı program çalışmalı. Robot köşeye gelince önü kapanır: eğer kartıyla karar ver." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "karton-kutu", adet: 1 }],
    adimlar: [
      "Bir arkadaşın \"robot\" olsun. Sen kuralı söyle: \"Eğer önün kapalıysa sağa dön, değilse bir adım ilerle.\"",
      "Sınıfta sandalye ya da kutularla küçük bir yol kurun; robot arkadaşınız kuralla yürüsün.",
      "mBlock'ta \"eğer–değilse\" bloğunu bul. İçine mesafe sensörünü koy: eğer mesafe 10 cm'den azsa dön, değilse ileri git.",
      "Programı \"sürekli tekrarla\" bloğunun içine koy, robotun önüne kutu tut."
    ],
    guvenlik: "Robot arkadaş gözleri açık, yavaş yürür.",
    ogretmenNotu: "mBot'un fabrika programındaki \"engelden kaçma\" modu da aynı fikirle çalışır. " + MBLOCK
  }
};

export const DONGU_VE_SENSOR: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "dongu-ve-sensor",
  ad: "Döngü ve sensör",
  kazanim: "Kaç kez tekrarlanacağı bilinmeyen işi \"… olduğu sürece\" kartıyla programlar.",
  sure: 35,
  anlat: [
    { bit: "anlatiyor", metin: "Tekrarla kartı bir işi kaç kez yapacağını bilir: 3 kez, 5 kez. Ama sokağın kaç kare olduğunu bilmiyorsak?", gorsel: { tur: "cizim", ad: "surece-dongu" } },
    { bit: "anlatiyor", metin: M.surece, gorsel: { tur: "cizim", ad: "surece-dongu" } },
    {
      bit: "dusunuyor", metin: "Aynı program kısa sokakta da uzun sokakta da çalışır. Robot her adımda önüne bakar.", gorsel: { tur: "cizim", ad: "surece-dongu" },
      soru: {
        soru: "\"Önü açık olduğu sürece ileri git.\" Sokak 7 kare. Robot ne zaman durur?",
        secenekler: [{ metin: "3 adım sonra" }, { metin: "Sokağın sonunda, önü kapanınca", dogru: true }, { metin: "Hiç durmaz" }],
        aciklama: "Robot her adımda önüne bakar; önü kapanınca döngü biter."
      }
    }
  ],
  dene: {
    bilesen: "sokak", ayar: {},
    yonerge: "Sokağın uzunluğunu değiştir. Program hiç değişmiyor; robot her seferinde nerede duruyor? Üç farklı sokak dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kart", gorev: "mb-surece", yonerge: "İki sokağın uzunlukları farklı. Tek bir programla ikisini de temizle: sürece kartını kullan." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "karton-kutu", adet: 1 }],
    adimlar: [
      "\"Duvara kadar yürü\" oyunu: Bir arkadaşın gözleri açık, duvara gelene kadar adım atsın. Her seferinde başka bir yerden başlayın: kaç adım sürdü?",
      "mBlock'ta \"… olana kadar tekrarla\" bloğunu bul.",
      "İçine \"ileri git\" koy. Koşula mesafe sensörünü yaz: mesafe 10 cm'den az olana kadar.",
      "Robotu kutudan farklı uzaklıklarda başlat. Hep kutunun önünde duruyor mu?"
    ],
    guvenlik: "Duvara doğru yürürken yavaş ol, kolların önde olsun.",
    ogretmenNotu: "Kartlardaki \"önü açık olduğu sürece\" ile mBlock'taki \"… olana kadar tekrarla\" ters koşul kullanır: biri devam etme, öteki durma koşulu. Bunu tahtada iki şekilde yazarak gösterebilirsiniz. " + MBLOCK
  }
};

export const ENERJI_DERSI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "enerji",
  ad: "Enerji",
  kazanim: "Robotun hareket ederken batarya harcadığını bilir; şarj istasyonuna uğrayacak şekilde yolunu planlar.",
  sure: 35,
  anlat: [
    { bit: "anlatiyor", metin: "Robotlar da yorulur! Motorlar çalıştıkça batarya azalır.", gorsel: { tur: "sahne", ad: "mbot-tekerler" } },
    {
      bit: "anlatiyor", metin: M.enerji, gorsel: { tur: "cizim", ad: "batarya-enerji" },
      soru: {
        soru: "Batarya 5. Önde 3 karlı kare var. Robot hepsini temizleyebilir mi?",
        secenekler: [{ metin: "Evet" }, { metin: "Hayır, 6 enerji gerekir", dogru: true }],
        aciklama: "Her karlı kare 2 enerji: 3 × 2 = 6. Batarya 5, yetmez."
      }
    },
    { bit: "ipucu", metin: "Uzun bir yolda önce planla: batarya nerede biter? Şarj istasyonuna o zamandan önce uğra.", gorsel: { tur: "cizim", ad: "batarya-enerji" } }
  ],
  dene: {
    bilesen: "batarya", ayar: {},
    yonerge: "Sokağın karelerine dokunarak kar, temiz yol ya da şarj istasyonu yap. Robot sokağın sonuna varabiliyor mu? Üç farklı sokak dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kart", gorev: "mb-sarj", yonerge: "Cadde çok uzun, batarya yetmiyor. Yolun ortasındaki şarj istasyonuna uğra, sonra karı temizlemeye devam et." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "yapiskan-not", adet: 1 }, { parca: "maskeleme-bandi", adet: 1 }],
    adimlar: [
      "Yerde bantla 8 karelik bir yol çizin; bazı karelere \"kar\" yazan not koyun, birine \"şarj\" yazın.",
      "\"Robot\" arkadaşınıza 6 enerji jetonu (not kâğıdı) verin. Karlı karede 2, temiz karede 1 jeton bırakır; şarj karesinde jetonları yenilenir.",
      "Yolun sonuna varabildi mi? Şarja uğramasaydı ne olurdu?",
      "mBot'un pil yuvasına bakın: kaç pil var? Piller bitince robot ne yapar?"
    ],
    ogretmenNotu: "mBot dört AA pille ya da şarjlı lityum pille çalışır. Piller zayıflayınca motorlar yavaşlar; derste bunu fark etmeleri iyi bir gözlemdir."
  }
};

export const CIZGIYI_IZLE: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "cizgiyi-izle",
  ad: "Çizgiyi izle",
  kazanim: "mBot'un iki gözlü çizgi sensörüyle çizgiyi nasıl izlediğini açıklar; dört durumun her biri için doğru hamleyi seçer.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: "mBot yerdeki siyah bir çizgiyi izleyerek yol alabilir. Bunun için altındaki çizgi sensörünü kullanır.", gorsel: { tur: "sahne", ad: "mbot-cizgi-sensoru" } },
    { bit: "anlatiyor", metin: M.ikiGoz, gorsel: { tur: "cizim", ad: "iki-goz-cizgi" } },
    {
      bit: "dusunuyor", metin: "Neden ters yöne dönüyor? Sol göz beyaza çıktıysa robot çizginin soluna kaymıştır; çizgi sağında kalmıştır.", gorsel: { tur: "cizim", ad: "iki-goz-cizgi" },
      soru: {
        soru: "Sağ göz beyaza çıktı, sol göz hâlâ siyahta. mBot ne yapmalı?",
        secenekler: [{ metin: "Sağa dönmeli" }, { metin: "Sola dönmeli", dogru: true }, { metin: "Durmalı" }],
        aciklama: "Robot çizginin sağına kaymış; çizgiye geri dönmek için sola döner."
      }
    },
    { bit: "ipucu", metin: "İki göz de beyazda kalırsa robot çizgiyi kaybetmiştir. Biraz geri gidip yeniden arayabilir.", gorsel: { tur: "sahne", ad: "mbot-cizgi-sensoru" } }
  ],
  dene: {
    bilesen: "iki-goz", ayar: {},
    yonerge: "mBot'u çizginin üstünde sağa sola kaydır. İki göz ne görüyor, robot ne yapmalı? Dört durumun hepsini bul.",
    enAzFarkliDeger: 4
  },
  gorev: { tur: "cizgi-tablo", yonerge: "Dört durumun her biri için mBot'un ne yapacağını seç. Sonra pistte dene: mBot bir turu bitirebilecek mi?" },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "siyah-elektrik-bandi", adet: 1 }, { parca: "beyaz-a4-kagit", adet: 4 }],
    adimlar: [
      "mBot'un kutusundan çıkan pisti ya da beyaz kâğıtlara yapıştırdığınız siyah bantla bir yol kullanın.",
      "İki arkadaş \"sol göz\" ve \"sağ göz\" olsun; bir arkadaş da robot. Gözler bandın kenarına gelince \"beyaz!\" desin, robot ters yöne dönsün.",
      "mBlock'ta çizgi sensörü bloğunu kullanarak dört durumu \"eğer\" bloklarıyla yaz.",
      "Robotu pistte çalıştırın. Çizgiden çıkıyorsa dönüş hızını azaltın."
    ],
    guvenlik: "Pist yerdeyse üstüne basmayın; bant kayabilir.",
    ogretmenNotu: "mBot'un çizgi sensörü iki gözün durumunu tek bir değer olarak verir (dört durum). Fabrika programındaki \"çizgi izleme\" modu bu dört durumla çalışır. " + MBLOCK
  }
};

export const MINI_PROJE: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "mini-proje",
  ad: "Mini proje: kendi görevin",
  kazanim: "Kendi görev haritasını tasarlar, kart programıyla çözer ve haritasını bir arkadaşıyla paylaşır.",
  sure: 40,
  anlat: [
    { bit: "seviniyor", metin: M.tasarim, gorsel: { tur: "cizim", ad: "harita-tasarla" } },
    { bit: "anlatiyor", metin: "İyi bir görev ne zor ne çok kolaydır. Birkaç köşe, biraz kar, belki bir şarj istasyonu.", gorsel: { tur: "cizim", ad: "harita-tasarla" } },
    { bit: "ipucu", metin: "Haritanın bir kodu var. Kodu arkadaşına ver; o da senin haritanı açıp çözsün.", gorsel: { tur: "cizim", ad: "harita-tasarla" } }
  ],
  dene: {
    bilesen: "harita-tasarimcisi", ayar: {},
    yonerge: "Bir araç seç, sonra haritanın karelerine dokun. Binaları, karlı sokakları ve robotun yerini sen belirle. En az beş değişiklik yap.",
    enAzFarkliDeger: 5
  },
  gorev: { tur: "tasarim", yonerge: "Şimdi kendi haritandaki karı kartlarla temizle. Daha çok kar ve döngü kartıyla daha çok yıldız!" },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "maskeleme-bandi", adet: 1 }, { parca: "renkli-kalem", adet: 1 }, { parca: "beyaz-a4-kagit", adet: 2 }],
    adimlar: [
      "Kâğıda kareli bir harita çiz: binalar, yollar, bir başlangıç ve bir bitiş.",
      "Haritayı arkadaşınla değiş. Onun haritası için kartları kâğıda sırayla çiz (ileri, sağa dön, tekrarla…).",
      "Yerde bantla haritanın büyük hâlini kurun. mBot'u mBlock'ta programlayıp haritada sürün.",
      "Kimin programı en az kartla bitti? Sınıfa gösterin."
    ],
    ogretmenNotu: "Gerçek robotta \"bir kare ileri\" için mBot'u kaç saniye süreceğinizi önce birlikte ölçün; pil durumuna göre değişir. " + MBLOCK
  }
};

/** İlkokul · Robot görevleri modülünün sekiz dersi, sırasıyla */
export const MBOT_DERSLERI: DersTanimi[] = [MOTOR_VE_TEKER, DONMEK, SENSOR_NE_GORUR, EGER_DEGILSE, DONGU_VE_SENSOR, ENERJI_DERSI, CIZGIYI_IZLE, MINI_PROJE];
