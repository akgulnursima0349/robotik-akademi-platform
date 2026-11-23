/* SiroLine Ayar Atölyesi: kitin mBlock bloğundaki değerlerle (taban hız, ek hız, Kp, Kd, zemin) oynayıp pistte dene.
   Hesap kitin kütüphanesindeki gibi (bkz. robot-motoru/cizgi.ts siroBeyni). Bulunan değerler masadaki robota aynen girilir. */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { CIZGI_GOREVLERI, Pist, siroBeyni, SIRO_VARSAYILAN, turKos, type CizgiSonucu, type SiroAyar } from "@sra/robot-motoru";
import { ilerleme } from "../ilerleme";
import { ustKisim } from "./ana";
import { BOS_KARE, sahneBolumu, secici, sn } from "./cizgi-ortak";

interface Deneme { no: number; pist: string; ayar: SiroAyar; sonuc: CizgiSonucu }
const ANAHTAR = "siro-ayar";
const SVG = "http://www.w3.org/2000/svg";

const ALANLAR: { k: "taban" | "ek" | "kp" | "kd"; ad: string; min: number; max: number; adim: number; aciklama: string }[] = [
  { k: "taban", ad: "Taban Hız", min: 0, max: 255, adim: 5, aciklama: "Düz giderken iki motorun gücü (0–255)." },
  { k: "ek", ad: "Ek Hız", min: 0, max: 100, adim: 5, aciklama: "Çizgi tam ortadayken tabana eklenir: düzlükte hızlan." },
  { k: "kp", ad: "Kp", min: 0, max: 0.2, adim: 0.005, aciklama: "Çizgiden ne kadar uzaksan o kadar sert dön (oransal)." },
  { k: "kd", ad: "Kd", min: 0, max: 3, adim: 0.05, aciklama: "Hata hızlı değişiyorsa frenle: sallanmayı söndürür (türev)." }
];

function kayitliAyar(): SiroAyar {
  try { const k = ilerleme.kod(ANAHTAR); if (k) return { ...SIRO_VARSAYILAN, ...JSON.parse(k) }; } catch { /* bozuk kayıt */ }
  return { ...SIRO_VARSAYILAN };
}

export async function ayarAtolyesi(root: HTMLElement) {
  const ayar = kayitliAyar();
  let gorev = CIZGI_GOREVLERI[0];
  const denemeler: Deneme[] = [];
  const kaydet = () => ilerleme.kodKaydet(ANAHTAR, JSON.stringify(ayar));

  /* mBlock benzeri bloklar */
  const girdiler: Record<string, HTMLInputElement> = {};
  const kaydiricilar: Record<string, HTMLInputElement> = {};
  const deger = (k: keyof SiroAyar, v: number) => {
    (ayar as unknown as Record<string, number>)[k] = v;
    girdiler[k].value = String(v); kaydiricilar[k].value = String(v);
    aktar(); kaydet();
  };
  const ovalGirdi = (a: (typeof ALANLAR)[number]) => {
    const g = el("input", "l3-blok__girdi", { type: "number", inputmode: "decimal", min: String(a.min), max: String(a.max), step: String(a.adim), value: String(ayar[a.k]), "aria-label": a.ad, id: `ayar-${a.k}` }) as HTMLInputElement;
    g.addEventListener("change", () => { const v = Math.max(a.min, Math.min(a.max, Number(g.value.replace(",", ".")) || 0)); deger(a.k, v); });
    girdiler[a.k] = g; return g;
  };
  const zeminSec = el("select", "l3-blok__secim", { "aria-label": "Zemin", id: "ayar-zemin" },
    el("option", "", { value: "siyah" }, "Siyah"), el("option", "", { value: "beyaz" }, "Beyaz")) as HTMLSelectElement;
  zeminSec.value = ayar.zemin;
  zeminSec.addEventListener("change", () => { ayar.zemin = zeminSec.value as "siyah"; aktar(); kaydet(); });
  const bloklar = el("div", "l3-bloklar", { "aria-label": "SiroLine blokları" },
    el("div", "l3-blok l3-blok--sapka", {}, "Arduino başladığında"),
    el("div", "l3-blok", {}, "QTR-8A Kızılötesi Sensör Başlat"),
    el("div", "l3-blok l3-blok--ayar", {}, "Ayarla Taban Hız:", ovalGirdi(ALANLAR[0]), ", Ek Hız:", ovalGirdi(ALANLAR[1]), ", Kp:", ovalGirdi(ALANLAR[2]), ", Kd:", ovalGirdi(ALANLAR[3])),
    el("div", "l3-blok", {}, "Zemin:", zeminSec, "Yap", el("span", "l3-blok__not", {}, "pistin zemin rengi")),
    el("div", "l3-blok l3-blok--dongu", {}, el("span", "", {}, "sürekli tekrarla"),
      el("div", "l3-blok l3-blok--ic", {}, "Sensör Oku"),
      el("div", "l3-blok l3-blok--ic", {}, "Pid ile Motor Güçlerini Ayarla"),
      el("div", "l3-blok l3-blok--ic", {}, "Motor Kontrol Sol Motor Hız: ", el("i", "", {}, "Sol Motor Pwm"), ", Sağ Motor Hız: ", el("i", "", {}, "Sağ Motor Pwm"))));
  const kaydiriciKutu = el("div", "l3-kaydiricilar", {}, ...ALANLAR.map((a) => {
    const r = el("input", "", { type: "range", min: String(a.min), max: String(a.max), step: String(a.adim), value: String(ayar[a.k]), "aria-label": a.ad + " kaydırıcısı" }) as HTMLInputElement;
    r.addEventListener("input", () => deger(a.k, Number(r.value)));
    kaydiricilar[a.k] = r;
    return el("label", "l3-kaydirici", {}, el("span", "", {}, el("b", "", {}, a.ad), el("small", "", {}, a.aciklama)), r);
  }));

  /* pist seçimi, çalıştır, varsayılana dön */
  const pistSec = secici("Pist", CIZGI_GOREVLERI.map((g) => [g.kimlik, g.ad] as [string, string]), gorev.kimlik, (d) => {
    gorev = CIZGI_GOREVLERI.find((g) => g.kimlik === d)!;
    sahne?.yukle(new Pist(gorev.pist, "siyah")); bolum.panelGoster(BOS_KARE);
  });
  const denaB = dugme({ metin: "Pistte dene", ikon: "ok-sag", ikonSonda: true, id: "l-calistir" }) as HTMLButtonElement;
  const varsayB = dugme({ metin: "Kitin değerleri", tur: "ikincil", kucuk: true, id: "ayar-varsayilan" }) as HTMLButtonElement;
  varsayB.addEventListener("click", () => { for (const a of ALANLAR) deger(a.k, SIRO_VARSAYILAN[a.k]); zeminSec.value = ayar.zemin = "siyah"; aktar(); kaydet(); });

  /* robotuna aktar */
  const aktarKutu = el("div", "l3-aktar sra-kart", { "aria-live": "polite" });
  function aktar() {
    aktarKutu.replaceChildren(ikon("robot", "l3-aktar__ikon"),
      el("div", "", {}, el("b", "", {}, "Masadaki SiroLine'a aktar"),
        el("p", "", {}, "mBlock'ta ", el("code", "", {}, `Ayarla Taban Hız: ${ayar.taban}, Ek Hız: ${ayar.ek}, Kp: ${ayar.kp}, Kd: ${ayar.kd}`), " ve ", el("code", "", {}, `Zemin: ${ayar.zemin === "siyah" ? "Siyah" : "Beyaz"}`), "."),
        el("small", "", {}, "Gerçek robotta pil doluluğu ve zemin farklı olabilir; değerleri küçük adımlarla dene.")));
  }
  aktar();

  /* deneme tablosu ve sapma grafiği */
  const tablo = el("table", "l3-tablo", {}, el("caption", "", {}, "Denemelerin"),
    el("thead", "", {}, el("tr", "", {}, ...["#", "Pist", "Taban", "Ek", "Kp", "Kd", "Zemin", "Sonuç", "Ort. sapma"].map((b) => el("th", "", { scope: "col" }, b)))),
    el("tbody"));
  const tabloKap = el("div", "l3-tablo-kap", { hidden: "" }, tablo);
  const grafik = el("figure", "l3-grafik sra-kart", { hidden: "" });
  const cikti = el("div", "l-cikti", { "aria-live": "polite" });

  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#cizgi" }, "← SiroLine"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, "Ayar Atölyesi · kitin blokları"), el("h1", "", {}, "SiroLine'ı ayarla"),
      el("p", "", {}, "Kod yazmadan, robotunun gerçek bloklarındaki değerlerle oyna. Pist sınıftaki gibi: siyah zemin, beyaz bant. Hızlı ama sallanmayan ayarı bul, sonra aynısını masadaki robota gir.")),
    bloklar, kaydiriciKutu,
    el("div", "l-eylem", {}, denaB, varsayB),
    cikti, aktarKutu);

  const bolum = sahneBolumu("Ayar Atölyesi: SiroLine yarışma pistinde, 3D");
  const sag = el("section", "l-gorev-sag", {}, el("div", "l3-pist-sec", {}, el("span", "", {}, "Pist"), pistSec), bolum.kok, grafik, tabloKap);
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));
  const sahne = await bolum.kur(new Pist(gorev.pist, "siyah"));
  if (!sahne) { denaB.disabled = true; return; }

  denaB.addEventListener("click", async () => {
    if (sahne.oynuyor) return;
    denaB.disabled = true; cikti.replaceChildren();
    const a = { ...ayar };
    const sonuc = turKos(new Pist(gorev.pist, "siyah"), siroBeyni(a), gorev.sureSiniri);
    const d: Deneme = { no: denemeler.length + 1, pist: gorev.ad, ayar: a, sonuc };
    denemeler.push(d);
    const tamam = await sahne.oynat(sonuc);
    denaB.disabled = false;
    if (!tamam) return;
    tabloyuCiz(); grafigiCiz(d); yorum(d);
  });

  function yorum(d: Deneme) {
    const s = d.sonuc;
    let m: string, tur: "basari" | "bilgi" | "hata" = "bilgi";
    if (d.ayar.zemin === "beyaz") { m = "Zemin 'Beyaz' seçili, ama bu pistin zemini siyah ve bandı beyaz (sınıftaki pist gibi): robot siyah zemini bant sandı."; tur = "hata"; }
    else if (s.durum === "cikti") { m = `Robot çizgiyi kaybetti (turun %${Math.round(s.ilerleme * 100)}'i). Virajda yeterince sert dönemedi: Kp'yi artır ya da taban hızı düşür.`; tur = "hata"; }
    else if (s.durum === "sure") { m = s.ilerleme < 0.05 ? "Robot neredeyse hiç ilerlemedi: taban hız çok düşük olabilir." : "Süre doldu: robot çok yavaş ya da titriyor. Kd çok yüksekse motorlar sürekli ileri geri gider."; }
    else { m = `Tur tamam: ${sn(s.sure)} saniye, ortalama sapma ${sn(s.ortSapma)} mm.` + (s.ortSapma > 8 ? " Robot epey sallanıyor; Kd'yi biraz artırmayı dene." : " Çizgiyi sıkı takip ediyor; taban hızı artırmayı dene."); tur = "basari"; }
    cikti.replaceChildren(uyari(m, tur));
  }

  function tabloyuCiz() {
    tabloKap.hidden = false;
    /* her pistte en hızlı biten deneme */
    const enIyi = new Map<string, Deneme>();
    for (const d of denemeler) if (d.sonuc.durum === "bitti" && (!enIyi.get(d.pist) || d.sonuc.sure < enIyi.get(d.pist)!.sonuc.sure)) enIyi.set(d.pist, d);
    tablo.tBodies[0].replaceChildren(...denemeler.slice().reverse().map((d) => {
      const iyi = enIyi.get(d.pist) === d, s = d.sonuc;
      return el("tr", iyi ? "en-iyi" : "", {},
        el("td", "", {}, String(d.no)), el("td", "", {}, d.pist), el("td", "", {}, String(d.ayar.taban)), el("td", "", {}, String(d.ayar.ek)),
        el("td", "", {}, sn(d.ayar.kp)), el("td", "", {}, sn(d.ayar.kd)), el("td", "", {}, d.ayar.zemin === "siyah" ? "Siyah" : "Beyaz"),
        el("td", "", {}, s.durum === "bitti" ? `${sn(s.sure)} sn` : s.durum === "cikti" ? `çıktı (%${Math.round(s.ilerleme * 100)})` : `süre doldu (%${Math.round(s.ilerleme * 100)})`, iyi ? el("span", "l3-rozet", {}, "en hızlı") : ""),
        el("td", "", {}, `${sn(s.ortSapma)} mm`));
    }));
  }

  /** Son denemenin çizgiden sapması: tek seri, sıfır çizgisi "çizgi", fareyle değer okuma. */
  function grafigiCiz(d: Deneme) {
    grafik.hidden = false;
    const k = d.sonuc.kareler, W = 640, H = 170, sol = 44, alt = 26, ust = 12, sag = 10;
    const sinir = Math.max(10, Math.ceil(Math.max(...k.map((x) => Math.abs(x.sapma))) / 10) * 10);
    const tMax = Math.max(1, k[k.length - 1].t);
    const X = (t: number) => sol + (t / tMax) * (W - sol - sag), Y = (v: number) => ust + (1 - (v + sinir) / (2 * sinir)) * (H - ust - alt);
    const s = document.createElementNS(SVG, "svg");
    s.setAttribute("viewBox", `0 0 ${W} ${H}`); s.setAttribute("role", "img");
    s.setAttribute("aria-label", `Deneme ${d.no}: çizgiden sapma, en fazla ${sinir} milimetre, ${sn(+tMax.toFixed(1))} saniye`);
    const yolD = k.map((x, i) => `${i ? "L" : "M"}${X(x.t).toFixed(1)} ${Y(x.sapma).toFixed(1)}`).join("");
    const adimT = tMax > 30 ? 10 : tMax > 12 ? 5 : 2;
    let izgara = "";
    for (const v of [-sinir, -sinir / 2, 0, sinir / 2, sinir]) izgara += `<line x1="${sol}" x2="${W - sag}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 0 ? "sifir" : "iz"}"/><text x="${sol - 6}" y="${Y(v) + 4}" text-anchor="end">${v === 0 ? "çizgi" : v > 0 ? "+" + v : v}</text>`;
    for (let t = 0; t <= tMax + 0.01; t += adimT) izgara += `<text x="${X(t)}" y="${H - 6}" text-anchor="middle">${t} sn</text>`;
    s.innerHTML = `${izgara}<path d="${yolD}" class="seri"/><line class="imlec" y1="${ust}" y2="${H - alt}" x1="-10" x2="-10"/><circle class="nokta" r="4" cx="-10" cy="-10"/>`;
    const ipucu = el("div", "l3-grafik__ipucu", { hidden: "" });
    s.addEventListener("pointermove", (e) => {
      const r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
      const t = Math.max(0, Math.min(tMax, (x - sol) / (W - sol - sag) * tMax));
      const kk = k[Math.min(k.length - 1, Math.round(t / 0.02))];
      s.querySelector(".imlec")!.setAttribute("x1", String(X(kk.t))); s.querySelector(".imlec")!.setAttribute("x2", String(X(kk.t)));
      s.querySelector(".nokta")!.setAttribute("cx", String(X(kk.t))); s.querySelector(".nokta")!.setAttribute("cy", String(Y(kk.sapma)));
      ipucu.hidden = false; ipucu.textContent = `${sn(kk.t)} sn · ${sn(Math.abs(kk.sapma))} mm ${kk.sapma > 0 ? "solda" : kk.sapma < 0 ? "sağda" : ""}`;
      ipucu.style.left = (X(kk.t) / W * 100) + "%";
    });
    s.addEventListener("pointerleave", () => { ipucu.hidden = true; });
    grafik.replaceChildren(el("figcaption", "", {}, el("b", "", {}, `Deneme ${d.no}: sensörlerin çizgiden sapması (mm)`), el("small", "", {}, "Sıfır çizgisinin iki yanında dalgalanma = sallanma. Düz ve sıfıra yakın = kararlı.")), el("div", "l3-grafik__kap", {}, s, ipucu));
  }
}
