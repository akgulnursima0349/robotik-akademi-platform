/* Lise · Kontrol (mBot2) modülünün çizimleri ve çizimli adımların metinleri.
   Ekrandaki metin formülleri sembolle yazar; sesli okunan metin (ses) aynı şeyi sözle söyler. Çizim katmanları sesli
   okunan metnin kelimelerine bağlıdır (konuşma balonu seslendirme varken onun kelimelerini sayar). */
import type { Cizim, CizimRengi, Katman, Sekil } from "./gorseller";
import { kelime } from "./gorseller-labirent";

export const KONTROL_METINLERI = {
  surus: {
    metin: "İki teker farklı hızda dönünce robot bir çemberin üstünde döner. Robotun hızı v = (v_sol + v_sağ) / 2, dönme hızı ω = (v_sağ − v_sol) / L, dönüş yarıçapı R = v / ω. L iki teker arasındaki uzaklık; mBot2'de yaklaşık 11,5 cm.",
    ses: "İki teker farklı hızda dönünce robot bir çemberin üstünde döner. Robotun hızı, iki teker hızının ortalamasıdır. Dönme hızı omega, hız farkının iki teker arasındaki uzaklığa bölümüdür. Dönüş yarıçapı, hızın omegaya bölümüdür. mBot2'de iki teker arası yaklaşık on bir buçuk santimetre."
  },
  kaliciHata: {
    metin: "Motor hızını yalnız P ile tutalım: güç = Kp · e. Hız hedefe yaklaştıkça e küçülür, güç azalır. Motor hedefin altında bir hızda dengede kalır; aradaki farka kalıcı hata denir. Simülasyondaki motorda e = hedef / (1 + 3,5 · Kp). Örnek: hedef 150 dev/dk, Kp = 1 → e = 150 / 4,5 ≈ 33 dev/dk; motor 117 dev/dk'da kalır.",
    ses: "Motor hızını yalnız P ile tutalım: güç, Kp çarpı hata. Hız hedefe yaklaştıkça hata küçülür, güç azalır. Motor hedefin altında bir hızda dengede kalır; aradaki farka kalıcı hata denir. Örneğin hedef 150 devir, Kp bir iken hata yaklaşık 33 devir olur; motor 117 devirde kalır."
  },
  iTerimi: {
    metin: "I terimi hatayı zamanla toplar: I = Ki · Σ(e · Δt). Hata küçük de olsa sürdükçe toplam büyür, güç artar ve motor hedefe varır. Örnek: e = 10 dev/dk hata 0,5 saniye sürerse toplam 10 · 0,5 = 5 olur; Ki = 10 ise güce 10 · 5 = %50 eklenir.",
    ses: "I terimi hatayı zamanla toplar. Her döngüde hata çarpı geçen süre toplama eklenir, toplam Ki ile çarpılır. Hata küçük de olsa sürdükçe toplam büyür, güç artar ve motor hedefe varır. Örneğin on devirlik hata yarım saniye sürerse toplam beş olur; Ki on ise güce yüzde elli eklenir."
  },
  birikme: {
    metin: "Motor gücü en çok %100. Hız hedeften çok uzakken güç %100'e dayanır ama I toplamı büyümeye devam eder. Hedefe varınca bu fazla toplam boşalana kadar motor hedefi aşar: buna aşırı birikme (windup) denir. Çözüm sınırlama (anti-windup): güç sınırdayken toplamayı durdur.",
    ses: "Motor gücü en çok yüzde yüz. Hız hedeften çok uzakken güç yüzde yüze dayanır ama I toplamı büyümeye devam eder. Hedefe varınca bu fazla toplam boşalana kadar motor hedefi aşar. Buna aşırı birikme denir. Çözüm sınırlama: güç sınırdayken toplamayı durdur."
  },
  ornekleme: {
    metin: "Kontrol programı bir döngüdür: sensörü oku, hesapla, motora yaz, bekle. Bir turun süresine örnekleme aralığı (Ts) denir. İki ölçüm arasında robot kördür, son kararla gider: kör yol = v · Ts. Örnek: 1,5 m/sn hızda Ts = 20 ms → 1,5 · 0,02 = 0,03 m = 3 cm.",
    ses: "Kontrol programı bir döngüdür: sensörü oku, hesapla, motora yaz, bekle. Bir turun süresine örnekleme aralığı denir. İki ölçüm arasında robot kördür, son kararla gider. Kör gittiği yol, hız çarpı örnekleme aralığıdır. Örneğin saniyede bir buçuk metre hızla, yirmi milisaniyede üç santimetre."
  },
  gecikme: {
    metin: "Ölçüm ile motorun tepkisi arasında bir de gecikme var: hesap süresi, haberleşme, motorun hızlanması. Robot ortalama Ts / 2 + gecikme kadar geç tepki verir. Örnek: Ts = 20 ms, gecikme 10 ms → 20 / 2 + 10 = 20 ms. Geç gelen düzeltme, robot çizgiyi çoktan geçmişken uygulanır: salınım büyür.",
    ses: "Ölçüm ile motorun tepkisi arasında bir de gecikme var: hesap süresi, haberleşme, motorun hızlanması. Robot ortalama olarak örnekleme aralığının yarısı artı gecikme kadar geç tepki verir. Örneğin yirmi milisaniyelik döngü ve on milisaniyelik gecikmeyle yirmi milisaniye. Geç gelen düzeltme, robot çizgiyi çoktan geçmişken uygulanır: salınım büyür."
  },
  torkDevir: {
    metin: "DC motorun torku devir arttıkça azalır: τ = τ_kilit · (1 − devir / devir_boşta). Kilitliyken (devir 0) tork en büyük, boşta (yük yok) tork sıfır. Örnek: mBot2'nin motoru 7,4 V'ta τ_kilit = 5 kg·cm, boşta 350 dev/dk. 1,5 kg·cm yükte devir = 350 · (1 − 1,5 / 5) = 245 dev/dk.",
    ses: "DC motorun torku devir arttıkça azalır. Kilitliyken, yani devir sıfırken tork en büyük; boşta, yani yük yokken tork sıfır. Arada düz bir çizgi. mBot2'nin motoru yedi virgül dört voltta beş kilogram santimetre başlangıç torku veriyor ve boşta 350 devirle dönüyor. Bir buçuk kilogram santimetre yükte 245 devir."
  },
  guc: {
    metin: "Mekanik güç P = τ · ω (tork N·m, ω rad/sn). Örnek: 1,5 kg·cm ≈ 0,147 N·m; 245 dev/dk = 245 · 2π / 60 ≈ 25,7 rad/sn; P ≈ 0,147 · 25,7 ≈ 3,8 W. Güç en çok boşta devrin yarısında: orada tork da yarıdadır.",
    ses: "Mekanik güç, tork çarpı açısal hızdır. Bir buçuk kilogram santimetre yaklaşık 0,147 newton metre, 245 devir saniyede yaklaşık 25,7 radyan. Çarpınca yaklaşık 3,8 vat. Güç en çok, boşta devrin yarısında: orada tork da yarıdadır."
  },
  disli: {
    metin: "Dişli oranı n olan bir dişli takımı torku n katına çıkarır, devri n'e böler (kayıpları yok sayıyoruz). Örnek: n = 2 → τ_kilit = 5 · 2 = 10 kg·cm, devir_boşta = 350 / 2 = 175 dev/dk. n < 1 ise tersi: hız artar, tork azalır.",
    ses: "Dişli oranı n olan bir dişli takımı torku n katına çıkarır, devri n'e böler. Örneğin oran iki ise başlangıç torku on kilogram santimetreye çıkar, boşta devir 175'e düşer. Oran birden küçükse tersi: hız artar, tork azalır."
  },
  enkoder: {
    metin: "Enkoder motorun kaç derece döndüğünü sayar; mBot2'de 1 derece hassasiyetle. Teker N derece dönünce gidilen yol = (N / 360) · π · d. Örnek: N = 537°, d = 6,4 cm → 537 / 360 · 3,14 · 6,4 ≈ 30 cm.",
    ses: "Enkoder motorun kaç derece döndüğünü sayar; mBot2'de bir derece hassasiyetle. Teker tam tur dönünce çevresi kadar, yani pi çarpı çap kadar yol alır. N derece dönünce yolun N bölü 360'ı kadar. Örneğin 537 derece ve 6,4 santimetre çapla yaklaşık otuz santimetre."
  },
  yerindeDonus: {
    metin: "Yerinde dönerken iki teker ters yönde aynı hızla döner; her teker yarıçapı L / 2 olan bir çemberin yayını gider: yay = (L / 2) · θ. Örnek: 180° (π rad) dönüş, L = 11,5 cm → 5,75 · 3,14 ≈ 18,1 cm; enkoder: 18,1 / (3,14 · 6,4) · 360 ≈ 323°.",
    ses: "Yerinde dönerken iki teker ters yönde aynı hızla döner. Her teker, yarıçapı iki teker arasının yarısı olan bir çemberin yayını gider. Örneğin yarım tur dönüşte her teker yaklaşık on sekiz santimetre gider; bu da tekerin yaklaşık 323 derece dönmesi demek."
  },
  odometri: {
    metin: "Robot enkoderlerden konumunu hesaplar: buna odometri denir. Küçük hatalar birikir. Örnek: sağ teker aslında 6,5 cm ama robot 6,4 cm sanıyor. Her düz gidişte sağ teker %1,6 fazla yol alır, robot hafifçe döner. 30 cm'lik kareyi bitirince başlangıçtan yaklaşık 4,6 cm uzakta ve 13° yanlış yöne bakar.",
    ses: "Robot enkoderlerden konumunu hesaplar: buna odometri denir. Küçük hatalar birikir. Örneğin sağ teker aslında 6,5 santimetre ama robot 6,4 sanıyor. Her düz gidişte sağ teker yüzde 1,6 fazla yol alır, robot hafifçe döner. Otuz santimetrelik kareyi bitirince başlangıçtan yaklaşık dört buçuk santimetre uzakta ve on üç derece yanlış yöne bakar."
  },
  ornekSurus: {
    metin: "Örnek: v_sol = 10 cm/sn, v_sağ = 20 cm/sn, L = 11,5 cm. v = (10 + 20) / 2 = 15 cm/sn. ω = (20 − 10) / 11,5 ≈ 0,87 rad/sn (yaklaşık 50°/sn). R = 15 / 0,87 ≈ 17,3 cm.",
    ses: "Örnek: sol teker saniyede on, sağ teker yirmi santimetre. Robotun hızı on beş. Omega, on bölü on bir buçuk, yaklaşık 0,87 radyan; saniyede yaklaşık elli derece. Yarıçap, on beş bölü 0,87, yaklaşık on yedi santimetre."
  },
  donmeAcisi: {
    metin: "Dönülen açı θ = ω · t. Örnek: ω = 0,87 rad/sn ile 3 saniyede θ = 0,87 · 3 ≈ 2,6 rad ≈ 150°. Görevde önce yarıçapı ve açıyı bul, sonra ω ve v'yi; en son teker hızlarını: v_sağ − v_sol = ω · L ve v_sol + v_sağ = 2v.",
    ses: "Dönülen açı, omega çarpı süredir. Örneğin 0,87 radyanla üç saniyede yaklaşık 2,6 radyan, yani yüz elli derece. Görevde önce yarıçapı ve açıyı bul, sonra omegayı ve hızı; en son teker hızlarını."
  },
  pidToplam: {
    metin: "Tam formül: güç = Kp · e + Ki · Σ(e · Δt) + Kd · Δe / Δt. Hız ölçümü titrekse D bu titremeyi büyütür; motor hızında Kd çok küçük tutulur ya da hiç kullanılmaz. Önce Kp, sonra Ki, gerekirse Kd.",
    ses: "Tam formül: güç, Kp çarpı hata, artı Ki çarpı hata toplamı, artı Kd çarpı hatanın değişim hızı. Hız ölçümü titrekse D bu titremeyi büyütür; motor hızında Kd çok küçük tutulur ya da hiç kullanılmaz. Önce Kp, sonra Ki, gerekirse Kd."
  },
  yavasAyar: {
    metin: "Yavaş döngüde: Taban Hızı düşür (kör yol kısalır), Kp'yi küçült (her düzeltme daha yumuşak), Kd'yi dikkatle ayarla. D terimi Δe / Δt: Δt büyüyünce aynı Kd'nin etkisi değişir. Örnek: Δe = 20, Δt = 0,01 sn → 2000; Δt = 0,02 sn → 1000.",
    ses: "Yavaş döngüde Taban Hızı düşür, kör yol kısalır. Kp'yi küçült, her düzeltme daha yumuşak olur. Kd'yi dikkatle ayarla: D terimi hatanın değişimini geçen süreye böler, süre büyüyünce aynı Kd'nin etkisi değişir."
  },
  rampaKuvvet: {
    metin: "Rampada gereken kuvvet F = m · g · (sin θ + μ · cos θ), teker torku τ = F · r. Örnek: 2,5 kg, 8° rampa, μ = 0,03: F = 2,5 · 9,81 · (0,139 + 0,03 · 0,990) ≈ 4,1 N; r = 3,2 cm → τ = 4,1 · 0,032 ≈ 0,13 N·m ≈ 1,35 kg·cm (iki motora bölünür). Çok tork, az hız demek: dişli oranı rampa dikleştikçe büyür.",
    ses: "Rampada gereken kuvvet, kütle çarpı yer çekimi çarpı eğimin sinüsü artı sürtünme payı. Teker torku, kuvvet çarpı teker yarıçapı. Örneğin iki buçuk kilogramlık robot, sekiz derecelik rampada yaklaşık 4,1 newton ister; bu da yaklaşık 1,35 kilogram santimetre tork, iki motora bölünür. Rampa dikleştikçe daha büyük dişli oranı gerekir."
  },
  pilOrani: {
    metin: "Pil zayıfken motorlar istenen gücün yalnız bir kısmını verir: gerçek hız = istenen · pil oranı. Örnek: Taban Hız 160, pil %80 güç veriyor → 160 · 0,8 = 128. Hız düşünce Kp ve Kd'nin etkisi de değişir; aynı ayar artık aynı robot değildir.",
    ses: "Pil zayıfken motorlar istenen gücün yalnız bir kısmını verir. Örneğin Taban Hız 160 ve pil yüzde seksen güç veriyorsa robot 128 ile gider. Hız düşünce Kp ve Kd'nin etkisi de değişir; aynı ayar artık aynı robot değildir."
  },
  ucSurum: {
    metin: "Bu dersin deneyi ve görevi Çizgi İzleyen modülündeki robotun (SiroLine) modeliyle koşar: simülasyondaki robot, ağır robot ve zayıf pilli, yavaş kartlı robot. Sağlam ayarın ölçüsü en iyi tur değil, en kötü turdur.",
    ses: "Bu dersin deneyi ve görevi Çizgi İzleyen modülündeki robotun (SiroLine) modeliyle koşar: simülasyondaki robot, ağır robot ve zayıf pilli, yavaş kartlı robot. Sağlam ayarın ölçüsü en iyi tur değil, en kötü turdur."
  },
  modelGercek: {
    metin: "Simülasyon bir modeldir. Gerçek robotta kütle farklıdır, tekerler kayar, pil zayıflar, kart yavaşlar, motor geç tepki verir. Simülasyonda en hızlı ayar, gerçekte çoğu zaman en kırılgan ayardır. Sağlam ayar, farklı koşulların hepsinde iş gören ayardır.",
    ses: "Simülasyon bir modeldir. Gerçek robotta kütle farklıdır, tekerler kayar, pil zayıflar, kart yavaşlar, motor geç tepki verir. Simülasyonda en hızlı ayar, gerçekte çoğu zaman en kırılgan ayardır. Sağlam ayar, farklı koşulların hepsinde iş gören ayardır."
  }
} as const;
type MetinAdi = keyof typeof KONTROL_METINLERI;

const yazici = (ad: MetinAdi) => (sekil: Sekil, renk: CizimRengi, soz?: string): Katman => ({ sekil, renk, ...(soz ? { kelime: kelime(KONTROL_METINLERI[ad].ses, soz) } : {}) });
const kutu = (x: number, y: number, g: number, y2: number, dolgu?: CizimRengi, kose = 4): Sekil => ({ tur: "kutu", x, y, g, y2, dolgu, kose });
const cizgi = (...n: [number, number][]): Sekil => ({ tur: "cizgi", noktalar: n });
const ok = (...n: [number, number][]): Sekil => ({ tur: "ok", noktalar: n });
const yaz = (x: number, y: number, metin: string, hiza: "sol" | "orta" | "sag" = "sol"): Sekil => ({ tur: "etiket", x, y, metin, hiza });
const daire = (x: number, y: number, r: number, dolgu?: CizimRengi): Sekil => ({ tur: "daire", x, y, r, dolgu });
/** f(t), t ∈ [0, 1] eğrisinden n noktalı çizgi */
const egri = (f: (t: number) => [number, number], n = 24): Sekil => cizgi(...Array.from({ length: n + 1 }, (_, i) => f(i / n)));
/** grafik eksenleri: sol alt köşe (x0, y0), genişlik g, yükseklik h */
const eksen = (k: ReturnType<typeof yazici>, x0: number, y0: number, g: number, h: number, xAd: string, yAd: string, soz: string, xAdAlti = 22): Katman[] => [
  k(ok([x0, y0], [x0 + g, y0]), "murekkep", soz), k(ok([x0, y0], [x0, y0 - h]), "murekkep", soz),
  k(yaz(x0 + g, y0 + xAdAlti, xAd, "sag"), "murekkep", soz), k(yaz(x0 + 8, y0 - h + 4, yAd), "murekkep", soz)
];

export const KONTROL_CIZIMLERI: Record<string, Cizim> = {
  "diferansiyel-surus": (() => {
    const k = yazici("surus");
    /* robot (260, 170) yukarı bakar; dönme merkezi solda (110, 170) */
    return {
      aciklama: "Üstten mBot2: sol tekerde kısa, sağ tekerde uzun hız oku; teker ekseninin uzantısında soldaki dönme merkezi ve robotun gittiği yay. İki teker arası L, merkeze uzaklık R.",
      katmanlar: [
        k(kutu(226, 140, 12, 60, "siyah", 3), "siyah", "İki"), k(kutu(282, 140, 12, 60, "siyah", 3), "siyah", "İki"), k(kutu(236, 130, 48, 80, "mavi", 8), "mavi", "İki"),
        k(ok([232, 140], [232, 100]), "sari", "farklı"), k(yaz(222, 96, "v_sol", "sag"), "sari", "farklı"),
        k(ok([288, 140], [288, 60]), "yesil", "farklı"), k(yaz(298, 66, "v_sağ"), "yesil", "farklı"),
        k(egri((t) => [110 + 150 * Math.cos(t * 0.9), 170 - 150 * Math.sin(t * 0.9)]), "mor", "çemberin"),
        k(daire(110, 170, 6, "kirmizi"), "kirmizi", "çemberin"), k(yaz(110, 196, "dönme merkezi", "orta"), "kirmizi", "çemberin"),
        k(ok([116, 170], [226, 170]), "kirmizi", "yarıçapı,"), k(yaz(170, 160, "R", "orta"), "kirmizi", "yarıçapı,"),
        k(cizgi([232, 224], [288, 224]), "murekkep", "uzaklığa"), k(yaz(260, 246, "L", "orta"), "murekkep", "uzaklığa"),
        k(yaz(398, 120, "v = ortalama", "sag"), "murekkep", "ortalamasıdır."), k(yaz(398, 142, "ω = fark / L", "sag"), "murekkep", "omega,"), k(yaz(398, 164, "R = v / ω", "sag"), "murekkep", "yarıçapı,")
      ]
    };
  })(),
  "kalici-hata": (() => {
    const k = yazici("kaliciHata");
    const x0 = 50, y0 = 220, G = 320, H = 180, hedefY = y0 - 150;
    return {
      aciklama: "Hız–zaman grafiği: üstte kesikli hedef çizgisi; yalnız P ile hız hedefin altında yatay kalıyor, aradaki boşluk kalıcı hata diye işaretli.",
      katmanlar: [
        ...eksen(k, x0, y0, G, H, "zaman", "hız", "Motor"),
        k(cizgi([x0, hedefY], [x0 + G - 10, hedefY]), "kirmizi", "hedefe"), k(yaz(x0 + G - 10, hedefY - 8, "hedef 150", "sag"), "kirmizi", "hedefe"),
        k(egri((t) => [x0 + t * (G - 10), y0 - 117 * (1 - Math.exp(-t * 7))]), "mor", "dengede"), k(yaz(x0 + 150, y0 - 126, "yalnız P: 117", "orta"), "mor", "dengede"),
        k(ok([x0 + 260, y0 - 117], [x0 + 260, hedefY + 4]), "sari", "kalıcı"), k(yaz(x0 + 254, y0 - 84, "kalıcı hata ≈ 33", "sag"), "sari", "kalıcı")
      ]
    };
  })(),
  "i-terimi": (() => {
    const k = yazici("iTerimi");
    const x0 = 50, y0 = 130, G = 320;
    return {
      aciklama: "Üstte hata–zaman grafiği: küçük bir hata uzun süre kalıyor, altındaki alan taralı (toplam). Altta toplamın zamanla büyüdüğünü gösteren yükselen çizgi.",
      katmanlar: [
        k(ok([x0, y0], [x0 + G, y0]), "murekkep", "hatayı"), k(ok([x0, y0], [x0, 20]), "murekkep", "hatayı"), k(yaz(x0 + 8, 26, "hata"), "murekkep", "hatayı"),
        ...Array.from({ length: 10 }, (_, i) => k(kutu(x0 + 6 + i * 28, y0 - 30, 22, 30, "sari", 2), "sari", "toplama")),
        k(yaz(x0 + 150, y0 - 40, "her döngü: e · Δt", "orta"), "murekkep", "toplama"),
        k(ok([x0, 240], [x0 + G, 240]), "murekkep", "toplam"), k(ok([x0, 240], [x0, 150]), "murekkep", "toplam"), k(yaz(x0 + 8, 160, "toplam"), "murekkep", "toplam"),
        k(cizgi([x0, 240], [x0 + 300, 160]), "mor", "büyür,"), k(yaz(x0 + G, 254, "zaman", "sag"), "murekkep", "büyür,"),
        k(yaz(x0 + 290, 186, "güç artar", "sag"), "yesil", "güç")
      ]
    };
  })(),
  "asiri-birikme": (() => {
    const k = yazici("birikme");
    const x0 = 50, y0 = 230, G = 320, hedefY = 110;
    return {
      aciklama: "Hız–zaman grafiği: güç %100'de dayanmışken hız yükseliyor; sınırlama kapalıyken hız hedefi aşıp geri iniyor (aşma), sınırlama açıkken hedefe yumuşakça oturuyor.",
      katmanlar: [
        ...eksen(k, x0, y0, G, 200, "zaman", "hız", "Motor"),
        k(kutu(x0 + 40, 40, 110, 16, "kirmizi", 4), "kirmizi", "dayanır"), k(yaz(x0 + 95, 34, "güç %100", "orta"), "kirmizi", "dayanır"),
        k(cizgi([x0, hedefY], [x0 + G - 10, hedefY]), "murekkep", "Hedefe"), k(yaz(x0 + G - 10, hedefY - 8, "hedef", "sag"), "murekkep", "Hedefe"),
        k(egri((t) => { const x = x0 + t * (G - 10); const u = t * 3.2; return [x, u < 1 ? y0 - (y0 - hedefY) * u : hedefY - 60 * Math.exp(-(u - 1) * 1.6) * Math.sin((u - 1) * 3.4)]; }, 40), "kirmizi", "aşar."),
        k(yaz(x0 + 140, 44 + 28, "aşma", "orta"), "kirmizi", "aşar."),
        k(egri((t) => { const x = x0 + t * (G - 10); const u = t * 3.2; return [x, u < 1 ? y0 - (y0 - hedefY) * u : hedefY + 0]; }, 40), "yesil", "sınırlama:"),
        k(yaz(x0 + G - 10, hedefY + 26, "sınırlama açık", "sag"), "yesil", "sınırlama:")
      ]
    };
  })(),
  "ornekleme": (() => {
    const k = yazici("ornekleme");
    const x0 = 40, y0 = 200, G = 340;
    const f = (t: number) => y0 - 60 - 60 * Math.sin(t * 5.2);
    const adim = 34;
    const merdiven: [number, number][] = [];
    for (let x = 0; x < G - 20; x += adim) { const y = f(x / (G - 20)); merdiven.push([x0 + x, y], [x0 + Math.min(x + adim, G - 20), y]); }
    return {
      aciklama: "Zamanla değişen sapma eğrisi ve onun basamaklı hâli: kontrolcü yalnız eşit aralıklarla ölçüyor; iki ölçüm arasında son değeri kullanıyor. Bir basamağın genişliği Ts.",
      katmanlar: [
        k(ok([x0, y0], [x0 + G, y0]), "murekkep", "döngüdür:"), k(yaz(x0 + G, y0 + 22, "zaman", "sag"), "murekkep", "döngüdür:"),
        k(egri((t) => [x0 + t * (G - 20), f(t)], 48), "gri", "sensörü"), k(yaz(x0 + 4, 30, "gerçek sapma (gri)"), "gri", "sensörü"),
        k(cizgi(...merdiven), "mor", "turun"), k(yaz(x0 + 4, 52, "robotun bildiği (mor)"), "mor", "turun"),
        k(cizgi([x0 + adim * 4, y0 + 8], [x0 + adim * 5, y0 + 8]), "kirmizi", "örnekleme"), k(yaz(x0 + adim * 4.5, y0 + 30, "Ts", "orta"), "kirmizi", "örnekleme"),
        k(yaz(x0 + G, 30, "kör yol = v · Ts", "sag"), "kirmizi", "kördür,")
      ]
    };
  })(),
  "gecikme": (() => {
    const k = yazici("gecikme");
    return {
      aciklama: "Zaman çizgisi: solda sensör ölçüyor, ortada hesap ve haberleşme kutuları, sağda motorun tepkisi; aradaki süre gecikme. Altta robot çizgiyi geçmiş, düzeltme geç geliyor.",
      katmanlar: [
        k(cizgi([20, 70], [380, 70]), "murekkep", "Ölçüm"),
        k(daire(40, 70, 10, "mavi"), "mavi", "Ölçüm"), k(yaz(40, 50, "ölçüm", "orta"), "mavi", "Ölçüm"),
        k(kutu(80, 56, 80, 28, "gri", 6), "gri", "hesap"), k(yaz(120, 106, "hesap", "orta"), "murekkep", "hesap"),
        k(kutu(170, 56, 90, 28, "gri", 6), "gri", "haberleşme,"), k(yaz(215, 106, "haberleşme", "orta"), "murekkep", "haberleşme,"),
        k(daire(300, 70, 10, "yesil"), "yesil", "hızlanması."), k(yaz(300, 50, "motor tepkisi", "orta"), "yesil", "hızlanması."),
        k(ok([40, 130], [300, 130]), "kirmizi", "geç"), k(yaz(170, 150, "≈ Ts / 2 + gecikme", "orta"), "kirmizi", "geç"),
        k(kutu(30, 200, 340, 18, "siyah", 3), "siyah", "çizgiyi"),
        k(egri((t) => [40 + t * 320, 209 + 34 * Math.sin(t * 9)], 40), "mor", "salınım"), k(yaz(200, 252, "geç düzeltme: salınım büyür", "orta"), "mor", "salınım")
      ]
    };
  })(),
  "tork-devir": (() => {
    const k = yazici("torkDevir");
    const x0 = 60, y0 = 200, G = 300, H = 150;
    return {
      aciklama: "Tork–devir grafiği: soldaki eksende kilitlenme torku 5 kg·cm, alttaki eksende boşta devir 350 dev/dk; ikisini birleştiren düz çizgi. 1,5 kg·cm yükte çalışma noktası 245 dev/dk'da.",
      katmanlar: [
        ...eksen(k, x0, y0, G + 30, H + 34, "devir (dev/dk)", "tork (kg·cm)", "DC", 46),
        k(cizgi([x0, y0 - H], [x0 + G, y0]), "mor", "düz"),
        k(daire(x0, y0 - H, 6, "kirmizi"), "kirmizi", "Kilitliyken,"), k(yaz(x0 - 8, y0 - H + 4, "5", "sag"), "kirmizi", "Kilitliyken,"), k(yaz(x0 + 14, y0 - H + 4, "kilit torku"), "kirmizi", "Kilitliyken,"),
        k(daire(x0 + G, y0, 6, "yesil"), "yesil", "boşta,"), k(yaz(x0 + G, y0 + 22, "350", "orta"), "yesil", "boşta,"),
        k(cizgi([x0, y0 - H * 0.3], [x0 + G * 0.7, y0 - H * 0.3]), "sari", "yükte"), k(yaz(x0 - 8, y0 - H * 0.3 + 4, "1,5", "sag"), "sari", "yükte"),
        k(daire(x0 + G * 0.7, y0 - H * 0.3, 7, "sari"), "sari", "245"), k(cizgi([x0 + G * 0.7, y0 - H * 0.3], [x0 + G * 0.7, y0]), "sari", "245"),
        k(yaz(x0 + G * 0.7, y0 + 22, "245", "orta"), "sari", "245")
      ]
    };
  })(),
  "guc-egrisi": (() => {
    const k = yazici("guc");
    const x0 = 60, y0 = 200, G = 300, H = 150;
    return {
      aciklama: "Güç–devir grafiği: güç sıfırdan başlayıp boşta devrin yarısında en yükseğe çıkan, boşta devirde yeniden sıfıra inen bir kemer.",
      katmanlar: [
        ...eksen(k, x0, y0, G + 30, H + 40, "devir", "güç (W)", "Mekanik", 46),
        k(egri((t) => [x0 + t * G, y0 - 4 * H * t * (1 - t)], 32), "mor", "tork"),
        k(cizgi([x0 + G / 2, y0 - H], [x0 + G / 2, y0]), "kirmizi", "yarısında:"), k(yaz(x0 + G / 2, y0 - H - 10, "en çok güç", "orta"), "kirmizi", "yarısında:"),
        k(yaz(x0 + G / 2, y0 + 22, "boşta devrin yarısı", "orta"), "kirmizi", "yarısında:"),
        k(daire(x0 + G * 0.7, y0 - 4 * H * 0.7 * 0.3, 6, "sari"), "sari", "3,8"), k(yaz(x0 + G * 0.7 + 10, y0 - 4 * H * 0.21 + 22, "3,8 W"), "sari", "3,8")
      ]
    };
  })(),
  "disli-orani": (() => {
    const k = yazici("disli");
    const disli = (x: number, y: number, r: number, renk: CizimRengi, soz: string): Katman[] => [
      k(daire(x, y, r + 6, renk), renk, soz), k(daire(x, y, r, "beyaz"), renk, soz), k(daire(x, y, 5, "murekkep"), "murekkep", soz),
      ...Array.from({ length: Math.round(r / 4) }, (_, i) => { const a = (i / Math.round(r / 4)) * Math.PI * 2; return k(kutu(x + Math.cos(a) * (r + 6) - 4, y + Math.sin(a) * (r + 6) - 4, 8, 8, renk, 2), renk, soz); })
    ];
    return {
      aciklama: "İki dişli: soldaki küçük dişli motorda, sağdaki iki kat büyük dişli tekerde. Küçük dişli hızlı döner; büyük dişli yarı hızla ama iki kat torkla döner.",
      katmanlar: [
        ...disli(120, 120, 30, "sari", "Dişli"), k(yaz(120, 196, "motor", "orta"), "sari", "Dişli"),
        ...disli(226, 120, 66, "mor", "takımı"), k(yaz(226, 226, "teker", "orta"), "mor", "takımı"),
        k(yaz(330, 60, "tork × n"), "yesil", "torku"), k(yaz(330, 86, "devir ÷ n"), "kirmizi", "devri"),
        k(yaz(120, 40, "n = 2", "orta"), "murekkep", "iki")
      ]
    };
  })(),
  "enkoder-yol": (() => {
    const k = yazici("enkoder");
    return {
      aciklama: "Solda derece çizgileriyle işaretli teker; teker yere açılınca bir tur, çevresi kadar (π · d) yol. N derece dönüşte bu yolun N / 360'ı.",
      katmanlar: [
        k(daire(90, 110, 56, "siyah"), "siyah", "Enkoder"), k(daire(90, 110, 40, "gri"), "gri", "Enkoder"),
        ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return k(cizgi([90 + Math.cos(a) * 42, 110 + Math.sin(a) * 42], [90 + Math.cos(a) * 54, 110 + Math.sin(a) * 54]), "beyaz", "derece"); }),
        k(yaz(90, 114, "d", "orta"), "beyaz", "çap"),
        k(cizgi([40, 172], [390, 172]), "murekkep", "tur"),
        k(ok([90, 188], [370, 188]), "mor", "çevresi"), k(yaz(230, 210, "1 tur = π · d", "orta"), "mor", "çevresi"),
        k(ok([90, 228], [90 + 280 * 537 / 360 / 1.6, 228]), "yesil", "537"), k(yaz(220, 252, "537° ≈ 30 cm", "orta"), "yesil", "537")
      ]
    };
  })(),
  "yerinde-donus-yay": (() => {
    const k = yazici("yerindeDonus");
    const cx = 200, cy = 130, r = 70;
    return {
      aciklama: "Üstten robot ve teker ekseninin ortasında merkez: iki teker merkezin çevresinde, yarıçapı L / 2 olan çember üstünde ters yönlere yay çiziyor.",
      katmanlar: [
        k(egri((t) => [cx + r * Math.cos(t * 2 * Math.PI), cy + r * Math.sin(t * 2 * Math.PI)], 48), "gri", "çemberin"),
        k(kutu(cx - r - 6, cy - 24, 12, 48, "siyah", 3), "siyah", "iki"), k(kutu(cx + r - 6, cy - 24, 12, 48, "siyah", 3), "siyah", "iki"),
        k(kutu(cx - r + 10, cy - 36, 2 * r - 20, 72, "mavi", 8), "mavi", "iki"),
        k(ok([cx - r - 14, cy + 10], [cx - r - 14, cy - 40]), "yesil", "ters"), k(ok([cx + r + 14, cy - 10], [cx + r + 14, cy + 40]), "kirmizi", "ters"),
        k(daire(cx, cy, 5, "kirmizi"), "kirmizi", "yarıçapı"), k(cizgi([cx, cy], [cx + r, cy]), "kirmizi", "yarıçapı"), k(yaz(cx + r / 2, cy - 8, "L / 2", "orta"), "beyaz", "yarıçapı"),
        k(yaz(200, 244, "yay = (L / 2) · θ", "orta"), "mor", "yayını")
      ]
    };
  })(),
  "odometri-hata": (() => {
    const k = yazici("odometri");
    const kare: [number, number][] = [[90, 220], [90, 60], [250, 60], [250, 220], [90, 220]];
    /* hatalı iz: her kenarda hafif sola kayar */
    const iz: [number, number][] = [[90, 220], [87, 60], [242, 46], [251, 200], [108, 214]];
    return {
      aciklama: "Kesikli gri kare robotun sandığı yol; mor çizgi gerçek iz: her kenarda biraz sapıyor, son köşe başlangıca kapanmıyor. Aradaki boşluk birikmiş hata.",
      katmanlar: [
        k(cizgi(...kare), "gri", "enkoderlerden"), k(yaz(272, 140, "robotun sandığı"), "gri", "enkoderlerden"),
        k(cizgi(...iz), "mor", "birikir."), k(yaz(272, 166, "gerçek iz"), "mor", "birikir."),
        k(daire(90, 220, 6, "yesil"), "yesil", "başlangıçtan"), k(daire(108, 214, 6, "kirmizi"), "kirmizi", "uzakta"),
        k(yaz(170, 250, "≈ 4,6 cm ve 13° hata", "orta"), "kirmizi", "uzakta")
      ]
    };
  })(),
  "model-gercek": (() => {
    const k = yazici("modelGercek");
    const satir = (y: number, sol: string, sag: string, soz: string): Katman[] => [k(yaz(110, y, sol, "orta"), "murekkep", soz), k(yaz(290, y, sag, "orta"), "kirmizi", soz)];
    return {
      aciklama: "İki sütun: solda model (simülasyon), sağda gerçek robot. Her satırda modelin varsaydığı ve gerçekte olan: kütle, tekerin tutunması, pil, döngü süresi, motor tepkisi.",
      katmanlar: [
        k(kutu(20, 14, 180, 34, "mor", 8), "mor", "modeldir."), k(yaz(110, 38, "Model", "orta"), "beyaz", "modeldir."),
        k(kutu(200, 14, 180, 34, "kirmizi", 8), "kirmizi", "Gerçek"), k(yaz(290, 38, "Gerçek robot", "orta"), "beyaz", "Gerçek"),
        ...satir(84, "kütle sabit", "üstüne parça eklenir", "kütle"),
        ...satir(118, "teker kaymaz", "teker kayar", "kayar,"),
        ...satir(152, "pil hep dolu", "pil zayıflar", "pil"),
        ...satir(186, "döngü 10 ms", "kart yavaşlar", "kart"),
        ...satir(220, "motor anında", "motor geç tepki verir", "geç"),
        k(cizgi([200, 60], [200, 236]), "gri", "Simülasyon")
      ]
    };
  })(),
  "kinematik-ornek": (() => {
    const k = yazici("ornekSurus");
    /* robot (250, 190) yukarı bakar; R = 17,3 cm → 17,3 × 6 px; merkez solda */
    const R = 104, cx = 250 - R, cy = 190;
    return {
      aciklama: "Üstten mBot2: sol teker 10, sağ teker 20 cm/sn; robot solundaki merkezin çevresinde 17,3 cm yarıçaplı bir yay çiziyor. Yanında v = 15 cm/sn, ω ≈ 0,87 rad/sn, R ≈ 17,3 cm.",
      katmanlar: [
        k(kutu(222, 166, 10, 48, "siyah", 3), "siyah", "sol"), k(kutu(268, 166, 10, 48, "siyah", 3), "siyah", "sol"), k(kutu(230, 158, 40, 64, "mavi", 8), "mavi", "sol"),
        k(ok([227, 166], [227, 136]), "sari", "on,"), k(yaz(216, 140, "10", "sag"), "sari", "on,"),
        k(ok([273, 166], [273, 106]), "yesil", "yirmi"), k(yaz(284, 112, "20"), "yesil", "yirmi"),
        k(yaz(398, 40, "v = (10 + 20) / 2 = 15", "sag"), "murekkep", "hızı"),
        k(yaz(398, 66, "ω = 10 / 11,5 ≈ 0,87", "sag"), "murekkep", "Omega,"),
        k(egri((t) => [cx + R * Math.cos(t * 1.2), cy - R * Math.sin(t * 1.2)]), "mor", "Yarıçap,"),
        k(daire(cx, cy, 5, "kirmizi"), "kirmizi", "Yarıçap,"), k(ok([cx + 6, cy], [222, cy]), "kirmizi", "Yarıçap,"),
        k(yaz(cx + 10, cy + 28, "R ≈ 17,3 cm", "orta"), "kirmizi", "Yarıçap,"),
        k(yaz(398, 92, "R = 15 / 0,87 ≈ 17,3", "sag"), "kirmizi", "on yedi")
      ]
    };
  })(),
  "donme-acisi": (() => {
    const k = yazici("donmeAcisi");
    const cx = 130, cy = 170, R = 110, son = (150 * Math.PI) / 180;
    return {
      aciklama: "Bir dönme merkezi ve çevresinde robotun 3 saniyede çizdiği 150°'lik yay; başlangıçtaki ve sondaki robot yönü, aradaki açı θ.",
      katmanlar: [
        k(daire(cx, cy, 5, "kirmizi"), "kirmizi", "Dönülen"),
        k(egri((t) => [cx + R * Math.cos(t * son), cy - R * Math.sin(t * son)], 36), "mor", "omega"),
        k(cizgi([cx, cy], [cx + R, cy]), "gri", "açı,"), k(cizgi([cx, cy], [cx + R * Math.cos(son), cy - R * Math.sin(son)]), "gri", "açı,"),
        k(egri((t) => [cx + 30 * Math.cos(t * son), cy - 30 * Math.sin(t * son)], 16), "kirmizi", "açı,"), k(yaz(cx + 26, cy - 40, "θ"), "kirmizi", "açı,"),
        k(daire(cx + R, cy, 7, "mavi"), "mavi", "Örneğin"), k(yaz(cx + R + 12, cy + 6, "başlangıç"), "mavi", "Örneğin"),
        k(daire(cx + R * Math.cos(son), cy - R * Math.sin(son), 7, "mavi"), "mavi", "üç"), k(yaz(cx + R * Math.cos(son) + 12, cy - R * Math.sin(son) - 10, "3 sn sonra"), "mavi", "üç"),
        k(yaz(390, 220, "θ = 0,87 · 3 ≈ 2,6 rad ≈ 150°", "sag"), "murekkep", "yüz elli")
      ]
    };
  })(),
  "pid-toplam": (() => {
    const k = yazici("pidToplam");
    const terim = (x: number, ad: string, alt: string, renk: CizimRengi, soz: string): Katman[] => [k(kutu(x, 60, 96, 60, renk, 10), renk, soz), k(yaz(x + 48, 96, ad, "orta"), "beyaz", soz), k(yaz(x + 48, 144, alt, "orta"), "murekkep", soz)];
    return {
      aciklama: "Üç kutu: P (şimdiki hata), I (hata toplamı), D (hatanın değişimi); üçü toplanıp motor gücünü veriyor.",
      katmanlar: [
        ...terim(14, "P", "Kp · e", "mor", "Kp"), k(yaz(122, 96, "+", "orta"), "murekkep", "artı"),
        ...terim(132, "I", "Ki · Σ(e · Δt)", "yesil", "toplamı,"), k(yaz(240, 96, "+", "orta"), "murekkep", "toplamı,"),
        ...terim(250, "D", "Kd · Δe / Δt", "sari", "değişim"),
        k(ok([200, 160], [200, 200]), "murekkep", "Hız"), k(kutu(130, 204, 140, 40, "kirmizi", 10), "kirmizi", "Hız"), k(yaz(200, 230, "güç (%)", "orta"), "beyaz", "Hız"),
        k(yaz(366, 40, "küçük!", "orta"), "sari", "küçük")
      ]
    };
  })(),
  "yavas-dongu-ayar": (() => {
    const k = yazici("yavasAyar");
    const satir = (y: number, ad: string, yon: "asagi" | "dikkat", not: string, soz: string): Katman[] => [
      k(yaz(40, y + 6, ad), "murekkep", soz),
      yon === "asagi" ? k(ok([170, y - 14], [170, y + 14]), "kirmizi", soz) : k(yaz(170, y + 6, "≈", "orta"), "sari", soz),
      k(yaz(200, y + 6, not), "murekkep", soz)
    ];
    return {
      aciklama: "Yavaş döngü için üç ayar: Taban Hız aşağı (kör yol kısalır), Kp aşağı (düzeltme yumuşar), Kd dikkatle (Δt büyüyünce etkisi değişir).",
      katmanlar: [
        k(yaz(200, 30, "Döngü yavaşsa", "orta"), "mor", "Yavaş"),
        ...satir(80, "Taban Hız", "asagi", "kör yol kısalır", "Taban"),
        ...satir(140, "Kp", "asagi", "düzeltme yumuşar", "Kp'yi"),
        ...satir(200, "Kd", "dikkat", "Δe / Δt değişir", "Kd'yi")
      ]
    };
  })(),
  "rampa-kuvvet": (() => {
    const k = yazici("rampaKuvvet");
    const a = (16 * Math.PI) / 180, x0 = 30, y0 = 230, L = 340;
    const nok = (d: number, h = 0): [number, number] => [x0 + d * Math.cos(a) - h * Math.sin(a), y0 - d * Math.sin(a) - h * Math.cos(a)];
    const govde = [nok(150, 0), nok(210, 0), nok(210, 34), nok(150, 34), nok(150, 0)];
    return {
      aciklama: "Eğik bir rampa ve üstünde robot; aşağı doğru ağırlığın rampaya paralel bileşeni ve sürtünme, yukarı doğru tekerin itme kuvveti F; θ açısı işaretli.",
      katmanlar: [
        k(cizgi([x0, y0], nok(L), [x0 + L * Math.cos(a), y0], [x0, y0]), "kahve", "Rampada"),
        k(egri((t) => [x0 + 46 * Math.cos(t * a), y0 - 46 * Math.sin(t * a)], 8), "kahve", "eğimin"), k(yaz(x0 + 56, y0 - 4, "θ"), "kahve", "eğimin"),
        k(cizgi(...govde), "mavi", "robot,"), k(daire(...nok(162, -2), 8, "siyah"), "siyah", "robot,"), k(daire(...nok(198, -2), 8, "siyah"), "siyah", "robot,"),
        k(ok(nok(180, 17), [nok(180, 17)[0], nok(180, 17)[1] + 70]), "kirmizi", "yer"), k(yaz(nok(180, 17)[0] - 8, nok(180, 17)[1] + 64, "m · g", "sag"), "kirmizi", "yer"),
        k(ok(nok(150, 17), nok(90, 17)), "sari", "sinüsü"), k(yaz(30, 120, "m·g·sin θ + sürtünme"), "sari", "sinüsü"),
        k(ok(nok(210, 17), nok(280, 17)), "yesil", "Teker"), k(yaz(nok(290, 30)[0], nok(290, 30)[1], "F", "orta"), "yesil", "Teker"),
        k(yaz(390, 30, "τ = F · r", "sag"), "murekkep", "Teker"), k(yaz(390, 56, "8°: F ≈ 4,1 N", "sag"), "murekkep", "4,1")
      ]
    };
  })(),
  "pil-orani": (() => {
    const k = yazici("pilOrani");
    return {
      aciklama: "İki çubuk: istenen Taban Hız 160, pil %80 güç verince gerçek hız 128. Yanında küçük bir pil simgesi, beşte dördü dolu.",
      katmanlar: [
        k(kutu(70, 60, 260, 40, "mor", 8), "mor", "istenen"), k(yaz(80, 50, "istenen 160"), "mor", "istenen"),
        k(kutu(70, 150, 208, 40, "kirmizi", 8), "kirmizi", "128"), k(yaz(80, 140, "gerçek 160 · 0,8 = 128"), "kirmizi", "128"),
        k(kutu(300, 196, 70, 34, "beyaz", 6), "murekkep", "Pil"), k(kutu(370, 206, 8, 14, "murekkep", 2), "murekkep", "Pil"),
        k(kutu(304, 200, 50, 26, "yesil", 4), "yesil", "seksen"), k(yaz(335, 252, "%80", "orta"), "yesil", "seksen")
      ]
    };
  })(),
  "uc-surum": (() => {
    const k = yazici("ucSurum");
    const surum = (x: number, ad1: string, ad2: string, renk: CizimRengi, soz: string): Katman[] => [
      k(kutu(x, 70, 100, 70, renk, 12), renk, soz), k(yaz(x + 50, 160, ad1, "orta"), "murekkep", soz), k(yaz(x + 50, 180, ad2, "orta"), "murekkep", soz)
    ];
    return {
      aciklama: "Üç robot kutusu yan yana: simülasyondaki robot, ağır robot, zayıf pilli ve yavaş kartlı robot. Altında: sağlam ayar en kötü tura göre ölçülür.",
      katmanlar: [
        ...surum(20, "simülasyondaki", "robot", "mor", "simülasyondaki"),
        ...surum(150, "ağır", "robot", "yesil", "ağır"),
        ...surum(280, "zayıf pil,", "yavaş kart", "sari", "zayıf"),
        k(yaz(200, 40, "aynı ayar, üç robot", "orta"), "murekkep", "deneyi"),
        k(yaz(200, 232, "ölçü: en kötü tur", "orta"), "kirmizi", "kötü")
      ]
    };
  })()
};
