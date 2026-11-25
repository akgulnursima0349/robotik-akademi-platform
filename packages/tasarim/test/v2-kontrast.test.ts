/* v2 belirteçlerindeki her yazı/zemin çiftinin kontrastı (WCAG 2.1): normal yazı 4,5:1, büyük yazı (24 px ya da 18,7 px kalın) 3:1.
   Değerler doğrudan belirtecler.css'ten okunur: bir renk değişirse bu test hemen uyarır. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/v2/belirtecler.css", import.meta.url), "utf8");
const renk = (ad: string): string => {
  if (ad.startsWith("#")) return ad;
  const m = css.match(new RegExp(`--sra2-${ad}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error("belirteç yok: " + ad);
  return m[1];
};
const parlaklik = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const kontrast = (a: string, b: string) => { const [x, y] = [parlaklik(renk(a)), parlaklik(renk(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/* [yazı, zemin, nerede] — normal yazı */
const NORMAL: [string, string, string][] = [
  ["murekkep", "krem", "gövde metni"], ["murekkep", "beyaz", "kartlar"], ["murekkep", "lavanta", "üst bant"],
  ["murekkep-2", "krem", "ikincil yazı"], ["murekkep-2", "beyaz", "kart açıklaması"], ["murekkep-2", "lavanta", "üst bant açıklaması"],
  ["#FFFFFF", "kirmizi", "ana düğme"], ["#FFFFFF", "mor", "mor düğme, seçili seviye"], ["#FFFFFF", "yesil", "biten adım"], ["#FFFFFF", "gece", "kod, seçili sekme"],
  ["#FFFFFF", "hata", "hata ikonu"], ["#FFFFFF", "bilgi", "bilgi ikonu"],
  ["murekkep", "sari-acik", "ipucu düğmesi, XP hapı"], ["murekkep", "sari", "seviye numarası, rozet"],
  ["mor-taban", "mor-acik", "mor hap"], ["yesil-taban", "yesil-acik", "yeşil hap"], ["mor", "krem", "sessiz düğme"], ["mor", "mor-acik", "sessiz düğme (üstünde)"],
  ["murekkep-acik", "gece", "kod başlığı"], ["murekkep", "basari-acik", "başarı şeridi"], ["murekkep", "hata-acik", "hata şeridi"], ["murekkep", "bilgi-acik", "bilgi şeridi"],
  ["#605B78", "#EFEAE0", "devre dışı düğme"]
];
/* büyük yazı (başlıklar) */
const BUYUK: [string, string, string][] = [["kirmizi", "lavanta", "üst bant vurgu başlığı"], ["kirmizi", "krem", "başlık vurgusu"]];

describe("v2 renk kontrastı", () => {
  for (const [y, z, n] of NORMAL) it(`${n}: ${y} / ${z} ≥ 4,5`, () => expect(kontrast(y, z)).toBeGreaterThanOrEqual(4.5));
  for (const [y, z, n] of BUYUK) it(`${n} (büyük yazı): ${y} / ${z} ≥ 3`, () => expect(kontrast(y, z)).toBeGreaterThanOrEqual(3));
});
