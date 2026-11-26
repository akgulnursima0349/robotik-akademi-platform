# Supabase kurulumu

Platform, Python Atölyesi ve Python Atölyesi Junior ile **aynı Supabase projesini** kullanır. Öğretmen hesapları, sınıflar ve öğrenciler ortaktır; bir kez giriş yapan öğrenci kurslar arasında yeniden giriş yapmaz.

Bütün SQL dosyaları **eklemelidir ve tekrar çalıştırılabilir**: mevcut tablolara yalnızca sütun ve fonksiyon ekler, veri silmez.

## 1. Veritabanı

**SQL Editor → New query**: aşağıdaki dosyaların her birinin tamamını yapıştır, **Run**. Sıra önemlidir:

1. `kurslar/ortaokul/site/supabase/kurulum.sql`: Python Atölyesi (öğretmenler, sınıflar, öğrenciler).
2. `kurslar/junior/supabase/junior.sql`: Junior ilerlemesi.
3. `supabase/platform.sql`: sınıfın kursu ve kursa yönlendirme. Mevcut sınıflara `kurs` sütunu eklenir; Junior ilerlemesi olan sınıflar `junior` olarak işaretlenir, diğerleri `ortaokul` kalır.
4. `supabase/lab.sql`: Robotik Laboratuvarı lig robotları.
5. `supabase/analitik.sql`: platform ilerlemesi ve öğretmen analitiği.
6. `supabase/dersler.sql`: ders motorunun ilerleme kaydı (var olan kuruluma `dersler` uygulamasını ekler).
7. `supabase/ders-onay.sql`: derslerde öğretmen onayı ve sınıf raporunda ders ilerlemesi. `analitik.sql` yeniden çalıştırılırsa bu dosya da ardından yeniden çalıştırılır (sınıf raporu fonksiyonunun son hâli buradadır).

İlk iki dosya projede zaten kuruluysa yeniden çalıştırmak zararsızdır ve son sürüme günceller.

> `supabase/ornek-veri.sql` uydurma sınıf ve öğrenciler ekler; yalnızca ayrı bir deneme projesinde kullanılır. Akademinin asıl projesinde **çalıştırılmaz**.

Kurum kodu daha önce belirlenmediyse:

```sql
insert into public.ayarlar (anahtar, deger) values ('kurum_kodu', 'KURUM-KODU')
on conflict (anahtar) do update set deger = excluded.deger;
```

## 2. Kimlik doğrulama

- **Authentication → Sign In / Providers:** *Email* açık; *Allow anonymous sign-ins* açık (öğrenci girişi anonim oturumla çalışır).
- **Authentication → URL Configuration:** sitenin yayın adresini (örneğin `https://<kullanıcı>.github.io/robotik-akademi-platform/`) *Redirect URLs* listesine ekle. Öğretmen e-posta onayı bu adrese döner.

## 3. Platform ayarı

`ayarlar/platform.ornek.json` dosyasını `ayarlar/platform.json` adıyla kopyala; **Project Settings → API Keys** sayfasındaki proje adresini ve **publishable** anahtarı yaz.

Secret / service_role anahtarı asla kullanılmaz; derleme betiği bu tür bir anahtarı reddeder.

```sh
npm run demo     # derler ve http://localhost:4173 adresinde açar
```

## Ayrı bir deneme projesi (isteğe bağlı)

Gerçek sınıflara dokunmadan denemek için ücretsiz katmanda ikinci bir proje açılabilir. Adımlar aynıdır; ardından:

1. Platformda **Öğretmenim → Hesap aç** ile öğretmen hesabı açılır.
2. `supabase/ornek-veri.sql` içindeki e-posta bu hesapla değiştirilip çalıştırılır.

Üç örnek sınıf ve uydurma takma adlı öğrenciler eklenir:

| Sınıf kodu | Kurs | Öğrenci / PIN |
|---|---|---|
| JNR123 | Junior | Ece 1234 · Deniz 2345 · Kuzey 3456 |
| ORT456 | Ortaokul | Mert 5678 · Ada 6789 |
| BLK789 | Blok Atölyesi | Bulut 1111 |
