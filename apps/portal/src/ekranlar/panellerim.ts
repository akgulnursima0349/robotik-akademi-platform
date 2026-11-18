/* Öğretmenin sınıfları, kurslara göre. Her sınıfın kursu buradan ayarlanır; panel bağlantısı o kursun kendi paneline gider.
   Birleşik panel ve öğrenme analitiği P4'te. */
import { el, ikon, rozet, uyari } from "@sra/tasarim";
import { hataMetni, KURS_KIMLIKLERI, KURSLAR, Ogretmen, panelYolu, type KursKimligi, type Sinif } from "@sra/bulut";
import { uygulama } from "../uygulama";
import { altBilgi, ustKisim } from "../ortak";

const RENK: Record<KursKimligi, string> = { ilkokul: "var(--sra-kurs-ilkokul)", junior: "var(--sra-kurs-junior)", ortaokul: "var(--sra-kurs-ortaokul)" };

export async function panellerim(root: HTMLElement): Promise<void> {
  const k = uygulama.kullanici;
  if (!(k instanceof Ogretmen) || !uygulama.oturum) { location.hash = "giris"; return; }
  const oturum = uygulama.oturum;
  const govde = el("div", "p-panel__govde", { "aria-live": "polite" }, el("p", "p-yukleniyor", {}, "Sınıflar yükleniyor…"));
  const ana = el("main", "p-panel sra-sarmal", { id: "ana" },
    el("div", "p-panel__bas sra-belir", {},
      el("div", "", {}, el("p", "p-kahraman__ust", {}, k.mudur ? "Kurum müdürü" : "Öğretmen"), el("h1", "", {}, `Merhaba, ${k.gorunenAd}`)),
      el("p", "", {}, "Sınıfların kurslarına göre aşağıda. Bir sınıfın kursunu değiştirirsen öğrencileri bir sonraki girişte yeni kursa gider.")),
    govde);
  root.replaceChildren(ustKisim(), ana, altBilgi());

  let siniflar: Sinif[];
  try { siniflar = await oturum.siniflarim(); }
  catch (e) { govde.replaceChildren(uyari(hataMetni(e), "hata")); return; }

  const ciz = () => {
    govde.replaceChildren();
    if (!siniflar.length) {
      govde.append(uyari("Henüz sınıfın yok. Sınıfı kursun kendi panelinden açabilirsin; açılan sınıf burada görünür.", "bilgi"));
    }
    for (const kurs of KURS_KIMLIKLERI) {
      const liste = siniflar.filter((s) => s.kurs === kurs);
      const bolum = el("section", "p-kursgrup sra-kart", { "data-kurs": kurs });
      bolum.style.setProperty("--renk", RENK[kurs]);
      const yol = panelYolu(kurs);
      bolum.append(el("header", "p-kursgrup__bas", {},
        el("div", "", {}, el("span", "sra-kurs__etiket", {}, KURSLAR[kurs].siniflar), el("h2", "", {}, KURSLAR[kurs].ad)),
        yol ? el("a", "sra-dugme sra-dugme--ikincil sra-dugme--kucuk", { href: yol }, ikon("panel"), el("span", "", {}, "Kurs paneli")) : rozet("Yakında", "koyu")));
      if (!liste.length) bolum.append(el("p", "p-bos", {}, "Bu kursta sınıfın yok."));
      else {
        const tablo = el("div", "p-siniflar", { role: "table", "aria-label": KURSLAR[kurs].ad + " sınıfları" },
          el("div", "p-sinif p-sinif--bas", { role: "row" }, ...["Sınıf", "Kod", "Öğrenci", "Kurs", ""].map((t) => el("span", "", { role: "columnheader" }, t))));
        for (const s of liste) tablo.append(satir(s));
        bolum.append(tablo);
      }
      govde.append(bolum);
    }
  };

  const satir = (s: Sinif): HTMLElement => {
    const secim = el("select", "p-kurssec", { "aria-label": `${s.ad} sınıfının kursu`, "data-sinif": s.id });
    for (const kurs of KURS_KIMLIKLERI) {
      const o = el("option", "", { value: kurs }, KURSLAR[kurs].ad);
      if (kurs === s.kurs) o.selected = true;
      secim.append(o);
    }
    secim.addEventListener("change", async () => {
      const yeni = secim.value as KursKimligi;
      secim.disabled = true;
      try { await oturum.sinifKursuAyarla(s.id, yeni); s.kurs = yeni; ciz(); }
      catch (e) { secim.disabled = false; secim.value = s.kurs; secim.closest(".p-kursgrup")?.prepend(uyari(hataMetni(e), "hata")); }
    });
    const yol = panelYolu(s.kurs, s.id);
    return el("div", "p-sinif", { role: "row", "data-kod": s.kod },
      el("span", "p-sinif__ad", { role: "cell" }, s.ad, !s.benim ? el("small", "", {}, s.sahipAd) : null),
      el("code", "p-sinif__kod", { role: "cell" }, s.kod),
      el("span", "", { role: "cell" }, String(s.ogrenciSayisi)),
      el("span", "", { role: "cell" }, secim),
      el("span", "p-sinif__git", { role: "cell" }, yol ? el("a", "p-baglanti", { href: yol }, "Paneli aç", ikon("sag-ok")) : el("span", "p-sessiz", {}, "—")));
  };
  ciz();
}

export function yakinda(root: HTMLElement, kurs: string): void {
  const ad = (KURSLAR as Record<string, { ad: string }>)[kurs]?.ad ?? "Bu kurs";
  const ana = el("main", "p-giris sra-sarmal", { id: "ana" },
    el("div", "p-giris__kutu sra-kart sra-belir p-yakinda", {},
      ikon("isilti", "p-yakinda__ikon"),
      el("h1", "", {}, `${ad} hazırlanıyor`),
      el("p", "", {}, "Sınıfın bu kursa kayıtlı ama kurs henüz açılmadı. Öğretmenin açıldığında haber verecek."),
      el("a", "sra-dugme sra-dugme--ikincil", { href: "#" }, el("span", "", {}, "Ana sayfaya dön"))));
  root.replaceChildren(ustKisim(), ana, altBilgi());
}
