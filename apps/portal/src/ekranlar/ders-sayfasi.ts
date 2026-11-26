/* Ders oynatıcı: portal/#ders/<kimlik>
   Anlat → Dene → Görev → Gerçek robotta. Bölümler sırayla açılır (öğretmende hepsi açık); ilerleme bu cihazda saklanır,
   giriş yapmış öğrencide buluta eşitlenir. Görseller (E3) ve deney bileşenleri (E4) kayıt defterlerinden yüklenir;
   olmayanların yerinde sade bir yer tutucu durur. */
import { bildirim, dugme, el, hap, ikon, kok, konusmaBalonu, maskot, parcaliIlerleme, sesServisi, seviyeGostergesi, yildizlar } from "@sra/tasarim/v2";
import { IlerlemeEsitleyici, Ogrenci, Ogretmen } from "@sra/bulut";
import {
  bolumAcik, DERS_BOLUMLERI, DersDeposu, dersBul, dersDurumu, DERSLER, dersXp, ilkBolum, kayitOku, LAB_KAYIT_ANAHTARI, labAnahtari, PARCALAR, ROBOTIK,
  seviyeHesapla, XP, type DersBolumu, type DersTanimi
} from "@sra/mufredat";
import { uygulama } from "../uygulama";
import { acilisSeviyesi } from "../atolyeler";
import { stilEkle, ustCubuk } from "./ana-sayfa";
import { cizimGorseli, sahneGorseli } from "../gorsel";
import { DENEYLER } from "../deney";

/** Deney bileşenleri (deney/): ayar ve "bu değer denendi" bildirimiyle bir öğe kurar */
export type DeneyBileseni = (ayar: Record<string, unknown>, denendi: (deger: string | number) => void) => HTMLElement;
export const DENEY_BILESENLERI: Record<string, DeneyBileseni> = DENEYLER;
/** Anlatım görselleri: çizim kelimeye göre belirsin diye okuma olaylarını alır; adım değişince kapatılır */
export interface GorselOynatici { kap: HTMLElement; olay?: { basladi?: () => void; kelime?: (i: number) => void; bitti?: () => void }; kapat?: () => void }
export type GorselCizici = (ad: string, ayar: Record<string, unknown> | undefined) => GorselOynatici;
export const GORSELLER: { sahne?: GorselCizici; cizim?: GorselCizici } = { sahne: sahneGorseli, cizim: cizimGorseli };

const depoAl = (): Storage | null => { try { return localStorage; } catch { return null; } };
let depo: DersDeposu | null = null;
let esitleyici: IlerlemeEsitleyici<unknown> | null = null;
/** Sayfanın ders deposu; giriş yapmış öğrencide bulutla eşitlenir (bir kez kurulur) */
export function dersDeposu(): DersDeposu {
  if (!depo) depo = new DersDeposu(depoAl());
  if (!esitleyici && uygulama.oturum && uygulama.kullanici instanceof Ogrenci) {
    esitleyici = new IlerlemeEsitleyici(uygulama.oturum, "dersler", depo);
    depo.degisince(() => esitleyici?.degisti());
    void esitleyici.baslat();
  }
  return depo;
}
const labKaydi = () => { try { return kayitOku(localStorage.getItem(LAB_KAYIT_ANAHTARI)); } catch { return kayitOku(null); } };
const labYildizi = (d: DersTanimi) => (d.gorev.tur === "lab" ? labKaydi().gorevler[labAnahtari(d.gorev)]?.yildiz ?? 0 : 0);
/* öğretmen onayları: yalnız giriş yapmış öğrencide sunucudan okunur, bellekte tutulur (misafirde ve çevrimdışıyken yok) */
let onaylar: Record<string, string> = {};
let onayOkundu: Promise<boolean> | null = null;
/** Onayları bir kez okur; değiştiyse true */
function onaylariOku(): Promise<boolean> {
  if (!(uygulama.oturum && uygulama.kullanici instanceof Ogrenci)) return Promise.resolve(false);
  return (onayOkundu ??= uygulama.oturum.dersOnaylarim().then((o) => {
    const degisti = JSON.stringify(o) !== JSON.stringify(onaylar);
    onaylar = o;
    return degisti;
  }).catch(() => false).finally(() => { setTimeout(() => { onayOkundu = null; }, 0); }));
}
const onayli = (d: DersTanimi) => d.kimlik in onaylar;
/** Bütün derslerden toplanan XP (öğretmen onayı dahil) */
export function toplamXp(): number { const dp = dersDeposu(); return DERSLER.reduce((t, d) => t + dersXp(dersDurumu(d, dp.kayit(d.kimlik), labYildizi(d), onayli(d))), 0); }

const STIL = `
.dr-ust{padding-bottom:28px}
.dr-bas{max-width:1184px;margin:22px auto 0;display:flex;flex-wrap:wrap;gap:14px 24px;align-items:flex-end;justify-content:space-between}
.dr-bas h1{font-size:var(--sra2-boy-6);margin:0 0 6px}
.dr-bas p{margin:0;max-width:62ch;color:var(--sra2-murekkep-2);font-weight:600}
.dr-bolumler{max-width:1184px;margin:20px auto 0;display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}
.dr-bolumler button{display:inline-flex;align-items:center;gap:8px;min-height:var(--sra2-hedef);padding:0 16px;border:0;border-radius:var(--sra2-kose-hap);background:#fff;color:var(--sra2-murekkep);font:800 var(--sra2-boy-2) var(--sra2-yazi);cursor:pointer;box-shadow:0 var(--sra2-taban-1) 0 var(--sra2-lavanta-taban)}
.dr-bolumler button .s2-ikon{width:18px;height:18px}
.dr-bolumler button.bitti{background:var(--sra2-yesil);color:#fff;box-shadow:0 var(--sra2-taban-1) 0 var(--sra2-yesil-taban)}
.dr-bolumler button[aria-current="step"]{background:var(--sra2-mor);color:#fff;box-shadow:0 var(--sra2-taban-1) 0 var(--sra2-mor-taban)}
.dr-bolumler button:disabled{background:#EFEAE0;color:#605B78;box-shadow:none;cursor:not-allowed}
.dr-bolumler button:focus-visible{box-shadow:var(--sra2-odak)}
.dr-govde{flex:1;width:100%;max-width:1232px;margin:0 auto;padding:28px clamp(16px,4vw,48px) 56px;display:flex;flex-direction:column;gap:20px}
.dr-anlat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:24px;align-items:start}
.dr-gorsel{aspect-ratio:4/3;border-radius:var(--sra2-kose-3);background:var(--sra2-gece);color:var(--sra2-murekkep-acik);display:grid;place-items:center;text-align:center;padding:20px;box-shadow:0 var(--sra2-taban-2) 0 var(--sra2-gece-taban);overflow:hidden}
.dr-adimsay.dr-denendi{align-self:flex-start;display:inline-flex;margin:4px 0 0;padding:6px 14px;border-radius:999px;background:var(--sra2-lavanta);color:var(--sra2-mor-taban);font-weight:800;font-size:var(--sra2-boy-2)}
.dr-onay{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.dr-gorsel--dolu{padding:0;display:block;position:relative}
.dr-gorsel--dolu[data-tur=cizim]{aspect-ratio:auto;align-self:start;background:#FFF8EC;box-shadow:0 var(--sra2-taban-2) 0 var(--sra2-kart-taban)}
.dr-yukleniyor{position:absolute;inset:0;display:grid;place-items:center;font-weight:800}
.dr-gorsel b{display:block;color:#fff;font:800 var(--sra2-boy-4) var(--sra2-yazi-baslik);margin-bottom:6px}
.dr-sag{display:flex;flex-direction:column;gap:16px}
.dr-adimsay{font-weight:800;color:var(--sra2-murekkep-2);font-size:var(--sra2-boy-1)}
.dr-soru{display:flex;flex-direction:column;gap:10px}
.dr-soru h3{font-size:var(--sra2-boy-4);margin:0}
.dr-secenekler{display:flex;flex-direction:column;gap:8px}
.dr-secenekler button{min-height:52px;padding:10px 16px;border:2px solid var(--sra2-kart-taban);border-radius:var(--sra2-kose-2);background:#fff;text-align:left;font:700 var(--sra2-boy-3) var(--sra2-yazi);color:var(--sra2-murekkep);cursor:pointer}
.dr-secenekler button:hover{border-color:var(--sra2-mor)}
.dr-secenekler button[aria-pressed="true"].dogru{border-color:var(--sra2-yesil);background:var(--sra2-yesil-acik)}
.dr-secenekler button[aria-pressed="true"].yanlis{border-color:var(--sra2-hata);background:var(--sra2-hata-acik)}
.dr-gezinti{display:flex;gap:12px;flex-wrap:wrap}
.dr-gezinti .s2-dugme:last-child{margin-left:auto}
.dr-kart{display:flex;flex-direction:column;gap:14px}
.dr-kart h2{font-size:var(--sra2-boy-5);margin:0}
.dr-kart ul,.dr-kart ol{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px;font-weight:600}
.dr-adimlar{list-style:none;padding:0 !important}
.dr-adimlar label{display:flex;gap:12px;align-items:flex-start;min-height:44px;padding:8px 10px;border-radius:12px;background:var(--sra2-krem);cursor:pointer}
.dr-adimlar input{width:24px;height:24px;flex:none;accent-color:var(--sra2-yesil);margin-top:1px}
.dr-ogretmen{border:2px dashed var(--sra2-lavanta-taban);border-radius:var(--sra2-kose-2);padding:12px 14px;font-weight:600}
.dr-son{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.dr-bitti{display:flex;flex-direction:column;gap:16px;background:var(--sra2-lavanta) !important}
@media (max-width:900px){.dr-anlat{grid-template-columns:1fr}.dr-gorsel{aspect-ratio:16/9}.dr-gorsel--dolu[data-tur=cizim]{aspect-ratio:auto}}
@media print{
  .as-ust,.as-alt,.dr-bolumler,.dr-yazdirma,.dr-bitti,.no-print{display:none !important}
  .dr-govde{padding:0}.s2-kart{box-shadow:none;border:1px solid #ccc}
  body,.sra2{background:#fff !important}
}
`;

let klavye: ((e: KeyboardEvent) => void) | null = null;

export function dersSayfasi(root: HTMLElement, kimlik: string): boolean {
  const d = dersBul(kimlik);
  if (!d) return false;
  stilEkle();
  if (!document.getElementById("dr-stil")) document.head.append(el("style", "", { id: "dr-stil" }, STIL));
  const k = uygulama.kullanici, ogretmen = k instanceof Ogretmen;
  const dp = dersDeposu();
  const ses = sesServisi();
  const deneyVar = !!DENEY_BILESENLERI[d.dene.bilesen];
  const durum = () => dersDurumu(d, dp.kayit(d.kimlik), labYildizi(d), onayli(d));
  let bolum: DersBolumu = ilkBolum(durum(), { ogretmen, deneyVar });
  let adim = Math.min(dp.kayit(d.kimlik).anlat?.adim ?? 0, d.anlat.length - 1);
  let aktifGorsel: GorselOynatici | null = null;
  if (durum().anlat && bolum === "anlat") adim = 0;
  let soruCozuldu = new Set<number>();
  const oncekiBitti = durum().bitti;

  const sayfa = kok(el("div", "as"), acilisSeviyesi(depoAl(), k instanceof Ogrenci ? k.kurs : undefined));
  const modul = ROBOTIK.moduller.find((m) => m.kimlik === d.modul);
  const xpYeri = el("div", "", { id: "dr-xp" });
  const bolumNav = el("ol", "dr-bolumler", { "aria-label": "Dersin bölümleri" });
  const icerik = el("main", "dr-govde", { id: "ana", tabindex: "-1" });
  const ust = el("header", "as-ust dr-ust", {}, ustCubuk(),
    el("div", "dr-bas", {},
      el("div", "", {},
        el("a", "at-geri", { href: `#atolye/${d.atolye}` }, ikon("geri"), modul ? `${ROBOTIK.ad} · ${modul.ad}` : "Atölye"),
        el("h1", "s2-baslik", {}, d.ad),
        el("p", "", {}, d.kazanim)),
      xpYeri),
    bolumNav);
  sayfa.append(ust, icerik, el("footer", "as-alt", {}, el("div", "", {}, el("span", "", {}, "© Sivas Robotik Akademi"), el("span", "", {}, `${d.sure} dakika · ${d.robot ?? ""}`))));
  root.replaceChildren(sayfa);
  document.title = `${d.ad} · Sivas Robotik Akademi`;

  /** XP göstergesi ve bölüm düğmeleri (içerik yeniden kurulmadan da güncellenebilir) */
  const ustBolum = () => {
    const s = durum();
    const xp = toplamXp(), sv = seviyeHesapla(xp);
    xpYeri.replaceChildren(seviyeGostergesi(sv.seviye, `${xp} XP`, sv.doluluk));
    const bitmis: Record<DersBolumu, boolean> = { anlat: s.anlat, dene: s.dene, gorev: s.gorev, gercek: s.gercek };
    bolumNav.replaceChildren(...DERS_BOLUMLERI.map(([b, ad], i) => {
      const acik = bolumAcik(s, b, { ogretmen, deneyVar });
      const btn = el("button", bitmis[b] ? "bitti" : "", { type: "button", "data-bolum": b }, ikon(bitmis[b] ? "tamam" : acik ? "oynat" : "kilit"), `${i + 1} · ${ad}`);
      if (!acik) { btn.disabled = true; btn.title = b === "dene" ? "Önce anlatımı bitir" : "Önce denemeyi bitir"; }
      if (b === bolum) btn.setAttribute("aria-current", "step");
      btn.addEventListener("click", () => { bolum = b; if (b === "anlat") adim = 0; ciz(); icerik.focus({ preventScroll: true }); });
      return el("li", "", {}, btn);
    }));
  };
  const ciz = () => {
    ses.durdur();
    aktifGorsel?.kapat?.(); aktifGorsel = null;
    const s = durum();
    ustBolum();
    const parcalar: Node[] = [];
    if (s.bitti) parcalar.push(bitisPaneli());
    parcalar.push(bolum === "anlat" ? anlatim() : bolum === "dene" ? deneme() : bolum === "gorev" ? gorev() : gercek());
    icerik.replaceChildren(...parcalar);
    icerik.dataset.bolum = bolum;
  };
  const ilerle = (ek: Parameters<DersDeposu["ilerle"]>[1]) => { dp.ilerle(d.kimlik, ek); };

  /* ---------- Anlat ---------- */
  const anlatim = () => {
    const a = d.anlat[adim], son = adim === d.anlat.length - 1;
    aktifGorsel = a.gorsel && GORSELLER[a.gorsel.tur] ? GORSELLER[a.gorsel.tur]!(a.gorsel.ad, a.gorsel.ayar) : null;
    const gorsel = aktifGorsel
      ? el("div", "dr-gorsel dr-gorsel--dolu", { "data-gorsel": a.gorsel!.ad, "data-tur": a.gorsel!.tur }, aktifGorsel.kap)
      : el("figure", "dr-gorsel", { style: "margin:0", "data-gorsel": a.gorsel?.ad ?? "" },
          el("figcaption", "", {}, el("b", "", {}, a.gorsel ? (a.gorsel.tur === "sahne" ? "3D sahne" : "Çizim") : d.robot ?? "Bit"),
            a.gorsel ? `${a.gorsel.ad.replace(/-/g, " ")} · görsel hazırlanıyor` : ""), a.gorsel ? null : maskot(a.bit, 160, true));
    const sag = el("div", "dr-sag", {},
      el("span", "dr-adimsay", { "aria-live": "polite" }, `Adım ${adim + 1} / ${d.anlat.length}`),
      parcaliIlerleme(d.anlat.length, adim, true, "Anlatım"),
      konusmaBalonu({ metin: a.metin, seslendirme: a.seslendirme, hal: a.bit, ses, olay: aktifGorsel?.olay }));
    let gecebilir = !a.soru || soruCozuldu.has(adim);
    const ileriBtn = dugme({ metin: son ? "Anlatımı bitir" : "İleri", tur: "ana", ikon: son ? "tamam" : "ileri", ikonSonda: true, id: "dr-ileri" }) as HTMLButtonElement;
    if (a.soru) {
      const q = a.soru, geri = el("div", "", { "aria-live": "polite" });
      const secenekler = el("div", "dr-secenekler", { role: "group", "aria-label": q.soru });
      q.secenekler.forEach((sc) => {
        const b = el("button", "", { type: "button", "aria-pressed": "false" }, sc.metin);
        b.addEventListener("click", () => {
          secenekler.querySelectorAll("button").forEach((x) => { x.setAttribute("aria-pressed", "false"); x.classList.remove("dogru", "yanlis"); });
          b.setAttribute("aria-pressed", "true"); b.classList.add(sc.dogru ? "dogru" : "yanlis");
          if (sc.dogru) { soruCozuldu.add(adim); gecebilir = true; ileriBtn.disabled = false; geri.replaceChildren(konusmaBalonu({ metin: "Doğru! " + q.aciklama, hal: "seviniyor", ses, kendiliginden: false })); }
          else geri.replaceChildren(konusmaBalonu({ metin: "Tam değil. Anlatımı bir daha düşün ve tekrar seç.", hal: "sasiriyor", ses, kendiliginden: false }));
          geri.dataset.sonuc = sc.dogru ? "dogru" : "yanlis";
        });
        secenekler.append(b);
      });
      sag.append(el("div", "s2-kart dr-soru", { id: "dr-soru" }, el("h3", "s2-baslik", {}, "Anladın mı?"), el("p", "", { style: "margin:0;font-weight:700" }, q.soru), secenekler, geri));
    }
    ileriBtn.disabled = !gecebilir;
    ileriBtn.addEventListener("click", () => {
      if (!gecebilir) return;
      if (son) { ilerle({ anlat: { adim, bitti: true } }); bolum = bolumAcik(durum(), "dene", { ogretmen, deneyVar }) ? "dene" : "anlat"; }
      else { adim++; ilerle({ anlat: { adim, bitti: false } }); }
      ciz();
    });
    const geriBtn = dugme({ metin: "Geri", ikon: "geri", id: "dr-geri", devreDisi: adim === 0 });
    geriBtn.addEventListener("click", () => { if (adim > 0) { adim--; ciz(); } });
    sag.append(el("div", "dr-gezinti", {}, geriBtn, ileriBtn));
    return el("section", "dr-anlat", { "aria-label": "Anlat" }, gorsel, sag);
  };

  /* ---------- Dene ---------- */
  const deneme = () => {
    const kap = el("section", "s2-kart dr-kart", { "aria-label": "Dene" }, el("h2", "s2-baslik", {}, "Dene"), konusmaBalonu({ metin: d.dene.yonerge, hal: "ipucu", ses }));
    const bilesen = DENEY_BILESENLERI[d.dene.bilesen];
    if (!bilesen) {
      kap.append(bildirim("bilgi", "Bu deney hazırlanıyor.", " Şimdilik göreve geçebilirsin; deney eklenince ders tamamlanabilecek."),
        el("div", "dr-son", {}, dugme({ metin: "Göreve geç", tur: "mor", ikon: "ileri", ikonSonda: true, id: "dr-goreve" })));
      kap.querySelector("#dr-goreve")!.addEventListener("click", () => { bolum = "gorev"; ciz(); });
      return kap;
    }
    /* farklı değerler bu oturumda sayılır; kayıttaki sayı (önceki oturum) altına düşülmez */
    const gorulen = new Set<string>();
    const kayitli = () => dp.kayit(d.kimlik).dene?.degerler ?? 0;
    const sayac = el("p", "dr-adimsay dr-denendi", { "aria-live": "polite" }, "");
    const yaz = () => { sayac.textContent = `${Math.min(Math.max(gorulen.size, kayitli()), d.dene.enAzFarkliDeger)} / ${d.dene.enAzFarkliDeger} denendi`; };
    const sonBlok = () => {
      if (kap.querySelector("#dr-goreve")) return;
      const b = el("div", "dr-son", {}, bildirim("basari", "Deneme tamam.", " Şimdi görev seni bekliyor."), dugme({ metin: "Göreve geç", tur: "mor", ikon: "ileri", ikonSonda: true, href: "#ders/" + d.kimlik, id: "dr-goreve" }));
      b.querySelector("#dr-goreve")!.addEventListener("click", (e) => { e.preventDefault(); bolum = "gorev"; ciz(); icerik.focus({ preventScroll: true }); });
      kap.append(b);
    };
    yaz();
    kap.append(sayac, bilesen(d.dene.ayar, (v) => {
      const once = durum();
      gorulen.add(String(v));
      if (gorulen.size > kayitli()) ilerle({ dene: { degerler: gorulen.size, bitti: gorulen.size >= d.dene.enAzFarkliDeger } });
      yaz();
      const simdi = durum();
      /* deney sürerken içerik yeniden kurulmaz (öğrencinin elindeki robot kaybolmasın); yalnız üst kısım ve bitiş bildirimi */
      if (simdi.dene && !once.dene) {
        if (simdi.bitti) { ciz(); return; }
        ustBolum(); sonBlok();
      }
    }));
    if (durum().dene) sonBlok();
    return kap;
  };

  /* ---------- Görev ---------- */
  const gorev = () => {
    const kap = el("section", "s2-kart dr-kart", { "aria-label": "Görev" }, el("h2", "s2-baslik", {}, "Görev"));
    const g = d.gorev;
    if (g.tur === "lab") {
      const y = labYildizi(d);
      kap.append(konusmaBalonu({ metin: g.yonerge, hal: "anlatiyor", ses }),
        el("div", "dr-son", {}, yildizlar(3, y), el("span", "", { style: "font-weight:800", id: "dr-gorev-yildiz" }, y ? `${y} / 3 yıldız` : "Henüz yıldız yok"),
          dugme({ metin: y ? "Lab'da tekrar dene" : "Lab'da aç", tur: "ana", ikon: "oynat", ikonSonda: true, href: `lab/#${g.modul}/${g.gorev}`, id: "dr-lab" })));
      if (y && !durum().dene) kap.append(bildirim("ipucu", "Görev tamam.", " Dersi bitirmek için Dene bölümü de bitmeli."));
    } else kap.append(bildirim("bilgi", "Bu görev hazırlanıyor.", ""));
    return kap;
  };

  /* ---------- Gerçek robotta ---------- */
  const gercek = () => {
    const kap = el("section", "s2-kart dr-kart dr-etkinlik", { "aria-label": "Gerçek robotta" }, el("h2", "s2-baslik", {}, `Gerçek robotta · ${d.ad}`));
    const gr = d.gercek;
    if (!gr) { kap.append(el("p", "", {}, "Bu dersin sınıf etkinliği yok.")); return kap; }
    const yapti = !!dp.kayit(d.kimlik).gercek?.ogrenci || onayli(d);
    kap.append(
      el("div", "", {}, el("h3", "s2-baslik", { style: "margin:0 0 6px" }, "Malzeme"), el("ul", "", {}, ...gr.malzeme.map((m) => el("li", "", {}, `${m.adet} × ${PARCALAR[m.parca] ?? m.parca}`)))),
      el("div", "", {}, el("h3", "s2-baslik", { style: "margin:0 0 6px" }, "Adımlar"),
        el("ol", "dr-adimlar", {}, ...gr.adimlar.map((a, i) => el("li", "", {}, el("label", "", {}, el("input", "", { type: "checkbox", id: `dr-a${i}` }), el("span", "", {}, `${i + 1}. ${a}`)))))),
      gr.guvenlik ? bildirim("ipucu", "Güvenlik", " " + gr.guvenlik) : el("span"));
    if (ogretmen && gr.ogretmenNotu) kap.append(el("p", "dr-ogretmen", { id: "dr-ogretmen-notu" }, el("b", "", {}, "Öğretmen notu: "), gr.ogretmenNotu));
    const yaptim = dugme({ metin: yapti ? "Sınıfta yaptın" : "Sınıfta yaptım", tur: yapti ? "ikincil" : "ana", ikon: "tamam", id: "dr-yaptim" }) as HTMLButtonElement;
    yaptim.setAttribute("aria-pressed", String(yapti));
    yaptim.addEventListener("click", () => { if (!yapti) { ilerle({ gercek: { ogrenci: true } }); ciz(); } });
    const yazdir = dugme({ metin: "Yazdır", ikon: "panel", id: "dr-yazdir" });
    yazdir.addEventListener("click", () => print());
    kap.append(el("div", "dr-son dr-yazdirma", {}, yaptim, yazdir, yapti ? hap("+20 XP", "sari", "yildiz") : null));
    if (onayli(d)) kap.append(el("div", "dr-onay", { id: "dr-onay" }, bildirim("basari", "Öğretmenin onayladı.", " Bu etkinliği sınıfta yaptığını öğretmenin gördü."), hap(`+${XP.onay} XP`, "yesil", "yildiz")));
    return kap;
  };

  /* ---------- bitiş ---------- */
  const bitisPaneli = () => {
    const s = durum(), xp = dersXp(s);
    const sira = modul ? modul.dersler.findIndex((x) => x.anahtar === d.kimlik) : -1;
    const sonraki = modul && sira >= 0 ? modul.dersler[sira + 1] : undefined;
    return el("section", "s2-kart s2-kart--lavanta dr-bitti", { id: "dr-bitti", "aria-label": "Ders bitti" },
      konusmaBalonu({ metin: oncekiBitti ? `Bu dersi bitirdin. Bu dersten ${xp} XP kazandın.` : `Harika, dersi bitirdin! ${xp} XP kazandın.`, hal: "seviniyor", ses, kendiliginden: false }),
      el("div", "dr-son", {}, sonraki ? dugme({ metin: `Sıradaki: ${sonraki.ad}`, tur: "ana", ikon: "ileri", ikonSonda: true, href: sonraki.adres, id: "dr-sonraki" }) : null,
        dugme({ metin: "Atölyeye dön", href: `#atolye/${d.atolye}` })));
  };

  /* klavye: ← → anlatımda gezinme (yazı alanında değilken) */
  if (klavye) removeEventListener("keydown", klavye);
  klavye = (e) => {
    if (!document.body.contains(icerik)) { removeEventListener("keydown", klavye!); klavye = null; return; }
    if (bolum !== "anlat" || e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "ArrowRight") { const b = document.getElementById("dr-ileri") as HTMLButtonElement | null; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    if (e.key === "ArrowLeft") { const b = document.getElementById("dr-geri") as HTMLButtonElement | null; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
  };
  addEventListener("keydown", klavye);
  /* Lab'dan dönünce (sekme ya da geri) yıldızları yeniden oku */
  addEventListener("pageshow", () => { if (document.body.contains(icerik)) ciz(); });
  /* öğretmen onayı sunucudan gelince: deney sürüyorsa içerik bozulmasın diye yalnız üst kısım yenilenir */
  const onayYenile = () => void onaylariOku().then((degisti) => {
    if (!degisti || !document.body.contains(icerik)) return;
    if (bolum === "dene") ustBolum(); else ciz();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && document.body.contains(icerik)) { ciz(); onayYenile(); } });
  ciz();
  onayYenile();
  return true;
}
