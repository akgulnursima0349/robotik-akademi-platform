/* Çizgi İzleyen Robot (SiroLine Pleksi): görev listesi ve görev ekranı.
   3D sahne (Three.js) yalnızca bu ekranlar açılınca yüklenir. */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { CIZGI_GOREVLERI, cizgiYildiz, Pist, type CizgiGorevi, type CizgiSonucu } from "@sra/robot-motoru";
import { cizgiCalistir } from "@sra/python";
import { Ogretmen } from "@sra/bulut";
import { Editor } from "../editor";
import { ilerleme } from "../ilerleme";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";
import { BOS_KARE, sahneBolumu, sahneModulu, sn, webglYok } from "./cizgi-ortak";

const anahtar = (g: CizgiGorevi) => "cizgi-" + g.kimlik;
const acikMi = (i: number) => i === 0 || ilerleme.yildiz(anahtar(CIZGI_GOREVLERI[i - 1])) > 0 || uygulama.kullanici instanceof Ogretmen;
const yildizlar = (n: number, toplam = 3) => el("span", "l-yildizlar", { "aria-label": `${n} / ${toplam} yıldız` }, ...Array.from({ length: toplam }, (_, i) => el("i", i < n ? "dolu" : "")));

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
    el("div", "l3-etkinlik", {},
      el("a", "sra-kart", { href: "#cizgi/kurulum", id: "c-kurulum" }, ikon("yapboz", "l3-etkinlik__ikon"),
        el("span", "", {}, el("b", "", {}, "3D kurulum rehberi"), el("small", "", {}, "SiroLine'ı adım adım kur: hangi parça ne işe yarar?"),
          ilerleme.bayrak("siro-kurulum") ? el("span", "l3-tamam", {}, ikon("tamam"), "Tamamlandı") : ""), ikon("ok-sag")),
      el("a", "sra-kart", { href: "#cizgi/ayar", id: "c-ayar" }, ikon("islemci", "l3-etkinlik__ikon"),
        el("span", "", {}, el("b", "", {}, "Ayar Atölyesi"), el("small", "", {}, "Kitin bloklarıyla Kp ve Kd'yi ayarla, değerleri masadaki robota aktar.")), ikon("ok-sag"))),
    el("h2", "l3-baslik2", {}, "Kod görevleri (Python)"),
    liste));
  const m = await sahneModulu();
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

  const bolum = sahneBolumu(`${g.ad}: SiroLine robotu yarışma pistinde, 3D`);
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, el("section", "l-gorev-sag", {}, bolum.kok)));
  const sahne = await bolum.kur(pist);
  if (!sahne) { calistirB.disabled = true; return; }

  ipucuB.addEventListener("click", () => cikti.replaceChildren(uyari(g.ipucu, "bilgi")));
  bastanB.addEventListener("click", () => { sahne.sifirla(); calistirB.disabled = false; editor.temizle(); cikti.replaceChildren(); bolum.panelGoster(BOS_KARE); });

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
