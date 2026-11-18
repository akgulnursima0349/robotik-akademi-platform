/* Robotik Laboratuvarı: #, #kar, #kar/<görev>, #lig */
import "@sra/tasarim";
import "./lab.css";
import { uygulama } from "./uygulama";
import { ilerleme } from "./ilerleme";
import { IlerlemeEsitleyici, Ogrenci } from "@sra/bulut";
import { ana } from "./ekranlar/ana";
import { karGorev, karListe } from "./ekranlar/kar";
import { lig } from "./ekranlar/lig";

const root = document.getElementById("app")!;
async function yonlendir() {
  document.body.removeAttribute("data-hazir");
  const h = location.hash.replace(/^#\/?/, "");
  if (h === "kar") karListe(root);
  else if (h.startsWith("kar/")) await karGorev(root, h.slice(4));
  else if (h === "lig") await lig(root);
  else ana(root);
  window.scrollTo({ top: 0 });
  document.title = (h.startsWith("kar") ? "Kar Küreme" : h === "lig" ? "Sınıf Robot Ligi" : "Robotik Laboratuvarı") + " · Sivas Robotik Akademi";
  document.body.dataset.hazir = "1";
}
addEventListener("hashchange", () => void yonlendir());
uygulama.yenile().finally(async () => {
  if (uygulama.kullanici instanceof Ogrenci && uygulama.oturum) {
    const e = new IlerlemeEsitleyici(uygulama.oturum, "lab", ilerleme);
    ilerleme.dinle(() => e.degisti());
    await e.baslat();
  }
  void yonlendir();
});
