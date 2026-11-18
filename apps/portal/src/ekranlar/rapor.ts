/* Sınıf raporu: özet, kursun etkisi, kazanım grafiği, kazanım ısı haritası, en zor bölümler, destek listesi.
   Bütün hesaplar @sra/analitik'te (testli); bu dosya yalnızca gösterir. */
import { dugme, el, ikon, uyari } from "@sra/tasarim";
import { hataMetni, KURSLAR, Ogretmen, type RaporSatiri } from "@sra/bulut";
import { csv, destekGerekenler, DURUM_ACIKLAMA, enZorBolumler, isiHaritasi, KAZANIMLAR, kazanimOzeti, kursEtkisi, type HucreDurumu, type RaporOgrenci } from "@sra/analitik";
import { uygulama } from "../uygulama";
import { altBilgi, ustKisim } from "../ortak";

const RENK_ON = "#4a78d6", RENK_SON = "#d7262e";
const yuzde = (x: number | null) => (x === null ? "—" : Math.round(x * 100) + "%");
const bir = (x: number) => (Math.round(x * 10) / 10).toLocaleString("tr-TR");

function donustur(r: RaporSatiri): RaporOgrenci {
  return { id: r.id, takmaAd: r.takma_ad, sonGiris: r.son_giris, junior: r.junior as RaporOgrenci["junior"], lab: r.lab as RaporOgrenci["lab"], blok: r.blok as RaporOgrenci["blok"] };
}

/** Grafiklerin ortak ipucu kutusu (fareyle üzerine gelince ve klavyeyle odaklanınca) */
function ipucu(kap: HTMLElement) {
  const kutu = el("div", "r-ipucu", { role: "tooltip", hidden: "" });
  kap.append(kutu);
  const goster = (hedef: Element, x: number, y: number) => {
    const m = (hedef as HTMLElement | SVGElement).dataset.ipucu; if (!m) return;
    kutu.innerHTML = m; kutu.hidden = false;
    const r = kap.getBoundingClientRect();
    kutu.style.left = Math.min(r.width - 220, Math.max(0, x - r.left + 14)) + "px";
    kutu.style.top = y - r.top + 14 + "px";
  };
  kap.addEventListener("pointermove", (e) => { const h = (e.target as Element).closest("[data-ipucu]"); if (h) goster(h, e.clientX, e.clientY); else kutu.hidden = true; });
  kap.addEventListener("pointerleave", () => (kutu.hidden = true));
  kap.addEventListener("focusin", (e) => { const h = (e.target as Element).closest("[data-ipucu]"); if (h) { const b = h.getBoundingClientRect(); goster(h, b.right, b.top); } });
  kap.addEventListener("focusout", () => (kutu.hidden = true));
}

/** Yatay gruplanmış çubuklar (HTML): telefonda da okunur; her çubukta ipucu, klavyeyle odaklanabilir */
function kazanimGrafigi(satirlar: ReturnType<typeof kazanimOzeti>): HTMLElement {
  const cubuk = (v: number | null, sinif: string, ad: string, s: ReturnType<typeof kazanimOzeti>[number], n: number) =>
    v === null ? el("span", "r-cb-bos") : el("span", `r-cb ${sinif}`, { style: `width:${Math.max(1.5, v * 100)}%`, tabindex: "0", "data-ipucu": `<b>K${s.k} · ${s.ad}</b><br>${ad}: <b>${yuzde(v)}</b> doğru (${n} öğrenci)`, "aria-label": `${ad} ${yuzde(v)}` });
  const liste = el("div", "r-cubuklar", { role: "img", "aria-label": "Kazanım başına başlangıç ve bitiş testinde doğru oranı" },
    ...satirlar.map((s) => el("div", "r-cs", {},
      el("span", "r-cs__ad", {}, `K${s.k} · ${s.ad}`),
      el("span", "r-cs__cubuk", {}, cubuk(s.on, "on", "Başlangıç", s, s.onN), cubuk(s.son, "son", "Bitiş", s, s.sonN)),
      el("span", "r-cs__deger", {}, yuzde(s.son)))),
    el("div", "r-cs r-cs--eksen", { "aria-hidden": "true" }, el("span"), el("span", "r-cs__eksen", {}, ...["0%", "25%", "50%", "75%", "100%"].map((t) => el("i", "", {}, t))), el("span")));
  const kap = el("div", "r-grafik-kap", {}, liste);
  ipucu(kap);
  return kap;
}

export async function rapor(root: HTMLElement, sinifId: string) {
  const k = uygulama.kullanici;
  if (!(k instanceof Ogretmen) || !uygulama.oturum) { location.hash = "giris"; return; }
  const govde = el("div", "r-govde", { "aria-live": "polite" }, el("p", "p-yukleniyor", {}, "Rapor hazırlanıyor…"));
  const baslik = el("h1", "", {}, "Sınıf raporu");
  const ust = el("p", "p-kahraman__ust", {}, "Öğrenme analitiği");
  const eylem = el("div", "r-eylem no-print");
  const ana = el("main", "p-panel sra-sarmal r-sayfa", { id: "ana" },
    el("a", "l-geri r-geri no-print", { href: "#panellerim" }, "← Panellerim"),
    el("div", "p-panel__bas", {}, el("div", "r-bas", {}, el("div", "", {}, ust, baslik), eylem)), govde);
  root.replaceChildren(ustKisim(), ana, altBilgi());

  let satirlar: RaporSatiri[], sinifAd = "";
  try {
    const [r, s] = await Promise.all([uygulama.oturum.sinifRaporu(sinifId), uygulama.oturum.siniflarim()]);
    satirlar = r;
    const sinif = s.find((x) => x.id === sinifId);
    sinifAd = sinif ? `${sinif.ad} (${sinif.kod}) · ${KURSLAR[sinif.kurs].ad}` : "";
  } catch (e) { govde.replaceChildren(uyari(hataMetni(e), "hata")); return; }
  baslik.textContent = sinifAd ? `${sinifAd.split(" (")[0]} · Sınıf raporu` : "Sınıf raporu";
  ust.textContent = sinifAd || "Öğrenme analitiği";
  document.title = `${baslik.textContent} · Sivas Robotik Akademi`;

  const ogrenciler = satirlar.map(donustur);
  if (!ogrenciler.length) { govde.replaceChildren(uyari("Bu sınıfta henüz öğrenci yok.", "bilgi")); return; }

  /* dışa aktarma */
  const csvB = dugme({ metin: "CSV indir", tur: "ikincil", kucuk: true, ikon: "indir", id: "r-csv" });
  csvB.addEventListener("click", () => {
    const a = el("a", "", { href: URL.createObjectURL(new Blob([csv(ogrenciler)], { type: "text/csv;charset=utf-8" })), download: `${(sinifAd.split(" (")[0] || "sinif").replace(/\s+/g, "-")}-rapor.csv` });
    document.body.append(a); a.click(); a.remove();
  });
  const yazB = dugme({ metin: "Yazdır", tur: "ikincil", kucuk: true, ikon: "yazici", id: "r-yazdir" });
  yazB.addEventListener("click", () => window.print());
  eylem.append(csvB, yazB);

  /* özet */
  const simdi = Date.now();
  const aktif = ogrenciler.filter((o) => o.sonGiris && simdi - new Date(o.sonGiris).getTime() < 7 * 864e5).length;
  const etki = kursEtkisi(ogrenciler);
  const ikiTest = etki.n;
  const ozet = el("section", "r-ozet", { "aria-label": "Özet" },
    ...([
      ["Öğrenci", String(ogrenciler.length), "takma adla kayıtlı"],
      ["Son 7 gün", String(aktif), "öğrenci giriş yaptı"],
      ["İki testi bitiren", String(ikiTest), "Junior başlangıç ve bitiş"],
      ["Ortalama artış", etki.n ? (etki.fark >= 0 ? "+" : "") + bir(etki.fark) : "—", "12 soruda doğru sayısı"]
    ] as const).map(([a, d, alt]) => el("div", "r-kutu sra-kart", {}, el("span", "", {}, a), el("b", "", {}, d), el("small", "", {}, alt))));

  /* kursun etkisi */
  const etkiKart = el("section", "r-kart sra-kart r-etki", { "aria-labelledby": "r-etki-b" }, el("h2", "", { id: "r-etki-b" }, "Kursun etkisi"));
  if (!etki.n) etkiKart.append(el("p", "r-bos", {}, "Başlangıç ve bitiş testini birlikte çözen öğrenci yok."));
  else {
    const olcek = (v: number) => (v / 12) * 100 + "%";
    etkiKart.append(
      el("div", "r-dambil", { role: "img", "aria-label": `Başlangıç ortalaması ${bir(etki.onOrt)}, bitiş ortalaması ${bir(etki.sonOrt)} (12 üzerinden)` },
        el("div", "r-dambil__cizgi", { style: `left:${olcek(Math.min(etki.onOrt, etki.sonOrt))};right:${100 - (Math.max(etki.onOrt, etki.sonOrt) / 12) * 100}%` }),
        el("span", "r-dambil__nokta on", { style: `left:${olcek(etki.onOrt)}` }), el("span", "r-dambil__nokta son", { style: `left:${olcek(etki.sonOrt)}` }),
        el("span", "r-dambil__etiket on " + (etki.sonOrt >= etki.onOrt ? "solda" : "sagda"), { style: `left:${olcek(etki.onOrt)}` }, `Başlangıç ${bir(etki.onOrt)}`),
        el("span", "r-dambil__etiket son " + (etki.sonOrt >= etki.onOrt ? "sagda" : "solda"), { style: `left:${olcek(etki.sonOrt)}` }, `Bitiş ${bir(etki.sonOrt)}`)),
      el("div", "r-olcek", { "aria-hidden": "true" }, ...[0, 3, 6, 9, 12].map((n) => el("span", "", {}, String(n)))),
      el("p", "", {}, `${etki.n} öğrencinin 12 soruluk testte doğru sayısı ortalama `, el("b", "", {}, `${bir(etki.onOrt)} → ${bir(etki.sonOrt)}`),
        etki.dz !== null ? ` oldu. Etki büyüklüğü (eşleştirilmiş Cohen d) ` : " oldu.", etki.dz !== null ? el("b", "", {}, `${bir(etki.dz)}: ${etki.yorum}`) : "", etki.dz !== null ? "." : ""),
      etki.azVeri ? uyari("Öğrenci sayısı 5'in altında; sonucu dikkatle yorumlayın.", "bilgi") : el("span"));
  }

  /* kazanım grafiği */
  const ozetSatir = kazanimOzeti(ogrenciler);
  const tablo = el("table", "r-tablo", {}, el("thead", "", {}, el("tr", "", {}, ...["Kazanım", "Başlangıç", "Bitiş"].map((t) => el("th", "", { scope: "col" }, t)))),
    el("tbody", "", {}, ...ozetSatir.map((s) => el("tr", "", {}, el("td", "", {}, `K${s.k} · ${s.ad}`), el("td", "", {}, yuzde(s.on)), el("td", "", {}, yuzde(s.son))))));
  const kazanimKart = el("section", "r-kart sra-kart", { "aria-labelledby": "r-kaz-b" },
    el("div", "r-kart-bas", {}, el("h2", "", { id: "r-kaz-b" }, "Kazanımlar: doğru oranı"),
      el("div", "r-lejant", {}, el("span", "", {}, el("i", "", { style: `background:${RENK_ON}` }), "Başlangıç"), el("span", "", {}, el("i", "", { style: `background:${RENK_SON}` }), "Bitiş"))),
    kazanimGrafigi(ozetSatir),
    el("details", "r-tablo-gor", {}, el("summary", "", {}, "Tablo olarak gör"), tablo));

  /* ısı haritası */
  const harita = isiHaritasi(ogrenciler);
  const DURUMLAR: HucreDurumu[] = ["ogrendi", "biliyordu", "zorlaniyor", "geriledi", "yalniz_on", "yok"];
  const isiTablo = el("table", "r-isi", { "aria-label": "Kazanım ısı haritası" },
    el("thead", "", {}, el("tr", "", {}, el("th", "", { scope: "col" }, "Öğrenci"), ...KAZANIMLAR.map((kz) => el("th", "", { scope: "col", title: kz.kisa, "data-ipucu": `<b>K${kz.k}</b> · ${kz.kisa}`, tabindex: "0" }, `K${kz.k}`)))),
    el("tbody", "", {}, ...harita.map((h) => el("tr", "", {}, el("th", "", { scope: "row" }, h.ogrenci.takmaAd),
      ...h.hucreler.map((d, i) => el("td", `r-d-${d}`, { "data-ipucu": `<b>${h.ogrenci.takmaAd}</b> · K${KAZANIMLAR[i].k} ${KAZANIMLAR[i].kisa}<br>${DURUM_ACIKLAMA[d].ad}`, "aria-label": `K${KAZANIMLAR[i].k}: ${DURUM_ACIKLAMA[d].ad}` }, DURUM_ACIKLAMA[d].simge))))));
  const isiKap = el("div", "r-isi-kap", {}, isiTablo);
  ipucu(isiKap);
  const isiKart = el("section", "r-kart sra-kart", { "aria-labelledby": "r-isi-b" },
    el("h2", "", { id: "r-isi-b" }, "Kazanım ısı haritası (Junior testleri)"),
    el("div", "r-lejant r-lejant--isi", {}, ...DURUMLAR.filter((d) => d !== "yok").map((d) => el("span", "", {}, el("i", `r-d-${d}`, {}, DURUM_ACIKLAMA[d].simge), DURUM_ACIKLAMA[d].ad))),
    isiKap);

  /* zor bölümler */
  const zor = enZorBolumler(ogrenciler);
  const enBuyuk = Math.max(1, ...zor.map((z) => z.zorluk));
  const zorKart = el("section", "r-kart sra-kart", { "aria-labelledby": "r-zor-b" }, el("h2", "", { id: "r-zor-b" }, "En zor bölümler (Blok ve Lab)"),
    zor.length ? el("ol", "r-zor", {}, ...zor.map((z) => el("li", "", {},
      el("div", "", {}, el("b", "", {}, z.ad), el("small", "", {}, `${z.deneyen} öğrenci denedi · ortalama ${bir(z.ortDeneme)} deneme · %${Math.round(z.bitirmeOrani * 100)} bitirdi`)),
      el("span", "r-zor__cubuk", { "aria-hidden": "true" }, el("i", "", { style: `width:${(z.zorluk / enBuyuk) * 100}%` })))))
      : el("p", "r-bos", {}, "Henüz Blok ya da Lab denemesi yok."));

  /* destek */
  const destek = destekGerekenler(ogrenciler);
  const destekKart = el("section", "r-kart sra-kart", { "aria-labelledby": "r-destek-b" }, el("h2", "", { id: "r-destek-b" }, "Bir göz atın"),
    destek.length ? el("ul", "r-destek", {}, ...destek.map((d) => el("li", "", {}, ikon("bilgi"), el("div", "", {}, el("b", "", {}, d.ogrenci.takmaAd), el("small", "", {}, d.gerekceler.join(" · "))))))
      : el("p", "r-bos", {}, "Herkes yolunda görünüyor."));

  govde.replaceChildren(ozet, el("div", "r-iki", {}, etkiKart, destekKart), kazanimKart, isiKart, zorKart);
  document.body.dataset.hazir = "1";
}
