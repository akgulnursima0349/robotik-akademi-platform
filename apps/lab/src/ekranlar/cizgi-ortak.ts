/* SiroLine ekranlarının ortak parçaları: 3D sahne kutusu, kamera/hız seçicileri, canlı sensör ve motor paneli. */
import { el, ikon, uyari } from "@sra/tasarim";
import type { CizgiKaresi, Pist } from "@sra/robot-motoru";
import type { CizgiSahnesi } from "../sahne3d/cizgi-sahnesi";

export async function sahneModulu() {
  const { webglVar } = await import("../sahne3d/studyo");
  if (!webglVar()) return null;
  return import("../sahne3d/cizgi-sahnesi");
}
export const webglYok = () => uyari("Bu tarayıcı 3D çizimi (WebGL) desteklemiyor ya da kapalı. Chrome, Edge ya da Firefox'un güncel sürümüyle dene; donanım hızlandırmanın açık olduğundan emin ol.", "hata");
export const sn = (x: number) => String(x).replace(".", ",");

export function secici(ad: string, sec: [string, string][], ilk: string, degisince: (d: string) => void): HTMLElement {
  const s = el("div", "l3-secici", { role: "group", "aria-label": ad },
    ...sec.map(([d, m]) => el("button", d === ilk ? "secili" : "", { type: "button", "data-deger": d, "aria-pressed": String(d === ilk) }, m)));
  s.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button"); if (!b) return;
    s.querySelectorAll("button").forEach((x) => { x.classList.toggle("secili", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    degisince(b.dataset.deger!);
  });
  return s;
}

export const BOS_KARE: CizgiKaresi = { t: 0, x: 0, y: 0, yon: 0, sol: 0, sag: 0, sensor: new Array(8).fill(0), solTeker: 0, sagTeker: 0, ilerleme: 0, sapma: 0 };

/** 3D sahne kutusu + üst şerit + canlı panel. `kur` sahneyi yükler (WebGL yoksa null). */
export function sahneBolumu(etiket: string) {
  let sahne: CizgiSahnesi | null = null;
  const sahneKutu = el("div", "l3-sahne", { role: "img", "aria-label": etiket });
  const kamSec = secici("Kamera", [["serbest", "Serbest"], ["takip", "Takip"], ["ust", "Üstten"]], "serbest", (d) => sahne?.kipSec(d as "takip"));
  const hizSec = secici("Oynatma hızı", [["1", "1×"], ["2", "2×"]], "1", (d) => { if (sahne) sahne.hiz = Number(d); });
  const surePano = el("b", "l3-sure", {}, "0,00 sn");
  const ilerlemePano = el("i");
  const ust = el("div", "l3-ust", {}, el("span", "l3-zaman", {}, ikon("saat"), surePano), el("span", "l3-ilerleme", { "aria-label": "Tur ilerlemesi" }, ilerlemePano), kamSec, hizSec);
  const sensorCubuk = Array.from({ length: 8 }, (_, k) => el("span", "l3-sensor", { title: `Sensör ${k}` }, el("i"), el("b", "", {}, "0"), el("small", "", {}, String(k))));
  const motorCubuk = (ad: string) => el("span", "l3-motor", {}, el("small", "", {}, ad), el("span", "l3-motor__ray", {}, el("i")), el("b", "", {}, "0"));
  const solM = motorCubuk("Sol"), sagM = motorCubuk("Sağ");
  const panel = el("div", "l3-panel", { "aria-label": "Canlı sensör ve motor değerleri" },
    el("div", "l3-panel__sensorler", {}, el("p", "l3-panel__baslik", {}, "sensorler()"), el("div", "l3-sensorler", {}, ...sensorCubuk)),
    el("div", "l3-panel__motorlar", {}, el("p", "l3-panel__baslik", {}, "motorlar(sol, sag)"), solM, sagM));
  const kok = el("div", "l3-sahne-kap sra-kart", {}, ust, sahneKutu, panel);

  const panelGoster = (k: CizgiKaresi) => {
    k.sensor.forEach((v, j) => {
      const c = sensorCubuk[j];
      (c.firstChild as HTMLElement).style.height = v / 10 + "%";
      c.classList.toggle("siyah", v > 500);
      (c.children[1] as HTMLElement).textContent = String(v);
    });
    for (const [c, v] of [[solM, k.sol], [sagM, k.sag]] as const) {
      const n = Math.max(-255, Math.min(255, Math.round(v)));
      const cub = c.querySelector(".l3-motor__ray i") as HTMLElement;
      cub.style.width = Math.abs(n) / 255 * 50 + "%";
      cub.style.left = n >= 0 ? "50%" : 50 - Math.abs(n) / 255 * 50 + "%";
      cub.classList.toggle("geri", n < 0);
      (c.lastChild as HTMLElement).textContent = String(n);
    }
    surePano.textContent = k.t.toFixed(2).replace(".", ",") + " sn";
    ilerlemePano.style.width = k.ilerleme * 100 + "%";
  };

  async function kur(pist: Pist): Promise<CizgiSahnesi | null> {
    const m = await sahneModulu();
    if (!m) { sahneKutu.replaceChildren(webglYok()); return null; }
    if (!sahneKutu.isConnected) return null;
    sahne = new m.CizgiSahnesi(sahneKutu);
    sahne.tanitimMesafesi = 0.85;
    sahne.yukle(pist);
    sahne.kareDinle = panelGoster;
    window.addEventListener("hashchange", () => sahne?.kapat(), { once: true });
    sahneKutu.dataset.hazir = "1";
    return sahne;
  }
  return { kok, panelGoster, kur };
}
