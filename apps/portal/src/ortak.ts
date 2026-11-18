/* Ekranların ortak parçaları: üst bar (oturuma göre düğmeler) ve alt bilgi. */
import { dugme, el, ustBar } from "@sra/tasarim";
import { Ogrenci } from "@sra/bulut";
import { uygulama } from "./uygulama";

export function ustKisim(): HTMLElement {
  const sag: Node[] = [];
  const k = uygulama.kullanici;
  if (uygulama.hesapli) {
    if (k) {
      sag.push(el("span", "p-kim", {}, k.gorunenAd));
      sag.push(dugme({ metin: k instanceof Ogrenci ? "Kursuma git" : "Panellerim", tur: "ikincil", kucuk: true, href: k instanceof Ogrenci ? k.hedef() : "#panellerim" }));
      const c = dugme({ metin: "Çıkış", tur: "hayalet", kucuk: true, ikon: "cikis", id: "p-cikis" });
      c.addEventListener("click", async () => { await uygulama.cikis(); location.hash = ""; dispatchEvent(new HashChangeEvent("hashchange")); });
      sag.push(c);
    } else {
      sag.push(dugme({ metin: "Giriş yap", tur: "ana", kucuk: true, ikon: "giris", href: "#giris", id: "p-giris" }));
    }
  }
  return ustBar(sag, "#");
}

export function altBilgi(): HTMLElement {
  const ic = el("div", "p-alt__ic sra-sarmal", {},
    el("span", "", {}, "© Sivas Robotik Akademi"),
    el("span", "p-alt__mod", {}, uygulama.mod === "bulut" ? "Hesaplar açık" : uygulama.mod === "deneme" ? "Deneme modu" : "Hesapsız mod · ilerleme bu cihazda"));
  return el("footer", "p-alt", {}, ic);
}
