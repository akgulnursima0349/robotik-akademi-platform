/* Tasarım sistemi v2 vitrini: portal/#vitrin/tasarim
   Belirteçler (renk, kontrast, yazı ölçeği), her bileşen bütün durumlarıyla, dört seviye anahtarı ve bileşenlerden kurulmuş
   küçük bir örnek ana sayfa şeridi. */
import {
  adimGostergesi, atolyeKarti, bildirim, dugme, el, hap, kodCercevesi, kok, parcaliIlerleme, rozet, secici, sekmeler,
  SEVIYELER, seviyeGostergesi, xpHap, yildizlar, type AtolyeKimligi, type Seviye
} from "@sra/tasarim/v2";
import logo from "@sra/tasarim/logo.webp";

const STIL = `
.tv{min-height:100vh}
.tv-ust{background:var(--sra2-lavanta);border-radius:0 0 40px 40px;padding:20px clamp(16px,4vw,48px) 36px}
.tv-ust__bar{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.tv-marka{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;font:800 20px/1 var(--sra2-yazi-baslik)}
.tv-marka img{width:48px;height:48px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 0 var(--sra2-lavanta-taban)}
.tv-marka span span{color:var(--sra2-kirmizi)}
.tv-ust h1{font-size:var(--sra2-boy-8);margin:28px 0 8px}
.tv-ust h1 em{font-style:normal;color:var(--sra2-kirmizi)}
.tv-ust p{margin:0 0 20px;max-width:640px;color:var(--sra2-murekkep-2);font-weight:600;font-size:var(--sra2-boy-3)}
.tv-govde{padding:28px clamp(16px,4vw,48px) 64px;display:flex;flex-direction:column;gap:40px;max-width:1280px;margin:0 auto}
.tv-bolum>h2{font-size:var(--sra2-boy-5);margin:0 0 6px}
.tv-bolum>p{margin:0 0 16px;color:var(--sra2-murekkep-2);font-weight:600}
.tv-sira{display:flex;flex-wrap:wrap;gap:16px 14px;align-items:center}
.tv-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}
.tv-renk{background:#fff;border-radius:var(--sra2-kose-2);padding:10px;box-shadow:0 4px 0 var(--sra2-kart-taban);font-size:13px;font-weight:700}
.tv-renk i{display:block;height:56px;border-radius:12px;margin-bottom:8px;border:1px solid rgba(23,20,74,.08)}
.tv-renk code{font:500 12px var(--sra2-yazi-kod)}
.tv-renk small{display:block;color:var(--sra2-murekkep-2)}
.tv-olcek{display:flex;flex-direction:column;gap:6px}
.tv-olcek div{display:flex;align-items:baseline;gap:16px;border-bottom:2px dotted var(--sra2-kart-taban);padding-bottom:6px;overflow:hidden}
.tv-olcek code{font:500 12px var(--sra2-yazi-kod);color:var(--sra2-murekkep-2);width:64px;flex:none}
.tv-atolyeler{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}
.tv-ornek{background:var(--sra2-lavanta);border-radius:var(--sra2-kose-3);padding:20px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:20px;align-items:center}
@media (max-width:760px){.tv-ornek{grid-template-columns:1fr}}
.tv-ornek h3{font-size:var(--sra2-boy-6);margin:0 0 12px}
`;

const ATOLYELER: [AtolyeKimligi, string, string][] = [
  ["bilgisayar", "Bilgisayarla Tanışma", "Fare, klavye, ilk adım."], ["blok", "Kodla Oyna", "Bloklarla bulmaca."], ["python", "Python", "Kenshin'i kodla."],
  ["cpp", "C++", "Derslerdeki dil."], ["arduino", "Arduino", "LED, sensör, motor."], ["robotik", "Robotik", "Parça seç, kur."]
];
const RENKLER: [string, string][] = [
  ["krem", "zemin"], ["lavanta", "üst bant"], ["beyaz", "kart"], ["gece", "kod ve sahne"], ["murekkep-2", "ikincil yazı"], ["kirmizi", "ana eylem"],
  ["mor", "seçim, şimdiki adım"], ["yesil", "biten, başarı"], ["sari", "yıldız, seviye"], ["sari-acik", "ipucu, XP"], ["kart-taban", "basılabilir taban"], ["hata", "hata"]
];

export function tasarimVitrini(root: HTMLElement) {
  document.head.append(el("style", "", {}, STIL));
  const sayfa = kok(el("div", "tv"));

  const ust = el("header", "tv-ust", {},
    el("div", "tv-ust__bar", {},
      el("a", "tv-marka", { href: "#" }, el("img", "", { src: logo, alt: "" }), el("span", "", {}, "Sivas Robotik ", el("span", "", {}, "Akademi"))),
      el("span", "", { style: "margin-left:auto" }, seviyeGostergesi(7, "Mühendis", 0.64))),
    el("h1", "s2-baslik", {}, "Tasarım sistemi ", el("em", "", {}, "v2")),
    el("p", "", {}, "Platformun yeni ekranları yalnız bu parçalarla kurulur. Seviyeyi değiştir: renkler aynı kalır, okul öncesinde düğmeler ve yazılar büyür, lisede sadeleşir."),
    secici("Seviye", [["", "Varsayılan"], ...SEVIYELER] as [string, string][], "", (s) => { kok(sayfa, (s || undefined) as Seviye | undefined); }));
  ust.querySelector(".s2-secici")!.id = "tv-seviye";

  const bolum = (baslik: string, aciklama: string, ...icerik: Node[]) => el("section", "tv-bolum", { "aria-label": baslik }, el("h2", "s2-baslik", {}, baslik), el("p", "", {}, aciklama), ...icerik);
  const renkler = el("div", "tv-izgara", {}, ...RENKLER.map(([ad, ne]) => el("div", "tv-renk", {}, el("i", "", { style: `background:var(--sra2-${ad})` }), el("code", "", { "data-renk": ad }, ""), el("small", "", {}, ne), el("small", "", { "data-kontrast": ad }, ""))));
  const olcek = el("div", "tv-olcek", {}, ...[8, 7, 6, 5, 4, 3, 2, 1].map((n) => el("div", "", {}, el("code", "", {}, `boy-${n}`),
    el("span", n >= 5 ? "s2-baslik" : "", { style: `font-size:var(--sra2-boy-${n});${n < 5 ? "font-weight:700" : ""}` }, n >= 5 ? "Robotunu kur, kodla" : "Kenshin ringde tur atıyor: ğüşıöç İ"))));

  const kart = (...c: Node[]) => el("div", "s2-kart", {}, ...c);
  sayfa.append(ust, el("main", "tv-govde", { id: "ana" },
    bolum("Renkler", "Akademinin kırmızısı ana eylemde. Beyaz yazı yalnız kırmızı, mor, yeşil ve gece üstünde; sarının üstünde her zaman gece rengi.", renkler),
    bolum("Yazı", "Başlıklar Baloo 2, gövde Nunito, kod JetBrains Mono. Türkçe harflerin hepsi var.", olcek),
    bolum("Düğmeler", "Basılınca tabana iner. Klavye odağı mor halka. En az 44 px; okul öncesinde 56 px.",
      el("div", "tv-sira", {},
        dugme({ metin: "Çalıştır", tur: "ana", ikon: "oynat" }), dugme({ metin: "Adım adım" }), dugme({ metin: "İpucu", tur: "ipucu", ikon: "ampul", ek: "−5 XP" }),
        dugme({ metin: "Göreve geç", tur: "mor", ikon: "ileri", ikonSonda: true }), dugme({ metin: "Atla", tur: "sessiz" }),
        dugme({ metin: "Geri", ikon: "geri", yalnizIkon: true }), dugme({ metin: "Dinle", ikon: "ses", yalnizIkon: true, tur: "ana" })),
      el("div", "tv-sira", { style: "margin-top:16px" },
        dugme({ metin: "Küçük", kucuk: true }), dugme({ metin: "Küçük ana", kucuk: true, tur: "ana" }), dugme({ metin: "Kilitli", devreDisi: true, ikon: "kilit" }),
        dugme({ metin: "Kaydediliyor", yukleniyor: true }))),
    bolum("Atölye kartları", "Seçili atölye dolu kırmızı; henüz açılmamış atölye kilitli.",
      el("div", "tv-atolyeler", {}, ...ATOLYELER.map(([k, a, d], i) => atolyeKarti({ kimlik: k, ad: a, aciklama: d, href: "#vitrin/tasarim", secili: i === 2 })),
        atolyeKarti({ kimlik: "robotik", ad: "Yarışma Lab'ı", aciklama: "", href: "#", kilitli: true }))),
    bolum("Hap, rozet, seviye", "Durumu, ödülü ve ilerlemeyi gösterir.",
      el("div", "tv-sira", {}, hap("Devam ediyor"), hap("Yeni", "mor"), hap("Bitti", "yesil", "tamam"), hap("Öğretmen", "gece"), xpHap(30), seviyeGostergesi(3, "Çırak", 0.2)),
      el("div", "tv-sira", { style: "margin-top:16px" }, rozet("Tur Ustası", "yildiz"), rozet("İlk Kod", "terminal"), rozet("Sumo Şampiyonu", "robot", true))),
    bolum("İlerleme", "Ders sayısı kadar parça: biten yeşil, şimdiki çizgili mor. Küçükler için yıldız.",
      kart(parcaliIlerleme(6, 3, true, "Döngüler modülü"), el("div", "", { style: "height:16px" }), yildizlar(5, 3))),
    bolum("Seçiciler ve sekmeler", "Ok tuşlarıyla gezilir; Tab grubun içine bir kez girer.",
      el("div", "tv-sira", {}, secici("Örnek seviye", SEVIYELER, "ortaokul", () => {})),
      el("div", "", { style: "margin-top:16px" }, sekmeler("Ders görünümü", [
        { ad: "Kod", icerik: kodCercevesi("kenshin.py", "for tur in range(4):\n    ileri(0.6)\n    sola_don(0.35)\ndur()") },
        { ad: "Sahne", icerik: kart(el("p", "", { style: "margin:0;font-weight:700" }, "3D sahne burada.")) },
        { ad: "Notlar", icerik: kart(el("p", "", { style: "margin:0;font-weight:700" }, "Öğretmen notları burada.")) }]))),
    bolum("Adım göstergesi", "Her ders dört bölüm: Anlat, Dene, Görev, Gerçek robotta.", el("div", "tv-sira", {}, adimGostergesi(1))),
    bolum("Bildirimler", "Renkle birlikte her zaman ikon ve yazı. Hata şeridi ekran okuyucuya hemen söylenir.",
      el("div", "", { style: "display:flex;flex-direction:column;gap:12px" },
        bildirim("basari", "Süper!", "Dört yıldızın üçünü topladın.", dugme({ metin: "Göreve geç", tur: "mor", kucuk: true })),
        bildirim("ipucu", "İpucu", "Dönüş süresini biraz azalt."),
        bildirim("hata", "Olmadı.", "3. satırda parantez kapanmamış."),
        bildirim("bilgi", "Bilgi", "Bu ders gerçek Kenshin ile de yapılabilir."))),
    bolum("Örnek", "Aynı parçalarla kurulmuş küçük bir ana sayfa şeridi.",
      el("div", "tv-ornek", {},
        el("div", "", {}, el("h3", "s2-baslik", {}, "Robotunu kur, kodla, ", el("span", "", { style: "color:var(--sra2-kirmizi)" }, "kazan!")),
          el("div", "tv-sira", {}, dugme({ metin: "Oyna: Ders 3", tur: "ana", ikon: "oynat", ikonSonda: true }), dugme({ metin: "Sınıf koduyla katıl" }))),
        el("div", "s2-kart s2-kart--lavanta", { style: "display:flex;flex-direction:column;gap:10px" },
          el("div", "tv-sira", {}, hap("Devam ediyor"), el("span", "", { style: "margin-left:auto;font-weight:800;color:var(--sra2-murekkep-2)" }, "3 / 6")),
          el("strong", "s2-baslik", { style: "font-size:var(--sra2-boy-5)" }, "Python · Döngüler"),
          parcaliIlerleme(6, 3, false, "Python · Döngüler"))))));
  root.replaceChildren(sayfa);

  /* renk kodlarını gerçek değerden yaz (belirteç değişirse vitrin de değişir) */
  const cs = getComputedStyle(sayfa);
  const deger = (ad: string) => cs.getPropertyValue(`--sra2-${ad}`).trim().toUpperCase();
  for (const c of sayfa.querySelectorAll<HTMLElement>("[data-renk]")) c.textContent = deger(c.dataset.renk!);
  /* her rengin üstünde hangi yazı okunur: beyaz ya da gece mavisi, kontrastıyla */
  for (const c of sayfa.querySelectorAll<HTMLElement>("[data-kontrast]")) {
    const z = deger(c.dataset.kontrast!), b = kontrast(z, "#FFFFFF"), g = kontrast(z, deger("murekkep"));
    c.textContent = b >= g ? `beyaz yazı ${b.toFixed(1).replace(".", ",")}:1` : `gece yazı ${g.toFixed(1).replace(".", ",")}:1`;
  }
  document.title = "Tasarım sistemi v2 · Sivas Robotik Akademi";
}

/** WCAG 2.1 kontrast oranı (iki #RRGGBB renk) */
function kontrast(a: string, b: string): number {
  const p = (h: string) => { const [r, g, m] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * m; };
  const [x, y] = [p(a), p(b)].sort((u, v) => v - u);
  return (x + 0.05) / (y + 0.05);
}
