/* Portal girişi: hash yönlendirme. #giris, #panellerim, #yakinda/<kurs>, geri kalan her şey karşılama. */
import "@sra/tasarim";
import "./portal.css";
import { uygulama } from "./uygulama";
import { karsilama } from "./ekranlar/karsilama";
import { giris } from "./ekranlar/giris";
import { panellerim, yakinda } from "./ekranlar/panellerim";

const root = document.getElementById("app")!;
let ilk = true;

async function yonlendir(): Promise<void> {
  const h = location.hash.replace(/^#\/?/, "");
  if (h === "kurslar" && !ilk) return; // sayfa içi bağlantı
  ilk = false;
  if (h === "giris") giris(root);
  else if (h === "panellerim") await panellerim(root);
  else if (h.startsWith("yakinda/")) yakinda(root, h.slice(8));
  else karsilama(root);
  if (h !== "kurslar") window.scrollTo({ top: 0 });
  document.title = h === "giris" ? "Giriş · Sivas Robotik Akademi" : h === "panellerim" ? "Panellerim · Sivas Robotik Akademi" : "Sivas Robotik Akademi · Eğitim Platformu";
}

addEventListener("hashchange", () => { void yonlendir(); });
uygulama.yenile().finally(() => {
  void yonlendir().then(() => {
    if (location.hash === "#kurslar") document.getElementById("kurslar")?.scrollIntoView();
    document.body.dataset.hazir = "1";
  });
});
