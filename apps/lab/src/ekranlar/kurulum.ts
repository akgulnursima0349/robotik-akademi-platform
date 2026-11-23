/* SiroLine 3D kurulum rehberi: 10 adım, her adımda parça yerine iner; dört adımda kısa soru.
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
  { baslik: "Pleksi şasi", parca: "sasi", kamera: { hedef: [70, 0, 0], kamera: [260, 250, 240] },
    metin: "Robotun iskeleti. Pleksi (akrilik) hem hafif hem sağlamdır; lazerle kesilir. Üstündeki delikler vidaların ve kabloların yeridir.",
    bilgi: "Robot ne kadar hafifse motorlar o kadar az zorlanır ve pil daha uzun gider." },
  { baslik: "Sensör kolu ve kayma topları", parca: "kol", kamera: { hedef: [172, 6, 0], kamera: [340, 140, 190] },
    metin: "Sarı kol 3D yazıcıyla basılır ve sensörleri robotun yaklaşık 17 cm önüne taşır. Öndeki iki şeffaf top, robotun burnunu yerden yukarıda tutar ve kaymasını sağlar.",
    soru: { soru: "Sensörler neden robotun önüne uzatılmış?", siklar: ["Virajı önceden görüp zamanında dönebilmek için", "Robot daha güzel görünsün diye", "Motorlar soğusun diye"], dogru: 0,
      aciklama: "Sensör ne kadar öndeyse robot virajı o kadar erken fark eder. Ama çok uzun kol robotu ağırlaştırır; mühendislik hep bir denge." } },
  { baslik: "Redüktörlü motorlar", parca: "motor", kamera: { hedef: [25, 15, 0], kamera: [180, 150, 230] },
    metin: "Sarı kutuların içinde dişliler var. Gümüş renkli küçük motor çok hızlı ama güçsüz döner; dişliler hızı düşürüp gücü artırır. Buna redüktör denir.",
    bilgi: "TT motorun dişlileri hızı yaklaşık 48'de 1'e indirir.",
    soru: { soru: "Motorun içindeki dişliler ne işe yarar?", siklar: ["Motoru soğutur", "Hızı düşürüp gücü artırır", "Pili şarj eder"], dogru: 1,
      aciklama: "Bisikletteki vites gibi: hafif viteste pedal kolay döner ama yavaş gidersin." } },
  { baslik: "Tekerlekler", parca: "teker", kamera: { hedef: [0, 18, 55], kamera: [130, 90, 260] },
    metin: "Tekerlekler motorun miline geçer. 3,7 cm çaplı bir tekerlek bir turda yaklaşık 11,6 cm yol alır (çap × π). Yumuşak lastik zemini iyi tutar.",
    bilgi: "Kitin enkoder bloğunda teker çapı tam bu yüzden 3,7 yazılır: robot gittiği yolu tur sayısından hesaplar." },
  { baslik: "QTR-8A sensör kartı", parca: "sensor", kamera: { hedef: [168, 12, 0], kamera: [300, 110, 130] },
    metin: "Sekiz kızılötesi göz yere görünmez bir ışık yollar. Beyaz zemin ışığı geri yansıtır, siyah bant yutar. Her göz 0 (beyaz) ile 1000 (siyah) arasında bir sayı verir.",
    soru: { soru: "Sensör siyah bandın tam üstündeyken ne okur?", siklar: ["0'a yakın", "Hep 500", "1000'e yakın"], dogru: 2,
      aciklama: "Siyah ışığı yutar, geri az ışık döner; kart bunu büyük bir sayı olarak verir." } },
  { baslik: "Aralayıcılar ve kalkan kartı", parca: "kalkan", kamera: { hedef: [35, 22, 0], kamera: [190, 170, 190] },
    metin: "Pirinç aralayıcılar kartı şasiden yukarı kaldırır; kartın altındaki lehimler pleksiye değmez. Kalkan kartı Nano'yu, motor sürücüyü ve kabloları tek yerde toplar." },
  { baslik: "Arduino Nano ve motor sürücü", parca: "nano", kamera: { hedef: [35, 30, 0], kamera: [150, 150, 120] },
    metin: "Nano robotun beyni: sensörleri okur, kararı verir. Ama motorları kendisi çeviremez. Kırmızı motor sürücü, Nano'nun komutunu pilden aldığı güçle motora iletir: beyin ve kas.",
    soru: { soru: "Motorları neden doğrudan Nano'ya bağlamıyoruz?", siklar: ["Motorlar Nano'nun verebileceğinden çok daha fazla akım ister", "Kablolar kısa kalır", "Nano Python bilmez"], dogru: 0,
      aciklama: "Nano'nun bir pini çok küçük bir akım verebilir; motor ise bunun onlarca katını ister. Sürücü aradaki güç köprüsüdür." } },
  { baslik: "Pil yuvası", parca: "pil", kamera: { hedef: [-20, 15, 0], kamera: [-190, 150, 170] },
    metin: "İki lityum hücre art arda (seri) bağlanır: 3,7 + 3,7 = 7,4 volt.",
    bilgi: "Pil zayıfladıkça motorlar yavaşlar. Aynı Kp değeri dolu pille ve yarım pille farklı davranabilir." },
  { baslik: "Kablolar", parca: "kablo", kamera: { hedef: [100, 15, 0], kamera: [270, 190, 210] },
    metin: "Gökkuşağı renkli şerit kablo sekiz sensörü Nano'nun A0–A7 girişlerine bağlar. Kırmızı-siyah teller motorlara ve pile güç taşır: kırmızı artı, siyah eksi." },
  { baslik: "SiroLine hazır", parca: null, kamera: { hedef: [80, 10, 0], kamera: [360, 220, 300] },
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
