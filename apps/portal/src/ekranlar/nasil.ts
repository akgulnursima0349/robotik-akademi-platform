/* "Nasıl kuruldu?": platformun mühendislik tarafı. Sunumun son dakikası için. */
import { el, ikon, type IkonAdi } from "@sra/tasarim";
import { altBilgi, ustKisim } from "../ortak";

const sema = () => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 760 470"); s.setAttribute("class", "n-sema"); s.setAttribute("role", "img");
  s.setAttribute("aria-label", "Platform yapısı: tek giriş, dört uygulama, ortak paketler ve veritabanı");
  const kutu = (x: number, y: number, w: number, h: number, ad: string, alt: string, renk = "#cfd4de", vurgu = false) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${vurgu ? "#eef2fd" : "#fff"}" stroke="${renk}" stroke-width="${vurgu ? 2 : 1.25}"/>` +
    `<text x="${x + w / 2}" y="${y + (alt ? 26 : h / 2 + 5)}" text-anchor="middle" class="n-ad">${ad}</text>` +
    (alt ? `<text x="${x + w / 2}" y="${y + 44}" text-anchor="middle" class="n-alt">${alt}</text>` : "");
  const ok = (x: number, y1: number, y2: number) => `<path d="M${x} ${y1}V${y2 - 6}" stroke="#8a93a6" stroke-width="1.5" fill="none" marker-end="url(#n-ok)"/>`;
  s.innerHTML = `<defs><marker id="n-ok" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a93a6"/></marker></defs>
    ${kutu(20, 10, 720, 56, "Portal · tek giriş", "PIN öğrenciyi kendi kursuna götürür · öğretmen Panellerim ve sınıf raporu", "#d7262e")}
    ${[150, 300, 460, 620].map((x) => ok(x, 66, 104)).join("")}
    ${kutu(20, 104, 160, 64, "Blok Atölyesi", "1–3 · bloklar, ses", "#f0a020")}
    ${kutu(196, 104, 176, 64, "Python Atölyesi Junior", "4–6 · submodule", "#22a6a0")}
    ${kutu(388, 104, 160, 64, "Python Atölyesi", "ortaokul · submodule", "#d7262e")}
    ${kutu(564, 104, 176, 64, "Robotik Laboratuvarı", "Kar · Sumo · SiroLine · Labirent", "#3a62e0", true)}
    ${[100, 284, 468, 652].map((x) => ok(x, 168, 210)).join("")}
    <rect x="20" y="210" width="720" height="150" rx="14" fill="#f7f8fb" stroke="#e2e5ec"/>
    <text x="36" y="234" class="n-baslik">Ortak paketler (TypeScript)</text>
    ${kutu(36, 246, 128, 50, "tasarim", "renk, bileşen")}
    ${kutu(176, 246, 128, 50, "bulut", "Oturum (OOP)")}
    ${kutu(316, 246, 128, 50, "robot-motoru", "deterministik")}
    ${kutu(456, 246, 128, 50, "python", "Skulpt köprüsü")}
    ${kutu(596, 246, 128, 50, "analitik", "etki, ısı haritası")}
    <text x="380" y="330" text-anchor="middle" class="n-alt">SunucuBaglantisi arayüzü: gerçek Supabase ya da tarayıcı içi sahte sunucu (testler, internetsiz demo)</text>
    ${ok(380, 360, 398)}
    ${kutu(20, 398, 720, 56, "Supabase (PostgreSQL)", "satır düzeyinde güvenlik · her öğretmen yalnızca kendi sınıfını görür · öğrenciden yalnızca takma ad + PIN")}`;
  return s;
};

const KARTLAR: [IkonAdi, string, string][] = [
  ["kod", "Tek depo, paylaşılan paketler", "Portal, Lab ve Blok Atölyesi aynı tasarım sistemini, oturumu ve simülasyon motorunu paylaşır. Mevcut iki site bozulmadan alt depo olarak bağlanır."],
  ["kisiler", "Nesne yönelimli çekirdek", "Oturum, Öğrenci ve Öğretmen sınıfları; her kullanıcı türü nereye gideceğini kendisi bilir. Sunucu bir arayüzün arkasında, testte sahtesiyle değiştirilir."],
  ["robot", "Deterministik simülasyon", "Aynı kod her seferinde aynı sonucu verir. Lig maçları sunucu olmadan tekrar izlenir; SiroLine çizgi izleyenin sensör gürültüsü bile sabit tohumlu. Her görevin örnek çözümü otomatik test edilir."],
  ["terminal", "Tarayıcıda Python", "Çocuğun kodu bilgisayarında çalışır, sunucuya gitmez. Hatalar satır numarasıyla Türkçe anlatılır; bitmeyen döngü kendiliğinden durdurulur."],
  ["grafik", "Öğrenme analitiği", "Kazanım ısı haritası, başlangıç ve bitiş testi arasında eşleştirilmiş etki büyüklüğü, en zor bölümler ve nazik bir destek listesi."],
  ["tamam", "Otomatik testler", "Birim testleri (Vitest), gerçek PostgreSQL'de yetki senaryoları ve masaüstü, tablet, telefonda uçtan uca testler (Playwright). Her değişiklikte GitHub Actions çalıştırır."]
];
const ILKELER = [
  "Öğrenciden yalnızca takma ad ve 4 haneli PIN; e-posta, fotoğraf, ses yok.",
  "Her öğretmen yalnızca kendi sınıfını görür (veritabanında satır düzeyinde güvenlik).",
  "Öğrencinin yazdığı kod sunucuda çalıştırılmaz; yalnızca metin olarak saklanır.",
  "Reklam, izleme ya da üçüncü taraf analitik servisi yok.",
  "Gizli anahtar hiçbir zaman sitede ya da depoda bulunmaz; derleme betiği yanlış ayarı reddeder.",
  "Demo, gerçek öğrencilerin bulunduğu veritabanından ayrı bir projede çalışır."
];

export function nasil(root: HTMLElement) {
  const ana = el("main", "n-sayfa sra-sarmal", { id: "ana" },
    el("a", "l-geri", { href: "#" }, "← Ana sayfa"),
    el("div", "n-bas sra-belir", {}, el("p", "p-kahraman__ust", {}, "Mühendislik"), el("h1", "", {}, "Nasıl kuruldu?"),
      el("p", "", {}, "Platform, ilkokuldan ortaokula üç kursu, bir robot laboratuvarını ve öğretmen panelini tek adreste toplar. Her parçası test edilir; çocuk verisi en aza indirilir; internet olmadan da çalışır.")),
    el("section", "n-kart sra-kart", { "aria-labelledby": "n-yapi" }, el("h2", "", { id: "n-yapi" }, "Yapı"), el("p", "n-kaydir", {}, "Şemayı yana kaydırabilirsin →"), el("div", "n-sema-kap", { tabindex: "0", "aria-label": "Yapı şeması (yana kaydırılabilir)" }, sema())),
    el("section", "n-izgara", { "aria-label": "Teknik özellikler" }, ...KARTLAR.map(([i, b, a]) => el("article", "n-ozellik sra-kart", {}, ikon(i, "n-ozellik__ikon"), el("h3", "", {}, b), el("p", "", {}, a)))),
    el("div", "n-iki", {},
      el("section", "n-kart sra-kart", { "aria-labelledby": "n-kvkk" }, el("h2", "", { id: "n-kvkk" }, "Çocuk verisi ve güvenlik"),
        el("ul", "n-liste", {}, ...ILKELER.map((m) => el("li", "", {}, ikon("kilit"), m)))),
      el("section", "n-kart sra-kart", { "aria-labelledby": "n-cevrim" }, el("h2", "", { id: "n-cevrim" }, "İnternetsiz çalışma"),
        el("ul", "n-liste", {}, ...[
          "Yazı tipleri ve ikonlar sitenin içinde; dışarıdan yüklenmez.",
          "Simülasyonlar ve Python yorumlayıcısı tarayıcıda çalışır.",
          "Deneme modunda sahte sunucu tarayıcıda çalışır; tek giriş internetsiz de denenir.",
          "3D sahneler ilk saniyelerde kare hızını ölçer; kurs bilgisayarı yavaşsa gölge ve çözünürlük kendiliğinden düşer."
        ].map((m) => el("li", "", {}, ikon("tamam"), m))))));
  root.replaceChildren(ustKisim(), ana, altBilgi());
}
