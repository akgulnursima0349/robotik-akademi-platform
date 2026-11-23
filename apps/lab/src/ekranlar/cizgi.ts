/* Çizgi İzleyen Robot (SiroLine Pleksi): görev listesi ve görev ekranı.
   3D sahne (Three.js) yalnızca bu ekranlar açılınca yüklenir. */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { CIZGI_GOREVLERI, cizgiYildiz, Pist, type CizgiGorevi, type CizgiKaresi, type CizgiSonucu } from "@sra/robot-motoru";
import { cizgiCalistir } from "@sra/python";
import { Ogretmen } from "@sra/bulut";
import { Editor } from "../editor";
import { ilerleme } from "../ilerleme";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";

const anahtar = (g: CizgiGorevi) => "cizgi-" + g.kimlik;
const sn = (x: number) => String(x).replace(".", ",");
const acikMi = (i: number) => i === 0 || ilerleme.yildiz(anahtar(CIZGI_GOREVLERI[i - 1])) > 0 || uygulama.kullanici instanceof Ogretmen;
const yildizlar = (n: number, toplam = 3) => el("span", "l-yildizlar", { "aria-label": `${n} / ${toplam} yıldız` }, ...Array.from({ length: toplam }, (_, i) => el("i", i < n ? "dolu" : "")));

async function sahneYukle() {
  const { webglVar } = await import("../sahne3d/studyo");
  if (!webglVar()) return null;
  return import("../sahne3d/cizgi-sahnesi");
}
const webglYok = () => uyari("Bu tarayıcı 3D çizimi (WebGL) desteklemiyor ya da kapalı. Chrome, Edge ya da Firefox'un güncel sürümüyle dene; donanım hızlandırmanın açık olduğundan emin ol.", "hata");

/* ---------------- liste ---------------- */
export async function cizgiListe(root: HTMLElement) {
  const vitrin = el("div", "l3-vitrin", { role: "img", "aria-label": "SiroLine Pleksi çizgi izleyen robotun 3D modeli, kendi etrafında dönüyor" });
  const liste = el("ol", "l-gorevler");
  CIZGI_GOREVLERI.forEach((g, i) => {
    const acik = acikMi(i), y = ilerleme.yildiz(anahtar(g));
    const icerik = [el("span", "l-gorev__no", {}, String(i + 1)), el("span", "l-gorev__metin", {}, el("b", "", {}, g.ad), el("small", "", {}, g.ogretir)),
      acik ? yildizlar(y) : el("span", "l-gorev__kilit", {}, ikon("kilit"), "Önceki görevi bitir")];
    liste.append(el("li", "", {}, acik ? el("a", "l-gorev sra-kart" + (y ? " bitti" : ""), { href: `#cizgi/${g.kimlik}`, "data-gorev": g.kimlik }, ...icerik) : el("div", "l-gorev sra-kart kilitli", { "aria-disabled": "true" }, ...icerik)));
  });
  root.replaceChildren(ustKisim(), el("main", "l-sayfa sra-sarmal", { id: "ana" },
    el("a", "l-geri", { href: "#" }, "← Laboratuvar"),
    el("div", "l3-kahraman", {},
      el("div", "l-baslik sra-belir", {}, el("p", "l-ust", {}, "Çizgi İzleyen Robot"), el("h1", "", {}, "SiroLine pistte"),
        el("p", "", {}, "Akademinin derste kullandığı SiroLine Pleksi, burada 3D. Sekiz kızılötesi sensörünü oku, iki motorunu Python'la yönet. Pistte işe yarayan mantığı masadaki robota da taşıyabilirsin."),
        el("ul", "l3-ozellik", {}, ...[["robot", "21,5 × 17,5 cm, iki redüktörlü motor"], ["grafik", "8 sensör: 0 beyaz, 1000 siyah"], ["kod", "dongu() her 20 milisaniyede çalışır"]].map(([i, m]) => el("li", "", {}, ikon(i as "robot"), m)))),
      vitrin),
    liste));
  const m = await sahneYukle();
  if (!m) { vitrin.replaceChildren(webglYok()); return; }
  if (!vitrin.isConnected) return;
  const s = new m.CizgiSahnesi(vitrin);
  s.tanitimMesafesi = 0.72;
  s.yukle(new Pist(CIZGI_GOREVLERI[0].pist));
  window.addEventListener("hashchange", () => s.kapat(), { once: true });
  vitrin.dataset.hazir = "1";
}

/* ---------------- görev ---------------- */
const SEBEP: Record<string, string> = {
  cikti: "Robot çizgiyi kaybetti ve pistten çıktı.",
  sure: "Süre doldu: robot turu bitiremedi.",
  hata: "Kodda bir hata var."
};

export async function cizgiGorev(root: HTMLElement, kimlik: string) {
  const i = CIZGI_GOREVLERI.findIndex((x) => x.kimlik === kimlik), g = CIZGI_GOREVLERI[i];
  if (!g || !acikMi(i)) { location.hash = "cizgi"; return; }
  const pist = new Pist(g.pist);
  const editor = new Editor(ilerleme.kod(anahtar(g)) ?? g.baslangicKod, "SiroLine'ın Python kodu");
  editor.degisince = (k) => ilerleme.kodKaydet(anahtar(g), k);

  const cikti = el("div", "l-cikti", { "aria-live": "polite" });
  const calistirB = dugme({ metin: "Pistte dene", ikon: "ok-sag", ikonSonda: true, id: "l-calistir" }) as HTMLButtonElement;
  const bastanB = dugme({ metin: "Başa al", tur: "ikincil", kucuk: true, id: "l-bastan" }) as HTMLButtonElement;
  const ipucuB = dugme({ metin: "İpucu", tur: "hayalet", kucuk: true, ikon: "bilgi", id: "l-ipucu" }) as HTMLButtonElement;
  const api = el("details", "l3-api", {},
    el("summary", "", {}, "SiroLine komutları"),
    el("dl", "", {},
      el("dt", "", {}, el("code", "", {}, "sensorler()")), el("dd", "", {}, "8 sayılık liste, soldan sağa. 0 beyaz zemin, 1000 siyah bant."),
      el("dt", "", {}, el("code", "", {}, "cizgi_konumu()")), el("dd", "", {}, "Çizgi nerede: -100 en solda, 0 tam ortada, 100 en sağda. Çizgi kaybolursa son gördüğü taraf."),
      el("dt", "", {}, el("code", "", {}, "motorlar(sol, sag)")), el("dd", "", {}, "İki motorun gücü, -255 ile 255 arası. 35'in altında motor dönmez."),
      el("dt", "", {}, el("code", "", {}, "sure()")), el("dd", "", {}, "Başlangıçtan beri geçen milisaniye."),
      el("dt", "", {}, el("code", "", {}, "def kurulum():")), el("dd", "", {}, "İsteğe bağlı; en başta bir kez çalışır.")));
  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#cizgi" }, "← Görevler"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, `Görev ${i + 1} · ${g.ogretir}`), el("h1", "", {}, g.ad), el("p", "", {}, g.ozet + ` Yıldızlar: turu bitir, ${sn(g.yildizSureleri[0])} saniyenin altı, ${sn(g.yildizSureleri[1])} saniyenin altı.`)),
    api, editor.kok,
    el("div", "l-eylem", {}, calistirB, bastanB, ipucuB),
    cikti);
  if (uygulama.kullanici instanceof Ogretmen) {
    const cozB = dugme({ metin: "Örnek çözüm", tur: "hayalet", kucuk: true, ikon: "kep" });
    cozB.addEventListener("click", () => { editor.kod = g.ornekCozum; });
    sol.querySelector(".l-eylem")!.append(cozB);
  }

  /* sahne, kamera ve hız düğmeleri, sensör paneli */
  const sahneKutu = el("div", "l3-sahne", { role: "img", "aria-label": `${g.ad}: SiroLine robotu yarışma pistinde, 3D` });
  const secici = (ad: string, sec: [string, string][], ilk: string) => el("div", "l3-secici", { role: "group", "aria-label": ad },
    ...sec.map(([d, m]) => el("button", d === ilk ? "secili" : "", { type: "button", "data-deger": d, "aria-pressed": String(d === ilk) }, m)));
  const kamSec = secici("Kamera", [["serbest", "Serbest"], ["takip", "Takip"], ["ust", "Üstten"]], "serbest");
  const hizSec = secici("Oynatma hızı", [["1", "1×"], ["2", "2×"]], "1");
  const surePano = el("b", "l3-sure", {}, "0,00 sn");
  const ilerlemePano = el("i");
  const ust = el("div", "l3-ust", {}, el("span", "l3-zaman", {}, ikon("saat"), surePano), el("span", "l3-ilerleme", { "aria-label": "Tur ilerlemesi" }, ilerlemePano), kamSec, hizSec);
  const sensorCubuk = Array.from({ length: 8 }, (_, k) => el("span", "l3-sensor", { title: `Sensör ${k}` }, el("i"), el("b", "", {}, "0"), el("small", "", {}, String(k))));
  const motorCubuk = (ad: string) => { const c = el("span", "l3-motor", {}, el("small", "", {}, ad), el("span", "l3-motor__ray", {}, el("i")), el("b", "", {}, "0")); return c; };
  const solM = motorCubuk("Sol"), sagM = motorCubuk("Sağ");
  const panel = el("div", "l3-panel", { "aria-label": "Canlı sensör ve motor değerleri" },
    el("div", "l3-panel__sensorler", {}, el("p", "l3-panel__baslik", {}, "sensorler()"), el("div", "l3-sensorler", {}, ...sensorCubuk)),
    el("div", "l3-panel__motorlar", {}, el("p", "l3-panel__baslik", {}, "motorlar(sol, sag)"), solM, sagM));
  const sag = el("section", "l-gorev-sag", {}, el("div", "l3-sahne-kap sra-kart", {}, ust, sahneKutu, panel));
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));

  const panelGoster = (k: CizgiKaresi) => {
    k.sensor.forEach((v, j) => {
      const c = sensorCubuk[j];
      (c.firstChild as HTMLElement).style.height = v / 10 + "%";
      c.classList.toggle("siyah", v > 500);
      (c.children[1] as HTMLElement).textContent = String(v);
    });
    for (const [c, v] of [[solM, k.sol], [sagM, k.sag]] as const) {
      const n = Math.max(-255, Math.min(255, Math.round(v)));
      const cub = c.querySelector(".l3-motor__ray i") as HTMLElement;
      cub.style.width = Math.abs(n) / 255 * 50 + "%";
      cub.style.left = n >= 0 ? "50%" : 50 - Math.abs(n) / 255 * 50 + "%";
      cub.classList.toggle("geri", n < 0);
      (c.lastChild as HTMLElement).textContent = String(n);
    }
    surePano.textContent = k.t.toFixed(2).replace(".", ",") + " sn";
    ilerlemePano.style.width = k.ilerleme * 100 + "%";
  };

  const m = await sahneYukle();
  if (!m) { sahneKutu.replaceChildren(webglYok()); calistirB.disabled = true; return; }
  if (!sahneKutu.isConnected) return;
  const sahne = new m.CizgiSahnesi(sahneKutu);
  sahne.tanitimMesafesi = 0.85;
  sahne.yukle(pist);
  sahne.kareDinle = panelGoster;
  window.addEventListener("hashchange", () => sahne.kapat(), { once: true });
  sahneKutu.dataset.hazir = "1";

  const seciciBagla = (s: HTMLElement, f: (d: string) => void) => s.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button"); if (!b) return;
    s.querySelectorAll("button").forEach((x) => { x.classList.toggle("secili", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    f(b.dataset.deger!);
  });
  seciciBagla(kamSec, (d) => sahne.kipSec(d as "takip"));
  seciciBagla(hizSec, (d) => { sahne.hiz = Number(d); });
  ipucuB.addEventListener("click", () => cikti.replaceChildren(uyari(g.ipucu, "bilgi")));
  bastanB.addEventListener("click", () => { sahne.sifirla(); calistirB.disabled = false; editor.temizle(); cikti.replaceChildren(); panelGoster({ t: 0, x: 0, y: 0, yon: 0, sol: 0, sag: 0, sensor: new Array(8).fill(0), solTeker: 0, sagTeker: 0, ilerleme: 0 }); });

  calistirB.addEventListener("click", async () => {
    if (sahne.oynuyor) return;
    calistirB.disabled = true; editor.temizle(); cikti.replaceChildren();
    ilerleme.denemeArttir(anahtar(g));
    const r = cizgiCalistir(g, editor.kod);
    if (r.cikti.length) cikti.append(el("pre", "l-print", {}, r.cikti.slice(-40).join("\n")));
    if (!r.sonuc) {
      if (r.hata) { editor.hataSatiri(r.hata.satir); cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj)); }
      calistirB.disabled = false; return;
    }
    const tamam = await sahne.oynat(r.sonuc);
    if (!tamam) return;
    if (r.hata) { editor.hataSatiri(r.hata.satir); cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj)); }
    sonucGoster(r.sonuc);
    calistirB.disabled = false;
  });

  function hataKutusu(satir: number, mesaj: string) {
    const d = uyari("", "hata");
    d.querySelector("span:last-child")!.innerHTML = (satir ? `<b>${satir}. satır:</b> ` : "") + mesaj;
    return d;
  }

  function sonucGoster(s: CizgiSonucu) {
    const y = cizgiYildiz(g, s), bitti = s.durum === "bitti";
    if (bitti) ilerleme.yildizKaydet(anahtar(g), y, editor.kod);
    const sonraki = CIZGI_GOREVLERI[i + 1];
    const sure = s.sure.toFixed(2).replace(".", ",");
    const satirlar: [boolean, string][] = [
      [bitti, bitti ? `Tur tamam: ${sure} saniye` : `${SEBEP[s.durum]} Turun %${Math.round(s.ilerleme * 100)}'i gidildi.`],
      [bitti && s.sure <= g.yildizSureleri[0], `${sn(g.yildizSureleri[0])} saniyenin altı`],
      [bitti && s.sure <= g.yildizSureleri[1], `${sn(g.yildizSureleri[1])} saniyenin altı`]
    ];
    const kart = el("div", "l-sonuc sra-kart sra-belir" + (bitti ? " basarili" : ""), { role: "status" },
      yildizlar(y),
      el("h2", "", {}, bitti ? (y === 3 ? "Pist rekoru!" : "Tur tamam!") : "Bir daha dene"),
      el("ul", "", {}, ...satirlar.map(([ok, mt]) => el("li", ok ? "ok" : "", {}, ikon(ok ? "tamam" : "uyari"), mt))));
    const eylem = el("div", "l-eylem", {});
    if (bitti && sonraki) eylem.append(dugme({ metin: "Sonraki pist", ikon: "ok-sag", ikonSonda: true, href: `#cizgi/${sonraki.kimlik}` }));
    const tekrar = dugme({ metin: bitti ? "Daha hızlısını dene" : "Tekrar dene", tur: "ikincil" });
    tekrar.addEventListener("click", () => { kart.remove(); bastanB.click(); editor.alan.focus(); });
    eylem.append(tekrar);
    kart.append(eylem);
    cikti.append(kart);
    kart.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
