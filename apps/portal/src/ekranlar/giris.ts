/* Tek giriş: öğrenci (sınıf kodu + takma ad + PIN) ya da öğretmen (e-posta + şifre).
   Öğrenci girişten sonra doğrudan kendi kursuna gider; öğretmen Panellerim'e. */
import { alan, dugme, el, ikon, LOGO, uyari, type IkonAdi } from "@sra/tasarim";
import { DENEME_HESAPLARI, hataMetni, TamamlanmamisHesap } from "@sra/bulut";
import { uygulama } from "../uygulama";
import { altBilgi, ustKisim } from "../ortak";

const SON_SINIF = "sra-son-sinif";
const oku = () => { try { return localStorage.getItem(SON_SINIF) ?? ""; } catch { return ""; } };
const yaz = (v: string) => { try { localStorage.setItem(SON_SINIF, v); } catch { /* depolama kapalı */ } };

export function giris(root: HTMLElement): void {
  const kutu = el("div", "p-giris__kutu sra-kart sra-belir");
  const ana = el("main", "p-giris sra-sarmal", { id: "ana" },
    el("div", "p-giris__ust", {},
      el("img", "", { src: LOGO, alt: "", width: "72", height: "72" }),
      el("h1", "", {}, "Giriş yap"),
      el("p", "", {}, "Sivas Robotik Akademi Eğitim Platformu")),
    kutu);
  root.replaceChildren(ustKisim(), ana, altBilgi());

  if (!uygulama.oturum) {
    kutu.append(uyari("Bu kurulum hesapsız çalışıyor. Kurslara ana sayfadaki kartlardan doğrudan girebilirsin.", "bilgi"),
      el("div", "p-form__eylem", {}, dugme({ metin: "Ana sayfaya dön", tur: "ikincil", href: "#" })));
    return;
  }
  const oturum = uygulama.oturum;

  const ciz = (baslik: string, aciklama: string, ...icerik: Node[]) => {
    kutu.replaceChildren(el("div", "p-giris__bas", {}, el("h2", "", {}, baslik), el("p", "", {}, aciklama)), ...icerik);
    kutu.classList.remove("sra-belir"); void kutu.offsetWidth; kutu.classList.add("sra-belir");
  };
  const mesaj = (form: HTMLElement, m: string, tur: "hata" | "basari" = "hata") => {
    form.querySelector(".sra-uyari")?.remove();
    form.prepend(uyari(m, tur));
  };
  const mesgul = (form: HTMLFormElement, b: boolean, metin: string) => {
    const d = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    d.disabled = b; d.querySelector(".sra-dugme__yazi")!.textContent = metin;
  };
  const geri = (f: () => void) => { const d = dugme({ metin: "Geri", tur: "hayalet" }); d.addEventListener("click", f); return d; };
  const secimKarti = (id: string, ik: IkonAdi, b: string, a: string, f: () => void) => {
    const d = el("button", "p-secim", { type: "button", id }, ikon(ik, "p-secim__ikon"), el("span", "", {}, el("b", "", {}, b), el("small", "", {}, a)), ikon("sag-ok", "p-secim__ok"));
    d.addEventListener("click", f);
    return d;
  };

  function secim(): void {
    const s = el("div", "p-secimler", {},
      secimKarti("g-ogrenci", "canta", "Öğrenciyim", "Sınıf kodu ve PIN ile", ogrenci),
      secimKarti("g-ogretmen", "kep", "Öğretmenim", "E-posta ve şifre ile", () => ogretmen()));
    const parca: Node[] = [s];
    if (uygulama.mod === "deneme") {
      const o = DENEME_HESAPLARI.ogrenciler;
      parca.push(el("p", "p-deneme", {}, el("b", "", {}, "Deneme modu · "),
        `Öğrenci: ${o.map((x) => `${x.kod} / ${x.ad} / ${x.pin}`).join(" · ")} · Öğretmen: ${DENEME_HESAPLARI.ogretmen.eposta}, müdür: ${DENEME_HESAPLARI.mudur.eposta} (şifre ${DENEME_HESAPLARI.ogretmen.sifre})`));
    }
    ciz("Sen kimsin?", "Öğrenciler kendi kursuna, öğretmenler sınıflarına gider.", ...parca);
  }

  function ogrenci(): void {
    const f = el("form", "p-form", { novalidate: "" },
      alan({ etiket: "Sınıf kodu", id: "g-kod", tur: "kod", ozellik: { maxlength: "8", autocapitalize: "characters", spellcheck: "false", required: "", value: oku() } }),
      alan({ etiket: "Takma adın", id: "g-ad", ozellik: { maxlength: "30", spellcheck: "false", required: "" } }),
      alan({ etiket: "PIN", id: "g-pin", tip: "password", tur: "pin", ipucu: "Öğretmeninin verdiği 4 rakam", ozellik: { inputmode: "numeric", pattern: "[0-9]*", maxlength: "4", required: "" } }),
      el("div", "p-form__eylem", {}, dugme({ metin: "Giriş yap", tip: "submit", ikon: "ok-sag", ikonSonda: true }), geri(secim)));
    ciz("Öğrenci girişi", "Öğretmeninin verdiği sınıf kodunu ve PIN'i yaz.", f);
    f.querySelector<HTMLInputElement>(oku() ? "#g-ad" : "#g-kod")!.focus({ preventScroll: true });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const kod = f.querySelector<HTMLInputElement>("#g-kod")!.value.trim().toUpperCase();
      const ad = f.querySelector<HTMLInputElement>("#g-ad")!.value.trim();
      const pinG = f.querySelector<HTMLInputElement>("#g-pin")!;
      if (!kod || !ad) return mesaj(f, "Sınıf kodunu ve takma adını yaz.");
      if (!/^\d{4}$/.test(pinG.value.trim())) return mesaj(f, "PIN 4 rakamdan oluşur.");
      mesgul(f, true, "Giriş yapılıyor…");
      try {
        const k = await oturum.ogrenciGiris(kod, ad, pinG.value.trim());
        yaz(kod); uygulama.kullanici = k;
        uygulama.git(k.hedef());
      } catch (err) {
        mesaj(f, hataMetni(err)); mesgul(f, false, "Giriş yap"); pinG.value = ""; pinG.focus();
      }
    });
  }

  function ogretmen(not?: string): void {
    const f = el("form", "p-form", { novalidate: "" },
      alan({ etiket: "E-posta", id: "g-eposta", tip: "email", ozellik: { autocomplete: "username", required: "" } }),
      alan({ etiket: "Şifre", id: "g-sifre", tip: "password", ozellik: { autocomplete: "current-password", required: "" } }),
      el("div", "p-form__eylem", {}, dugme({ metin: "Giriş yap", tip: "submit", ikon: "ok-sag", ikonSonda: true }), geri(secim)));
    const kayit = el("button", "p-baglanti", { type: "button", id: "g-kayit" }, "Hesap aç");
    kayit.addEventListener("click", kaydol);
    f.append(el("p", "p-form__not", {}, "Hesabın yok mu? ", kayit));
    ciz("Öğretmen girişi", "E-posta adresin ve şifrenle gir.", f);
    if (not) mesaj(f, not, "basari");
    f.querySelector<HTMLInputElement>("#g-eposta")!.focus({ preventScroll: true });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      mesgul(f, true, "Giriş yapılıyor…");
      try {
        const k = await oturum.ogretmenGiris(f.querySelector<HTMLInputElement>("#g-eposta")!.value, f.querySelector<HTMLInputElement>("#g-sifre")!.value);
        if (k instanceof TamamlanmamisHesap) {
          if (k.pasif) { mesaj(f, hataMetni("pasif")); mesgul(f, false, "Giriş yap"); return; }
          return tamamla();
        }
        uygulama.kullanici = k; uygulama.git(k.hedef());
      } catch (err) { mesaj(f, hataMetni(err)); mesgul(f, false, "Giriş yap"); }
    });
  }

  function kaydol(): void {
    const f = el("form", "p-form", { novalidate: "" },
      alan({ etiket: "E-posta", id: "g-eposta", tip: "email", ozellik: { autocomplete: "username", required: "" } }),
      alan({ etiket: "Şifre", id: "g-sifre", tip: "password", ipucu: "En az 6 karakter", ozellik: { autocomplete: "new-password", minlength: "6", required: "" } }),
      el("div", "p-form__eylem", {}, dugme({ metin: "Hesap aç", tip: "submit", ikon: "ok-sag", ikonSonda: true }), geri(() => ogretmen())));
    ciz("Yeni öğretmen hesabı", "E-posta adresini yaz ve bir şifre belirle.", f);
    f.querySelector<HTMLInputElement>("#g-eposta")!.focus({ preventScroll: true });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      mesgul(f, true, "Hesap açılıyor…");
      try {
        const r = await oturum.ogretmenKaydol(f.querySelector<HTMLInputElement>("#g-eposta")!.value, f.querySelector<HTMLInputElement>("#g-sifre")!.value);
        if (r.onayGerekli) return ogretmen("E-postana bir doğrulama bağlantısı gönderildi. Bağlantıya tıkladıktan sonra buradan giriş yap.");
        tamamla();
      } catch (err) { mesaj(f, hataMetni(err)); mesgul(f, false, "Hesap aç"); }
    });
  }

  function tamamla(): void {
    const f = el("form", "p-form", { novalidate: "" },
      alan({ etiket: "Adın soyadın", id: "g-adsoyad", ozellik: { maxlength: "60", autocomplete: "name", required: "" } }),
      alan({ etiket: "Kurum kodu", id: "g-kurum", ipucu: "Kurum yöneticisinden alınır", ozellik: { spellcheck: "false", required: "" } }),
      el("div", "p-form__eylem", {}, dugme({ metin: "Tamamla", tip: "submit", ikon: "ok-sag", ikonSonda: true })));
    ciz("Son adım", "Adını ve kurumun verdiği kurum kodunu yaz.", f);
    f.querySelector<HTMLInputElement>("#g-adsoyad")!.focus({ preventScroll: true });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      mesgul(f, true, "Kaydediliyor…");
      try {
        const k = await oturum.ogretmenTamamla(f.querySelector<HTMLInputElement>("#g-adsoyad")!.value, f.querySelector<HTMLInputElement>("#g-kurum")!.value);
        uygulama.kullanici = k; uygulama.git(k.hedef());
      } catch (err) { mesaj(f, hataMetni(err)); mesgul(f, false, "Tamamla"); }
    });
  }

  /* e-posta onayından dönen ya da kaydını tamamlamamış öğretmen doğrudan son adıma */
  oturum.tamamlanmamisHesap().then((v) => (v ? tamamla() : secim())).catch(secim);
}
