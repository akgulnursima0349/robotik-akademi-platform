/* Blok Atölyesi: # (dünyalar), #b/<bölüm> */
import "@sra/tasarim";
import "./blok.css";
import { bolumEkrani, harita } from "./ekranlar";
import { uygulama } from "./uygulama";

const root = document.getElementById("app")!;
function yonlendir() {
  document.body.removeAttribute("data-hazir");
  const h = location.hash.replace(/^#\/?/, "");
  if (h.startsWith("b/")) bolumEkrani(root, h.slice(2)); else harita(root);
  window.scrollTo({ top: 0 });
  document.body.dataset.hazir = "1";
}
addEventListener("hashchange", yonlendir);
uygulama.yenile().finally(yonlendir);
