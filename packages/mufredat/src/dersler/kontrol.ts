/* Lise · Kontrol (mBot2): altı ders. Robotun hareketini ve kontrolünü formül, deney ve ayarla inceler.
   Her formülün yanında sayılarla bir örnek var. Görevler ders sayfasında, kodsuz: ayar ve hesap.
   Çizgi izleme deneyleri (3. ve 6. ders) Çizgi İzleyen modülünün robot modeliyle koşar; derste açıkça söylenir.
   "Gerçek robotta" adımları mBot2 ve mBlock ile; mBot2 blokları İngilizce. */
import type { DersTanimi } from "../ders";
import { KONTROL_METINLERI as M } from "../gorseller-kontrol";

const ORTAK = { atolye: "robotik", modul: "kontrol", robot: "mBot2" } as const;
const seviyeler = () => ["lise" as const];
const ODUNC = "Lisede mBot2 yoksa ortaokuldan ödünç alınabilir.";
const BLOK = "Blok adları mBlock sürümüne göre biraz farklı olabilir; mBot2 blokları İngilizce.";
const ROBOT_MALZEME = [{ parca: "mbot2", adet: 1 }, { parca: "mblock-cihaz", adet: 1 }];
const adim = (k: keyof typeof M) => ({ metin: M[k].metin, seslendirme: M[k].ses });

export const DIFERANSIYEL_SURUS: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "diferansiyel-surus",
  ad: "Diferansiyel sürüş",
  kazanim: "Sol ve sağ teker hızından robotun hızını, dönme hızını ve dönüş yarıçapını hesaplar; istenen yayı çizecek teker hızlarını bulur.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: "Bu modülde mBot2 ile çalışacağız. İki tekerini iki ayrı enkoderli motor çevirir, önde küçük bir teker var. Yön direksiyonla değil, iki teker arasındaki hız farkıyla değişir: buna diferansiyel sürüş denir.", gorsel: { tur: "sahne", ad: "mbot2-onden" } },
    { bit: "anlatiyor", ...adim("surus"), gorsel: { tur: "cizim", ad: "diferansiyel-surus" } },
    {
      bit: "dusunuyor",
      ...adim("ornekSurus"), gorsel: { tur: "cizim", ad: "kinematik-ornek" },
      soru: {
        soru: "Sol teker −10 cm/sn, sağ teker +10 cm/sn dönüyor. Robot ne yapar?",
        secenekler: [{ metin: "Yerinde sola döner: v = 0, R = 0", dogru: true }, { metin: "Düz gider: R sonsuz" }, { metin: "Geri geri gider" }, { metin: "Büyük bir çember çizer" }],
        aciklama: "v = (−10 + 10) / 2 = 0, ω = (10 − (−10)) / 11,5 ≈ 1,74 rad/sn. Hız sıfır, dönme var: robot olduğu yerde sola döner, R = 0 / 1,74 = 0."
      }
    },
    {
      bit: "ipucu",
      ...adim("donmeAcisi"), gorsel: { tur: "cizim", ad: "donme-acisi" }
    }
  ],
  dene: {
    bilesen: "kinematik", ayar: {},
    yonerge: "Sol ve sağ teker hızını değiştir. Formüllerdeki sayıları ve robotun izini izle. Düz gidiş, yerinde dönüş ve geniş bir yay bul.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "hedef-yay", yonerge: "Robot 3 saniyede çeyrek çember çizip yeşil robotun yerine ve yönüne varacak. Yarıçapı ve açıyı hesapla, iki teker hızını bul." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "buyuk-kagit", adet: 1 }, { parca: "renkli-kalem", adet: 1 }, { parca: "maskeleme-bandi", adet: 1 }, { parca: "cetvel", adet: 1 }],
    adimlar: [
      "Kalemi mBot2'nin arkasına, iki tekerin ortasına gelecek biçimde bantla; ucu kâğıda değsin.",
      "mBlock'ta mBot2 bloklarından \"left wheel turns ... RPM, right wheel turns ... RPM\" bloğunu kullan: sol 30, sağ 60 RPM ver ve 3 saniye çalıştır.",
      "Kâğıttaki yayın yarıçapını cetvelle ölç. RPM'i cm/sn'ye çevir: v = RPM · π · 6,4 / 60 (30 RPM ≈ 10 cm/sn). Formülle hesapladığın R ile karşılaştır.",
      "İkinci bir hız çifti dene (ör. sol 45, sağ 60). Ölçtüğün ile hesapladığın arasındaki farkın nedenlerini yaz: teker kayması, L'nin tam ölçüsü, kalemin yeri."
    ],
    guvenlik: "Robotu masanın kenarından uzakta çalıştır; kâğıdı yere bantla.",
    ogretmenNotu: "30 RPM · π · 6,4 cm / 60 ≈ 10 cm/sn; sol 30, sağ 60 RPM için R ≈ 17 cm, 3 saniyede yaklaşık 150° döner. Gerçek L'yi tekerlerin yere değdiği orta çizgiler arasından ölçün. " + ODUNC + " " + BLOK
  }
};

export const I_TERIMI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "i-terimi",
  ad: "PID'in I terimi",
  kazanim: "Yalnız P ile kalıcı hata kaldığını hesaplar; I teriminin hatayı biriktirerek kapattığını, aşırı birikmeyi ve sınırlamayı (anti-windup) açıklar; yük altında hızı tutan bir PI ayarı bulur.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: "Çizgi İzleyen modülünde P ve D'yi kullandın. Şimdi aynı fikir motor hızında: mBot2'nin enkoderi motorun hızını ölçer, program gücü ayarlayıp hızı hedefte tutmaya çalışır. Hata e = hedef − ölçülen hız.", seslendirme: "Çizgi İzleyen modülünde P ve D'yi kullandın. Şimdi aynı fikir motor hızında: mBot2'nin enkoderi motorun hızını ölçer, program gücü ayarlayıp hızı hedefte tutmaya çalışır. Hata, hedef eksi ölçülen hızdır.", gorsel: { tur: "sahne", ad: "mbot2-motorlar" } },
    { bit: "dusunuyor", ...adim("kaliciHata"), gorsel: { tur: "cizim", ad: "kalici-hata" } },
    { bit: "anlatiyor", ...adim("iTerimi"), gorsel: { tur: "cizim", ad: "i-terimi" } },
    {
      bit: "dusunuyor", ...adim("birikme"), gorsel: { tur: "cizim", ad: "asiri-birikme" },
      soru: {
        soru: "Ki büyük, sınırlama kapalı. Motor hedef hıza varırken ne olur?",
        secenekler: [{ metin: "Hedefi aşar, sonra geri iner", dogru: true }, { metin: "Hedefin altında kalır" }, { metin: "Hedefe tam oturur" }],
        aciklama: "Güç %100'deyken biriken fazla I toplamı, hata eksiye dönüp boşaltana kadar gücü yüksek tutar. Motor hedefi aşar."
      }
    },
    {
      bit: "ipucu",
      ...adim("pidToplam"), gorsel: { tur: "cizim", ad: "pid-toplam" }
    }
  ],
  dene: {
    bilesen: "hiz-kontrolu", ayar: {},
    yonerge: "Önce yalnız Kp ile dene, kalıcı hatayı oku. Sonra Ki ekle. Sınırlamayı kapatıp aç: aşma nasıl değişiyor? En az üç farklı ayar dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "yukte-hiz", yonerge: "Motor 150 dev/dk'da dönecek; 1,5. saniyede tekere yük biniyor. Kalıcı hata olmasın, aşma az olsun, hız çabuk otursun." },
  gercek: {
    malzeme: [...ROBOT_MALZEME],
    adimlar: [
      "mBot2'yi bir kutunun üstüne koy, tekerler havada kalsın.",
      "Değişkenler oluştur: e, toplam, guc. Bir \"forever\" döngüsü kur: e = 100 − (\"encoder motor EM1 speed (RPM)\"), toplam = toplam + e · 0,02, guc = Kp · e + Ki · toplam.",
      "Döngüde \"encoder motor EM1 rotates at power (guc) %\" bloğuyla gücü ver, \"wait 0.02 seconds\" ile bekle. Hızı CyberPi ekranına yazdır.",
      "Önce Ki = 0 ile çalıştır: hız 100'e varıyor mu? Sonra Ki ekle. Tekere parmağınla hafifçe dokunup yük bindir: hız geri geliyor mu?",
      "guc 100'ü geçince toplama eklemeyi durduran bir \"if\" ekle (sınırlama). Tekeri birkaç saniye tutup bırak: sınırlama varken ve yokken aşmayı karşılaştır."
    ],
    guvenlik: "Tekere yalnız parmak ucuyla, hafifçe dokun; tekeri sıkıca tutma, motoru zorlama.",
    ogretmenNotu: "mBot2'nin kendi \"rotates at ... RPM\" bloğu içeride zaten hız kontrolü yapar; bu derste kontrolü öğrenciler kendileri yazsın diye güç (%) bloğu kullanılır. Küçük değerlerle başlayıp (ör. Kp 0,5, Ki 2) adım adım artırın; robot farklı olduğu için simülasyondaki değerler doğrudan geçmez. " + ODUNC + " " + BLOK
  }
};

export const ORNEKLEME_VE_GECIKME: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "ornekleme-ve-gecikme",
  ad: "Örnekleme ve gecikme",
  kazanim: "Örnekleme aralığı ve gecikme büyüdükçe kontrolün neden bozulduğunu kör yol ve tepki gecikmesiyle hesaplar; yavaş bir döngüde pisti bitiren ayarı bulur.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: "Kontrol döngüsü CyberPi'de çalışır. Döngü ne kadar sık dönerse robot o kadar çabuk düzeltir. Bu dersteki çizgi deneyleri Çizgi İzleyen modülündeki robotun (SiroLine) modeliyle koşar; aynı ilke mBot2 için de geçerli.", gorsel: { tur: "sahne", ad: "mbot2-cyberpi" } },
    { bit: "anlatiyor", ...adim("ornekleme"), gorsel: { tur: "cizim", ad: "ornekleme" } },
    {
      bit: "dusunuyor", ...adim("gecikme"), gorsel: { tur: "cizim", ad: "gecikme" },
      soru: {
        soru: "Aynı PD ayarıyla döngü 10 ms'den 30 ms'ye çıktı. En olası sonuç?",
        secenekler: [{ metin: "Salınım büyür, robot pistten çıkabilir", dogru: true }, { metin: "Robot daha düzgün izler" }, { metin: "Hiçbir şey değişmez" }],
        aciklama: "1,5 m/sn hızda 30 ms'de 4,5 cm kör gidilir; düzeltme geç gelir. Simülasyonda bu ayar 10 ms'de pisti bitiriyor, 30 ms'de çıkıyor."
      }
    },
    {
      bit: "ipucu",
      ...adim("yavasAyar"), gorsel: { tur: "cizim", ad: "yavas-dongu-ayar" }
    }
  ],
  dene: {
    bilesen: "ornekleme", ayar: {},
    yonerge: "Ayar sabit. Döngü aralığını ve gecikmeyi değiştirip pistte dene. Robot hangi değerlerden sonra pistten çıkıyor? En az üç farklı deneme yap.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "yavas-dongu", yonerge: "Kart yavaş: döngü 20 ms'de bir çalışıyor. Kit ayarı bu döngüde pisti bitiremiyor. Taban Hız, Kp ve Kd ile pisti bitiren bir ayar bul." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "cizgi-pisti", adet: 1 }],
    adimlar: [
      "Çizgi izleme programının döngüsünün başına \"reset timer\" koy; döngünün sonunda \"timer\" değerini bir değişkene yaz ve CyberPi ekranına yazdır. Bu, bir turun süresi (Ts).",
      "Quad RGB sensörün sapma (deviation) değeriyle P ya da PD çizgi izleme yap. Ölçtüğün Ts kaç milisaniye?",
      "Döngünün sonuna \"wait 0.03 seconds\" ekle. Robot nasıl izliyor? Bekleme süresini 0,06 saniyeye çıkar.",
      "Kör yolu hesapla: v · Ts. Robot hangi beklemede pistten çıkmaya başladı? Hızı düşürünce yeniden izleyebiliyor mu?"
    ],
    guvenlik: "Pistin çevresini boşalt; robot pistten çıkınca yakalamaya hazır ol.",
    ogretmenNotu: "Ekrana yazdırmak döngüyü yavaşlatır; Ts'yi ölçerken bunu da tartışın. Simülasyon SiroLine modeliyle koşar (bu ayarla saniyede yaklaşık 2 m); mBot2 daha yavaş olduğu için gerçek robotta etkiyi görmek için daha uzun bekleme gerekebilir. " + ODUNC + " " + BLOK
  }
};

export const MOTOR_MODELI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "motor-modeli",
  ad: "Motor modeli",
  kazanim: "DC motorun tork–devir doğrusunu ve güç eğrisini okur, yükten çalışma devrini hesaplar; dişli oranının torka ve devre etkisini kullanarak bir rampa için oran seçer.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", ...adim("torkDevir"), gorsel: { tur: "cizim", ad: "tork-devir" } },
    { bit: "anlatiyor", ...adim("guc"), gorsel: { tur: "cizim", ad: "guc-egrisi" } },
    {
      bit: "dusunuyor", ...adim("disli"), gorsel: { tur: "cizim", ad: "disli-orani" },
      soru: {
        soru: "Ek dişli oranı 1'den 2'ye çıktı. Kilit torku ve boşta devir ne olur?",
        secenekler: [{ metin: "Tork 10 kg·cm, boşta devir 175 dev/dk", dogru: true }, { metin: "Tork 2,5 kg·cm, boşta devir 700 dev/dk" }, { metin: "İkisi de iki katına çıkar" }],
        aciklama: "Dişli torku n katına çıkarır, devri n'e böler: 5 · 2 = 10 kg·cm, 350 / 2 = 175 dev/dk. Güç değişmez."
      }
    },
    {
      bit: "ipucu",
      ...adim("rampaKuvvet"), gorsel: { tur: "cizim", ad: "rampa-kuvvet" }
    }
  ],
  dene: {
    bilesen: "motor", ayar: {},
    yonerge: "Gerilimi, dişli oranını ve yükü değiştir. Çalışma noktası doğru üstünde nereye kayıyor? Güç ne zaman en büyük? En az üç farklı ayar dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "rampa", yonerge: "Yüklü mBot2 aynı dişliyle iki rampayı çıkacak: uzun ve yatık, kısa ve dik. İki rampada toplam süreyi en kısa yapan ek dişli oranını bul." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "rampa-tahta", adet: 1 }, { parca: "kronometre", adet: 1 }, { parca: "cetvel", adet: 1 }],
    adimlar: [
      "mBot2'yi tekerleri havada olacak biçimde bir kutunun üstüne koy. \"encoder motor EM1 rotates at power ... %\" ile gücü 20, 40, 60, 80 ve 100 yap; her birinde \"encoder motor EM1 speed (RPM)\" değerini ekrana yazdırıp not et.",
      "Güç–devir tablonu çiz. Doğruya benziyor mu?",
      "Robotu yere koy, aynı güçlerle düz gittir: devirler havadakinden ne kadar düşük? Fark, tekerlerin taşıdığı yükten.",
      "Tahtayla bir rampa kur. Rampanın açısını iki kitap ve cetvelle ölç (sin θ = yükseklik / uzunluk). Robotun rampayı çıkış süresini 50 ve 100 güçle ölç."
    ],
    guvenlik: "Rampayı sağlam kur, robot üstünden düşmesin; alt ucunda biri hazır beklesin.",
    ogretmenNotu: "Motor değerleri Makeblock'un ürün bilgisinden: 180 enkoderli motor 7,4 V'ta boşta 350 dev/dk, başlangıç torku 5 kg·cm; çalışırken 200 dev/dk ve 1,5 kg·cm. Simülasyon kayıpsız doğrusal model kullanır; gerçekte devir biraz daha düşük çıkar. mBot2'de ek dişli takılı değildir; görevdeki ek dişli bir düşünce deneyidir. " + ODUNC + " " + BLOK
  }
};

export const ENKODERLE_KONUM: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "enkoderle-konum",
  ad: "Enkoderle konum",
  kazanim: "Enkoder sayısından yol ve dönüş açısı hesaplar; kare çizecek enkoder değerlerini bulur; teker çapı hatası ve kaymayla odometri hatasının nasıl biriktiğini açıklar.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", ...adim("enkoder"), gorsel: { tur: "cizim", ad: "enkoder-yol" } },
    { bit: "anlatiyor", ...adim("yerindeDonus"), gorsel: { tur: "cizim", ad: "yerinde-donus-yay" } },
    {
      bit: "dusunuyor", ...adim("odometri"), gorsel: { tur: "cizim", ad: "odometri-hata" },
      soru: {
        soru: "Robot her dönüşte biraz kayıyor ve gerçekte gerekenden az dönüyor. Kare ne olur?",
        secenekler: [{ metin: "Kapanmaz; hata her köşede büyür", dogru: true }, { metin: "Kenarlar kısalır ama kare kapanır" }, { metin: "Hiçbir şey değişmez" }],
        aciklama: "Her köşedeki küçük açı hatası sonraki kenarların yönünü değiştirir. Hata birikir; dört köşe sonra robot başlangıca dönmez."
      }
    },
    {
      bit: "ipucu",
      gorsel: { tur: "sahne", ad: "mbot2-cyberpi" },
      metin: "CyberPi'deki jiroskop dönülen açıyı doğrudan ölçer; teker kaysa da açıyı doğru bulur. Pratikte düz giderken enkoder, dönerken jiroskop kullanılır. Kalibrasyon: d_gerçek = d · (ölçülen / istenen). Örnek: 50 cm istedin, 49 cm gitti → d = 6,4 · 49 / 50 ≈ 6,27 cm.",
      seslendirme: "CyberPi'deki jiroskop dönülen açıyı doğrudan ölçer; teker kaysa da açıyı doğru bulur. Pratikte düz giderken enkoder, dönerken jiroskop kullanılır. Teker çapını kalibre etmek için: elli santimetre istedin, kırk dokuz gitti ise yeni çap 6,4 çarpı 49 bölü 50, yaklaşık 6,27 santimetre."
    }
  ],
  dene: {
    bilesen: "odometri", ayar: {},
    yonerge: "Sağ tekerin gerçek çapını ve dönüşteki kaymayı değiştir. Robotun sandığı kare ile gerçek iz arasındaki fark nasıl büyüyor? En az üç farklı değer dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "kare", yonerge: "mBot2 50 cm kenarlı bir kare çizecek. Düz gidiş için N1'i, yerinde 90° dönüş için N2'yi hesapla ve gir." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "cetvel", adet: 1 }, { parca: "maskeleme-bandi", adet: 1 }],
    adimlar: [
      "Yere bantla bir başlangıç çizgisi çek. \"reset encoder motor EM1 angle\" ile enkoderi sıfırla.",
      "\"encoder motor EM1 rotates ... °\" bloklarıyla iki tekeri hesapladığın açı kadar döndür (50 cm için). Robotun gittiği yolu cetvelle ölç.",
      "Ölçtüğün yolla teker çapını kalibre et: d = 6,4 · ölçülen / istenen. Yeni çapla açıyı yeniden hesaplayıp tekrar dene.",
      "Kareyi gerçek robotta çiz: dört kez düz ve yerinde 90° dönüş. Başlangıca ne kadar uzakta bitti? Dönüşü \"turn left 90°\" (jiroskoplu) blokla yapıp karşılaştır."
    ],
    guvenlik: "Robotu düz, kaymayan bir zeminde çalıştır.",
    ogretmenNotu: "Teker çapı yaklaşık 6,4 cm, iki teker arası yaklaşık 11,5 cm; tam değerleri sınıftaki robotta ölçün. 50 cm için yaklaşık 895°, yerinde 90° dönüş için her teker yaklaşık 162° (ters yönlerde). Gerçek robotta lastik ve zemin yüzünden kayma olur; jiroskopla dönüş daha tutarlıdır. " + ODUNC + " " + BLOK
  }
};

export const SIMULASYONDAN_GERCEGE: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "simulasyondan-gercege",
  ad: "Simülasyondan gerçeğe",
  kazanim: "Model ile gerçek robot arasındaki farkları sayar; farklı koşullarda çalışan sağlam bir ayar bulur; bir ayarı gerçek robota adım adım taşır ve ayar defteri tutar.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", ...adim("modelGercek"), gorsel: { tur: "cizim", ad: "model-gercek" } },
    {
      bit: "anlatiyor",
      ...adim("pilOrani"), gorsel: { tur: "cizim", ad: "pil-orani" }
    },
    {
      bit: "dusunuyor",
      ...adim("ucSurum"), gorsel: { tur: "cizim", ad: "uc-surum" },
      soru: {
        soru: "Bir ayar simülasyonda 2,6 sn'de, ağır robotta 3,3 sn'de bitiriyor, zayıf pilli robotta süre dolana kadar bitiremiyor. Bu ayar sağlam mı?",
        secenekler: [{ metin: "Hayır; en kötü durumda bitiremiyor", dogru: true }, { metin: "Evet; ortalaması iyi" }, { metin: "Evet; simülasyonda en hızlısı" }],
        aciklama: "Sağlam ayar her koşulda çalışmalı. Gerçek robotun hangi koşulda olacağını önceden bilemezsin."
      }
    },
    {
      bit: "ipucu",
      gorsel: { tur: "sahne", ad: "mbot2-quad-rgb" },
      metin: "Gerçek mBot2 çizgiyi altındaki dört gözlü Quad RGB sensörle görür. Ayarı taşırken önce hızı yarıya indir, Kp ve Kd aynı kalsın. Robot düzgün izliyorsa her denemede hızı yaklaşık %10 artır: 80 → 88 → 97 → 107… Her denemeyi ayar defterine yaz: tarih, pil, Taban Hız, Kp, Kd, süre, not.",
      seslendirme: "Gerçek mBot2 çizgiyi altındaki dört gözlü Quad RGB sensörle görür. Ayarı taşırken önce hızı yarıya indir, Kp ve Kd aynı kalsın. Robot düzgün izliyorsa her denemede hızı yaklaşık yüzde on artır: seksen, seksen sekiz, doksan yedi, yüz yedi. Her denemeyi ayar defterine yaz: tarih, pil, hız, Kp, Kd, süre ve not."
    }
  ],
  dene: {
    bilesen: "model-farki", ayar: {},
    yonerge: "Üç hazır ayarı sırayla seç; her biri üç robot sürümünde koşar. Hangisi en hızlı, hangisi en sağlam? Üçünü de dene.",
    enAzFarkliDeger: 3
  },
  gorev: { tur: "kontrol", gorev: "saglam-ayar", yonerge: "Tek bir ayar bul: simülasyondaki robotta, ağır robotta ve zayıf pilli, yavaş kartlı robotta pisti bitirsin. En yavaş tur ne kadar kısaysa o kadar iyi." },
  gercek: {
    malzeme: [...ROBOT_MALZEME, { parca: "cizgi-pisti", adet: 1 }, { parca: "kronometre", adet: 1 }, { parca: "renkli-kalem", adet: 1 }],
    adimlar: [
      "Bir ayar defteri aç: tarih, pil durumu, Taban Hız, Kp, Kd, tur süresi ve not sütunları.",
      "mBot2'nin çizgi izleme programına görevde bulduğun Kp ve Kd'yi yaz, hızı yarıya indir. Pistte bir tur at, defterine yaz.",
      "Robot düzgün izliyorsa hızı %10 artır ve tekrarla. Salınım başlayınca bir önceki hıza dön.",
      "Robotun üstüne küçük bir ağırlık (ör. bir kalem kutusu) koy ve aynı ayarla tekrar dene. Pil azaldığında da bir tur at. Hangi koşulda bozuldu?"
    ],
    guvenlik: "Pistin çevresini boşalt; hızı artırırken robotu yakalamaya hazır ol.",
    ogretmenNotu: "Simülasyondaki ayar değerleri (Taban Hız, Kp, Kd) SiroLine'ın kit ölçeğinde; mBot2'de güç %, sapma −100…100 aralığında olduğu için sayılar aynı kalmaz. Amaç değerleri değil yöntemi taşımak: düşük hızdan başla, adım adım artır, kayıt tut. " + ODUNC + " " + BLOK
  }
};

export const KONTROL_DERSLERI: DersTanimi[] = [DIFERANSIYEL_SURUS, I_TERIMI, ORNEKLEME_VE_GECIKME, MOTOR_MODELI, ENKODERLE_KONUM, SIMULASYONDAN_GERCEGE];
