/* Portal girişi: hash yönlendirme. #giris, #panellerim, #yakinda/<kurs>, geri kalan her şey karşılama. */
import "@sra/tasarim";
import "./portal.css";
import { uygulama } from "./uygulama";
import { anaSayfa } from "./ekranlar/ana-sayfa";
import { giris } from "./ekranlar/giris";
import { panellerim, yakinda } from "./ekranlar/panellerim";
import { rapor } from "./ekranlar/rapor";
import { nasil } from "./ekranlar/nasil";

const root = document.getElementById("app")!;
let ilk = true;

async function yonlendir(): Promise<void> {
  const h = location.hash.replace(/^#\/?/, "");
  if ((h === "kurslar" || h === "atolyeler") && !ilk && document.getElementById("atolyeler")) { document.getElementById("atolyeler")!.scrollIntoView({ behavior: "smooth" }); return; } // sayfa içi bağlantı
  ilk = false;
  if (h === "giris") giris(root);
  else if (h === "panellerim") await panellerim(root);
  else if (h.startsWith("yakinda/")) yakinda(root, h.slice(8));
  else if (h === "nasil") nasil(root);
  else if (h.startsWith("atolye/")) { const a = await import("./ekranlar/atolye-sayfasi"); if (a.atolyeVarMi(h.slice(7))) a.atolyeSayfasi(root, h.slice(7)); else anaSayfa(root); }
  else if (h === "vitrin/tasarim") { const { tasarimVitrini } = await import("./ekranlar/tasarim-vitrini"); tasarimVitrini(root); }
  else if (h.startsWith("rapor/")) await rapor(root, decodeURIComponent(h.slice(6)));
  else anaSayfa(root);
  if (h === "atolyeler" || h === "kurslar") document.getElementById("atolyeler")?.scrollIntoView();
  if (h !== "kurslar" && h !== "atolyeler") window.scrollTo({ top: 0 });
  if (!h.startsWith("rapor/") && !h.startsWith("atolye/") && h !== "vitrin/tasarim") document.title = h === "giris" ? "Giriş · Sivas Robotik Akademi" : h === "panellerim" ? "Panellerim · Sivas Robotik Akademi" : h === "nasil" ? "Nasıl kuruldu? · Sivas Robotik Akademi" : "Sivas Robotik Akademi · Eğitim Platformu";
}

addEventListener("hashchange", () => { void yonlendir(); });
uygulama.yenile().finally(() => {
  void yonlendir().then(() => {
    if (location.hash === "#kurslar" || location.hash === "#atolyeler") document.getElementById("atolyeler")?.scrollIntoView();
    document.body.dataset.hazir = "1";
  });
});
