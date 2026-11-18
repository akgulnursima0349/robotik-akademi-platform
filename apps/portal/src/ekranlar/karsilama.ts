/* Karşılama: logo, platformun tek cümlesi ve dört kurs kartı. */
import { dugme, el, ikon, kursKarti, LOGO, type KursKartiSecenek } from "@sra/tasarim";
import { KURSLAR, Ogrenci } from "@sra/bulut";
import { uygulama } from "../uygulama";
import { altBilgi, ustKisim } from "../ortak";
import { blokKapagi, labKapagi } from "../kapaklar";
import kapakJunior from "../assets/kapak-junior.webp";
import kapakOrtaokul from "../assets/kapak-ortaokul.webp";

const KARTLAR = (): KursKartiSecenek[] => [
  {
    kimlik: "ilkokul", etiket: KURSLAR.ilkokul.siniflar, baslik: KURSLAR.ilkokul.ad, renk: "var(--sra-kurs-ilkokul)",
    aciklama: "Sürükle-bırak bloklarla Bit'i ızgarada yürüt. Her yönerge sesli okunur; okumayı yeni sökenler de rahat eder.",
    bilgi: "3 dünya · 12 bölüm", bilgiIkon: "bloklar", gorsel: blokKapagi(), href: KURSLAR.ilkokul.yol!
  },
  {
    kimlik: "junior", etiket: KURSLAR.junior.siniflar, baslik: KURSLAR.junior.ad, renk: "var(--sra-kurs-junior)",
    aciklama: "Adım adım Python ve yapay zekâ: on dünya, başlangıç ve bitiş testi, sertifika ve oyun salonu.",
    bilgi: "10 dünya · 7 oyun", bilgiIkon: "yapboz", gorsel: kapakJunior, gorselAlt: "Merdiven çıkan robot Bit", href: KURSLAR.junior.yol!
  },
  {
    kimlik: "ortaokul", etiket: KURSLAR.ortaokul.siniflar, baslik: KURSLAR.ortaokul.ad, renk: "var(--sra-kurs-ortaokul)",
    aciklama: "Gerçek Python, makine öğrenmesi kütüphaneleri ve tarayıcıda çalışan defterlerle üç yapay zekâ laboratuvarı.",
    bilgi: "5 defter", bilgiIkon: "terminal", gorsel: kapakOrtaokul, gorselAlt: "Laptopta kod yazan iki öğrenci", href: KURSLAR.ortaokul.yol!
  },
  {
    kimlik: "lab", etiket: "Bütün kurslar", baslik: "Robotik Laboratuvarı", renk: "var(--sra-kurs-lab)",
    aciklama: "Kar Küreme görevleri, Sınıf Robot Ligi ve kendi kendine öğrenen robotlar. Hepsi tarayıcıda, kurulum yok.",
    bilgi: "6 görev · robot ligi", bilgiIkon: "robot", gorsel: labKapagi(), href: "lab/"
  }
];

const ADIMLAR: [string, string, Parameters<typeof ikon>[0]][] = [
  ["Öğretmen sınıf açar", "Her öğrenciye bir takma ad ve 4 haneli PIN verilir. E-posta istenmez.", "okul"],
  ["Öğrenci tek kez girer", "Sınıf kodu ve PIN ile girer; platform onu kendi kursuna götürür.", "giris"],
  ["İlerleme her yerde aynı", "Okuldaki bilgisayarda başladığını evdeki tablette sürdürür.", "isilti"]
];

export function karsilama(root: HTMLElement): void {
  const k = uygulama.kullanici;
  const ana = el("main", "p-ana", { id: "ana" });

  /* üst bölüm */
  const kahraman = el("section", "p-kahraman sra-sarmal sra-belir");
  kahraman.append(
    el("img", "p-kahraman__logo", { src: LOGO, alt: "Sivas Robotik Akademi logosu", width: "112", height: "112" }),
    el("p", "p-kahraman__ust", {}, "Sivas Robotik Akademi · Eğitim Platformu"),
    el("h1", "p-kahraman__baslik", {}, "Kodlama, yapay zekâ ve robotik ", el("span", "", {}, "tek çatı altında")),
    el("p", "p-kahraman__alt", {}, "İlkokuldan ortaokula, her yaşa kendi kursu. Çocuklar oynayarak öğrenir; öğretmenler kimin nerede zorlandığını görür.")
  );
  const eylem = el("div", "p-kahraman__eylem");
  if (k instanceof Ogrenci) eylem.append(dugme({ metin: `${k.gorunenAd}, kursuna devam et`, ikon: "ok-sag", ikonSonda: true, href: k.hedef(), id: "p-devam" }));
  else if (k) eylem.append(dugme({ metin: "Panellerim", ikon: "panel", href: "#panellerim" }));
  else if (uygulama.hesapli) eylem.append(dugme({ metin: "Giriş yap", ikon: "giris", href: "#giris" }));
  eylem.append(dugme({ metin: "Kursları gör", tur: "ikincil", href: "#kurslar", id: "p-kurslara" }));
  eylem.lastElementChild!.addEventListener("click", (e) => { e.preventDefault(); document.getElementById("kurslar")?.scrollIntoView({ behavior: "smooth" }); });
  kahraman.append(eylem);

  /* kurslar */
  const kurslar = el("section", "p-kurslar sra-sarmal", { id: "kurslar", "aria-labelledby": "kurslar-baslik" },
    el("div", "p-bolum-bas", {},
      el("h2", "", { id: "kurslar-baslik" }, "Kurslar"),
      el("p", "", {}, uygulama.hesapli ? "Öğrenciler giriş yapınca kendi kurslarına gider. Karta tıklayarak kursa doğrudan da girebilirsin." : "Karta tıklayarak kursa gir. Bu kurulum hesapsız çalışıyor; ilerleme bu cihazda saklanır.")));
  const izgara = el("div", "p-kurs-izgara");
  KARTLAR().forEach((s, i) => { const kart = kursKarti(s); kart.classList.add("sra-belir"); kart.style.animationDelay = 80 + i * 60 + "ms"; izgara.append(kart); });
  kurslar.append(izgara);

  /* nasıl çalışır */
  const nasil = el("section", "p-nasil sra-sarmal", { "aria-labelledby": "nasil-baslik" },
    el("div", "p-bolum-bas", {}, el("h2", "", { id: "nasil-baslik" }, "Nasıl çalışır?")));
  const liste = el("ol", "p-adimlar");
  ADIMLAR.forEach(([b, a, i], n) => liste.append(el("li", "p-adim sra-kart", {},
    el("span", "p-adim__no", {}, String(n + 1)), ikon(i, "p-adim__ikon"), el("h3", "", {}, b), el("p", "", {}, a))));
  nasil.append(liste);

  const muhendislik = el("section", "p-nasil-bag sra-sarmal", {},
    el("a", "p-nasil-kart sra-kart", { href: "#nasil", id: "p-nasil" }, ikon("kod", "p-adim__ikon"),
      el("span", "", {}, el("b", "", {}, "Nasıl kuruldu?"), el("small", "", {}, "Mimari, testler, çocuk verisi ilkeleri ve internetsiz çalışma")), ikon("ok-sag")));
  ana.append(kahraman, kurslar, nasil, muhendislik);
  root.replaceChildren(ustKisim(), ana, altBilgi());
}
