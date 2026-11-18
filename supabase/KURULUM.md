# Demo projesi kurulumu

Platformun demosu **ayrı bir Supabase projesinde** çalışır. Gerçek öğrencilerin bulunduğu projeye hiçbir şey yapılmaz.

1. [supabase.com](https://supabase.com) → **New project** → ad: `platform-demo`. Ücretsiz katman yeterli.
2. **Authentication → Sign In / Providers**: *Email* açık; *Allow anonymous sign-ins* **açık** (öğrenci girişi anonim oturumla çalışır).
   Demo için *Confirm email* kapatılabilir; açık kalırsa öğretmen hesabı açarken gelen e-postadaki bağlantıya tıklanır.
3. **SQL Editor → New query**, sırayla üç dosyanın tamamını yapıştırıp **Run**:
   1. `kurslar/ortaokul/site/supabase/kurulum.sql`
   2. `kurslar/junior/supabase/junior.sql`
   3. `supabase/platform.sql`

   Ardından kurum kodunu belirle (kendi kodunla değiştir):
   ```sql
   insert into public.ayarlar (anahtar, deger) values ('kurum_kodu', 'DEMO-KURUM-KODU')
   on conflict (anahtar) do update set deger = excluded.deger;
   ```
4. `ayarlar/platform.ornek.json` dosyasını `ayarlar/platform.json` adıyla kopyala; **Project Settings → API Keys** sayfasındaki proje adresini ve **publishable** anahtarı yaz.
   (Secret / service_role anahtarı asla kullanılmaz; derleme betiği bunu ve gerçek projeyi reddeder.)
5. `npm run demo` → `http://localhost:4173/#giris` → **Öğretmenim → Hesap aç** ile demo öğretmen hesabını aç, kurum kodunu gir.
6. `supabase/ornek-veri.sql` içindeki e-postayı bu hesapla değiştirip SQL Editor'de çalıştır. Üç örnek sınıf ve uydurma takma adlı öğrenciler eklenir:

   | Sınıf kodu | Kurs | Öğrenci / PIN |
   |---|---|---|
   | JNR123 | Junior | Ece 1234 · Deniz 2345 · Kuzey 3456 |
   | ORT456 | Ortaokul | Mert 5678 · Ada 6789 |
   | BLK789 | Blok Atölyesi | Bulut 1111 |
