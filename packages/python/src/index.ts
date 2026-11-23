/* Python köprüsü: çocuğun kodunu tarayıcıda (Skulpt) çalıştırır, robot komutlarını motora bağlar.
   - Her satırda sayaç artar; sınır aşılınca "bitmeyen döngü" hatasıyla durur.
   - Hatalar satır numarasıyla sade Türkçe cümlelere çevrilir.
   Skulpt, sayfada <script> ile (ya da testte) yüklenmiş olmalı: globalThis.Sk. */
import { degerlendir, KarKureme, Pist, RobotDurdu, turKos, type Beyin, type CizgiGorevi, type CizgiOkuma, type CizgiSonucu, type Durum, type Gorev, type GorevSonucu } from "@sra/robot-motoru";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SkTuru = any;
const Sk = (): SkTuru => {
  const s = (globalThis as any).Sk;
  if (!s) throw new Error("Python yorumlayıcısı (Skulpt) yüklenmemiş.");
  return s;
};

export interface PyHata { satir: number; mesaj: string; tur: string }
export const ADIM_SINIRI = 60000;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const kodsuz = (kod: string) => kod.replace(/("[^"\n]*"?|'[^'\n]*'?)/g, '""').replace(/#.*$/gm, "");

/** Skulpt Türkçe harfli adları kabul etmez; çocuğa önceden söyleriz. */
export function turkceAdBul(kod: string): PyHata | null {
  const satirlar = kodsuz(kod).split("\n");
  for (let i = 0; i < satirlar.length; i++) {
    const m = satirlar[i].match(/[A-Za-z_çğıöşüÇĞİÖŞÜ]*[çğıöşüÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ]*/);
    if (m) return { satir: i + 1, tur: "Ad", mesaj: `<code>${esc(m[0])}</code> adında Türkçe harf var. Değişken ve fonksiyon adlarında ç, ğ, ı, ö, ş, ü kullanmıyoruz. Tırnak içindeki yazılarda serbest.` };
  }
  return null;
}

function yazimYardimi(kod: string, satir: number): string | null {
  const s = kod.split("\n"), L = s[satir - 1] ?? "", t = L.trim();
  let pi = satir - 2;
  while (pi >= 0 && !s[pi].trim()) pi--;
  const once = pi >= 0 ? s[pi] : "";
  if (/^(for|if|elif|else|while|def)\b/.test(t) && !/:\s*(#.*)?$/.test(t)) return `Satırın sonunda iki nokta <code>:</code> eksik. <code>${esc(t.split(/[\s(]/)[0])}</code> ile başlayan satırlar <code>:</code> ile biter.`;
  if (/^(if|elif|while)\b/.test(t) && /[^=!<>]=[^=]/.test(t.replace(/"[^"]*"/g, ""))) return "Koşulda tek <code>=</code> var. Karşılaştırmak için <code>==</code> yazılır.";
  if (/^(for|if|elif|else|while|def)\b/.test(once.trim()) && /:\s*(#.*)?$/.test(once.trim()) && L.search(/\S/) <= once.search(/\S/))
    return `Girinti hatası. <code>${esc(once.trim())}</code> satırının altındaki komutlar <b>4 boşluk içeride</b> olmalı.`;
  for (const u of [t, once.trim()].map((x) => x.replace(/#.*$/, ""))) {
    if ((u.match(/"/g) ?? []).length % 2 || (u.match(/'/g) ?? []).length % 2) return "Bir tırnak işareti kapanmamış.";
    const a = (u.match(/\(/g) ?? []).length, k = (u.match(/\)/g) ?? []).length;
    if (a !== k) return `Parantez sayısı tutmuyor: ${a} açılmış, ${k} kapanmış. Komutlar <code>ileri()</code> gibi iki parantezle yazılır.`;
  }
  return null;
}

const BILINENLER = ["print", "range", "len", "ileri", "sola_don", "saga_don", "onu_acik", "onunde_kar_var", "batarya", "istasyonda_mi", "hamle", "robot"];
const yakin = (ad: string) => BILINENLER.find((k) => k !== ad && (k.replace(/_/g, "") === ad.replace(/_/g, "").toLowerCase() || k.split("").sort().join("") === ad.toLowerCase().split("").sort().join("")));

/** Skulpt ya da robot hatasını çocuğa uygun cümleye çevirir. */
export function hataCevir(e: any, satir: number, kod: string): PyHata {
  const ic = e?.nativeError ?? e;
  if (ic instanceof RobotDurdu) return { satir, tur: "Robot", mesaj: ic.message };
  if (ic?.sraMesaj) return { satir, tur: "Atölye", mesaj: ic.sraMesaj };
  let tur = "";
  try { tur = e.tp$name ?? ""; } catch { /* yok */ }
  try { if (e.traceback?.length) satir = e.traceback[0].lineno; } catch { /* yok */ }
  /* yazım hatası dosya sonunu ya da boş satırı gösteriyorsa: asıl suçlu son dolu satırdır */
  if (/SyntaxError|ParseError|TokenError|IndentationError/.test(tur) && kod) {
    const s = kod.split("\n");
    let i = Math.min(satir, s.length);
    while (i > 1 && !(s[i - 1] ?? "").trim()) i--;
    satir = i;
  }
  const ham = String(e).replace(/ on line \d+[\s\S]*$/, "");
  const ayrinti = ham.replace(/^\w+: /, "");
  let mesaj: string;
  if (tur === "NameError") {
    const ad = ayrinti.match(/name '([^']+)'/)?.[1] ?? "?";
    const y = yakin(ad);
    mesaj = `Python <code>${esc(ad)}</code> diye bir şey tanımıyor.` + (y ? ` Bunu mu demek istedin: <code>${y}()</code>?` : " Yazım hatası olabilir; büyük-küçük harf de önemli.");
  } else if (tur === "IndentationError") mesaj = yazimYardimi(kod, satir) ?? "Girinti hatası. <code>:</code> ile biten satırın altındaki komutlar 4 boşluk içeride olmalı.";
  else if (/SyntaxError|ParseError|TokenError/.test(tur)) mesaj = yazimYardimi(kod, satir) ?? "Yazım hatası. <code>:</code>, parantez ve tırnakları kontrol et.";
  else if (tur === "TypeError") mesaj = /argument/.test(ayrinti) ? "Komuta yanlış sayıda bilgi verdin. <code>ileri()</code> parantezlerin içi boş yazılır." : /not callable/.test(ayrinti) ? "Bir değeri komut gibi çağırdın. Parantezleri kontrol et." : "Bu işlem bu tip değerlerle yapılamıyor.";
  else if (tur === "IndexError") mesaj = "Listenin dışına çıktın. 3 elemanlı listede sıra numaraları 0, 1, 2'dir.";
  else if (tur === "KeyError") mesaj = `Sözlükte böyle bir anahtar yok: ${esc(ayrinti)}`;
  else if (tur === "ZeroDivisionError") mesaj = "Sıfıra bölme yapılamaz!";
  else if (tur === "AttributeError") mesaj = "Bu tipte öyle bir özellik yok. Robotun bilgilerini <code>robot[\"x\"]</code> gibi köşeli parantezle oku.";
  else mesaj = "Python bir hata verdi: " + esc(ayrinti);
  return { satir, tur: tur || "Hata", mesaj };
}

/* ---------- çalıştırıcı ---------- */
interface Calisma { aktifSatir: number; adim: number; cikti: string[]; sinir: number }
const durmaHatasi = (m: string) => Object.assign(new Error(m), { sraMesaj: m });
const DONGU_MESAJI = "Program durmadan çalıştı ve durduruldu. Hiç bitmeyen bir döngü olabilir mi? <code>while</code> koşulunun bir gün yanlış olacağından emin ol.";

function satirBul(s: any): number { let c = s, ln = 0; while (c) { if (c.$lineno != null) ln = c.$lineno; c = c.child; } return ln; }

function surdur(c: Calisma, r: any): any {
  const sk = Sk();
  while (r instanceof sk.misceval.Suspension) {
    if (r.data?.type === "Sk.debug") {
      c.aktifSatir = satirBul(r) || c.aktifSatir;
      if (++c.adim > c.sinir) throw durmaHatasi(DONGU_MESAJI);
    }
    r = r.resume();
  }
  return r;
}

function hazirla(c: Calisma, yerlesik: Record<string, unknown>) {
  const sk = Sk();
  let tampon = "";
  sk.configure({
    output: (t: string) => { tampon += t; const p = tampon.split("\n"); tampon = p.pop()!; c.cikti.push(...p); },
    read: (x: string) => { const f = sk.builtinFiles?.files[x]; if (f === undefined) throw new Error("Dosya yok: " + x); return f; },
    inputfun: () => { throw durmaHatasi("Laboratuvarda <code>input()</code> kullanmıyoruz."); },
    __future__: sk.python3, debugging: true, execLimit: null, yieldLimit: null
  });
  sk.breakpoints = () => true;
  for (const [k, v] of Object.entries(yerlesik)) sk.builtins[k] = typeof v === "function" ? new sk.builtin.func(v) : sk.ffi.remapToPy(v);
  return () => { if (tampon) c.cikti.push(tampon); tampon = ""; };
}

/** Bir Python fonksiyonu olarak çağrılan JS fonksiyonu: Python değerlerini JS'e çevirir, sonucu geri çevirir. */
export function pyIslev(f: (...a: unknown[]) => unknown) {
  return (...args: unknown[]) => {
    const sk = Sk();
    const r = f(...args.map((a) => sk.ffi.remapToJs(a)));
    return r === undefined ? sk.builtin.none.none$ : sk.ffi.remapToPy(r);
  };
}

export interface CalismaSonucu { hata: PyHata | null; cikti: string[]; modul: any }

/** Bir programı baştan sona çalıştırır. */
export function calistir(kod: string, yerlesik: Record<string, unknown> = {}, sinir = ADIM_SINIRI): CalismaSonucu {
  return calistirIc(kod, yerlesik, (c) => { c.sinir = sinir; });
}

/* ---------- Kar Küreme ---------- */
export interface KarKuremeSonucu { simler: KarKureme[]; sonuc: GorevSonucu; hata: PyHata | null; cikti: string[] }

export function karKuremeCalistir(g: Gorev, kod: string): KarKuremeSonucu {
  const simler: KarKureme[] = [];
  let hata: PyHata | null = null;
  const cikti: string[] = [];
  for (const harita of g.haritalar) {
    const sim = new KarKureme(harita, g.yon, g.batarya);
    simler.push(sim);
    let c: Calisma | null = null;
    const satirli = <T>(f: () => T) => () => { sim.satir = c?.aktifSatir ?? 0; return f(); };
    const yerlesik = {
      ileri: pyIslev(satirli(() => sim.ileri())),
      sola_don: pyIslev(satirli(() => sim.solaDon())),
      saga_don: pyIslev(satirli(() => sim.sagaDon())),
      onu_acik: pyIslev(() => sim.onuAcik()),
      onunde_kar_var: pyIslev(() => sim.onundeKarVar()),
      batarya: pyIslev(() => sim.batarya),
      istasyonda_mi: pyIslev(() => sim.istasyondaMi())
    };
    const r = calistirIc(kod, yerlesik, (cc) => { c = cc; });
    if (simler.length === 1) cikti.push(...r.cikti);
    if (r.hata) { hata = r.hata; break; }
  }
  const durma = simler.find((s) => s.durdu)?.durdu;
  const sonuc = degerlendir(g, simler, kod, hata && !durma ? "hata" : undefined);
  return { simler, sonuc, hata, cikti };
}

function calistirIc(kod: string, yerlesik: Record<string, unknown>, bagla: (c: Calisma) => void): CalismaSonucu {
  const c: Calisma = { aktifSatir: 0, adim: 0, cikti: [], sinir: ADIM_SINIRI };
  bagla(c);
  const tr = turkceAdBul(kod);
  if (tr) return { hata: tr, cikti: [], modul: null };
  const bitir = hazirla(c, yerlesik);
  let modul = null, hata: PyHata | null = null;
  try { modul = surdur(c, Sk().importMainWithBody("<lab>", false, kod, true)); }
  catch (e) { hata = hataCevir(e, c.aktifSatir, kod); }
  bitir();
  return { hata, cikti: c.cikti, modul };
}

/* ---------- Lig: def hamle(robot) ---------- */
export interface BeyinSonucu { beyin: Beyin | null; hata: PyHata | null }
export { ORNEK_ROBOTLAR, ILK_ROBOT, type OrnekRobot } from "./ornek-robotlar";
export const HAMLE_ADIM_SINIRI = 20000;

/** Çocuğun kodundan bir lig beyni üretir. Kod bir kez çalışır; her turda hamle(robot) çağrılır. */
export function pythonBeyin(kod: string): BeyinSonucu {
  const c: Calisma = { aktifSatir: 0, adim: 0, cikti: [], sinir: HAMLE_ADIM_SINIRI };
  const r = calistirIc(kod, {}, () => {});
  if (r.hata) return { beyin: null, hata: r.hata };
  const fn = r.modul?.$d?.hamle;
  if (!fn) return { beyin: null, hata: { satir: 1, tur: "Atölye", mesaj: "<code>def hamle(robot):</code> fonksiyonunu bulamadım. Robotun her turda bu fonksiyonla karar verir." } };
  const beyin: Beyin = (d: Durum) => {
    const sk = Sk();
    c.adim = 0; c.sinir = HAMLE_ADIM_SINIRI;
    try {
      const v = surdur(c, sk.misceval.callsimOrSuspendArray(fn, [sk.ffi.remapToPy(d)]));
      return v === sk.builtin.none.none$ ? "bekle" : String(sk.ffi.remapToJs(v));
    } catch (e) {
      const h = hataCevir(e, c.aktifSatir, kod);
      throw new Error(`${h.satir ? h.satir + ". satır: " : ""}${h.mesaj.replace(/<[^>]+>/g, "")}`);
    }
  };
  return { beyin, hata: null };
}

/* ---------- Çizgi izleyen (SiroLine): def dongu() ---------- */
export const DONGU_ADIM_SINIRI = 4000;
export interface CizgiCalismaSonucu { sonuc: CizgiSonucu | null; hata: PyHata | null; cikti: string[] }

/** Çocuğun kodunu bir kez çalıştırır, sonra turu 10 ms'lik dongu() çağrılarıyla koşturur. */
export function cizgiCalistir(g: CizgiGorevi, kod: string, tohum = 7): CizgiCalismaSonucu {
  const pist = new Pist(g.pist);
  let okuma: CizgiOkuma = { sensorler: new Array(8).fill(0), konum: 0, sure: 0 };
  let pwm: [number, number] = [0, 0];
  const cikti: string[] = [];
  const c: Calisma = { aktifSatir: 0, adim: 0, cikti, sinir: ADIM_SINIRI };
  const sayi = (v: unknown, ad: string) => {
    const n = Number(v);
    if (typeof v !== "number" || !Number.isFinite(n)) throw durmaHatasi(`<code>motorlar()</code> içindeki ${ad} değeri bir sayı olmalı.`);
    return n;
  };
  const yerlesik = {
    sensorler: pyIslev(() => okuma.sensorler.slice()),
    cizgi_konumu: pyIslev(() => okuma.konum),
    sure: pyIslev(() => okuma.sure),
    motorlar: pyIslev((sol, sag) => { pwm = [sayi(sol, "sol"), sayi(sag, "sağ")]; })
  };
  const tr = turkceAdBul(kod);
  if (tr) return { sonuc: null, hata: tr, cikti: [] };
  const bitir = hazirla(c, yerlesik);
  const sk = Sk();
  let modul: any;
  try { modul = surdur(c, sk.importMainWithBody("<lab>", false, kod, true)); }
  catch (e) { bitir(); return { sonuc: null, hata: hataCevir(e, c.aktifSatir, kod), cikti }; }
  const dongu = modul?.$d?.dongu, kurulum = modul?.$d?.kurulum;
  if (!dongu) { bitir(); return { sonuc: null, hata: { satir: 1, tur: "Atölye", mesaj: "<code>def dongu():</code> fonksiyonunu bulamadım. SiroLine her 10 milisaniyede bu fonksiyonu çalıştırır." }, cikti }; }
  let pyHata: PyHata | null = null;
  const cagir = (fn: any) => {
    c.adim = 0; c.sinir = DONGU_ADIM_SINIRI;
    try { surdur(c, sk.misceval.callsimOrSuspendArray(fn, [])); }
    catch (e) { pyHata = hataCevir(e, c.aktifSatir, kod); throw new Error(pyHata.mesaj); }
  };
  let ilk = true;
  const sonuc = turKos(pist, (o) => {
    okuma = o;
    if (ilk) { ilk = false; if (kurulum) cagir(kurulum); }
    cagir(dongu);
    if (cikti.length > 300) cikti.splice(0, cikti.length - 300);
    return pwm;
  }, g.sureSiniri, tohum);
  bitir();
  return { sonuc, hata: pyHata, cikti };
}
