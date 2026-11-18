/* Sunucudan gelen hata kodlarını çocuk ve öğretmen için sade Türkçe cümlelere çevirir.
   Teknik ayrıntı kullanıcıya gösterilmez; yalnızca konsola yazılır. */
export class BulutHatasi extends Error {
  constructor(readonly kod: string, mesaj?: string) {
    super(mesaj ?? kod);
    this.name = "BulutHatasi";
  }
}

const MESAJ: Record<string, string> = {
  gecersiz_giris: "Sınıf kodu, takma ad ya da PIN hatalı. Kontrol edip tekrar dene.",
  cok_deneme: "Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar dene ya da öğretmenine sor.",
  kurum_kodu_hatali: "Kurum kodu geçersiz.",
  yetki_yok: "Bu işlem için yetkiniz bulunmuyor.",
  oturum_yok: "Oturumun süresi doldu. Lütfen yeniden giriş yap.",
  giris_gerekli: "Bu işlem için giriş yapmanız gerekiyor.",
  ogretmen_hesabi: "Bu tarayıcıda açık bir öğretmen oturumu var. Öğrenci girişi için önce çıkış yapın.",
  kurs_gecersiz: "Bu kurs bulunamadı.",
  veri_gecersiz: "Robotun adı 1–40 karakter, kodu en fazla 4000 karakter olmalı.",
  pasif: "Bu hesabın erişimi kurum yöneticisi tarafından kapatılmış.",
  ag: "Sunucuya bağlanılamadı. İnternet bağlantısını kontrol edip tekrar dene.",
  "Invalid login credentials": "E-posta adresi veya şifre hatalı.",
  "Email not confirmed": "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki doğrulama bağlantısını kullanın.",
  "User already registered": "Bu e-posta adresiyle kayıtlı bir hesap zaten var."
};

export function hataMetni(e: unknown): string {
  const k = e instanceof BulutHatasi ? e.kod : e instanceof Error ? e.message : String(e);
  for (const a of Object.keys(MESAJ)) if (k.includes(a)) return MESAJ[a];
  if (/fetch|network|Failed to/i.test(k)) return MESAJ.ag;
  if (/Password should be/i.test(k)) return "Şifre en az 6 karakter olmalıdır.";
  if (/rate limit|too many/i.test(k)) return "Çok sayıda istek gönderildi. Biraz bekleyip tekrar deneyin.";
  if (/anonymous/i.test(k)) return "Öğrenci girişi şu anda kullanılamıyor. Öğretmenine haber ver.";
  if (/platform_/.test(k)) return "Sistem henüz hazır değil (platform.sql kurulmamış olabilir). Öğretmenine haber ver.";
  console.error("[platform]", e);
  return "Beklenmeyen bir hata oluştu. Sayfayı yenileyip tekrar dene.";
}
