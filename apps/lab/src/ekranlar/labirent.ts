/* RizBot labirent: görev listesi ve görev ekranı (kod editörü + 3D MEB labirenti). */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { LABIRENT_GOREVLERI, type LabirentGorevi, type LabirentKaresi, type LabirentSonucu } from "@sra/robot-motoru";
import { labirentCalistir, type LabirentCalismasi } from "@sra/python";
import { Ogretmen } from "@sra/bulut";
import { Editor } from "../editor";
import { ilerleme } from "../ilerleme";
import { webglYok } from "./cizgi-ortak";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";

const G = LABIRENT_GOREVLERI;
const acikMi = (g: LabirentGorevi) => g.sira === 1 || ilerleme.yildiz(G[g.sira - 2].kimlik) > 0 || uygulama.kullanici instanceof Ogretmen;
const yildizlar = (n: number, toplam = 3) => el("span", "l-yildizlar", { "aria-label": `${n} / ${toplam} yıldız` }, ...Array.from({ length: toplam }, (_, i) => el("i", i < n ? "dolu" : "")));
const sn = (t: number) => t.toFixed(2).replace(".", ",") + " sn";

export function labirentListe(root: HTMLElement) {
  const liste = el("ol", "l-gorevler");
  for (const g of G) {
    const acik = acikMi(g), y = ilerleme.yildiz(g.kimlik);
    const icerik = [el("span", "l-gorev__no", {}, String(g.sira)), el("span", "l-gorev__metin", {}, el("b", "", {}, g.ad), el("small", "", {}, g.ogrettigi)),
      acik ? yildizlar(y) : el("span", "l-gorev__kilit", {}, ikon("kilit"), "Önceki görevi bitir")];
    liste.append(el("li", "", {}, acik ? el("a", "l-gorev sra-kart" + (y ? " bitti" : ""), { href: `#labirent/${g.kimlik}`, "data-gorev": g.kimlik }, ...icerik) : el("div", "l-gorev sra-kart kilitli", { "aria-disabled": "true" }, ...icerik)));
  }
  root.replaceChildren(ustKisim(), el("main", "l-sayfa sra-sarmal", { id: "ana" },
    el("a", "l-geri", { href: "#" }, "← Laboratuvar"),
    el("div", "l-baslik sra-belir", {}, el("p", "l-ust", {}, "Labirent Ustası · RizBot"), el("h1", "", {}, "Labirentten çıkış yolunu bul"),
      el("p", "", {}, "Pist MEB Labirent Ustası ölçülerinde: 20 cm'lik hücreler, beyaz duvarlar, siyah zemin. RizBot'u duvar sensörleriyle programla. Her görevde yıldızlar: bitirmek, hızlı bitirmek ve kısa kod."),
      el("p", "l-not-kucuk", {}, "RizBot modeli ürün fotoğraflarından yapıldı; ölçüleri yaklaşıktır.")),
    liste));
}

const SEBEP: Record<string, string> = {
  carpma: "RizBot duvara çarptı.", sure: "Süre doldu, bitişe ulaşılamadı.", cok_adim: "Robot çok fazla adım attı; aynı yollarda dönüp duruyor olabilir.",
  bitmedi: "Program bitti ama RizBot bitiş hücresine ulaşmadı.", hata: "Kodda bir hata var."
};

export async function labirentGorev(root: HTMLElement, kimlik: string) {
  const g = G.find((x) => x.kimlik === kimlik);
  if (!g || !acikMi(g)) { location.hash = "labirent"; return; }
  const editor = new Editor(ilerleme.kod(g.kimlik) ?? g.baslangicKodu);
  editor.degisince = (k) => ilerleme.kodKaydet(g.kimlik, k);

  const cikti = el("div", "l-cikti", { "aria-live": "polite" });
  const calistirB = dugme({ metin: "Çalıştır", ikon: "ok-sag", ikonSonda: true, id: "l-calistir" }) as HTMLButtonElement;
  const bastanB = dugme({ metin: "Baştan al", tur: "ikincil", kucuk: true, id: "l-bastan" }) as HTMLButtonElement;
  const ipucuB = dugme({ metin: "İpucu", tur: "hayalet", kucuk: true, ikon: "bilgi", id: "l-ipucu" }) as HTMLButtonElement;
  const hizSec = el("div", "l-hiz", { role: "group", "aria-label": "Oynatma hızı" }, ...[1, 2, 4].map((h) => el("button", h === 1 ? "secili" : "", { type: "button", "data-hiz": String(h) }, `${h}×`)));
  const komutlar = el("div", "l-komutlar", { "aria-label": "Komutlar (tıkla, koda eklensin)" }, ...g.komutlar.map((k) => {
    const b = el("button", "l-komut", { type: "button" }, k);
    b.addEventListener("click", () => editor.ekle(k.replace("...", "")));
    return b;
  }));
  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#labirent" }, "← Görevler"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, `Görev ${g.sira} · ${g.ogrettigi}`), el("h1", "", {}, g.ad), el("p", "", {}, g.hikaye)),
    komutlar, editor.kok,
    el("div", "l-eylem", {}, calistirB, bastanB, ipucuB, hizSec),
    cikti);
  if (uygulama.kullanici instanceof Ogretmen) {
    const cozB = dugme({ metin: "Örnek çözüm", tur: "hayalet", kucuk: true, ikon: "kep" });
    cozB.addEventListener("click", () => { editor.kod = g.cozum; });
    sol.querySelector(".l-eylem")!.append(cozB);
  }

  const sahneKutu = el("div", "l-sahne l-sahne--labirent", { role: "img", "aria-label": `${g.ad}: labirent ve RizBot` });
  const saat = el("b", "", { id: "l-saat" }, sn(0));
  const satirG = el("b", "", {}, "");
  const haritaSecim = el("div", "l-haritalar", { role: "tablist" });
  const gosterge = el("div", "l-gosterge", {},
    el("span", "", {}, ikon("saat"), "Süre ", saat, el("small", "", {}, ` / ${g.sureSiniri} sn`)),
    el("span", "", {}, "Satır ", satirG));
  const sag = el("section", "l-gorev-sag", {}, el("div", "l-sahne-kap sra-kart", {}, gosterge, sahneKutu, haritaSecim));
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));

  const { webglVar } = await import("@sra/sahne/studyo");
  if (!webglVar()) { sahneKutu.replaceChildren(webglYok()); calistirB.disabled = true; return; }
  const { LabirentSahnesi3D } = await import("../sahne3d/labirent-sahnesi");
  if (!sahneKutu.isConnected) return;
  const sahne = await LabirentSahnesi3D.kur(sahneKutu);
  sahneKutu.dataset.hazir = "1";
  let aktif = 0, oynuyor = false;
  const satirSayisi = (i: number) => (g.haritalar[i].length - 1) / 2;
  const satirGoster = (s: number, i: number) => { satirG.textContent = `${s}/${satirSayisi(i)}`; };
  const yukle = (i: number) => { aktif = i; sahne.yukle(g.haritalar[i]); saat.textContent = sn(0); satirGoster(1, i); sekmeler(); };
  sahne.saatDinle = (t) => { saat.textContent = sn(t); };
  let enUzak = 1;
  sahne.kareDinle = (k: LabirentKaresi) => {
    const s = satirSayisi(aktif) - k.y; if (s > enUzak) { enUzak = s; satirGoster(s, aktif); }
    if (k.satir) editor.calisanSatir(k.satir);
  };
  const sekmeler = () => {
    haritaSecim.hidden = g.haritalar.length < 2;
    haritaSecim.replaceChildren(...g.haritalar.map((_, i) => {
      const b = el("button", i === aktif ? "secili" : "", { type: "button", role: "tab", "aria-selected": String(i === aktif) }, `Labirent ${i + 1}`);
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
  bastanB.addEventListener("click", () => { sahne.durdur(); oynuyor = false; calistirB.disabled = false; editor.temizle(); cikti.replaceChildren(); yukle(aktif); });

  calistirB.addEventListener("click", async () => {
    if (oynuyor) return;
    oynuyor = true; calistirB.disabled = true; editor.temizle(); cikti.replaceChildren();
    ilerleme.denemeArttir(g.kimlik);
    const r: LabirentCalismasi = labirentCalistir(g, editor.kod);
    if (r.cikti.length) cikti.append(el("pre", "l-print", {}, r.cikti.join("\n")));
    const robotHatasi = r.hata?.tur === "Robot";
    if (r.hata && !robotHatasi && r.simler[0].iz.filter((k) => k.olay !== "bak").length <= 1) {
      editor.hataSatiri(r.hata.satir);
      cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj));
      oynuyor = false; calistirB.disabled = false; return;
    }
    for (let i = 0; i < r.simler.length; i++) {
      yukle(i); enUzak = 1;
      const s = r.simler[i];
      const tamam = await sahne.oynat(s.iz, s.zamanla());
      if (!tamam) { oynuyor = false; return; }
      if (!s.bittiMi()) break;
    }
    editor.calisanSatir(0);
    if (r.hata && !(robotHatasi && r.sonuc.basarili)) { editor.hataSatiri(r.hata.satir); cikti.append(hataKutusu(r.hata.satir, r.hata.mesaj)); }
    sonucGoster(r.sonuc);
    oynuyor = false; calistirB.disabled = false;
  });

  function hataKutusu(satir: number, mesaj: string) {
    const d = uyari("", "hata");
    d.querySelector("span:last-child")!.innerHTML = (satir ? `<b>${satir}. satır:</b> ` : "") + mesaj;
    return d;
  }

  function sonucGoster(s: LabirentSonucu) {
    if (s.basarili) ilerleme.yildizKaydet(g!.kimlik, s.yildiz, editor.kod);
    const sonraki = G[g!.sira];
    const coklu = g!.haritalar.length > 1;
    const satirlar: [boolean, string][] = [
      [s.yildizlar.bitti, s.basarili ? (coklu ? "İki labirentte de bitişe ulaştı" : "Bitişe ulaştı") : SEBEP[s.sebep ?? "hata"]],
      [s.yildizlar.hizli, `Süre: ${s.basarili ? sn(s.sure) : "—"} (yıldız için en fazla ${g!.yildizSuresi} sn${coklu ? ", 1. labirentte" : ""})`],
      [s.yildizlar.kisa, `Kod: ${s.satir} satır (yıldız için en fazla ${g!.satirSiniri})`]
    ];
    if (g!.meb) satirlar.push([s.basarili, `MEB puanı: ${s.basarili ? sn(s.puan) : `${s.puan} (ulaşılan satır ${s.enUzakSatir}/16)`}; düşük puan daha iyi`]);
    const kart = el("div", "l-sonuc sra-kart sra-belir" + (s.basarili ? " basarili" : ""), { role: "status" },
      yildizlar(s.yildiz),
      el("h2", "", {}, s.basarili ? (s.yildiz === 3 ? "Kusursuz!" : "Görev tamam!") : "Bir daha dene"),
      el("ul", "", {}, ...satirlar.map(([ok, m]) => el("li", ok ? "ok" : "", {}, ikon(ok ? "tamam" : "uyari"), m))));
    const eylem = el("div", "l-eylem", {});
    if (s.basarili && sonraki) eylem.append(dugme({ metin: "Sonraki görev", ikon: "ok-sag", ikonSonda: true, href: `#labirent/${sonraki.kimlik}` }));
    const tekrar = dugme({ metin: s.basarili ? "Daha iyisini yap" : "Tekrar dene", tur: "ikincil" });
    tekrar.addEventListener("click", () => { kart.remove(); bastanB.click(); editor.alan.focus(); });
    eylem.append(tekrar);
    kart.append(eylem);
    cikti.append(kart);
    kart.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
