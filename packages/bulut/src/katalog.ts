/* Kurslar ve platformdaki yerleri. Öğrenci girişinde sınıfın kursu buradan bir adrese çevrilir. */
export type KursKimligi = "ilkokul" | "junior" | "ortaokul";
export const KURS_KIMLIKLERI: readonly KursKimligi[] = ["ilkokul", "junior", "ortaokul"];

export interface KursBilgisi {
  kimlik: KursKimligi;
  ad: string;
  siniflar: string;
  /** Platform kökünden göreli adres; null → henüz yayında değil. */
  yol: string | null;
}

export const KURSLAR: Record<KursKimligi, KursBilgisi> = {
  ilkokul: { kimlik: "ilkokul", ad: "Blok Atölyesi", siniflar: "1–3. sınıf", yol: null },
  junior: { kimlik: "junior", ad: "Python Atölyesi Junior", siniflar: "4–6. sınıf", yol: "junior/" },
  ortaokul: { kimlik: "ortaokul", ad: "Python Atölyesi", siniflar: "Ortaokul", yol: "ortaokul/" }
};

export function kursMu(x: unknown): x is KursKimligi {
  return typeof x === "string" && (KURS_KIMLIKLERI as readonly string[]).includes(x);
}

/** Bir kursun öğretmen paneline giden adres (kursların kendi panelleri; birleşik panel P4'te). */
export function panelYolu(kurs: KursKimligi, sinifId?: string): string | null {
  const yol = KURSLAR[kurs].yol;
  if (!yol) return null;
  if (kurs === "junior") return yol + (sinifId ? "#panel/" + encodeURIComponent(sinifId) : "#panel");
  return yol;
}
