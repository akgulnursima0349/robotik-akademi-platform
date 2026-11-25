/* Robotik Laboratuvarı: #, #kar, #kar/<görev>, #lig, #cizgi…, #labirent, #labirent/<görev> */
import "@sra/tasarim";
import "./lab.css";
import { uygulama } from "./uygulama";
import { ilerleme } from "./ilerleme";
import { IlerlemeEsitleyici, Ogrenci } from "@sra/bulut";
import { ana } from "./ekranlar/ana";
import { karGorev, karListe } from "./ekranlar/kar";
import { lig } from "./ekranlar/lig";
import { cizgiGorev, cizgiListe } from "./ekranlar/cizgi";

const root = document.getElementById("app")!;
async function yonlendir() {
  document.body.removeAttribute("data-hazir");
  const h = location.hash.replace(/^#\/?/, "");
  if (h === "vitrin/kenshin-fizik") { const { kenshinFizik } = await import("./sahne3d/kenshin-fizik"); void kenshinFizik(root); return; }
  if (h === "vitrin/fizik") { const { fizikOlcer } = await import("./sahne3d/fizik-olcer"); void fizikOlcer(root); return; }
  if (h.startsWith("vitrin")) { const { vitrin } = await import("./sahne3d/vitrin"); vitrin(root, h.split("/")[1] ?? ""); return; }
  if (h === "kar") karListe(root);
  else if (h.startsWith("kar/")) await karGorev(root, h.slice(4));
  else if (h === "lig") await lig(root);
  else if (h === "cizgi") void cizgiListe(root);
  else if (h === "cizgi/ayar") void (await import("./ekranlar/ayar")).ayarAtolyesi(root);
  else if (h === "cizgi/kurulum") void (await import("./ekranlar/kurulum")).kurulumRehberi(root);
  else if (h.startsWith("cizgi/")) void cizgiGorev(root, h.slice(6));
  else if (h === "labirent") (await import("./ekranlar/labirent")).labirentListe(root);
  else if (h.startsWith("labirent/")) void (await import("./ekranlar/labirent")).labirentGorev(root, h.slice(9));
  else ana(root);
  window.scrollTo({ top: 0 });
  document.title = (h.startsWith("kar") ? "Kar Küreme" : h === "lig" ? "Mini Sumo Ligi" : h.startsWith("cizgi") ? "Çizgi İzleyen Robot" : h.startsWith("labirent") ? "Labirent Ustası" : "Robotik Laboratuvarı") + " · Sivas Robotik Akademi";
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
