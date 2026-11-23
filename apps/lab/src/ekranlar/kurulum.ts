/* SiroLine (Full PCB) 3D kurulum rehberi: 10 adım, her adımda parça yerine iner; dört adımda kısa soru.
   Montaj sırası genel bir çizgi izleyen kurulumudur; akademinin kılavuzuyla karşılaştırılacak (docs/FAZ-P6b). */
import { dugme, el, ikon } from "@sra/tasarim";
import type { ParcaAdi } from "../sahne3d/siroline";
import type { AdimKamerasi } from "../sahne3d/kurulum-sahnesi";
import { ilerleme } from "../ilerleme";
import { ustKisim } from "./ana";
import { webglYok } from "./cizgi-ortak";

interface Soru { soru: string; siklar: string[]; dogru: number; aciklama: string }
interface Adim { baslik: string; parca: ParcaAdi | null; metin: string; bilgi?: string; soru?: Soru; kamera: AdimKamerasi }

export const ADIMLAR: Adim[] = [
  { baslik: "Ana kart: gövde aynı zamanda devre", parca: "sasi", kamera: { hedef: [70, 0, 0], kamera: [250, 240, 230] },
    metin: "SiroLine'ın gövdesi siyah bir devre kartı (PCB). Kartın içindeki ince bakır yollar parçaları birbirine bağlar; bu yüzden kablo karmaşası yok. Yanlardaki kanatlar ve öndeki kancalar da kartın kendisinden kesilmiş.",
    bilgi: "Ön kenar 81 mm, boyun 28 mm, arka gövde 94 mm genişliğinde. Hepsi tek parça." },
  { baslik: "QTR-8A sensör kartı", parca: "sensor", kamera: { hedef: [152, 4, 0], kamera: [250, 80, 140] },
    metin: "Kırmızı kart ön plakanın altına takılır; üstteki pencereden görünür. Sekiz kızılötesi göz yere görünmez bir ışık yollar: beyaz zemin ışığı geri yansıtır, siyah bant yutar. Her göz 0 (beyaz) ile 1000 (siyah) arasında bir sayı verir.",
    soru: { soru: "Sensör siyah bandın tam üstündeyken ne okur?", siklar: ["0'a yakın", "Hep 500", "1000'e yakın"], dogru: 2,
      aciklama: "Siyah ışığı yutar, geri az ışık döner; kart bunu büyük bir sayı olarak verir." } },
  { baslik: "Redüktörlü motorlar", parca: "motor", kamera: { hedef: [25, 15, 0], kamera: [170, 140, 210] },
    metin: "Mavi kutuların içinde metal dişliler var. Gümüş renkli küçük motor çok hızlı ama güçsüz döner; dişliler hızı düşürüp gücü artırır. Buna redüktör denir. Beyaz motor tutucular motorları karta iki vidayla sabitler.",
    bilgi: "SiroLine'daki \"Speed TT\" yarış motorunun dişlileri hızı az düşürür: tekerlek dakikada 2000–2500 tur atar. Sıradan TT motorlar bunun onda biri kadar döner.",
    soru: { soru: "Motorun içindeki dişliler ne işe yarar?", siklar: ["Motoru soğutur", "Hızı düşürüp gücü artırır", "Pili şarj eder"], dogru: 1,
      aciklama: "Bisikletteki vites gibi: hafif viteste pedal kolay döner ama yavaş gidersin." } },
  { baslik: "Tekerlekler", parca: "teker", kamera: { hedef: [0, 18, 50], kamera: [120, 80, 230] },
    metin: "Kırmızı jantlı tekerlekler motorun miline geçer. 36 mm çaplı bir tekerlek bir turda yaklaşık 11,3 cm yol alır (çap × π). Dakikada 2000 turla bu, saniyede 3,8 metre eder! Siyah köpük lastik pisti iyi tutar.",
    bilgi: "Sınıftaki robot kumpasla ölçüldü: teker çapı 36,1 mm, iki tekerleğin arası 99,2 mm." },
  { baslik: "Motor sürücüler", parca: "surucu", kamera: { hedef: [50, 18, 0], kamera: [160, 140, 120] },
    metin: "Nano kararı verir ama motorları kendisi çeviremez; motor sürücü, Nano'nun küçük komutunu pilden aldığı güçle motora iletir. SiroLine'da iki TB6612FNG sürücü var: çift sürücü, hızlı motorların daha güçlü ve dengeli kontrol edilmesine yardım eder. Sıradan kitlerde tek sürücü olur.",
    soru: { soru: "Motorları neden doğrudan Nano'ya bağlamıyoruz?", siklar: ["Motorlar Nano'nun verebileceğinden çok daha fazla akım ister", "Kablolar kısa kalır", "Nano Python bilmez"], dogru: 0,
      aciklama: "Nano'nun bir pini çok küçük bir akım verebilir; motor ise bunun onlarca katını ister. Sürücü aradaki güç köprüsüdür." } },
  { baslik: "Arduino Nano", parca: "nano", kamera: { hedef: [71, 20, 0], kamera: [170, 130, 90] },
    metin: "Robotun beyni. Sensörleri okur, Kp ve Kd ile hesabı yapar, motorlara ne kadar güç verileceğine karar verir. Dişi başlıklara takılır; bozulursa lehim gerekmeden değiştirilir. Bilgisayardan USB ile programlanır." },
  { baslik: "LiPo pil", parca: "pil", kamera: { hedef: [13, 12, 0], kamera: [-160, 140, 120] },
    metin: "300 mAh, iki hücreli (2S) LiPo pil; dolu iken yaklaşık 7,6 volt. Küçük ve hafiftir; kablo bağıyla karta tutturulur, sarı XT30 soketiyle bağlanır.",
    bilgi: "Pil zayıfladıkça motorlar yavaşlar. Aynı Kp değeri dolu pille ve yarım pille farklı davranabilir." },
  { baslik: "Kablolar", parca: "kablo", kamera: { hedef: [40, 15, 0], kamera: [190, 170, 170] },
    metin: "Burada az kablo var: motorların kırmızı-siyah telleri beyaz soketlere, pil kablosu güç girişine. Sensörden Nano'ya giden sekiz sinyal ise kablo değil, kartın içindeki bakır yollardan A0–A7 girişlerine gider." },
  { baslik: "Engel sensörü: yarışı başlatan göz", parca: "modul", kamera: { hedef: [124, 14, 0], kamera: [230, 90, 110] },
    metin: "Boynun ucundaki küçük kart bir engel sensörü. Yarış başlamadan robotun önüne bir blok konur; sensör önünü kapalı gördükçe robot bekler. Blok kaldırılınca yol açılır ve robot kendiliğinden kalkar. Kitteki \"Mz80 = 0 olana kadar bekle\" bloğu bunu yapar.",
    soru: { soru: "Robot yarışa ne zaman başlar?", siklar: ["Pil takılır takılmaz", "Önündeki blok kaldırılınca", "Çizgiyi gördüğü an"], dogru: 1,
      aciklama: "Böylece bütün robotlar aynı anda, hakemin işaretiyle başlar; kimse düğmeye basmakla zaman kaybetmez." } },
  { baslik: "SiroLine hazır", parca: null, kamera: { hedef: [80, 10, 0], kamera: [330, 200, 280] },
    metin: "Robot kuruldu. Şimdi onu pistte dene: ister Python'la kendi programını yaz, ister kitin bloklarıyla Ayar Atölyesi'nde Kp ve Kd'yi ayarla." }
];
const SIRA: ParcaAdi[] = ADIMLAR.flatMap((a) => (a.parca ? [a.parca] : []));

export async function kurulumRehberi(root: HTMLElement) {
  let adim = 0;
  const sahneKutu = el("div", "l3-kurulum__sahne", { role: "img", "aria-label": "SiroLine'ın 3D kurulumu" });
  const noktalar = el("ol", "l3-noktalar", { "aria-label": "Adımlar" }, ...ADIMLAR.map((a, i) => {
    const b = el("button", "", { type: "button", "aria-label": `${i + 1}. adım: ${a.baslik}` });
    b.addEventListener("click", () => git(i));
    return el("li", "", {}, b);
  }));
  const kart = el("article", "l3-adim sra-kart", { "aria-live": "polite" });
  const geriB = dugme({ metin: "Geri", tur: "ikincil", id: "k-geri" }) as HTMLButtonElement;
  const ileriB = dugme({ metin: "İleri", ikon: "ok-sag", ikonSonda: true, id: "k-ileri" }) as HTMLButtonElement;
  geriB.addEventListener("click", () => git(adim - 1));
  ileriB.addEventListener("click", () => git(adim + 1));

  root.replaceChildren(ustKisim(), el("main", "l3-kurulum sra-sarmal", { id: "ana" },
    el("a", "l-geri", { href: "#cizgi" }, "← SiroLine"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, "3D kurulum rehberi"), el("h1", "", {}, "SiroLine'ı birlikte kuralım")),
    el("div", "l3-kurulum__ic", {},
      el("div", "l3-kurulum__sol sra-kart", {}, sahneKutu, noktalar),
      el("div", "l3-kurulum__sag", {}, kart, el("div", "l-eylem", {}, geriB, ileriB),
        el("p", "l3-not", {}, ikon("bilgi"), "Montaj sırası derste eğitmeninin gösterdiğinden biraz farklı olabilir; masada eğitmenini izle.")))));

  const { webglVar } = await import("../sahne3d/studyo");
  let sahne: import("../sahne3d/kurulum-sahnesi").KurulumSahnesi | null = null;
  if (webglVar()) {
    const m = await import("../sahne3d/kurulum-sahnesi");
    if (!sahneKutu.isConnected) return;
    sahne = new m.KurulumSahnesi(sahneKutu);
    window.addEventListener("hashchange", () => sahne?.kapat(), { once: true });
  } else sahneKutu.replaceChildren(webglYok());

  const tus = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if (e.key === "ArrowRight") git(adim + 1); else if (e.key === "ArrowLeft") git(adim - 1);
  };
  addEventListener("keydown", tus);
  window.addEventListener("hashchange", () => removeEventListener("keydown", tus), { once: true });

  function git(i: number) {
    if (i < 0 || i >= ADIMLAR.length) return;
    adim = i;
    const a = ADIMLAR[i], son = i === ADIMLAR.length - 1;
    const gorunur = a.parca ? SIRA.slice(0, SIRA.indexOf(a.parca) + 1) : SIRA;
    sahne?.goster(gorunur, a.parca, a.kamera, son);
    noktalar.querySelectorAll("button").forEach((b, j) => { b.classList.toggle("aktif", j === i); b.classList.toggle("gecti", j < i); if (j === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    geriB.disabled = i === 0;
    ileriB.hidden = son;
    kart.replaceChildren(
      el("p", "l3-adim__no", {}, `Adım ${i + 1} / ${ADIMLAR.length}`),
      el("h2", "", {}, a.baslik),
      el("p", "", {}, a.metin),
      a.bilgi ? el("p", "l3-adim__bilgi", {}, el("b", "", {}, "Biliyor muydun? "), a.bilgi) : "",
      a.soru ? soruKutusu(a.soru) : "",
      son ? el("div", "l-eylem", {}, dugme({ metin: "Ayar Atölyesi", ikon: "ok-sag", ikonSonda: true, href: "#cizgi/ayar" }), dugme({ metin: "Kod görevleri", tur: "ikincil", href: "#cizgi" })) : "");
    if (son) ilerleme.bayrakKoy("siro-kurulum");
    if (sahneKutu.isConnected) sahneKutu.dataset.adim = String(i + 1);
  }

  function soruKutusu(s: Soru) {
    const sonuc = el("p", "l3-soru__sonuc", { "aria-live": "polite" });
    const kutu = el("fieldset", "l3-soru", {}, el("legend", "", {}, s.soru), ...s.siklar.map((m, j) => {
      const b = el("button", "l3-sik", { type: "button" }, m);
      b.addEventListener("click", () => {
        kutu.querySelectorAll(".l3-sik").forEach((x) => x.classList.remove("dogru", "yanlis"));
        b.classList.add(j === s.dogru ? "dogru" : "yanlis");
        sonuc.replaceChildren(ikon(j === s.dogru ? "tamam" : "uyari"), j === s.dogru ? "Doğru! " + s.aciklama : "Bir daha düşün.");
        sonuc.className = "l3-soru__sonuc " + (j === s.dogru ? "dogru" : "yanlis");
      });
      return b;
    }), sonuc);
    return kutu;
  }

  git(0);
  document.body.dataset.kurulumHazir = "1";
}
