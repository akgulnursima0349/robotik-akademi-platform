/* DOM yardımcısı: tasarım sisteminin iki sürümü de kullanır (stil yüklemez). */
/** Küçük DOM yardımcısı: etiket, sınıf, özellikler ve çocuklar. */
export function el<K extends keyof HTMLElementTagNameMap>(
  etiket: K,
  sinif = "",
  ozellik: Record<string, string> = {},
  ...cocuklar: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  for (const [k, v] of Object.entries(ozellik)) e.setAttribute(k, v);
  for (const c of cocuklar) if (c) e.append(c);
  return e;
}
