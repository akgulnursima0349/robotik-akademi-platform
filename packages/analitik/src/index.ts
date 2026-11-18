/* Öğrenme analitiği: sınıf raporundan kazanım ısı haritası, kazanım özeti, kursun etkisi, en zor bölümler,
   desteğe ihtiyacı olanlar ve CSV. Saf fonksiyonlar; arayüz ve sunucudan bağımsız, birim testli. */
import { KAZANIMLAR, FORM } from "../../../kurslar/junior/src/data/testler.js";
import { BOLUMLER, GOREVLER } from "@sra/robot-motoru";

export { KAZANIMLAR };

export interface TestKaydi { cevaplar: number[]; bitti?: boolean }
export interface RaporOgrenci {
  id: string;
  takmaAd: string;
  sonGiris: string | null;
  junior: { testler?: { on?: TestKaydi; son?: TestKaydi }; worlds?: Record<string, { stars?: number; done?: boolean }> };
  lab: { gorevler?: Record<string, { yildiz?: number; deneme?: number }> };
  blok: { yildiz?: Record<string, number>; deneme?: Record<string, number> };
}

/* ---------- kazanımlar ---------- */
export type HucreDurumu = "ogrendi" | "biliyordu" | "zorlaniyor" | "geriledi" | "yalniz_on" | "yok";
export const DURUM_ACIKLAMA: Record<HucreDurumu, { ad: string; simge: string }> = {
  ogrendi: { ad: "Öğrendi (önce yanlış, sonra doğru)", simge: "↑" },
  biliyordu: { ad: "Biliyordu (iki testte de doğru)", simge: "✓" },
  zorlaniyor: { ad: "Zorlanıyor (iki testte de yanlış)", simge: "✗" },
  geriledi: { ad: "Geriledi (önce doğru, sonra yanlış)", simge: "↓" },
  yalniz_on: { ad: "Yalnız başlangıç testi", simge: "·" },
  yok: { ad: "Test çözülmemiş", simge: "" }
};

/** Bir testin kazanım başına doğruluğu: k → true/false; çözülmemiş kazanım yok */
function kazanimDogru(tur: "on" | "son", t?: TestKaydi): Map<number, boolean> | null {
  if (!t || !t.bitti) return null;
  const m = new Map<number, boolean>();
  FORM[tur].forEach((s, i) => m.set(s.k, t.cevaplar[i] === s.dogru));
  return m;
}

export function isiHaritasi(ogrenciler: RaporOgrenci[]): { ogrenci: RaporOgrenci; hucreler: HucreDurumu[] }[] {
  return ogrenciler.map((o) => {
    const on = kazanimDogru("on", o.junior.testler?.on), son = kazanimDogru("son", o.junior.testler?.son);
    return {
      ogrenci: o,
      hucreler: KAZANIMLAR.map(({ k }): HucreDurumu => {
        if (!on) return "yok";
        if (!son) return "yalniz_on";
        const a = on.get(k)!, b = son.get(k)!;
        return a && b ? "biliyordu" : !a && b ? "ogrendi" : a && !b ? "geriledi" : "zorlaniyor";
      })
    };
  });
}

export interface KazanimSatiri { k: number; ad: string; on: number | null; son: number | null; onN: number; sonN: number }
/** Her kazanımda doğru oranı (0..1); testi çözen yoksa null */
export function kazanimOzeti(ogrenciler: RaporOgrenci[]): KazanimSatiri[] {
  const onlar = ogrenciler.map((o) => kazanimDogru("on", o.junior.testler?.on)).filter(Boolean) as Map<number, boolean>[];
  const sonlar = ogrenciler.map((o) => kazanimDogru("son", o.junior.testler?.son)).filter(Boolean) as Map<number, boolean>[];
  const oran = (l: Map<number, boolean>[], k: number) => (l.length ? l.filter((m) => m.get(k)).length / l.length : null);
  return KAZANIMLAR.map(({ k, kisa }) => ({ k, ad: kisa, on: oran(onlar, k), son: oran(sonlar, k), onN: onlar.length, sonN: sonlar.length }));
}

/* ---------- kursun etkisi ---------- */
export interface Etki {
  n: number; onOrt: number; sonOrt: number; fark: number; farkSs: number; dz: number | null;
  yorum: "küçük" | "orta" | "büyük" | "yok";
  azVeri: boolean;
}
const puan = (tur: "on" | "son", t?: TestKaydi) => { const m = kazanimDogru(tur, t); return m ? [...m.values()].filter(Boolean).length : null; };

export function kursEtkisi(ogrenciler: RaporOgrenci[]): Etki {
  const ciftler = ogrenciler.map((o) => [puan("on", o.junior.testler?.on), puan("son", o.junior.testler?.son)] as const).filter(([a, b]) => a !== null && b !== null) as [number, number][];
  const n = ciftler.length;
  if (!n) return { n: 0, onOrt: 0, sonOrt: 0, fark: 0, farkSs: 0, dz: null, yorum: "yok", azVeri: true };
  const ort = (a: number[]) => a.reduce((t, x) => t + x, 0) / a.length;
  const farklar = ciftler.map(([a, b]) => b - a);
  const fark = ort(farklar);
  const farkSs = n > 1 ? Math.sqrt(farklar.reduce((t, x) => t + (x - fark) ** 2, 0) / (n - 1)) : 0;
  const dz = farkSs > 0 ? fark / farkSs : null;
  const m = dz === null ? 0 : Math.abs(dz);
  return {
    n, onOrt: ort(ciftler.map((c) => c[0])), sonOrt: ort(ciftler.map((c) => c[1])), fark, farkSs, dz,
    yorum: dz === null ? "yok" : m >= 0.8 ? "büyük" : m >= 0.5 ? "orta" : "küçük",
    azVeri: n < 5
  };
}

/* ---------- en zor bölümler ---------- */
export interface ZorBolum { uygulama: "blok" | "lab"; kimlik: string; ad: string; deneyen: number; ortDeneme: number; bitirmeOrani: number; zorluk: number }
export function enZorBolumler(ogrenciler: RaporOgrenci[], adet = 5): ZorBolum[] {
  const satirlar: ZorBolum[] = [];
  const ekle = (uygulama: "blok" | "lab", kimlik: string, ad: string, kayit: { deneme: number; bitti: boolean }[]) => {
    const deneyen = kayit.filter((x) => x.deneme > 0);
    if (!deneyen.length) return;
    const ortDeneme = deneyen.reduce((t, x) => t + x.deneme, 0) / deneyen.length;
    const bitirmeOrani = deneyen.filter((x) => x.bitti).length / deneyen.length;
    satirlar.push({ uygulama, kimlik, ad, deneyen: deneyen.length, ortDeneme, bitirmeOrani, zorluk: ortDeneme * (1 - bitirmeOrani + 0.1) });
  };
  for (const b of BOLUMLER) ekle("blok", b.kimlik, `Blok ${b.kimlik} · ${b.ad}`, ogrenciler.map((o) => ({ deneme: o.blok.deneme?.[b.kimlik] ?? 0, bitti: (o.blok.yildiz?.[b.kimlik] ?? 0) > 0 })));
  for (const g of GOREVLER) ekle("lab", g.kimlik, `Lab ${g.sira} · ${g.ad}`, ogrenciler.map((o) => ({ deneme: o.lab.gorevler?.[g.kimlik]?.deneme ?? 0, bitti: (o.lab.gorevler?.[g.kimlik]?.yildiz ?? 0) > 0 })));
  return satirlar.sort((a, b) => b.zorluk - a.zorluk || a.ad.localeCompare(b.ad, "tr")).slice(0, adet);
}

/* ---------- desteğe ihtiyacı olanlar ---------- */
export interface Destek { ogrenci: RaporOgrenci; gerekceler: string[] }
export function destekGerekenler(ogrenciler: RaporOgrenci[], simdi = new Date()): Destek[] {
  const r: Destek[] = [];
  for (const o of ogrenciler) {
    const g: string[] = [];
    if (!o.sonGiris) g.push("Henüz hiç giriş yapmadı");
    else {
      const gun = Math.floor((simdi.getTime() - new Date(o.sonGiris).getTime()) / 864e5);
      if (gun > 7) g.push(`${gun} gündür giriş yapmadı`);
    }
    const a = puan("on", o.junior.testler?.on), b = puan("son", o.junior.testler?.son);
    if (a !== null && b !== null && b < a) g.push(`Bitiş testinde geriledi (${a} → ${b})`);
    for (const bl of BOLUMLER) { const d = o.blok.deneme?.[bl.kimlik] ?? 0; if (d > 5 && !(o.blok.yildiz?.[bl.kimlik])) g.push(`Blok ${bl.kimlik} bölümünde ${d} denemedir takılı`); }
    for (const gr of GOREVLER) { const x = o.lab.gorevler?.[gr.kimlik]; if ((x?.deneme ?? 0) > 5 && !x?.yildiz) g.push(`Lab "${gr.ad}" görevinde ${x!.deneme} denemedir takılı`); }
    if (g.length) r.push({ ogrenci: o, gerekceler: g });
  }
  return r;
}

/* ---------- CSV ---------- */
const hucre = (v: string | number | null) => { const s = v === null ? "" : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** Excel'in Türkçe ayarı için ';' ayraç, ondalık virgül ve UTF-8 BOM */
export function csv(ogrenciler: RaporOgrenci[]): string {
  const ondalik = (x: number | null) => (x === null ? "" : String(Math.round(x * 100) / 100).replace(".", ","));
  const bas = ["Takma ad", "Son giriş", "Başlangıç testi", "Bitiş testi", "Fark", ...KAZANIMLAR.map((k) => `K${k.k} ${k.kisa}`), "Blok yıldız", "Lab yıldız"];
  const harita = isiHaritasi(ogrenciler);
  const satirlar = ogrenciler.map((o, i) => {
    const a = puan("on", o.junior.testler?.on), b = puan("son", o.junior.testler?.son);
    const blokY = Object.values(o.blok.yildiz ?? {}).reduce((t, x) => t + x, 0);
    const labY = Object.values(o.lab.gorevler ?? {}).reduce((t, x) => t + (x.yildiz ?? 0), 0);
    return [o.takmaAd, o.sonGiris ? o.sonGiris.slice(0, 10) : "", a, b, a !== null && b !== null ? ondalik(b - a) : "",
      ...harita[i].hucreler.map((h) => DURUM_ACIKLAMA[h].ad.split(" (")[0].replace("Test çözülmemiş", "")), blokY, labY];
  });
  return "﻿" + [bas, ...satirlar].map((s) => s.map(hucre).join(";")).join("\r\n") + "\r\n";
}
