/* Sunucu bağlantısı arayüzü. Oturum sınıfı Supabase'i doğrudan tanımaz; bu arayüz üzerinden konuşur.
   Gerçek uygulama SupabaseBaglantisi, testlerde ve deneme modunda SahteBaglanti. */
import { BulutHatasi } from "./hata";

export interface OturumBilgisi { anonim: boolean }

export interface SunucuBaglantisi {
  oturum(): Promise<OturumBilgisi | null>;
  anonimGiris(): Promise<void>;
  epostaGiris(eposta: string, sifre: string): Promise<void>;
  kaydol(eposta: string, sifre: string): Promise<{ onayGerekli: boolean }>;
  rpc<T = unknown>(ad: string, parametre?: Record<string, unknown>): Promise<T>;
  cikis(): Promise<void>;
}

/** Üç uygulamanın (portal, Junior, ortaokul) aynı oturumu görmesi için ortak anahtar. */
export const ORTAK_OTURUM_ANAHTARI = "sra-platform-auth";

export class SupabaseBaglantisi implements SunucuBaglantisi {
  private istemci: Promise<import("@supabase/supabase-js").SupabaseClient>;

  constructor(url: string, anahtar: string, oturumAnahtari = ORTAK_OTURUM_ANAHTARI) {
    this.istemci = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, anahtar, { auth: { persistSession: true, autoRefreshToken: true, storageKey: oturumAnahtari } }));
  }

  /** Supabase cevabı: hata varsa BulutHatasi fırlat, yoksa veriyi döndür. */
  private static ac<R extends { data: unknown; error: { message: string } | null }>(r: R): NonNullable<R["data"]> {
    if (r.error) throw new BulutHatasi(r.error.message);
    return r.data as NonNullable<R["data"]>;
  }

  async oturum(): Promise<OturumBilgisi | null> {
    const sb = await this.istemci;
    const s = SupabaseBaglantisi.ac(await sb.auth.getSession()).session as { user?: { is_anonymous?: boolean } } | null;
    return s ? { anonim: !!s.user?.is_anonymous } : null;
  }
  async anonimGiris(): Promise<void> {
    SupabaseBaglantisi.ac(await (await this.istemci).auth.signInAnonymously());
  }
  async epostaGiris(eposta: string, sifre: string): Promise<void> {
    SupabaseBaglantisi.ac(await (await this.istemci).auth.signInWithPassword({ email: eposta, password: sifre }));
  }
  async kaydol(eposta: string, sifre: string): Promise<{ onayGerekli: boolean }> {
    const r = SupabaseBaglantisi.ac(await (await this.istemci).auth.signUp({
      email: eposta, password: sifre, options: { emailRedirectTo: location.href.split("#")[0] + "#giris" }
    })) as { session: unknown };
    return { onayGerekli: !r.session };
  }
  async rpc<T>(ad: string, parametre: Record<string, unknown> = {}): Promise<T> {
    return SupabaseBaglantisi.ac(await (await this.istemci).rpc(ad, parametre)) as T;
  }
  async cikis(): Promise<void> {
    await (await this.istemci).auth.signOut();
  }
}
