/* Sensör göstergesi: SiroLine'ın önü ve 8 sensörlük şeridi, siyah bandın üstünde, üstten bakış. Öğrenci robotu sağa sola
   sürükler (ya da ok tuşlarıyla kaydırır); her sensörün ışığı, okuması (0–1000) ve robotun hesapladığı konum (0–7000)
   anında değişir. Okumalar Lab'daki çizgi robotunun hesabıyla aynıdır (robot-motoru: banttaOkumalar, qtrOkuyucu). */
import { el, canliGrafik, secici } from "@sra/tasarim/v2";
import { banttaOkumalar, qtrOkuyucu, sensorYani, CIZGI_GENISLIGI, SIROLINE, type Zemin } from "@sra/robot-motoru";

export const KAYMA_SINIRI = 55; // mm: bant en fazla bu kadar yana kayar (sensör şeridi ±33 mm)
const OLCEK = 2;                // çizim birimi / mm
const G = 480, Y = 230, ORTA = G / 2;
/** Bandı en çok gören sensörün sırası; hiçbiri görmüyorsa null. Eşitlikte küçük sıra. */
export function enCokGorenSensor(okumalar: number[], zemin: Zemin = "beyaz"): number | null {
  const pay = zemin === "beyaz" ? okumalar : okumalar.map((v) => 1000 - v);
  let en = -1, i = -1;
  pay.forEach((v, j) => { if (v > en) { en = v; i = j; } });
  return en >= 500 ? i : null;
}
/** Konumun sözle anlatımı */
export function konumYazisi(konum: number): string {
  if (konum <= 2500) return "çizgi solda";
  if (konum >= 4500) return "çizgi sağda";
  return "çizgi ortada";
}

export function sensorGostergesi(ayar: Record<string, unknown>, denendi: (d: number) => void): HTMLElement {
  let zemin: Zemin = ayar.zemin === "siyah-uzerinde-beyaz-bant" ? "siyah" : "beyaz";
  const NS = "http://www.w3.org/2000/svg";
  const s = (ad: string, at: Record<string, string | number>) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); return e; };
  let okuyucu = qtrOkuyucu();
  let kayma = 0; // bandın robotun orta çizgisine göre yeri (mm, + sola)

  /* çizim: kâğıt, bant (sabit), robotun önü (kayar) */
  /* üstteki boşluk kırpılır; dar ekranda yanlar da kırpılır ki sensörler büyük görünsün (uçlarda levhanın kenarı taşar) */
  const GENIS = [0, 40, G, Y - 40], DAR = [100, 46, G - 200, Y - 46];
  let kutu = GENIS;
  const svg = s("svg", {
    viewBox: GENIS.join(" "), class: "sg-svg", tabindex: 0, role: "slider",
    "aria-label": "SiroLine'ın bant üstündeki yeri. Sol ve sağ ok tuşlarıyla kaydır.",
    "aria-valuemin": -KAYMA_SINIRI, "aria-valuemax": KAYMA_SINIRI
  });
  const zeminRect = s("rect", { x: 0, y: 0, width: G, height: Y });
  const bantRect = s("rect", { x: ORTA - (CIZGI_GENISLIGI * OLCEK) / 2, y: 0, width: CIZGI_GENISLIGI * OLCEK, height: Y, class: "sg-bant" });
  svg.append(zeminRect, bantRect);
  const robot = s("g", { class: "sg-robot" });
  /* önündeki levha: yarı saydam, altındaki bant görünsün */
  const levha = s("path", { d: "M-104 230 L-104 120 Q-104 92 -76 92 L76 92 Q104 92 104 120 L104 230", fill: "rgba(23,20,74,.62)", "stroke-width": 3 });
  robot.append(levha);
  const renklendir = () => {
    const beyaz = zemin === "beyaz";
    zeminRect.setAttribute("fill", beyaz ? "#F7F7F4" : "#1D1B19");
    bantRect.setAttribute("fill", beyaz ? "#141414" : "#F7F7F4");
    levha.setAttribute("stroke", beyaz ? "#17144A" : "#B8B0F0");
    kapRef?.setAttribute("data-zemin", zemin);
  };
  let kapRef: HTMLElement | null = null;
  robot.append(s("rect", { x: -82, y: 104, width: 164, height: 40, rx: 8, fill: "rgba(23,20,74,.35)", stroke: "#E3262F", "stroke-width": 2.5 }));
  const tl = s("text", { x: 0, y: 176, "text-anchor": "middle", class: "sg-yazi" }); tl.textContent = "SiroLine · ön"; robot.append(tl);
  const isiklar: SVGElement[] = [];
  for (let i = 0; i < SIROLINE.sensorSayisi; i++) {
    const x = -sensorYani(i) * OLCEK; // + sola → ekranda sola (x küçük)
    robot.append(s("rect", { x: x - 6, y: 114, width: 12, height: 20, rx: 3, fill: "#2B2770", stroke: "#fff", "stroke-width": 1 }));
    const isik = s("circle", { cx: x, cy: 124, r: 5.5, class: "sg-isik" }); isiklar.push(isik); robot.append(isik);
    const ad = s("text", { x, y: 86, "text-anchor": "middle", class: "sg-sira" }); ad.textContent = String(i); robot.append(ad);
  }
  svg.append(robot);
  const ipucu = s("text", { x: ORTA, y: 64, "text-anchor": "middle", class: "sg-ipucu" }); ipucu.textContent = "↔ Robotu sağa sola sürükle"; svg.append(ipucu);

  /* çubuklar ve konum */
  const cubuklar = Array.from({ length: SIROLINE.sensorSayisi }, (_, i) => {
    const dolgu = el("span", "sg-cubuk__dolgu");
    const sayi = el("span", "sg-cubuk__sayi", {}, "0");
    const kap = el("div", "sg-cubuk", { "data-sira": String(i) }, sayi, el("span", "sg-cubuk__yol", {}, dolgu), el("code", "sg-cubuk__ad", {}, `s[${i}]`));
    return { kap, dolgu, sayi };
  });
  const konumSayi = el("b", "sg-konum__sayi", {}, "3500");
  const konumYazi = el("span", "sg-konum__yazi", {}, "");
  const grafik = canliGrafik({ baslik: "Konum, son 10 saniye", en: 0, ust: 7000 });
  const durumMetni = el("p", "s2-gizli", { "aria-live": "polite" }, "");
  /* zemin seçimi: Lab'daki gibi beyaz zemin ya da sınıftaki pist gibi siyah zemin; sayılar tersine döner */
  const zeminSecici = ayar.zeminSecilir
    ? secici("Pist", [["beyaz", "Beyaz zemin, siyah bant"], ["siyah", "Siyah zemin, beyaz bant"]], zemin, (z) => {
        zemin = z; okuyucu = qtrOkuyucu(); renklendir(); guncelle(true);
      })
    : null;
  const kap = el("div", "sg", { "data-deney": "sensor-gostergesi" },
    ...(zeminSecici ? [el("div", "sg-zemin", {}, el("span", "sg-zemin__etiket", {}, "Pist"), zeminSecici)] : []),
    svg,
    el("div", "sg-cubuklar", { role: "group", "aria-label": "Sensör okumaları, 0 ile 1000 arası" }, ...cubuklar.map((c) => c.kap)),
    el("div", "sg-alt", {},
      el("p", "sg-konum", {}, el("span", "", {}, "Konum "), konumSayi, el("span", "sg-konum__aralik", {}, " / 7000 · "), konumYazi),
      grafik.kap),
    durumMetni);

  let oynadi = false, sonBildirilen: number | null = null;
  const guncelle = (bildir: boolean) => {
    const ok = banttaOkumalar(kayma, zemin);
    const konum = okuyucu(ok, zemin);
    const gorenler = ok.map((v) => (zemin === "beyaz" ? v : 1000 - v) >= 500);
    /* bant robota göre solda (kayma > 0) → robot ekranda sağa kaymış */
    robot.setAttribute("transform", `translate(${ORTA + kayma * OLCEK} 0)`);
    ok.forEach((v, i) => {
      isiklar[i].classList.toggle("yanik", gorenler[i]);
      cubuklar[i].dolgu.style.height = `${v / 10}%`;
      cubuklar[i].kap.classList.toggle("goruyor", gorenler[i]);
      cubuklar[i].sayi.textContent = String(v);
    });
    konumSayi.textContent = String(konum);
    konumYazi.textContent = konumYazisi(konum);
    kap.dataset.konum = String(konum);
    const en = enCokGorenSensor(ok, zemin);
    const metin = en === null ? `Çizgi hiçbir sensörün altında değil, konum ${konum}` : `Çizgi s[${en}] altında, konum ${konum}, ${konumYazisi(konum)}`;
    svg.setAttribute("aria-valuenow", String(Math.round(kayma)));
    svg.setAttribute("aria-valuetext", metin);
    grafik.ekle(konum);
    if (bildir) {
      durumMetni.textContent = metin;
      if (!oynadi) { oynadi = true; ipucu.remove(); }
      if (en !== null && en !== sonBildirilen) { sonBildirilen = en; denendi(en); }
    }
  };
  const kaydir = (mm: number) => { kayma = Math.max(-KAYMA_SINIRI, Math.min(KAYMA_SINIRI, mm)); guncelle(true); };

  /* sürükleme: robot imleçle birlikte kayar (tutulan yer korunur) */
  let surukleme: { x: number; kayma: number } | null = null;
  const mmBasina = () => svg.getBoundingClientRect().width / kutu[2] * OLCEK; // ekran pikseli / mm
  svg.addEventListener("pointerdown", (e) => { surukleme = { x: e.clientX, kayma }; svg.setPointerCapture?.(e.pointerId); svg.classList.add("suruklenen"); });
  svg.addEventListener("pointermove", (e) => { if (surukleme) kaydir(surukleme.kayma + (e.clientX - surukleme.x) / mmBasina()); });
  const birak = () => { surukleme = null; svg.classList.remove("suruklenen"); };
  svg.addEventListener("pointerup", birak); svg.addEventListener("pointercancel", birak);
  svg.addEventListener("keydown", (e) => {
    const adim = e.shiftKey ? 10 : 3;
    /* robot sola gidince bant robota göre sağa geçer (kayma azalır) */
    if (e.key === "ArrowLeft") kaydir(kayma - adim);
    else if (e.key === "ArrowRight") kaydir(kayma + adim);
    else if (e.key === "Home") kaydir(-KAYMA_SINIRI);
    else if (e.key === "End") kaydir(KAYMA_SINIRI);
    else return;
    e.preventDefault();
  });
  const boyutla = () => {
    const w = kap.getBoundingClientRect().width;
    const yeni = w > 0 && w < 520 ? DAR : GENIS;
    if (yeni !== kutu) { kutu = yeni; svg.setAttribute("viewBox", kutu.join(" ")); }
  };
  if (typeof ResizeObserver === "function") new ResizeObserver(boyutla).observe(kap);
  kapRef = kap; renklendir();
  guncelle(false);
  return kap;
}

export const SENSOR_GOSTERGESI_STILI = `
.sg{display:grid;gap:14px;margin:6px auto 0;max-width:760px;width:100%}
.sg-zemin{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.sg-zemin__etiket{font-weight:800;color:var(--sra2-murekkep-2)}
.sg-svg{width:100%;height:auto;display:block;border-radius:var(--sra2-kose-2);border:3px solid var(--sra2-murekkep);touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
.sg-svg.suruklenen{cursor:grabbing}
.sg-svg:focus-visible{outline:3px solid var(--sra2-mor);outline-offset:3px}
.sg-isik{fill:#3A365E;transition:fill 80ms}
.sg-isik.yanik{fill:#E3262F;filter:drop-shadow(0 0 5px #FF5A5F)}
.sg-sira{fill:#17144A;stroke:#fff;stroke-width:4px;paint-order:stroke;font:800 14px var(--sra2-yazi)}
.sg-yazi{fill:#fff;font:800 14px var(--sra2-yazi)}
.sg-ipucu{fill:#6A48F0;font:800 15px var(--sra2-yazi)}
.sg-cubuklar{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
.sg-cubuk{display:grid;justify-items:center;gap:4px;min-width:0}
.sg-cubuk__sayi{font:800 13px var(--sra2-yazi);color:var(--sra2-murekkep);font-variant-numeric:tabular-nums}
.sg-cubuk__yol{position:relative;width:100%;max-width:34px;height:84px;border-radius:6px;background:var(--sra2-lavanta)}
.sg-cubuk__dolgu{position:absolute;left:0;right:0;bottom:0;border-radius:6px 6px 6px 6px;background:var(--sra2-mor);transition:height 80ms}
.sg-cubuk.goruyor .sg-cubuk__dolgu{background:var(--sra2-kirmizi)}
.sg-cubuk__ad{font:600 12px var(--sra2-yazi-kod);color:var(--sra2-murekkep-2)}
.sg-alt{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:16px;align-items:center}
.sg-konum{margin:0;font-weight:700;color:var(--sra2-murekkep-2)}
.sg-konum__sayi{font:800 var(--sra2-boy-6) var(--sra2-yazi-baslik);color:var(--sra2-murekkep);font-variant-numeric:tabular-nums;display:block;line-height:1.1}
.sg-konum__yazi{color:var(--sra2-murekkep);font-weight:800}
@media (max-width:600px){.sg-alt{grid-template-columns:1fr}.sg-cubuklar{gap:3px}.sg-cubuk__sayi{font-size:11px}.sg-cubuk__ad{font-size:10px}}
@media (prefers-reduced-motion: reduce){.sg-isik,.sg-cubuk__dolgu{transition:none}}
`;
