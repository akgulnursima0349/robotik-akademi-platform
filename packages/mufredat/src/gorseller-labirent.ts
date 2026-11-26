/* Labirent modülünün (RizBot) anlatım çizimleri. Çizimdeki parçalar anlatım okunurken ilgili kelimede belirir; bu yüzden
   çizimli adımların metinleri burada durur (LABIRENT_METINLERI) ve dersler (dersler/labirent.ts) aynı metni kullanır.
   kelime(): metinde bir sözcüğün sırası; metin değişince sıra kendiliğinden doğru kalır. */
import type { Cizim, CizimRengi, Katman, Sekil } from "./gorseller";

export const LABIRENT_METINLERI = {
  hucre: "Labirent Ustası yarışmasında pist kare hücrelerden oluşur. Her hücre 20 santimetreye 20 santimetre. Duvarlar 8 santimetre yüksek ve parlak beyaz, zemin ise mat siyah.",
  yansima: "Sensör gözümüzün göremediği kızılötesi bir ışık yollar. Önünde beyaz bir duvar varsa ışık duvardan yansır ve sensöre geri döner. Duvar yoksa ışık uzaklaşır, geri gelmez.",
  sagElYolu: "Labirentte kaybolmamanın çok eski bir yolu var: sağ elini duvara koy ve hiç kaldırmadan yürü. Duvarlar birbirine bağlıysa bu yol seni sonunda bitişe götürür.",
  sagElAkisi: "Robot için bunu üç kurala çeviririz. Bir: sağ açıksa sağa dön ve ilerle. İki: sağ kapalı ama ön açıksa düz ilerle. Üç: ikisi de kapalıysa sola dön.",
  cikmazdaSagEl: "Çıkmaza girerse ne olur? Sağ kapalı, ön kapalı: sola döner. Sol da kapalıysa bir kez daha sola döner ve geldiği yoldan geri çıkar. Eli duvardan hiç kalkmamış olur.",
  robotGozu: "Gerçek bir labirentte robot haritayı bilmez; yalnız sensörlerinin gördüğünü bilir. Bir yol ayrımında hangi yolun bitişe gittiğini önceden bilemez.",
  cikmaz: "Yanlış yola girmek de olur: yol bir çıkmaza çıkar. Robot geri dönmek zorunda kalır; her çıkmaz zaman kaybettirir.",
  isaretleme: "Kaybolmamak için geçtiğin hücreleri işaretle. Bir yoldan ikinci kez geçtiysen o yol ya çıkmaza gidiyor ya da oradan geri döndün. Yol ayrımında hiç işaretlenmemiş yolu seç.",
  ada: "Bazı labirentlerde bitiş bir adanın içindedir: adanın duvarları dış duvara değmez. Sağ elini dış duvara koyan robot hep dış duvar boyunca döner ve başladığı yere geri gelir.",
  hafiza: "Çözüm hafıza. Robot her hücreye kaç kez geldiğini sayar. Yol ayrımında en az gittiği komşu hücreyi seçer. Böylece sonunda adanın içine de girer.",
  ikiYol: "Yarışmada bitişi bulmak yetmez, hızlı bulmak gerekir. Bu labirentte iki yol var: biri kısa ama çok dönüşlü, öteki uzun ama az dönüşlü. Sence hangisi daha hızlı?",
  hizProfili: "RizBot düz bir yolda önce hızlanır, en yüksek hızına çıkar ve dönmeden önce yavaşlayıp durur. Dönüşte yerinde döner, sonra yeniden sıfırdan hızlanır.",
  mebPisti: "MEB Robot Yarışması'nın Labirent Ustası pisti 8 hücre eninde, 16 hücre boyundadır. Başlangıç bir uçta, bitiş öteki uçta. İlk turda robotun 90 saniyesi, finalde 60 saniyesi var.",
  mebPuan: "Bitiren robotun puanı bitirme süresidir; az puan daha iyidir. Robota her dokunuş, yani müdahale, süreye 10 saniye ekler. Bitiremeyen robotun puanı 200 artı ulaşamadığı her satır için 10."
} as const;
type MetinAdi = keyof typeof LABIRENT_METINLERI;

/** metinde, içinde `parca` geçen ilk kelimenin sırası (0'dan) */
export function kelime(metin: string, parca: string): number {
  const i = metin.indexOf(parca);
  if (i < 0) throw new Error(`"${parca}" metinde yok: ${metin.slice(0, 40)}…`);
  return (metin.slice(0, i).match(/\S+/g) ?? []).length - (/\S$/.test(metin.slice(0, i)) ? 1 : 0);
}
/** katman yazıcısı: k(şekil, renk, "sözcük") */
const yazici = (ad: MetinAdi) => (sekil: Sekil, renk: CizimRengi, soz?: string): Katman => ({ sekil, renk, ...(soz ? { kelime: kelime(LABIRENT_METINLERI[ad], soz) } : {}) });
const kutu = (x: number, y: number, g: number, y2: number, dolgu?: CizimRengi, kose = 4): Sekil => ({ tur: "kutu", x, y, g, y2, dolgu, kose });
const cizgi = (...n: [number, number][]): Sekil => ({ tur: "cizgi", noktalar: n });
const ok = (...n: [number, number][]): Sekil => ({ tur: "ok", noktalar: n });
const yaz = (x: number, y: number, metin: string, hiza: "sol" | "orta" | "sag" = "sol"): Sekil => ({ tur: "etiket", x, y, metin, hiza });
const daire = (x: number, y: number, r: number, dolgu?: CizimRengi): Sekil => ({ tur: "daire", x, y, r, dolgu });

/** Küçük bir ızgara labirent: hücre `b` birim, sol üst (x0, y0). duvarlar: "y" yatay (x, y: hücrenin üst kenarı), "d" dikey (hücrenin sol kenarı) */
function izgara(x0: number, y0: number, b: number, gen: number, yuk: number, ic: [("y" | "d"), number, number][], renk: CizimRengi = "beyaz"): Sekil[] {
  const r: Sekil[] = [kutu(x0, y0, gen * b, yuk * b, "siyah", 3)];
  r.push(cizgi([x0, y0], [x0 + gen * b, y0], [x0 + gen * b, y0 + yuk * b], [x0, y0 + yuk * b], [x0, y0]));
  for (const [t, x, y] of ic) r.push(t === "y" ? cizgi([x0 + x * b, y0 + y * b], [x0 + (x + 1) * b, y0 + y * b]) : cizgi([x0 + x * b, y0 + y * b], [x0 + x * b, y0 + (y + 1) * b]));
  void renk;
  return r;
}
const merkez = (x0: number, y0: number, b: number, x: number, y: number): [number, number] => [x0 + x * b + b / 2, y0 + y * b + b / 2];

export const LABIRENT_CIZIMLERI: Record<string, Cizim> = {
  "labirent-hucresi": (() => {
    const k = yazici("hucre");
    return {
      aciklama: "Üstten bir labirent hücresi: siyah kare zemin, iki kenarında beyaz duvar; yanında ölçüler: hücre 20 cm, duvar 8 cm yüksek.",
      katmanlar: [
        k(kutu(40, 40, 180, 180, "siyah", 2), "siyah", "kare"),
        k(cizgi([40, 40], [220, 40]), "beyaz", "Duvarlar"),
        k(cizgi([40, 40], [40, 220]), "beyaz", "Duvarlar"),
        k(cizgi([40, 236], [220, 236]), "mor", "20"),
        k(yaz(130, 254, "20 cm", "orta"), "mor", "20"),
        k(cizgi([236, 40], [236, 220]), "mor", "santimetreye"),
        k(yaz(244, 136, "20 cm"), "mor", "santimetreye"),
        k(yaz(250, 60, "duvar: 8 cm"), "murekkep", "yüksek"),
        k(yaz(250, 82, "parlak beyaz"), "murekkep", "parlak"),
        k(yaz(250, 196, "zemin: mat siyah"), "murekkep", "mat")
      ]
    };
  })(),
  "kizilotesi-yansima": (() => {
    const k = yazici("yansima");
    return {
      aciklama: "İki durum yan yana. Solda sensörün önünde beyaz duvar var: ışın duvara gider ve geri döner. Sağda duvar yok: ışın uzaklaşır, geri gelmez.",
      katmanlar: [
        k(kutu(30, 110, 40, 40, "mor", 6), "murekkep", "Sensör"),
        k({ tur: "isin", bas: [70, 122], son: [150, 122] }, "kirmizi", "kızılötesi"),
        k(kutu(150, 70, 18, 120, "beyaz", 2), "gri", "beyaz"),
        k({ tur: "isin", bas: [150, 140], son: [70, 140] }, "kirmizi", "yansır"),
        k(yaz(100, 220, "duvar var: ışık döner", "orta"), "yesil", "geri"),
        k(kutu(230, 110, 40, 40, "mor", 6), "murekkep", "Duvar yoksa"),
        k({ tur: "isin", bas: [270, 130], son: [390, 130], soluk: true }, "kirmizi", "uzaklaşır"),
        k(yaz(300, 220, "duvar yok: ışık gelmez", "orta"), "kirmizi", "gelmez")
      ]
    };
  })(),
  "sag-el-yolu": (() => {
    const k = yazici("sagElYolu"), x0 = 100, y0 = 20, b = 72;
    const yol: [number, number][] = [merkez(x0, y0, b, 0, 2), merkez(x0, y0, b, 1, 2), merkez(x0, y0, b, 1, 1), merkez(x0, y0, b, 0, 1), merkez(x0, y0, b, 0, 0), merkez(x0, y0, b, 1, 0), merkez(x0, y0, b, 2, 0)];
    return {
      aciklama: "Üstten 3 × 3 hücrelik bir labirent. Başlangıçtan bitişe sağ el kuralının yolu: robot sağındaki duvarı hiç bırakmadan yürüyor.",
      katmanlar: [
        ...izgara(x0, y0, b, 3, 3, [["y", 1, 1], ["y", 2, 1], ["d", 2, 1], ["y", 0, 2], ["d", 2, 2], ["y", 2, 2]]).map((s, i) => k(s, i === 0 ? "siyah" : "beyaz", i === 0 ? "Labirentte" : "Labirentte")),
        k(yaz(merkez(x0, y0, b, 0, 2)[0], merkez(x0, y0, b, 0, 2)[1] + 6, "B", "orta"), "yesil", "Labirentte"),
        k(yaz(merkez(x0, y0, b, 2, 0)[0], merkez(x0, y0, b, 2, 0)[1] + 6, "F", "orta"), "sari", "Labirentte"),
        k(ok(...yol), "sari", "sağ"),
        k(yaz(330, 240, "bitiş", "orta"), "sari", "bitişe")
      ]
    };
  })(),
  "sag-el-akisi": (() => {
    const k = yazici("sagElAkisi");
    return {
      aciklama: "Üç kutu alt alta: 1. Sağ açık mı? Evet: sağa dön, ilerle. 2. Ön açık mı? Evet: ilerle. 3. Hayır: sola dön.",
      katmanlar: [
        k(kutu(20, 20, 170, 56, "mor", 12), "mor", "Bir:"),
        k(yaz(105, 54, "1 · Sağ açık mı?", "orta"), "beyaz", "Bir:"),
        k(ok([190, 48], [228, 48]), "yesil", "açıksa"),
        k(yaz(236, 54, "sağa dön, ilerle"), "yesil", "dön"),
        k(kutu(20, 100, 170, 56, "mor", 12), "mor", "İki:"),
        k(yaz(105, 134, "2 · Ön açık mı?", "orta"), "beyaz", "İki:"),
        k(ok([190, 128], [228, 128]), "yesil", "düz"),
        k(yaz(236, 134, "ilerle"), "yesil", "düz"),
        k(ok([105, 76], [105, 100]), "murekkep", "kapalı"),
        k(kutu(20, 180, 170, 56, "kirmizi", 12), "kirmizi", "Üç:"),
        k(yaz(105, 214, "3 · İkisi de kapalı", "orta"), "beyaz", "Üç:"),
        k(ok([105, 156], [105, 180]), "murekkep", "ikisi"),
        k(ok([190, 208], [228, 208]), "kirmizi", "sola"),
        k(yaz(236, 214, "sola dön"), "kirmizi", "sola")
      ]
    };
  })(),
  "cikmazda-sag-el": (() => {
    const k = yazici("cikmazdaSagEl");
    return {
      aciklama: "Bir çıkmaz koridor: robot sonuna kadar gider, iki kez sola döner ve geldiği yoldan geri çıkar.",
      katmanlar: [
        k(kutu(40, 70, 300, 120, "siyah", 3), "siyah", "Çıkmaza"),
        k(cizgi([40, 70], [340, 70], [340, 190], [40, 190]), "beyaz", "Çıkmaza"),
        k(kutu(270, 106, 44, 48, "mor", 10), "murekkep", "girerse"),
        k(ok([80, 110], [250, 110]), "sari", "girerse"),
        k(ok([258, 110], [258, 150]), "sari", "sola"),
        k(yaz(300, 50, "1 · sola dön", "orta"), "sari", "sola"),
        k(ok([258, 150], [80, 150]), "sari", "geri"),
        k(yaz(300, 222, "2 · yine sola, geri çık", "orta"), "sari", "daha"),
        k(yaz(60, 250, "sağ el hep duvarda", "sol"), "yesil", "duvardan")
      ]
    };
  })(),
  "robot-gozu": (() => {
    const k = yazici("robotGozu"), x0 = 80, y0 = 20, b = 56;
    const sis: Sekil[] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!(x === 1 && y >= 2) && !(x === 2 && y === 2)) sis.push(kutu(x0 + x * b + 2, y0 + y * b + 2, b - 4, b - 4, "gri", 2));
    return {
      aciklama: "Üstten 4 × 4 hücrelik labirent, çoğu hücre gri ve görünmüyor. Yalnız robotun geçtiği ve bulunduğu hücrelerin duvarları görünür. Önünde iki yol var.",
      katmanlar: [
        k(kutu(x0, y0, 4 * b, 4 * b, "siyah", 3), "siyah", "Gerçek"),
        ...sis.map((s) => k(s, "gri", "haritayı")),
        k(cizgi([x0 + b, y0 + 2 * b], [x0 + b, y0 + 4 * b]), "beyaz", "sensörlerinin"),
        k(cizgi([x0 + 2 * b, y0 + 3 * b], [x0 + 2 * b, y0 + 4 * b], [x0 + b, y0 + 4 * b]), "beyaz", "sensörlerinin"),
        k(cizgi([x0 + 2 * b, y0 + 2 * b], [x0 + 3 * b, y0 + 2 * b]), "beyaz", "sensörlerinin"),
        k(kutu(x0 + b + 14, y0 + 2 * b + 12, 28, 32, "mor", 8), "murekkep", "robot"),
        k(ok([x0 + 1.5 * b, y0 + 2 * b + 10], [x0 + 1.5 * b, y0 + 1.5 * b]), "sari", "ayrımında"),
        k(ok([x0 + 1.5 * b + 16, y0 + 2.5 * b], [x0 + 2.6 * b, y0 + 2.5 * b]), "sari", "ayrımında"),
        k(yaz(x0 + 4 * b + 14, y0 + 2.2 * b, "hangisi?"), "murekkep", "hangi")
      ]
    };
  })(),
  "cikmaz": (() => {
    const k = yazici("cikmaz");
    return {
      aciklama: "Bir yol ayrımı: sağa giden kol bir çıkmaza çıkıyor, robot oraya girip geri dönüyor; düz giden kol bitişe gidiyor.",
      katmanlar: [
        k(kutu(40, 40, 320, 180, "siyah", 3), "siyah", "Yanlış"),
        k(cizgi([40, 100], [200, 100], [200, 40]), "beyaz", "Yanlış"),
        k(cizgi([260, 40], [260, 100], [360, 100]), "beyaz", "Yanlış"),
        k(cizgi([40, 160], [360, 160]), "beyaz", "Yanlış"),
        k(cizgi([340, 100], [340, 160]), "beyaz", "çıkmaza"),
        k(yaz(230, 32, "bitiş ↑", "orta"), "yesil", "yola"),
        k(ok([70, 130], [310, 130]), "sari", "çıkmaza"),
        k(yaz(320, 200, "çıkmaz", "orta"), "kirmizi", "çıkmaza"),
        k(ok([310, 146], [230, 146]), "kirmizi", "geri"),
        k(yaz(140, 200, "zaman kaybı", "orta"), "kirmizi", "kaybettirir.")
      ]
    };
  })(),
  "cikmaz-isaretleme": (() => {
    const k = yazici("isaretleme"), x0 = 70, y0 = 30, b = 60;
    const isaret = (x: number, y: number, n: number) => { const [cx, cy] = merkez(x0, y0, b, x, y); return Array.from({ length: n }, (_, i) => cizgi([cx - 6 + i * 12, cy - 12], [cx - 6 + i * 12, cy + 12])); };
    return {
      aciklama: "Bir yol ayrımı: sağdaki çıkmaz yol iki çizgiyle işaretli ve girişine çarpı konmuş; soldaki işaretsiz yol seçiliyor.",
      katmanlar: [
        k(kutu(x0, y0, 5 * b, 3 * b, "siyah", 3), "siyah", "Kaybolmamak"),
        k(cizgi([x0, y0 + b], [x0 + 2 * b, y0 + b]), "beyaz", "Kaybolmamak"),
        k(cizgi([x0 + 3 * b, y0 + b], [x0 + 5 * b, y0 + b]), "beyaz", "Kaybolmamak"),
        k(cizgi([x0, y0 + 2 * b], [x0 + 2 * b, y0 + 2 * b]), "beyaz", "Kaybolmamak"),
        k(cizgi([x0 + 3 * b, y0 + 2 * b], [x0 + 5 * b, y0 + 2 * b]), "beyaz", "Kaybolmamak"),
        k(cizgi([x0 + 5 * b - 2, y0 + b], [x0 + 5 * b - 2, y0 + 2 * b]), "beyaz", "Kaybolmamak"),
        ...isaret(2, 2, 1).map((s) => k(s, "sari", "işaretle")),
        ...isaret(3, 1, 2).map((s) => k(s, "sari", "ikinci")),
        ...isaret(4, 1, 2).map((s) => k(s, "sari", "ikinci")),
        k(yaz(merkez(x0, y0, b, 3, 1)[0] - 36, merkez(x0, y0, b, 3, 1)[1] + 8, "✗", "orta"), "kirmizi", "çıkmaza"),
        k(ok([merkez(x0, y0, b, 2, 1)[0], merkez(x0, y0, b, 2, 1)[1]], [merkez(x0, y0, b, 1, 1)[0], merkez(x0, y0, b, 1, 1)[1]], [merkez(x0, y0, b, 0, 1)[0] + 6, merkez(x0, y0, b, 0, 1)[1]]), "yesil", "hiç"),
        k(yaz(x0 + b, y0 + 3 * b + 26, "işaretsiz yol", "orta"), "yesil", "seç."),
        k(yaz(x0 + 4 * b, y0 - 10, "2 kez geçildi", "orta"), "sari", "ikinci")
      ]
    };
  })(),
  "ada-labirent": (() => {
    const k = yazici("ada");
    return {
      aciklama: "Üstten bir labirent: ortada duvarları dış duvara değmeyen bir ada, bitiş adanın içinde. Sağ el kuralının yolu dış duvar boyunca dönüp başa geliyor.",
      katmanlar: [
        k(kutu(80, 20, 240, 220, "siyah", 3), "siyah", "Bazı"),
        k(cizgi([80, 20], [320, 20], [320, 240], [80, 240], [80, 20]), "beyaz", "Bazı"),
        k(cizgi([150, 80], [250, 80], [250, 180], [180, 180]), "beyaz", "adanın"),
        k(cizgi([150, 80], [150, 180]), "beyaz", "adanın"),
        k(yaz(200, 138, "F", "orta"), "sari", "bitiş"),
        k(yaz(200, 72, "ada", "orta"), "mor", "değmez."),
        k(yaz(104, 226, "B", "orta"), "yesil", "robot"),
        k(ok([104, 214], [104, 44], [296, 44], [296, 216], [124, 216]), "sari", "boyunca"),
        k(yaz(360, 130, "hep", "orta"), "kirmizi", "başladığı"),
        k(yaz(360, 152, "başa döner", "orta"), "kirmizi", "başladığı")
      ]
    };
  })(),
  "hafiza-sayilari": (() => {
    const k = yazici("hafiza"), x0 = 40, y0 = 40, b = 70;
    const sayi = (x: number, y: number, n: string, renk: CizimRengi, soz: string) => { const [cx, cy] = merkez(x0, y0, b, x, y); return [k(daire(cx, cy, 18, renk), renk, soz), k(yaz(cx, cy + 7, n, "orta"), "murekkep", soz)]; };
    return {
      aciklama: "Bir yol ayrımı ve komşu hücrelerin üstünde sayılar: kaç kez gelindiği. Robot sayısı en küçük (0) olan hücreye gidiyor.",
      katmanlar: [
        k(kutu(x0, y0, 3 * b, 2 * b, "siyah", 3), "siyah", "Çözüm"),
        k(cizgi([x0, y0], [x0 + 3 * b, y0]), "beyaz", "Çözüm"),
        k(cizgi([x0, y0 + 2 * b], [x0 + b, y0 + 2 * b]), "beyaz", "Çözüm"),
        k(cizgi([x0 + 2 * b, y0 + 2 * b], [x0 + 3 * b, y0 + 2 * b]), "beyaz", "Çözüm"),
        k(kutu(x0 + b + 20, y0 + b + 18, 30, 34, "mor", 8), "murekkep", "Robot"),
        ...sayi(0, 1, "2", "sari", "sayar."),
        ...sayi(1, 0, "1", "gri", "sayar."),
        ...sayi(2, 1, "0", "yesil", "en az"),
        k(ok([x0 + 1.5 * b + 22, y0 + 1.5 * b], [x0 + 2.5 * b - 22, y0 + 1.5 * b]), "yesil", "seçer."),
        k(yaz(x0 + 3 * b + 16, y0 + 1.5 * b + 6, "en az gidilen"), "yesil", "seçer.")
      ]
    };
  })(),
  "iki-yol": (() => {
    const k = yazici("ikiYol"), x0 = 40, y0 = 20, b = 36;
    const p = (x: number, y: number) => merkez(x0, y0, b, x, y);
    return {
      aciklama: "Aynı labirentte iki yol: turuncu yol kısa ama merdiven gibi yedi kez dönüyor; mor yol kenardan dolaşıyor, daha uzun ama yalnız iki kez dönüyor.",
      katmanlar: [
        k(kutu(x0, y0, 6 * b, 6 * b, "siyah", 3), "siyah", "Yarışmada"),
        k(yaz(p(0, 5)[0], p(0, 5)[1] + 6, "B", "orta"), "yesil", "Bu"),
        k(yaz(p(5, 2)[0], p(5, 2)[1] + 6, "F", "orta"), "beyaz", "Bu"),
        k(ok(p(0, 5), p(1, 5), p(1, 4), p(2, 4), p(2, 3), p(3, 3), p(3, 2), p(4, 2), [p(5, 2)[0] - 10, p(5, 2)[1]]), "sari", "kısa"),
        k(yaz(270, 210, "kısa, 7 dönüş"), "sari", "dönüşlü,"),
        k(ok([p(0, 5)[0] - 8, p(0, 5)[1]], [p(0, 0)[0] - 8, p(0, 0)[1] - 8], [p(5, 0)[0] + 8, p(5, 0)[1] - 8], [p(5, 2)[0] + 8, p(5, 2)[1] - 12]), "mor", "uzun"),
        k(yaz(270, 40, "uzun, 2 dönüş"), "mor", "az dönüşlü"),
        k(yaz(270, 128, "hangisi daha hızlı?"), "murekkep", "hangisi")
      ]
    };
  })(),
  "hiz-profili": (() => {
    const k = yazici("hizProfili");
    return {
      aciklama: "Hız-zaman grafiği: düz yolda hız artıyor, sabit kalıyor, azalıp sıfıra iniyor; dönüşte bir süre sıfırda kalıyor, sonra yeniden artıyor.",
      katmanlar: [
        k(cizgi([40, 220], [380, 220]), "murekkep", "RizBot"),
        k(cizgi([40, 220], [40, 30]), "murekkep", "RizBot"),
        k(yaz(46, 26, "hız"), "murekkep", "RizBot"),
        k(yaz(380, 244, "zaman", "sag"), "murekkep", "RizBot"),
        k(cizgi([40, 220], [100, 80]), "mor", "hızlanır"),
        k(yaz(54, 120, "hızlan", "sag"), "mor", "hızlanır"),
        k(cizgi([100, 80], [190, 80]), "mor", "yüksek"),
        k(yaz(145, 70, "en yüksek hız", "orta"), "mor", "yüksek"),
        k(cizgi([190, 80], [240, 220]), "mor", "yavaşlayıp"),
        k(cizgi([240, 220], [280, 220]), "kirmizi", "Dönüşte"),
        k(yaz(260, 244, "dönüş", "orta"), "kirmizi", "Dönüşte"),
        k(cizgi([280, 220], [330, 104]), "mor", "sıfırdan"),
        k(yaz(338, 120, "yeniden"), "mor", "sıfırdan")
      ]
    };
  })(),
  "meb-pisti": (() => {
    const k = yazici("mebPisti"), b = 12, x0 = 60, y0 = 20;
    const ic: Sekil[] = [];
    for (let i = 1; i < 8; i++) ic.push(cizgi([x0 + i * b, y0], [x0 + i * b, y0 + 16 * b]));
    for (let i = 1; i < 16; i++) ic.push(cizgi([x0, y0 + i * b], [x0 + 8 * b, y0 + i * b]));
    return {
      aciklama: "Üstten MEB Labirent Ustası pisti: 8 hücre eninde, 16 hücre boyunda bir ızgara (1,6 m × 3,2 m). Başlangıç alt uçta, bitiş üst uçta; yanında tur süreleri.",
      katmanlar: [
        k(kutu(x0, y0, 8 * b, 16 * b, "siyah", 2), "siyah", "pisti"),
        ...ic.map((s) => k(s, "gri", "pisti")),
        k(cizgi([x0, y0 + 16 * b + 10], [x0 + 8 * b, y0 + 16 * b + 10]), "mor", "eninde,"),
        k(yaz(x0 + 4 * b, y0 + 16 * b + 30, "8 hücre · 1,6 m", "orta"), "mor", "eninde,"),
        k(cizgi([x0 + 8 * b + 10, y0], [x0 + 8 * b + 10, y0 + 16 * b]), "mor", "boyundadır."),
        k(yaz(x0 + 8 * b + 18, y0 + 8 * b, "16 hücre · 3,2 m"), "mor", "boyundadır."),
        k(kutu(x0 + 2, y0 + 15 * b + 2, b - 4, b - 4, "yesil", 2), "yesil", "Başlangıç"),
        k(kutu(x0 + 7 * b + 2, y0 + 2, b - 4, b - 4, "beyaz", 2), "sari", "bitiş"),
        k(yaz(260, 60, "ilk tur: 90 sn"), "murekkep", "İlk"),
        k(yaz(260, 84, "final: 60 sn"), "murekkep", "finalde")
      ]
    };
  })(),
  "meb-puan": (() => {
    const k = yazici("mebPuan");
    return {
      aciklama: "İki kutu: Bitirdi: puan = süre, her müdahale 10 saniye ekler. Bitiremedi: puan = 200 + (16 − ulaşılan satır) × 10. Az puan iyidir.",
      katmanlar: [
        k(kutu(20, 30, 360, 86, "yesil", 14), "yesil", "Bitiren"),
        k(yaz(200, 64, "Bitirdi: puan = süre", "orta"), "beyaz", "süresidir;"),
        k(yaz(200, 96, "+ 10 sn her müdahale", "orta"), "beyaz", "müdahale,"),
        k(kutu(20, 140, 360, 86, "kirmizi", 14), "kirmizi", "Bitiremeyen"),
        k(yaz(200, 174, "Bitiremedi: 200 +", "orta"), "beyaz", "200"),
        k(yaz(200, 206, "(16 − ulaşılan satır) × 10", "orta"), "beyaz", "satır"),
        k(yaz(200, 254, "az puan daha iyi", "orta"), "murekkep", "iyidir.")
      ]
    };
  })()
};
