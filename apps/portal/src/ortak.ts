/* Alt sayfaların ortak parçaları (giriş, Panellerim, rapor, "Nasıl kuruldu", "Yakında"): ana sayfadaki üst çubuğun kısa bandı
   ve alt bilgi. Görünüm tasarım sistemi v2'den. */
import { el } from "@sra/tasarim/v2";
import { uygulama } from "./uygulama";
import { stilEkle, ustCubuk } from "./ekranlar/ana-sayfa";

export function ustKisim(): HTMLElement {
  stilEkle();
  return el("header", "as-ust as-ust--kisa", {}, ustCubuk());
}

export function altBilgi(): HTMLElement {
  return el("footer", "as-alt p-alt", {}, el("div", "", {},
    el("span", "", {}, "© Sivas Robotik Akademi"),
    el("span", "p-alt__mod", {}, uygulama.mod === "bulut" ? "Hesaplar açık" : uygulama.mod === "deneme" ? "Deneme modu" : "Hesapsız mod · ilerleme bu cihazda")));
}
