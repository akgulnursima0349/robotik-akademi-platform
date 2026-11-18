/* Platformun çalışma modu: ayarlar.js'teki window.SRA_AYAR'dan okunur.
   - { supabaseUrl, supabaseKey }  → bulut (gerçek hesaplar, tek giriş)
   - { deneme: true }               → tarayıcı içi sahte sunucu (testler ve sunum provası)
   - {} ya da hiç                    → yerel: hesap yok, kurslara doğrudan girilir */
import { ORTAK_OTURUM_ANAHTARI, SupabaseBaglantisi, type SunucuBaglantisi } from "./baglanti";
import { SahteBaglanti, tarayiciDeposu } from "./sahte";

export interface PlatformAyari { supabaseUrl?: string; supabaseKey?: string; deneme?: boolean; storageKey?: string }
export type Mod = "bulut" | "deneme" | "yerel";

export function modBul(a: PlatformAyari | undefined): Mod {
  if (!a) return "yerel";
  if (a.deneme) return "deneme";
  return a.supabaseUrl && a.supabaseKey ? "bulut" : "yerel";
}

export function baglantiKur(a: PlatformAyari | undefined): SunucuBaglantisi | null {
  const m = modBul(a);
  if (m === "deneme") return new SahteBaglanti(tarayiciDeposu(), 120);
  if (m === "bulut") return new SupabaseBaglantisi(a!.supabaseUrl!, a!.supabaseKey!, a!.storageKey ?? ORTAK_OTURUM_ANAHTARI);
  return null;
}
