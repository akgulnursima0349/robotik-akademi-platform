/* Labirent Ustası modülü (RizBot): altı ders. Kurallar MEB Robot Yarışması 2026 Labirent Ustası şartnamesinden.
   Sınıfta RizBot yok: "Gerçek robotta" bölümleri yerde bant ve kartonla kurulan labirentte robotsuz etkinliklerdir.
   Çizimli adımların metinleri gorseller-labirent.ts'te (çizim okunan kelimeye göre belirir). */
import type { DersTanimi } from "../ders";
import { LABIRENT_METINLERI as M } from "../gorseller-labirent";

const ORTAK = { atolye: "robotik", modul: "labirent", robot: "RizBot" } as const;
const seviyeler = () => ["ortaokul" as const];
const BANT_LABIRENT = "Yerdeki labirenti 40–50 cm'lik hücrelerle kurun ki çocuk içinde yürüyebilsin (yarışmadaki hücre 20 cm).";

export const DUVAR_SENSORLERI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "duvar-sensorleri",
  ad: "Duvar sensörleri",
  kazanim: "Labirent hücresini tanır; kızılötesi duvar sensörünün duvarı nasıl algıladığını ve okumasını açıklar.",
  sure: 30,
  anlat: [
    { bit: "anlatiyor", metin: M.hucre, gorsel: { tur: "cizim", ad: "labirent-hucresi" } },
    {
      bit: "anlatiyor",
      metin: "Bu labirentin robotu RizBot. Önünde, köşelerinde ve iki yanında duvarlara bakan sensörler var.",
      gorsel: { tur: "sahne", ad: "rizbot-sensorler" }
    },
    {
      bit: "dusunuyor", metin: M.yansima, gorsel: { tur: "cizim", ad: "kizilotesi-yansima" },
      soru: {
        soru: "Sensörün önünde duvar yok. Sensör ne görür?",
        secenekler: [{ metin: "Güçlü bir yansıma" }, { metin: "Yansıma görmez ya da çok az görür", dogru: true }, { metin: "Siyah zemini duvar sanar" }],
        aciklama: "Duvar yoksa ışığı geri gönderecek bir şey yoktur. Mat siyah zemin de ışığı çok az yansıtır; sensör duvar görmez."
      }
    },
    {
      bit: "anlatiyor",
      metin: "Lab'da üç sensörü üç komutla okursun: duvar_on(), duvar_sol() ve duvar_sag(). Duvar varsa True, yoksa False döner.",
      seslendirme: "Lab'da üç sensörü üç komutla okursun: duvar ön, duvar sol ve duvar sağ. Duvar varsa True, yani doğru; yoksa False, yani yanlış döner.",
      gorsel: { tur: "sahne", ad: "rizbot-labirentte" },
      soru: {
        soru: "RizBot'un solunda ve önünde duvar var, sağı açık. duvar_sag() ne döner?",
        secenekler: [{ metin: "True" }, { metin: "False", dogru: true }, { metin: "Hata verir" }],
        aciklama: "Sağda duvar yok: ışık geri dönmez, duvar_sag() False döner. Solda ve önde duvar olduğu için duvar_sol() ve duvar_on() True döner."
      }
    },
    {
      bit: "ipucu",
      metin: "Robot sensörlere bakıp karar verir: önü açıksa ilerler, kapalıysa açık tarafa döner. Sıradaki derste bu kararları bir kurala çevireceğiz.",
      gorsel: { tur: "sahne", ad: "rizbot-labirentte" }
    }
  ],
  dene: {
    bilesen: "duvar-sensoru", ayar: {},
    yonerge: "Hücrenin kenarlarına dokunarak duvar koy ya da kaldır, robotu da döndür. Sensörlerin okuması ve robotun kararı nasıl değişiyor? En az dört farklı durum dene.",
    enAzFarkliDeger: 4
  },
  gorev: {
    tur: "lab", modul: "labirent", gorev: "lb-duvara-bak",
    yonerge: "Lab'daki \"Duvara bak\" görevinde iki farklı koridor var; aynı kod ikisinde de çalışmalı. Önü açıksa ilerle, kapalıysa açık tarafa dön. İstersen önce \"İlk koridor\" göreviyle ısın."
  },
  gercek: {
    malzeme: [{ parca: "el-feneri", adet: 1 }, { parca: "beyaz-karton", adet: 1 }, { parca: "siyah-karton", adet: 1 }, { parca: "maskeleme-bandi", adet: 1 }, { parca: "cetvel", adet: 1 }],
    adimlar: [
      "Gölgeli bir köşede el fenerini beyaz kartona tut. Işığın kartondan geri yansıdığını gör.",
      "Aynısını siyah kartonla dene. Hangisi daha çok ışık yansıtıyor?",
      "Yere kâğıt bantla 3 × 3 hücrelik bir ızgara çiz.",
      "Bir hücreye kartondan ya da kitaplardan iki duvar koy. Arkadaşın o hücrede \"robot\" olsun: solunda, önünde ve sağında duvar var mı, tek tek söylesin (True ya da False)."
    ],
    guvenlik: "El fenerini kimsenin gözüne tutma.",
    ogretmenNotu: "Sınıfta RizBot olmadığı için etkinlik robotsuz. Kızılötesi ışık gözle görülmez; el feneri yine de beyazın siyahtan çok daha fazla ışık yansıttığını gösterir. " + BANT_LABIRENT + " Izgarayı modülün sonraki dersleri için kaldırmayın."
  }
};

export const SAG_EL_KURALI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "sag-el-kurali",
  ad: "Sağ el kuralı",
  kazanim: "Sağ el kuralını üç adımlı bir karar olarak yazar ve labirentte adım adım uygular.",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: M.sagElYolu, gorsel: { tur: "cizim", ad: "sag-el-yolu" } },
    { bit: "anlatiyor", metin: M.sagElAkisi, gorsel: { tur: "cizim", ad: "sag-el-akisi" } },
    {
      bit: "dusunuyor",
      metin: "Sıra önemli: robot önce sağa bakar. Sağa dönmek eli duvarda tutar; düz gitmek ancak sağ kapalıysa olur.",
      gorsel: { tur: "cizim", ad: "sag-el-akisi" },
      soru: {
        soru: "RizBot'un sağı da önü de açık. Sağ el kuralına göre ne yapar?",
        secenekler: [{ metin: "Düz ilerler" }, { metin: "Sağa döner ve ilerler", dogru: true }, { metin: "Sola döner" }],
        aciklama: "Önce sağa bakılır: sağ açıksa robot sağa döner, ön açık olsa bile. Böylece eli duvardan ayrılmaz."
      }
    },
    { bit: "anlatiyor", metin: M.cikmazdaSagEl, gorsel: { tur: "cizim", ad: "cikmazda-sag-el" } },
    {
      bit: "ipucu",
      metin: "Python'da bu kural bir while döngüsü ve üç dallı bir karar: if, elif ve else. Döngü, bitti() True olana kadar sürer.",
      seslendirme: "Python'da bu kural bir while döngüsü ve üç dallı bir karar: if, elif ve else. Döngü, bitti komutu True olana kadar sürer.",
      gorsel: { tur: "cizim", ad: "sag-el-akisi" }
    }
  ],
  dene: {
    bilesen: "kural-adim", ayar: { harita: "sag-el", kural: "sag-el" },
    yonerge: "Robotu adım adım yürüt. Her adımda kodun hangi satırı çalışıyor, robot neden öyle karar veriyor? En az on adım ilerle; istersen sonuna kadar oynat.",
    enAzFarkliDeger: 10
  },
  gorev: {
    tur: "lab", modul: "labirent", gorev: "lb-sag-el",
    yonerge: "Lab'daki \"Sağ el kuralı\" görevinde iki labirent var; kodun ikisinde de bitişi bulmalı. Dene bölümünde izlediğin kuralı kendin yaz."
  },
  gercek: {
    malzeme: [{ parca: "maskeleme-bandi", adet: 1 }, { parca: "karton-duvar", adet: 10 }],
    adimlar: [
      "Yerde kâğıt bantla 4 × 4 hücrelik bir labirent kurun; duvarlar için karton şeritleri ya da kitapları dik koyun. Bir yol ayrımı ve bir çıkmaz olsun.",
      "Bir arkadaşın \"robot\" olur: gözleri açık, sağ elini duvara değdirir ve kuralla yürür. Robot gibi yalnız bulunduğu hücrenin duvarlarına bakar, her hücrede bir adım atar.",
      "Başka biri her adımda kuralın hangi satırının çalıştığını söyler: \"sağ açık, sağa dön ve ilerle\", \"ön açık, ilerle\" ya da \"sola dön\".",
      "Bitişe vardınız mı? Kaç adım sürdü? Defterinize yazın, sonra görevleri değişin."
    ],
    guvenlik: "Koşmak yok, yavaş yürünür. Labirenti masa ve sandalyelerden uzakta kurun.",
    ogretmenNotu: BANT_LABIRENT + " Kuralı yüksek sesle söyletmek, Python'daki if, elif, else sırasını oturtur: önce sağa bakılır."
  }
};

export const CIKMAZI_HATIRLAMAK: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "cikmazi-hatirlamak",
  ad: "Çıkmazı hatırlamak",
  kazanim: "Labirentte geçtiği yolları işaretleyerek çıkmazlara yeniden girmeden bitişi bulur.",
  sure: 35,
  anlat: [
    { bit: "anlatiyor", metin: M.robotGozu, gorsel: { tur: "cizim", ad: "robot-gozu" } },
    { bit: "dusunuyor", metin: M.cikmaz, gorsel: { tur: "cizim", ad: "cikmaz" } },
    {
      bit: "anlatiyor", metin: M.isaretleme, gorsel: { tur: "cizim", ad: "cikmaz-isaretleme" },
      soru: {
        soru: "Bir yol ayrımındasın. Sağdaki yoldan iki kez geçmişsin, soldaki yola hiç girmemişsin. Hangisini seçersin?",
        secenekler: [{ metin: "Sağdakini: orayı tanıyorum" }, { metin: "Soldakini: hiç denemediğim yol", dogru: true }, { metin: "Fark etmez" }],
        aciklama: "İki kez geçtiğin yol zaten denenmiş: ya çıkmaza gidiyor ya da oradan geri döndün. Bitiş büyük ihtimalle hiç denemediğin yolda."
      }
    },
    {
      bit: "ipucu",
      metin: "Bu yöntem yaklaşık 150 yıllık; Fransız bir mühendisin adıyla Trémaux yöntemi diye anılır. Bilgisayarlar da hafızalarında hücreleri sayarak aynı şeyi yapar.",
      seslendirme: "Bu yöntem yaklaşık 150 yıllık; Fransız bir mühendisin adıyla Tremo yöntemi diye anılır. Bilgisayarlar da hafızalarında hücreleri sayarak aynı şeyi yapar.",
      gorsel: { tur: "cizim", ad: "cikmaz-isaretleme" }
    },
    { bit: "anlatiyor", metin: "Şimdi robotun gözünden bak: sisli labirentte yalnız geçtiğin hücrelerin duvarlarını göreceksin. Bitişin yeri ise baştan belli.", gorsel: { tur: "cizim", ad: "robot-gozu" } }
  ],
  dene: {
    bilesen: "sisli-labirent", ayar: { harita: "sis-1" },
    yonerge: "Sisli labirentte RizBot'u ok tuşlarıyla sür. Yalnız geçtiğin hücrelerin duvarları görünür; köşedeki sayı oraya kaç kez geldiğini gösterir. En az sekiz farklı hücre gez.",
    enAzFarkliDeger: 8
  },
  gorev: {
    tur: "sis", gorev: "sis-1",
    yonerge: "İki sisli labirentte bitişi bul. Az adımla bitirmek için işaretlere dikkat et: iki kez geçtiğin yollara bir daha girme."
  },
  gercek: {
    malzeme: [{ parca: "kagit-labirent", adet: 1 }, { parca: "renkli-kalem", adet: 1 }, { parca: "yapiskan-not", adet: 1 }],
    adimlar: [
      "Kâğıt labirentte başlangıçtan kalemle yürü; geçtiğin her yola küçük bir çizgi koy.",
      "Çıkmaza girdiğinde geri dön; o yoldan ikinci kez geçtiğin için ikinci çizgiyi koy. İki çizgili yola bir daha girme.",
      "Bitişe varınca yalnız tek çizgili yollardan geçen yolu renkli kalemle çiz: başlangıçtan bitişe giden yolu bulmuş oldun.",
      "Yerdeki labirentte aynısını yapın: geçtiğiniz hücreye yapışkan not koyun, ikinci geçişte nota bir çizgi ekleyin."
    ],
    ogretmenNotu: "Trémaux yöntemi: tek çizgili yollar sonunda başlangıçtan bitişe giden yolu verir. Lab'daki \"Ada\" görevinde robot aynı fikirle hücre sayar (sözlük); burada kâğıt ve kalemle somutlaştırın. Kâğıt labirenti platformdaki labirentlerden birini çizerek ya da internetten bir labirent yazdırarak hazırlayabilirsiniz."
  }
};

export const ADA_PROBLEMI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "ada-problemi",
  ad: "Ada problemi",
  kazanim: "Duvar takibinin hangi labirentlerde döngüye girdiğini açıklar; hafızayla (ziyaret sayısı) bu döngüden çıkar.",
  sure: 40,
  anlat: [
    {
      bit: "anlatiyor",
      metin: "Sağ el kuralı çoğu labirentte işe yarar, ama bir şartı var: bitişe, dış duvara bağlı bir duvar boyunca ulaşılabilmeli.",
      gorsel: { tur: "cizim", ad: "sag-el-yolu" }
    },
    {
      bit: "sasiriyor", metin: M.ada, gorsel: { tur: "cizim", ad: "ada-labirent" },
      soru: {
        soru: "Sağ el kuralıyla yürüyen robot, başladığı hücreye üçüncü kez geldi. Bu ne demek?",
        secenekler: [{ metin: "Bitişe çok yaklaştı" }, { metin: "Aynı turu dönüp duruyor; kural bu labirentte bitişi bulamıyor", dogru: true }, { metin: "Sensörleri bozuldu" }],
        aciklama: "Aynı yere tekrar tekrar gelmek, robotun bir döngüye girdiğini gösterir. Sensörler doğru çalışıyor; kural bu labirente uymuyor."
      }
    },
    { bit: "ipucu", metin: M.hafiza, gorsel: { tur: "cizim", ad: "hafiza-sayilari" } },
    {
      bit: "anlatiyor",
      metin: "Python'da bunu bir sözlükle yaparsın: ziyaret[konum()] o hücreye kaç kez gelindiğini tutar. komsu(\"sag\") sağdaki hücrenin konumunu verir.",
      seslendirme: "Python'da bunu bir sözlükle yaparsın: ziyaret sözlüğü, her konuma kaç kez gelindiğini tutar. Komşu sağ komutu, sağdaki hücrenin konumunu verir.",
      gorsel: { tur: "cizim", ad: "hafiza-sayilari" }
    }
  ],
  dene: {
    bilesen: "ada-deneyi", ayar: {},
    yonerge: "İki robotu aynı ada labirentinde birlikte oynat. Sağ el kuralı neden bitişi bulamıyor? Hafızalı robot adaya nasıl giriyor? Oynatmayı sonuna kadar izle.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "lab", modul: "labirent", gorev: "lb-ada",
    yonerge: "Lab'daki \"Ada\" görevinde RizBot'a hafıza ver: her hücreye kaç kez geldiğini say, yol ayrımında en az gidilen yolu seç."
  },
  gercek: {
    malzeme: [{ parca: "maskeleme-bandi", adet: 1 }, { parca: "karton-duvar", adet: 12 }, { parca: "yapiskan-not", adet: 1 }],
    adimlar: [
      "Yerdeki labirentin ortasına bir ada kurun: duvarları dış duvara değmeyen, tek girişli bir oda. Bitişi bu odanın içine koyun.",
      "\"Robot\" arkadaşınız sağ elini dış duvara koyup kuralla yürüsün. Başladığı yere kaç kez geldi?",
      "Şimdi hafızalı robot olun: her hücreye girerken oraya bir yapışkan not koyun ya da üstündekine bir çizgi ekleyin. Yol ayrımında en az çizgili hücreyi seçin.",
      "Bu kez bitişi buldunuz mu? Kaç adım sürdü? İki yöntemi karşılaştırın."
    ],
    ogretmenNotu: "Adanın odasına mutlaka bir giriş bırakın; yoksa bitişe hiç ulaşılamaz. Yapışkan notlar Lab görevindeki sözlüğün (ziyaret) sınıftaki karşılığıdır. " + BANT_LABIRENT
  }
};

export const HIZ_PROFILI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "hiz-profili",
  ad: "Hız profili",
  kazanim: "Robotun düz yolda hızlanıp dönüşte durduğunu bilir; dönüş sayısını da hesaba katarak en hızlı rotayı seçer.",
  sure: 35,
  anlat: [
    { bit: "dusunuyor", metin: M.ikiYol, gorsel: { tur: "cizim", ad: "iki-yol" } },
    { bit: "anlatiyor", metin: M.hizProfili, gorsel: { tur: "cizim", ad: "hiz-profili" } },
    {
      bit: "anlatiyor",
      metin: "Bu yüzden uzun düzlükler hızlıdır: robot bir kez hızlanır ve hızını korur. Çok dönüşlü yolda ise her dönüşte durur ve yeniden hızlanır.",
      gorsel: { tur: "sahne", ad: "rizbot-tekerler" },
      soru: {
        soru: "İki yol aynı uzunlukta: birinde iki dönüş var, ötekinde yedi. Hangisi daha hızlı?",
        secenekler: [{ metin: "Yedi dönüşlü" }, { metin: "İki dönüşlü", dogru: true }, { metin: "İkisi aynı" }],
        aciklama: "Her dönüşte robot durur, yerinde döner ve yeniden hızlanır. Dönüş azaldıkça bu kayıp da azalır."
      }
    },
    {
      bit: "anlatiyor",
      metin: "Yarışma robotları dönüşlerde kaymasın diye yardım alır. RizBot'un vakum fanı robotu zemine bastırır; böylece daha hızlı gidip daha sert dönebilir. Simülasyonda fanın etkisi yok.",
      gorsel: { tur: "sahne", ad: "rizbot-fan" }
    },
    { bit: "ipucu", metin: "Bir yolun süresini tahmin ederken yalnız hücreleri sayma, dönüşleri de say.", gorsel: { tur: "cizim", ad: "iki-yol" } }
  ],
  dene: {
    bilesen: "hiz-profili", ayar: {},
    yonerge: "İki yolu karşılaştır: turuncu kısa ama çok dönüşlü, mor uzun ama az dönüşlü. Grafikte hızın nasıl değiştiğine bak. En yüksek hızı ve hızlanmayı değiştir: hangi yol hep önde? En az üç ayar dene.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "rota", gorev: "rota-1",
    yonerge: "Başlangıçtan bitişe en hızlı rotayı çiz. En kısa yol en hızlısı olmayabilir: dönüşleri de say."
  },
  gercek: {
    malzeme: [{ parca: "maskeleme-bandi", adet: 1 }, { parca: "karton-duvar", adet: 10 }, { parca: "kronometre", adet: 1 }],
    adimlar: [
      "Yerdeki labirentte başlangıçtan bitişe iki yol seçin: biri kısa ama çok dönüşlü, öteki uzun ama az dönüşlü.",
      "\"Robot\" arkadaşınız düzde hızlı yürüyebilir, ama her dönüşte durup yerinde dönmek zorunda.",
      "Kronometreyle iki yolu da ölçün; her yolu iki kez deneyin.",
      "Hangi yol daha hızlı çıktı? Dönüş sayısıyla süre arasında nasıl bir ilişki var? Defterinize yazın."
    ],
    guvenlik: "Koşmak yok, hızlı yürümek yeterli. Labirentin çevresinde boş alan bırakın.",
    ogretmenNotu: "Simülasyondaki RizBot hızı tahminîdir (ürün sayfasında hız bilgisi yok): düzde en çok 1 m/sn, 90 derece dönüş 0,35 sn. Sınıfta fark, çocuğun her dönüşte durmasıyla ortaya çıkar."
  }
};

export const MEB_PISTI: DersTanimi = {
  ...ORTAK, seviyeler: seviyeler(),
  kimlik: "meb-pisti",
  ad: "MEB pisti",
  kazanim: "MEB Labirent Ustası kurallarını açıklar, bitiren ve bitiremeyen robotun puanını hesaplar.",
  mebKazanim: "MEB Robot Yarışması 2026 · Labirent Ustası şartnamesi",
  sure: 40,
  anlat: [
    { bit: "anlatiyor", metin: M.mebPisti, gorsel: { tur: "cizim", ad: "meb-pisti" } },
    {
      bit: "anlatiyor",
      metin: "Deneme turu yok. Robot bitiş hücresindeki beyaz alana varınca orada 5 saniye kalmalı.",
      gorsel: { tur: "cizim", ad: "meb-pisti" },
      soru: {
        soru: "Robot bitiş alanına vardı ama hemen çıktı. Ne olur?",
        secenekler: [{ metin: "Bitirmiş sayılır" }, { metin: "Bitirmiş sayılmaz: bitiş alanında 5 saniye kalmalıydı", dogru: true }, { metin: "Puanı ikiye katlanır" }],
        aciklama: "Kural, robotun bitiş alanında 5 saniye kalmasını ister. Robotun bitişte durmayı da bilmesi gerekir."
      }
    },
    { bit: "anlatiyor", metin: M.mebPuan, gorsel: { tur: "cizim", ad: "meb-puan" } },
    {
      bit: "dusunuyor",
      metin: "Robot 16 satırın 9'una kadar gelip durduysa puanı 200 + 7 × 10 = 270 olur. Bitiren her robot, bitiremeyenlerin önünde sıralanır.",
      seslendirme: "Robot on altı satırın dokuzuna kadar gelip durduysa puanı iki yüz artı yedi çarpı on, yani iki yüz yetmiş olur. Bitiren her robot, bitiremeyenlerin önünde sıralanır.",
      gorsel: { tur: "cizim", ad: "meb-puan" },
      soru: {
        soru: "Bir robot 12. satıra kadar geldi ve süre doldu. Puanı kaç?",
        secenekler: [{ metin: "120" }, { metin: "240", dogru: true }, { metin: "280" }],
        aciklama: "200 + (16 − 12) × 10 = 240. Bitiren robotların puanı süreleridir (en çok 90 civarı), bu yüzden bitiremeyen her robot onların arkasındadır."
      }
    },
    {
      bit: "ipucu",
      metin: "Robot yarışırken kimseden yardım alamaz: kablosuz bağlantı ve ayar anahtarı yasak, yalnız bir başlatma düğmesi olabilir. Robot her şeye kendi başına karar verir.",
      gorsel: { tur: "sahne", ad: "rizbot-labirentte" }
    }
  ],
  dene: {
    bilesen: "puan-hesaplayici", ayar: {},
    yonerge: "Bitiren ve bitiremeyen robotların puanını hesapla. Süreyi, müdahale sayısını ve ulaşılan satırı değiştir: puan nasıl değişiyor? En az üç farklı puan bul.",
    enAzFarkliDeger: 3
  },
  gorev: {
    tur: "lab", modul: "labirent", gorev: "lb-meb",
    yonerge: "Lab'daki MEB pistinde gerçek boyutlu labirentte yarış: 90 saniyen var. Önceki derslerdeki kurallardan birini seç ya da kendininkini yaz. 60 saniyenin altına inebilir misin?"
  },
  gercek: {
    malzeme: [{ parca: "maskeleme-bandi", adet: 1 }, { parca: "karton-duvar", adet: 20 }, { parca: "beyaz-a4-kagit", adet: 1 }, { parca: "kronometre", adet: 1 }],
    adimlar: [
      "Sınıfça yerdeki labirenti büyütün: en az 4 × 8 hücre. Bitiş hücresine beyaz kâğıt koyun.",
      "Her grup bir \"robot\" ve bir \"programcı\" seçsin. Programcı kuralı (sağ el, sol el ya da hafızalı) önceden kâğıda yazar; yarışırken konuşmak yok.",
      "Hakem süreyi tutar: robot bitişte 5 saniye bekler, her müdahale 10 saniye ceza. Bitiremeyen grubun ulaştığı satır yazılır.",
      "Puanları hesaplayıp tahtada sıralayın. Hangi kural en iyi sonucu verdi?"
    ],
    guvenlik: "Gözler açık yürünür; sırasını bekleyenler labirentin dışında durur.",
    ogretmenNotu: "Kurallar MEB Robot Yarışması 2026 Labirent Ustası şartnamesinden. \"Yarışırken konuşmak yok\", robottaki kablosuz bağlantı yasağının sınıftaki karşılığıdır: program önceden yazılır, yarışta değiştirilemez."
  }
};

/** Labirent modülünün altı dersi, sırasıyla */
export const LABIRENT_DERSLERI: DersTanimi[] = [DUVAR_SENSORLERI, SAG_EL_KURALI, CIKMAZI_HATIRLAMAK, ADA_PROBLEMI, HIZ_PROFILI, MEB_PISTI];
