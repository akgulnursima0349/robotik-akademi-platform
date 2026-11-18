/* Kar Küreme: görev listesi ve görev ekranı (kod editörü + izometrik sahne). */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { GOREVLER, type Gorev, type GorevSonucu, type Kare } from "@sra/robot-motoru";
import { karKuremeCalistir, type KarKuremeSonucu } from "@sra/python";
import { Ogretmen } from "@sra/bulut";
import { Editor } from "../editor";
import { ilerleme } from "../ilerleme";
import { KarSahnesi } from "../sahne/sahneler";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";

const acikMi = (g: Gorev) => g.sira === 1 || ilerleme.yildiz(GOREVLER[g.sira - 2].kimlik) > 0 || uygulama.kullanici instanceof Ogretmen;
const yildizlar = (n: number, toplam = 3) => el("span", "l-yildizlar", { "aria-label": `${n} / ${toplam} yıldız` }, ...Array.from({ length: toplam }, (_, i) => el("i", i < n ? "dolu" : "")));

export function karListe(root: HTMLElement) {
  const liste = el("ol", "l-gorevler");
  for (const g of GOREVLER) {
    const acik = acikMi(g), y = ilerleme.yildiz(g.kimlik);
    const icerik = [el("span", "l-gorev__no", {}, String(g.sira)), el("span", "l-gorev__metin", {}, el("b", "", {}, g.ad), el("small", "", {}, g.ogrettigi)),
      acik ? yildizlar(y) : el("span", "l-gorev__kilit", {}, ikon("kilit"), "Önceki görevi bitir")];
    liste.append(el("li", "", {}, acik ? el("a", "l-gorev sra-kart" + (y ? " bitti" : ""), { href: `#kar/${g.kimlik}`, "data-gorev": g.kimlik }, ...icerik) : el("div", "l-gorev sra-kart kilitli", { "aria-disabled": "true" }, ...icerik)));
  }
  root.replaceChildren(ustKisim(), el("main", "l-sayfa sra-sarmal", { id: "ana" },
    el("a", "l-geri", { href: "#" }, "← Laboratuvar"),
    el("div", "l-baslik sra-belir", {}, el("p", "l-ust", {}, "Kar Küreme Robotu"), el("h1", "", {}, "Mahalleyi kardan kurtar"),
      el("p", "", {}, "Her görevde yıldızlar: bitirmek, az enerji harcamak ve kısa kod yazmak. Görevler sırayla açılır.")),
    liste));
}

const SEBEP: Record<string, string> = {
  carpma: "Robot bir binaya çarptı.", batarya: "Batarya bitti, robot yolda kaldı.", cok_adim: "Robot çok fazla adım attı; bitmeyen bir döngü olabilir.",
  kar_kaldi: "Program bitti ama sokaklarda hâlâ kar var.", hata: "Kodda bir hata var."
};

export async function karGorev(root: HTMLElement, kimlik: string) {
  const g = GOREVLER.find((x) => x.kimlik === kimlik);
  if (!g || !acikMi(g)) { location.hash = "kar"; return; }
  const editor = new Editor(ilerleme.kod(g.kimlik) ?? g.baslangicKodu);
  editor.degisince = (k) => ilerleme.kodKaydet(g.kimlik, k);

  const cikti = el("div", "l-cikti", { "aria-live": "polite" });
  const calistirB = dugme({ metin: "Çalıştır", ikon: "ok-sag", ikonSonda: true, id: "l-calistir" }) as HTMLButtonElement;
  const bastanB = dugme({ metin: "Baştan al", tur: "ikincil", kucuk: true, id: "l-bastan" }) as HTMLButtonElement;
  const ipucuB = dugme({ metin: "İpucu", tur: "hayalet", kucuk: true, ikon: "bilgi", id: "l-ipucu" }) as HTMLButtonElement;
  const hizSec = el("div", "l-hiz", { role: "group", "aria-label": "Oynatma hızı" }, ...[1, 2, 4].map((h) => el("button", h === 1 ? "secili" : "", { type: "button", "data-hiz": String(h) }, `${h}×`)));
  const komutlar = el("div", "l-komutlar", { "aria-label": "Komutlar (tıkla, koda eklensin)" }, ...g.komutlar.map((k) => {
    const b = el("button", "l-komut", { type: "button" }, k);
    b.addEventListener("click", () => editor.ekle(k.replace("...", g.kimlik === "uzun-cadde" ? "14" : "")));
    return b;
  }));
  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#kar" }, "← Görevler"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, `Görev ${g.sira} · ${g.ogrettigi}`), el("h1", "", {}, g.ad), el("p", "", {}, g.hikaye)),
    komutlar, editor.kok,
    el("div", "l-eylem", {}, calistirB, bastanB, ipucuB, hizSec),
    cikti);
  if (uygulama.kullanici instanceof Ogretmen) {
    const cozB = dugme({ metin: "Örnek çözüm", tur: "hayalet", kucuk: true, ikon: "kep" });
    cozB.addEventListener("click", () => { editor.kod = g.cozum; });
    sol.querySelector(".l-eylem")!.append(cozB);
  }

  /* sahne ve göstergeler */
  const sahneKutu = el("div", "l-sahne", { role: "img", "aria-label": `${g.ad}: sokak haritası ve robot` });
  const pil = el("div", "l-pil", {}, el("i"));
  const pilYazi = el("b", "", {}, "");
  const karSay = el("b", "", {}, "");
  const haritaSecim = el("div", "l-haritalar", { role: "tablist" });
  const gosterge = el("div", "l-gosterge", {},
    el("span", "", {}, ikon("islemci"), "Batarya ", pil, pilYazi),
    el("span", "", {}, "Kalan kar ", karSay));
  const sag = el("section", "l-gorev-sag", {}, el("div", "l-sahne-kap sra-kart", {}, gosterge, sahneKutu, haritaSecim));
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));

  const sahne = await KarSahnesi.kur(sahneKutu);
  let aktifHarita = 0;
  const karlilar = (i: number) => g.haritalar[i].join("").split("").filter((c) => c === ".").length;
  let kalan = karlilar(0);
  const pilGoster = (b: number) => {
    const o = b / g.batarya;
    (pil.firstChild as HTMLElement).style.width = o * 100 + "%";
    pil.classList.toggle("az", o < 0.25);
    pilYazi.textContent = `${b}/${g.batarya}`;
  };
  const yukle = (i: number) => { aktifHarita = i; sahne.yukle(g.haritalar[i], g.yon); kalan = karlilar(i); karSay.textContent = String(kalan); pilGoster(g.batarya); haritaSekmeleri(); };
  sahne.kareDinle = (k: Kare) => {
    pilGoster(k.batarya);
    if (k.temizlenen) karSay.textContent = String(--kalan);
    if (k.satir) editor.calisanSatir(k.satir);
  };
  const haritaSekmeleri = () => {
    haritaSecim.hidden = g.haritalar.length < 2;
    haritaSecim.replaceChildren(...g.haritalar.map((_, i) => {
      const b = el("button", i === aktifHarita ? "secili" : "", { type: "button", role: "tab", "aria-selected": String(i === aktifHarita) }, `Sokak ${i + 1}`);
      b.addEventListener("click", () => { if (!oynuyor) yukle(i); });
      return b;
    }));
  };
  yukle(0);
  window.addEventListener("hashchange", () => sahne.yokEt(), { once: true });

  hizSec.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button"); if (!b) return;
    sahne.hiz = Number(b.dataset.hiz);
    hizSec.querySelectorAll("button").forEach((x) => x.classList.toggle("secili", x === b));
  });
  ipucuB.addEventListener("click", () => cikti.replaceChildren(uyari(g.ipucu, "bilgi")));
  bastanB.addEventListener("click", () => { sahne.durdur(); oynuyor = false; calistirB.disabled = false; editor.temizle(); cikti.replaceChildren(); yukle(aktifHarita); });

  let oynuyor = false;
  calistirB.addEventListener("click", async () => {
    if (oynuyor) return;
    oynuyor = true; calistirB.disabled = true; editor.temizle(); cikti.replaceChildren();
    ilerleme.denemeArttir(g.kimlik);
    const r: KarKuremeSonucu = karKuremeCalistir(g, editor.kod);
    if (r.cikti.length) cikti.append(el("pre", "l-print", {}, r.cikti.join("\n")));
    if (r.hata && r.hata.tur !== "Robot" && r.simler[0].iz.length <= 1) {
      editor.hataSatiri(r.hata.satir);
      cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj));
      oynuyor = false; calistirB.disabled = false; return;
    }
    /* her haritayı sırayla oynat */
    for (let i = 0; i < r.simler.length; i++) {
      yukle(i);
      const tamam = await sahne.oynat(r.simler[i].iz);
      if (!tamam) { oynuyor = false; return; }
      if (r.simler[i].durdu || (r.hata && i === r.simler.length - 1)) break;
    }
    editor.calisanSatir(0);
    if (r.hata) { editor.hataSatiri(r.hata.satir); cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj)); }
    sonucGoster(r.sonuc);
    oynuyor = false; calistirB.disabled = false;
  });

  function hataKutusu(satir: number, mesaj: string) {
    const d = uyari("", "hata");
    d.querySelector("span:last-child")!.innerHTML = (satir ? `<b>${satir}. satır:</b> ` : "") + mesaj;
    return d;
  }

  function sonucGoster(s: GorevSonucu) {
    if (s.basarili) ilerleme.yildizKaydet(g!.kimlik, s.yildiz, editor.kod);
    const sonraki = GOREVLER[g!.sira];
    const satirlar = [
      [s.yildizlar.bitti, s.basarili ? "Bütün sokaklar açıldı" : SEBEP[s.sebep ?? "hata"]],
      [s.yildizlar.enerji, `Enerji: ${s.harcanan} harcandı (yıldız için en fazla ${g!.enerjiSiniri})`],
      [s.yildizlar.kisa, `Kod: ${s.satir} satır (yıldız için en fazla ${g!.satirSiniri})`]
    ] as const;
    const kart = el("div", "l-sonuc sra-kart sra-belir" + (s.basarili ? " basarili" : ""), { role: "status" },
      yildizlar(s.yildiz),
      el("h2", "", {}, s.basarili ? (s.yildiz === 3 ? "Kusursuz!" : "Görev tamam!") : "Bir daha dene"),
      el("ul", "", {}, ...satirlar.map(([ok, m]) => el("li", ok ? "ok" : "", {}, ikon(ok ? "tamam" : "uyari"), m))));
    const eylem = el("div", "l-eylem", {});
    if (s.basarili && sonraki) eylem.append(dugme({ metin: "Sonraki görev", ikon: "ok-sag", ikonSonda: true, href: `#kar/${sonraki.kimlik}` }));
    else if (s.basarili) eylem.append(dugme({ metin: "Lige geç", ikon: "ok-sag", ikonSonda: true, href: "#lig" }));
    const tekrar = dugme({ metin: s.basarili ? "Daha iyisini yap" : "Tekrar dene", tur: "ikincil" });
    tekrar.addEventListener("click", () => { kart.remove(); bastanB.click(); editor.alan.focus(); });
    eylem.append(tekrar);
    kart.append(eylem);
    cikti.append(kart);
    kart.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
