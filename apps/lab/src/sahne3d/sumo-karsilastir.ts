/* Sumo motorları karşılaştırma sayfası: lab/#vitrin/sumo-karsilastir
   Aynı raunt (aynı robot kodları, diziliş ve tohum) iki motorda hesaplanır ve yan yana oynatılır:
   solda ligin bugünkü düzlem motoru, sağda yeni 3D fizik (Rapier). "Toplu karşılaştırma" bütün örnek robotları
   birbiriyle, üç dizilişte iki motorda oynatır; sonuçları ve bir raundun hesaplanma süresini tabloya döker. */
import { el } from "@sra/tasarim";
import { DIZILISLER, rauntOyna, type Dizilis, type RauntSonucu, type SumoBeyni } from "@sra/robot-motoru";
import { ORNEK_ROBOTLAR, pythonBeyin } from "@sra/python";
import { webglVar } from "./studyo";

const DIZILIS_AD: Record<Dizilis, string> = { karsi: "Karşı karşıya", yan: "Yan yana", sirt: "Sırt sırta" };
const STIL = `
.sk{max-width:1240px;margin:0 auto;padding:16px 16px 40px;font:14px/1.5 var(--sra-yazi);color:var(--sra-murekkep)}
.sk h1{font-size:22px;margin:0 0 4px}
.sk>p{margin:0 0 14px;color:var(--sra-murekkep-2);max-width:72ch}
.sk-ayar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:end;margin-bottom:14px}
.sk-ayar label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--sra-murekkep-2);font-weight:600}
.sk-ayar select,.sk-ayar input{font:14px var(--sra-yazi);padding:7px 10px;border:1px solid var(--sra-cizgi-2);border-radius:10px;background:var(--sra-yuzey);color:var(--sra-murekkep);min-height:38px}
.sk-ayar input{width:84px}
.sk-ikili{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:760px){.sk-ikili{grid-template-columns:1fr}}
.sk-gorunum{border:1px solid var(--sra-cizgi);border-radius:var(--sra-kose);overflow:hidden;background:var(--sra-yuzey)}
.sk-gorunum h2{margin:0;padding:10px 14px;font-size:14px;display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--sra-cizgi)}
.sk-gorunum h2 span{font-weight:500;color:var(--sra-murekkep-3);font-size:12.5px}
.sk-sahne{position:relative;aspect-ratio:4/3;background:#dfe3e9}
.sk-sonuc{margin:0;padding:10px 14px;font-variant-numeric:tabular-nums;min-height:44px;border-top:1px solid var(--sra-cizgi)}
.sk-toplu{margin-top:22px}
.sk-toplu h2{font-size:17px;margin:0 0 6px}
.sk-ozet{display:flex;flex-wrap:wrap;gap:8px 18px;margin:8px 0 10px;font-variant-numeric:tabular-nums}
.sk-ozet code{font:12.5px var(--sra-yazi-kod);background:var(--sra-zemin);padding:3px 6px;border-radius:6px;user-select:all}
.sk-tablo-kap{overflow-x:auto;border:1px solid var(--sra-cizgi);border-radius:var(--sra-kose)}
.sk table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:13px;background:var(--sra-yuzey)}
.sk th,.sk td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--sra-cizgi);white-space:nowrap}
.sk th{font-size:12px;color:var(--sra-murekkep-2);background:var(--sra-zemin)}
.sk tr.farkli td{background:color-mix(in srgb,var(--sra-vurgu) 9%,transparent)}
.sk td.isaret{font-weight:700;color:var(--sra-vurgu)}
.sk tbody tr{cursor:pointer}.sk tbody tr:hover td{background:var(--sra-zemin)}
`;

interface Eslesme { a: number; b: number; d: Dizilis; tohum: number }
type Sonuclar = { eski: RauntSonucu; yeni: RauntSonucu; eskiMs: number; yeniMs: number };

export async function sumoKarsilastir(root: HTMLElement) {
  document.head.append(el("style", "", {}, STIL));
  const secenek = (sec: number) => ORNEK_ROBOTLAR.map((r, i) => el("option", "", { value: String(i), ...(i === sec ? { selected: "" } : {}) }, r.ad));
  const robotA = el("select", "", { id: "sk-a" }, ...secenek(1)), robotB = el("select", "", { id: "sk-b" }, ...secenek(2));
  const dizilis = el("select", "", { id: "sk-dizilis" }, ...DIZILISLER.map((d) => el("option", "", { value: d }, DIZILIS_AD[d])));
  const tohum = el("input", "", { id: "sk-tohum", type: "number", min: "1", max: "999", value: "11", inputmode: "numeric" });
  const oynat = el("button", "sra-dugme sra-dugme--ana", { type: "button", id: "sk-oynat" }, "Hesapla ve oynat");
  const toplu = el("button", "sra-dugme sra-dugme--ikincil", { type: "button", id: "sk-toplu" }, "Toplu karşılaştırma");
  const gorunum = (baslik: string, alt: string, id: string) => {
    const sahne = el("div", "sk-sahne", { role: "img", "aria-label": baslik + " sumo ringi" }), sonuc = el("p", "sk-sonuc", { id, "aria-live": "polite" }, "–");
    return { kap: el("section", "sk-gorunum", {}, el("h2", "", {}, baslik, el("span", "", {}, alt)), sahne, sonuc), sahne, sonuc };
  };
  const eskiG = gorunum("Bugünkü lig motoru", "düzlemde, 2 ms adım", "sk-sonuc-eski");
  const yeniG = gorunum("Yeni 3D fizik", "Rapier, 4 ms adım", "sk-sonuc-yeni");
  const ozet = el("div", "sk-ozet", { id: "sk-ozet" });
  const tablo = el("div", "sk-tablo-kap", { hidden: "" });
  root.replaceChildren(el("main", "sk", { id: "ana" },
    el("h1", "", {}, "Sumo: iki motor yan yana"),
    el("p", "", {}, "Aynı robot kodları, aynı diziliş ve başlangıç: solda ligin bugünkü motoru, sağda yeni 3D fizik. Kod değişmeden iki motorda da çalışır; farklar fizikten gelir (bıçağın altına girme, kaldırılan robotun tekerlerinin kayması, ringden devrilerek düşme)."),
    el("div", "sk-ayar", {}, el("label", "", { for: "sk-a" }, "Kırmızı", robotA), el("label", "", { for: "sk-b" }, "Mavi", robotB),
      el("label", "", { for: "sk-dizilis" }, "Diziliş", dizilis), el("label", "", { for: "sk-tohum" }, "Tohum", tohum), oynat, toplu),
    el("div", "sk-ikili", {}, eskiG.kap, yeniG.kap),
    el("section", "sk-toplu", { "aria-label": "Toplu karşılaştırma" }, ozet, tablo)));

  const { SumoSahnesi } = await import("./sumo-sahnesi");
  const { fizikliRauntOyna } = await import("@sra/fizik/sumo-raunt");
  const sahneler = webglVar() ? [new SumoSahnesi(eskiG.sahne), new SumoSahnesi(yeniG.sahne)] : [];
  /* iki görünümde aynı açı: bütün ring çerçevede */
  for (const sh of sahneler) { sh.studyo.kontrol.target.set(0, 0.0, 0); sh.studyo.kamera.position.set(0.42, 0.62, 0.78); }
  addEventListener("hashchange", () => sahneler.forEach((s) => s.kapat()), { once: true });

  /* her motor kendi beyin örneğini alır: Python kodu durum tutabilir (global değişkenler), paylaşılmamalı */
  const beyin = (i: number): SumoBeyni => pythonBeyin(ORNEK_ROBOTLAR[i].kod).beyin!;
  const hesapla = async (e: Eslesme): Promise<Sonuclar> => {
    let t = performance.now();
    const eski = rauntOyna([beyin(e.a), beyin(e.b)], e.d, e.tohum);
    const eskiMs = performance.now() - t;
    t = performance.now();
    const yeni = await fizikliRauntOyna([beyin(e.a), beyin(e.b)], e.d, e.tohum);
    return { eski, yeni, eskiMs, yeniMs: performance.now() - t };
  };
  const sonucYazi = (r: RauntSonucu, e: Eslesme) => {
    const ad = (k: 0 | 1 | null) => (k === null ? "" : ORNEK_ROBOTLAR[k === 0 ? e.a : e.b].ad);
    if (r.sebep === "sure") return `Berabere · süre doldu (${r.sure} sn)`;
    if (r.sebep === "ikisi_dustu") return `Berabere · ikisi de düştü (${r.sure.toFixed(2)} sn)`;
    return `${ad(r.kazanan)} kazandı · rakip ${r.sure.toFixed(2).replace(".", ",")} sn'de düştü`;
  };
  const kisa = (r: RauntSonucu, e: Eslesme) => r.kazanan === null ? (r.sebep === "sure" ? "berabere (süre)" : "berabere") : `${ORNEK_ROBOTLAR[r.kazanan === 0 ? e.a : e.b].ad} · ${r.sure.toFixed(2).replace(".", ",")} sn`;

  let calisiyor = 0;
  const izle = async (e: Eslesme, s?: Sonuclar) => {
    const no = ++calisiyor;
    oynat.disabled = true;
    eskiG.sonuc.textContent = yeniG.sonuc.textContent = "Hesaplanıyor…";
    s ??= await hesapla(e);
    if (no !== calisiyor) return;
    oynat.disabled = false;
    const yaz = () => { eskiG.sonuc.textContent = sonucYazi(s.eski, e); yeniG.sonuc.textContent = sonucYazi(s.yeni, e); document.body.dataset.sonuc = "1"; };
    if (!sahneler.length) { yaz(); return; }
    eskiG.sonuc.textContent = yeniG.sonuc.textContent = "Oynatılıyor…";
    sahneler.forEach((sh, i) => { sh.kareDinle = (k) => { if (no === calisiyor) (i ? yeniG : eskiG).sonuc.textContent = `${k.t.toFixed(1).replace(".", ",")} sn`; }; });
    await Promise.all([sahneler[0].oynat(s.eski), sahneler[1].oynat(s.yeni)]);
    if (no === calisiyor) yaz();
  };
  const secili = (): Eslesme => ({ a: +robotA.value, b: +robotB.value, d: dizilis.value as Dizilis, tohum: Math.max(1, Math.round(+tohum.value) || 1) });
  oynat.addEventListener("click", () => void izle(secili()));

  toplu.addEventListener("click", async () => {
    toplu.disabled = true;
    const liste: Eslesme[] = [];
    const t0 = Math.max(1, Math.round(+tohum.value) || 1);
    for (let a = 0; a < ORNEK_ROBOTLAR.length; a++) for (let b = a + 1; b < ORNEK_ROBOTLAR.length; b++) for (const d of DIZILISLER) liste.push({ a, b, d, tohum: t0 });
    const govde = el("tbody");
    tablo.replaceChildren(el("table", "", {},
      el("thead", "", {}, el("tr", "", {}, ...["Kırmızı", "Mavi", "Diziliş", "Bugünkü motor", "Yeni fizik", ""].map((b) => el("th", "", { scope: "col" }, b)))), govde));
    tablo.hidden = false;
    let ayni = 0, eskiTop = 0, yeniTop = 0, oyunTop = 0;
    for (let i = 0; i < liste.length; i++) {
      ozet.textContent = `Hesaplanıyor: ${i + 1} / ${liste.length}`;
      await new Promise((r) => setTimeout(r, 0)); // arayüz nefes alsın
      const e = liste[i], s = await hesapla(e);
      eskiTop += s.eskiMs; yeniTop += s.yeniMs; oyunTop += s.yeni.sure;
      const farkli = s.eski.kazanan !== s.yeni.kazanan;
      if (!farkli) ayni++;
      const satir = el("tr", farkli ? "farkli" : "", { tabindex: "0" },
        el("td", "", {}, ORNEK_ROBOTLAR[e.a].ad), el("td", "", {}, ORNEK_ROBOTLAR[e.b].ad), el("td", "", {}, DIZILIS_AD[e.d]),
        el("td", "", {}, kisa(s.eski, e)), el("td", "", {}, kisa(s.yeni, e)), el("td", "isaret", { "aria-label": farkli ? "kazanan farklı" : "" }, farkli ? "≠" : ""));
      const ac = () => { robotA.value = String(e.a); robotB.value = String(e.b); dizilis.value = e.d; eskiG.kap.scrollIntoView({ behavior: "smooth", block: "start" }); void izle(e, s); };
      satir.addEventListener("click", ac);
      satir.addEventListener("keydown", (k) => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); ac(); } });
      govde.append(satir);
    }
    const n = liste.length;
    const olcum = `sumo-karsilastir: ${n} raunt · aynı kazanan ${ayni}/${n} · ortalama hesap: bugünkü ${(eskiTop / n).toFixed(0)} ms, yeni ${(yeniTop / n).toFixed(0)} ms · yeni fizik 10 sn'lik oyunu ${((yeniTop / Math.max(0.01, oyunTop)) * 10 / 1000).toFixed(2).replace(".", ",")} sn'de hesaplıyor · ${navigator.hardwareConcurrency ?? "?"} çekirdek`;
    ozet.replaceChildren(
      el("span", "", {}, el("strong", "", {}, `${ayni} / ${n}`), " raundda kazanan aynı"),
      el("span", "", {}, "Satıra tıklayınca iki motorda yan yana oynar."),
      el("code", "", { id: "sk-olcum", title: "Kurs bilgisayarındaki ölçüm için kopyalayın" }, olcum));
    toplu.disabled = false;
    document.body.dataset.toplu = "1";
  });

  document.body.dataset.hazir = "1";
  void izle(secili());
}
