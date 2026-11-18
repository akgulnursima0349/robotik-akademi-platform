/* Tasarım sisteminin bütün parçaları tek sayfada: gözden geçirme ve yeni uygulamalara örnek. */
import { alan, dugme, el, ikon, kursKarti, rozet, ustBar, uyari } from "@sra/tasarim";
import { IKONLAR, type IkonAdi } from "@sra/tasarim";
import "./portal.css";
import { blokKapagi } from "./kapaklar";
import kapakJunior from "./assets/kapak-junior.webp";

const bolum = (baslik: string, ...icerik: Node[]) => el("section", "o-bolum sra-kart", {}, el("h2", "", {}, baslik), ...icerik);
const RENKLER = ["zemin", "yuzey", "murekkep", "murekkep-2", "cizgi", "vurgu", "vurgu-2", "basari", "hata", "bilgi", "kurs-ilkokul", "kurs-junior", "kurs-ortaokul", "kurs-lab"];

const app = document.getElementById("app")!;
const sayfa = el("main", "o-sayfa sra-sarmal", {},
  el("div", "", {}, el("p", "p-kahraman__ust", {}, "Tasarım sistemi"), el("h1", "", {}, "@sra/tasarim · örnekler")),
  bolum("Renkler", el("div", "o-renkler", {}, ...RENKLER.map((r) => { const d = el("div", "o-renk", {}, el("i"), el("span", "", {}, "--sra-" + r)); d.style.setProperty("--r", `var(--sra-${r})`); return d; }))),
  bolum("Yazı", el("div", "o-yazilar", {},
    el("p", "", { style: "font-size:var(--sra-yazi-xxl);font-weight:700;letter-spacing:-.02em" }, "Başlık · Lexend 700"),
    el("p", "", { style: "font-size:var(--sra-yazi-xl);font-weight:700" }, "Bölüm başlığı"),
    el("p", "", { style: "font-size:var(--sra-yazi-l)" }, "Giriş paragrafı, 19 piksel."),
    el("p", "", {}, "Gövde metni, 16 piksel. Çocuklar ve öğretmenler için okunaklı."),
    el("p", "", { style: "font-family:var(--sra-yazi-kod)" }, "print(\"Merhaba\")  # JetBrains Mono"))),
  bolum("Düğmeler", el("div", "o-sira", {},
    dugme({ metin: "Ana düğme", ikon: "giris" }), dugme({ metin: "İkincil", tur: "ikincil" }), dugme({ metin: "Hayalet", tur: "hayalet", ikon: "cikis" }),
    dugme({ metin: "Küçük", kucuk: true }), dugme({ metin: "Devam", ikon: "ok-sag", ikonSonda: true }),
    (() => { const d = dugme({ metin: "Kapalı" }); (d as HTMLButtonElement).disabled = true; return d; })())),
  bolum("Rozetler", el("div", "o-sira", {}, rozet("Düz"), rozet("Yakında", "koyu"), rozet("Junior", "renkli", "var(--sra-kurs-junior)"), rozet("Lab", "renkli", "var(--sra-kurs-lab)"))),
  bolum("Uyarılar", uyari("Sınıf kodu, takma ad ya da PIN hatalı.", "hata"), uyari("Kaydedildi.", "basari"), uyari("Bu kurulum hesapsız çalışıyor.", "bilgi")),
  bolum("Form alanları", el("div", "p-form", { style: "max-width:420px" },
    alan({ etiket: "Sınıf kodu", id: "o-kod", tur: "kod", ozellik: { value: "JNR123" } }),
    alan({ etiket: "Takma ad", id: "o-ad" }),
    alan({ etiket: "PIN", id: "o-pin", tip: "password", tur: "pin", ipucu: "4 rakam" }))),
  bolum("Kurs kartları", el("div", "p-kurs-izgara", { style: "grid-template-columns:repeat(auto-fill,minmax(260px,1fr))" },
    kursKarti({ kimlik: "a", etiket: "4–6. sınıf", baslik: "Açık kurs", aciklama: "Görselli, tıklanabilir kart.", bilgi: "10 dünya", bilgiIkon: "yapboz", renk: "var(--sra-kurs-junior)", gorsel: kapakJunior, href: "#" }),
    kursKarti({ kimlik: "b", etiket: "1–3. sınıf", baslik: "Yakında olan kurs", aciklama: "SVG kapak, tıklanamaz.", bilgi: "Hazırlanıyor", bilgiIkon: "bloklar", renk: "var(--sra-kurs-ilkokul)", gorsel: blokKapagi(), yakinda: true }))),
  bolum("İkonlar", el("div", "o-sira", {}, ...(Object.keys(IKONLAR) as IkonAdi[]).map((a) => el("span", "sra-rozet", { title: a }, ikon(a), a))))
);
app.replaceChildren(ustBar([], "./"), sayfa);
