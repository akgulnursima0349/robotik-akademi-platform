/* Mini Sumo Ligi (Kenshin): robotunu yaz, rakiplerin kodunu oku, turnuvayı oynat, maçları ve rauntları 3D tekrar izle.
   Öğretmen (hesaplı modda) sınıfının robotlarını yükleyip tahtada sınıf turnuvası yapar. */
import { alan, dugme, el, ikon, uyari } from "@sra/tasarim";
import { hataMetni, Ogrenci, Ogretmen, type Sinif } from "@sra/bulut";
import { RAUNT_SURESI, sumoTurnuvasi, type SumoKaresi, type SumoOyuncu, type SumoTurnuvaSonucu } from "@sra/robot-motoru";
import { ILK_ROBOT, ORNEK_ROBOTLAR, pythonBeyin } from "@sra/python";
import { Editor, renklendir } from "../editor";
import { ilerleme } from "../ilerleme";
import { uygulama } from "../uygulama";
import { ustKisim } from "./ana";
import { secici, webglYok } from "./cizgi-ortak";

const bekle = () => new Promise((r) => setTimeout(r, 30));
const DIZILIS_AD = { karsi: "karşı karşıya", yan: "yan yana", sirt: "sırt sırta" } as const;
const SEBEP_AD = { dustu: "halkadan düştü", sure: "süre bitti, berabere", ikisi_dustu: "ikisi de düştü" } as const;

/** Platformdaki ders, strateji kartlarından üretilen robotu bu anahtarla Lab'a bırakır */
export const LIG_TASLAK_ANAHTARI = "sra-lig-taslak";

export async function lig(root: HTMLElement) {
  const ben = uygulama.kullanici;
  const kayitli = ilerleme.lig();
  const eskiKod = kayitli?.kod && !/return\s+["']/.test(kayitli.kod) ? kayitli.kod : null; // eski kar topu ligi kodları yüklenmez
  /* Platformdaki Mini Sumo dersinden (strateji kartları) gönderilen robot: bir kez yüklenir, ilk kayıtta lige yazılır */
  let taslak: { ad: string; kod: string } | null = null;
  try { const t = JSON.parse(localStorage.getItem(LIG_TASLAK_ANAHTARI) ?? "null"); if (t && typeof t.kod === "string") taslak = { ad: String(t.ad ?? "").slice(0, 40), kod: t.kod }; localStorage.removeItem(LIG_TASLAK_ANAHTARI); } catch { /* bozuk ya da erişilemez */ }
  const adAlan = alan({ etiket: "Robotunun adı", id: "l-robot-ad", ozellik: { maxlength: "40", value: taslak?.ad || kayitli?.ad || "Benim Kenshin'im" } });
  const adGirdi = adAlan.querySelector("input")!;
  const editor = new Editor(taslak?.kod ?? eskiKod ?? ILK_ROBOT, "Robotunun Python kodu");
  const kaydet = () => ilerleme.ligKaydet(adGirdi.value.trim() || "Benim Kenshin'im", editor.kod);
  editor.degisince = kaydet; adGirdi.addEventListener("input", kaydet);

  const mesaj = el("div", "l-cikti", { "aria-live": "polite" });
  if (taslak) mesaj.replaceChildren(uyari("Strateji kartlarından gelen robotun yüklendi. Turnuvayı başlatınca ligde kaydedilir.", "bilgi"));
  const baslatB = dugme({ metin: "Turnuvayı başlat", ikon: "ok-sag", ikonSonda: true, id: "l-turnuva" }) as HTMLButtonElement;
  const eylem = el("div", "l-eylem", {}, baslatB);

  /* öğrenci: robotunu sınıfına gönderir */
  if (ben instanceof Ogrenci && uygulama.oturum) {
    const gonderB = dugme({ metin: "Sınıfıma gönder", tur: "ikincil", ikon: "kisiler", id: "l-gonder" }) as HTMLButtonElement;
    gonderB.addEventListener("click", async () => {
      const b = pythonBeyin(editor.kod);
      if (b.hata) { mesaj.replaceChildren(hataKutusu(b.hata.satir, b.hata.mesaj)); editor.hataSatiri(b.hata.satir); return; }
      gonderB.disabled = true;
      try { await uygulama.oturum!.labRobotKaydet(adGirdi.value, editor.kod); mesaj.replaceChildren(uyari("Robotun sınıfına gönderildi. Öğretmenin sınıf turnuvasını başlatınca o da ringe çıkacak.", "basari")); }
      catch (e) { mesaj.replaceChildren(uyari(hataMetni(e), "hata")); }
      gonderB.disabled = false;
    });
    eylem.append(gonderB);
    uygulama.oturum.labRobotum().then((r) => { if (r && !kayitli && !/return\s+["']/.test(r.kod)) { adGirdi.value = r.ad; editor.kod = r.kod; } }).catch(() => {});
  }

  const rakipler = el("div", "l-rakipler", {}, el("h2", "", {}, "Rakipler"),
    ...ORNEK_ROBOTLAR.map((r) => el("details", "l-rakip", {},
      el("summary", "", {}, el("b", "", {}, r.ad), el("span", "", {}, r.aciklama)),
      (() => { const p = el("pre", "l-kod"); p.innerHTML = renklendir(r.kod); return p; })())));

  const sol = el("section", "l-gorev-sol", {},
    el("a", "l-geri", { href: "#" }, "← Laboratuvar"),
    el("div", "l-baslik", {}, el("p", "l-ust", {}, "Mini Sumo Ligi · Kenshin"), el("h1", "", {}, "Rakibini ringden çıkar"),
      el("p", "", {}, `Akademinin yarışma robotu Kenshin 77 cm'lik ringde. Her 20 milisaniyede hamle(robot) çalışır: 5 rakip sensörü ve 2 kenar sensörünü okur, iki motorun gücünü döndürür. Maçlar en fazla 3 raunt, raunt ${RAUNT_SURESI} saniye; ringden düşen raundu kaybeder.`)),
    el("details", "l3-api", {},
      el("summary", "", {}, "Kenshin'in sensörleri"),
      el("dl", "", {},
        el("dt", "", {}, el("code", "", {}, 'robot["rakip"]')), el("dd", "", {}, "Beş sayı: [sol yan, sol ön, orta, sağ ön, sağ yan]. Rakibi gören sensör 1, görmeyen 0. Menzil 60 cm."),
        el("dt", "", {}, el("code", "", {}, 'robot["kenar"]')), el("dd", "", {}, "İki sayı: [sol, sağ] zemin sensörü. Ringin beyaz kenarını görürse 1."),
        el("dt", "", {}, el("code", "", {}, 'robot["zaman"]')), el("dd", "", {}, "Raundun başından beri geçen milisaniye."),
        el("dt", "", {}, el("code", "", {}, "return sol, sag")), el("dd", "", {}, "İki motorun gücü, -255 ile 255 arası. Eksi geri gider."))),
    adAlan, editor.kok, eylem, mesaj);

  /* öğretmen: sınıf turnuvası */
  if (ben instanceof Ogretmen && uygulama.oturum) {
    const sinifKutu = el("div", "l-sinif");
    const sec = el("select", "p-kurssec", { "aria-label": "Sınıf", id: "l-sinif" });
    const sinifB = dugme({ metin: "Sınıf turnuvası", tur: "ikincil", ikon: "kisiler", id: "l-sinif-turnuva" }) as HTMLButtonElement;
    sinifKutu.append(el("h2", "", {}, "Sınıf turnuvası"), el("p", "", {}, "Öğrencilerin gönderdiği robotlar ringde karşılaşır. Tahtaya yansıtıp birlikte izleyin."), el("div", "l-eylem", {}, sec, sinifB));
    let siniflar: Sinif[] = [];
    uygulama.oturum.siniflarim().then((s) => { siniflar = s; sec.replaceChildren(...s.map((x) => el("option", "", { value: x.id }, `${x.ad} (${x.kod})`))); }).catch((e) => sinifKutu.append(uyari(hataMetni(e), "hata")));
    sinifB.addEventListener("click", async () => {
      const s = siniflar.find((x) => x.id === sec.value); if (!s) return;
      sinifB.disabled = true;
      try {
        const robotlar = await uygulama.oturum!.labSinifRobotlari(s.id);
        const oyuncular: SumoOyuncu[] = [], atlanan: string[] = [];
        for (const r of robotlar) { const b = pythonBeyin(r.kod); if (b.beyin) oyuncular.push({ kimlik: r.sahip, ad: r.ad, sahip: r.sahip, beyin: b.beyin }); else atlanan.push(r.sahip); }
        if (oyuncular.length < 2) { mesaj.replaceChildren(uyari("Turnuva için en az iki öğrencinin çalışan bir robot göndermesi gerekiyor.", "bilgi")); return; }
        await oyna(oyuncular, `${s.ad} turnuvası`);
        if (atlanan.length) mesaj.append(uyari(`Kodunda hata olduğu için katılamayanlar: ${atlanan.join(", ")}`, "bilgi"));
      } catch (e) { mesaj.replaceChildren(uyari(hataMetni(e), "hata")); }
      finally { sinifB.disabled = false; }
    });
    sol.append(sinifKutu);
  }
  sol.append(rakipler);

  /* sağ: ring, skor, raunt seçimi, tablo */
  const skor = el("div", "l-skor", { "aria-live": "polite" },
    el("span", "l-skor__ad a", {}, "—"), el("b", "l-skor__puan a", {}, "0"), el("span", "l-skor__tur", {}, "0,0 sn"), el("b", "l-skor__puan b", {}, "0"), el("span", "l-skor__ad b", {}, "—"));
  const rauntSec = el("div", "l-rauntlar", { role: "tablist", "aria-label": "Rauntlar" });
  const kamera = secici("Kamera", [["genel", "Genel"], ["ust", "Üstten"]], "genel", (d) => d === "ust" ? sahne?.ustten() : sahne?.genelBakis());
  const hiz = secici("Oynatma hızı", [["1", "1×"], ["0.5", "Yavaş"]], "1", (d) => { if (sahne) sahne.hiz = Number(d); });
  const sahneKutu = el("div", "l3-sahne l3-sahne--sumo", { role: "img", "aria-label": "Mini sumo ringi, iki Kenshin robotu" });
  const durum = el("p", "l-raunt-durum", { "aria-live": "polite" });
  const tabloKutu = el("div", "l-tablo-kutu", {}, el("p", "l-bos", {}, "Turnuvayı başlatınca puan tablosu ve maçlar burada görünür."));
  const sag = el("section", "l-gorev-sag", {}, el("div", "l3-sahne-kap sra-kart", {}, skor, el("div", "l3-ust", {}, rauntSec, kamera, hiz), sahneKutu, durum), tabloKutu);
  root.replaceChildren(ustKisim(), el("main", "l-gorev-sayfa sra-sarmal", { id: "ana" }, sol, sag));

  const { webglVar } = await import("@sra/sahne/studyo");
  let sahne: import("../sahne3d/sumo-sahnesi").SumoSahnesi | null = null;
  if (webglVar()) {
    const m = await import("../sahne3d/sumo-sahnesi");
    if (!sahneKutu.isConnected) return;
    sahne = new m.SumoSahnesi(sahneKutu);
    window.addEventListener("hashchange", () => sahne?.kapat(), { once: true });
    sahneKutu.dataset.hazir = "1";
  } else sahneKutu.replaceChildren(webglYok());

  const skorYaz = (a: number, b: number) => { skor.querySelector(".l-skor__puan.a")!.textContent = String(a); skor.querySelector(".l-skor__puan.b")!.textContent = String(b); };
  if (sahne) sahne.kareDinle = (k: SumoKaresi) => { skor.querySelector(".l-skor__tur")!.textContent = k.t.toFixed(1).replace(".", ",") + " sn"; };

  let sonuc: SumoTurnuvaSonucu | null = null, oyuncular: SumoOyuncu[] = [];
  /** bir maçın rauntlarını sırayla oynatır; raunt düğmesiyle tek raunt da izlenir */
  const macIzle = async (i: number, sadece?: number) => {
    if (!sonuc) return;
    const m = sonuc.maclar[i], [a, b] = [oyuncular[m.ev], oyuncular[m.dep]];
    skor.querySelector(".l-skor__ad.a")!.textContent = a.ad; skor.querySelector(".l-skor__ad.b")!.textContent = b.ad;
    tabloKutu.querySelectorAll(".l-mac").forEach((x, j) => x.classList.toggle("secili", j === i));
    rauntSec.replaceChildren(...m.sonuc.rauntlar.map((_r, j) => {
      const d = el("button", "", { type: "button", role: "tab", "data-raunt": String(j) }, `Raunt ${j + 1}`);
      d.addEventListener("click", () => void macIzle(i, j));
      return d;
    }));
    sahneKutu.scrollIntoView({ block: "nearest", behavior: "smooth" });
    let sa = 0, sb = 0;
    for (let j = 0; j < m.sonuc.rauntlar.length; j++) {
      const r = m.sonuc.rauntlar[j];
      if (sadece !== undefined && j !== sadece) { if (j < sadece) { if (r.kazanan === 0) sa++; if (r.kazanan === 1) sb++; } continue; }
      rauntSec.querySelectorAll("button").forEach((x, k) => { x.classList.toggle("secili", k === j); x.setAttribute("aria-selected", String(k === j)); });
      skorYaz(sa, sb);
      durum.textContent = `Raunt ${j + 1} · ${DIZILIS_AD[r.dizilis]}`;
      if (!sahne) break;
      const tamam = await sahne.oynat(r);
      if (!tamam) return;
      if (r.kazanan === 0) sa++; if (r.kazanan === 1) sb++;
      skorYaz(sa, sb);
      const kazananAd = r.kazanan === null ? null : r.kazanan === 0 ? a.ad : b.ad;
      durum.textContent = `Raunt ${j + 1}: ${kazananAd ? `${kazananAd} kazandı (${r.kazanan === 0 ? b.ad : a.ad} ${SEBEP_AD[r.sebep]})` : SEBEP_AD[r.sebep]}` + (r.hatalar.some(Boolean) ? ` · hata: ${r.hatalar.find(Boolean)}` : "");
      if (sadece !== undefined) break;
      await new Promise((t) => setTimeout(t, 700));
    }
  };

  async function oyna(liste: SumoOyuncu[], baslik: string) {
    mesaj.replaceChildren(el("p", "l-calisiyor", {}, "Maçlar oynanıyor…"));
    await bekle();
    oyuncular = liste;
    sonuc = sumoTurnuvasi(liste);
    mesaj.replaceChildren();
    const benimki = liste.findIndex((o) => o.kimlik === "ben");
    const tablo = el("table", "l-tablo", { "aria-label": "Puan tablosu" },
      el("thead", "", {}, el("tr", "", {}, ...["#", "Robot", "O", "G", "B", "M", "Raunt", "P"].map((t) => el("th", "", { scope: "col" }, t)))),
      el("tbody", "", {}, ...sonuc.tablo.map((r, i) => el("tr", r.kimlik === "ben" ? "ben" : "", {},
        el("td", "", {}, String(i + 1)), el("td", "", {}, el("b", "", {}, r.ad), r.sahip ? el("small", "", {}, r.sahip) : null),
        ...[r.o, r.g, r.b, r.m].map((n) => el("td", "", {}, String(n))), el("td", "", {}, `${r.alinan}:${r.verilen}`), el("td", "l-puan", {}, String(r.puan))))));
    const maclar = el("ol", "l-maclar", { "aria-label": "Maçlar (tıkla, tekrar izle)" }, ...sonuc.maclar.map((m, i) => {
      const s = m.sonuc;
      const b = el("button", "l-mac", { type: "button", "data-mac": String(i) },
        el("span", s.kazanan === 0 ? "kazanan" : "", {}, liste[m.ev].ad), el("b", "", {}, `${s.raunt[0]} – ${s.raunt[1]}`), el("span", s.kazanan === 1 ? "kazanan" : "", {}, liste[m.dep].ad), ikon("ok-sag"));
      b.addEventListener("click", () => void macIzle(i));
      return el("li", "", {}, b);
    }));
    const hatalar = sonuc.maclar.flatMap((m) => m.sonuc.rauntlar.flatMap((r) => r.hatalar.map((h, j) => (h && (j ? m.dep : m.ev) === benimki ? h : null)))).filter(Boolean);
    tabloKutu.replaceChildren(el("h2", "", {}, baslik), tablo, el("h3", "", {}, "Maçlar"), maclar);
    if (hatalar.length) mesaj.append(uyari("Robotun bazı rauntlarda hata verdi: " + hatalar[0], "hata"));
    const sira = sonuc.tablo.findIndex((r) => r.kimlik === "ben");
    if (sira >= 0) mesaj.append(uyari(sira === 0 ? "Şampiyon sensin! Kodunu sınıfınla paylaş." : `Robotun ${sira + 1}. oldu. Rakiplerin kodlarını oku, maçlarını izle, robotunu geliştir.`, sira === 0 ? "basari" : "bilgi"));
    const ilk = sonuc.maclar.findIndex((m) => m.ev === benimki || m.dep === benimki);
    void macIzle(ilk >= 0 ? ilk : 0);
  }

  baslatB.addEventListener("click", async () => {
    editor.temizle();
    kaydet(); // turnuvaya çıkan robot kaydedilir (dersten gelen taslak da)
    const b = pythonBeyin(editor.kod);
    if (b.hata) { editor.hataSatiri(b.hata.satir); mesaj.replaceChildren(hataKutusu(b.hata.satir, b.hata.mesaj)); return; }
    baslatB.disabled = true;
    sahne?.durdur();
    const liste: SumoOyuncu[] = [{ kimlik: "ben", ad: adGirdi.value.trim() || "Benim Kenshin'im", sahip: "sen", beyin: b.beyin! },
      ...ORNEK_ROBOTLAR.map((r) => ({ kimlik: r.kimlik, ad: r.ad, beyin: pythonBeyin(r.kod).beyin! }))];
    await oyna(liste, "Laboratuvar turnuvası");
    baslatB.disabled = false;
  });

  function hataKutusu(satir: number, m: string) {
    const d = uyari("", "hata");
    d.querySelector("span:last-child")!.innerHTML = (satir ? `<b>${satir}. satır:</b> ` : "") + m;
    return d;
  }
}
