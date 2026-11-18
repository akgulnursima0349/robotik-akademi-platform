# Faz P1 · Portal ve ortak çatı

Plan: [Sivas Robotik Akademi Eğitim Platformu · Plan](https://claude.ai/artifact/NZsfGAatcHYeWaDZbfjojP)

## Amaç

Tek adresten açılan bir karşılama ekranı kuruyoruz. Çocuk kursunu seçiyor ya da giriş yapınca kendi kursuna gidiyor. Yayındaki iki site (Python Atölyesi Junior ve ortaokul Python Atölyesi) bu çatının altına **bozulmadan** bağlanıyor. Lab ve Blok Atölyesi bu fazda yok; yalnızca yerleri hazırlanıyor.

## Mimari kararlar

1. **Tek depo, npm workspaces.**

   ```
   apps/portal          karşılama, kurs seçimi, tek giriş (Vite + TypeScript)
   packages/tasarim     ortak tasarım sistemi: renk/yazı/boşluk değişkenleri, düğme, kart, ikon, logo
   packages/bulut       Supabase istemcisi, oturum, rol ve kurs bilgisi (TypeScript, sınıflarla)
   kurslar/junior       python-atolyesi-junior   (git submodule, sabit commit)
   kurslar/ortaokul     python-atolyesi          (git submodule, sabit commit)
   ```

   Lab (P2) ve Blok Atölyesi (P3) sonra `apps/lab` ve `apps/blok` olarak eklenir.

2. **Mevcut siteler kopyalanmaz, submodule olarak bağlanır.**
   - İki site kendi depolarında, kendi yayınlarıyla yaşamaya devam eder.
   - Platform derlemesi onları `--base` ile derleyip tek çıktıya koyar:
     - `dist/`: portal;
     - `dist/junior/`;
     - `dist/ortaokul/`.
   - İki sitenin `base: "./"` ayarı sayesinde alt klasörde değişiklik gerekmeden çalışırlar.

3. **Tek giriş = aynı adres + ortak oturum anahtarı.**
   - Üç uygulama aynı adresten (origin) açıldığı için aynı Supabase oturumunu paylaşabilir.
   - Bunun için iki sitede **geriye uyumlu tek küçük değişiklik** yapılır: Supabase `storageKey` ayarlar dosyasından okunabilir olur.
     - `AYAR.storageKey` verilmezse bugünkü anahtarlar kullanılmaya devam eder.
     - Yayındaki siteler bu yüzden hiç etkilenmez.
   - Platformun ayar dosyası üçüne de aynı anahtarı (`sra-platform-auth`) verir.

4. **Öğrenciyi kursuna yönlendirme.**
   - Sınıflara bir `kurs` bilgisi eklenir: `ilkokul` | `junior` | `ortaokul`.
   - Değişiklik eklemelidir (additive): yeni sütunun varsayılanı `ortaokul`. Junior sınıfları göç betiğinde `junior` yapılır; göç, `junior_ilerleme` kaydı olan sınıflara bakarak karar verir.
   - Yeni RPC `platform_ben()`, giriş yapan kişinin rolünü ve öğrenciyse sınıfının kursunu döndürür.
   - SQL `supabase/platform.sql` dosyasında durur, ayrıca `KURULUM.md` yazılır.

5. **Demo ayrı bir Supabase projesinde.**
   - Demo, gerçek öğrencilerin bulunduğu projeye bağlanmaz. Ücretsiz katmanda ayrı bir "platform-demo" projesi açılır; içine kurulum.sql, junior.sql ve platform.sql çalıştırılır ve örnek sınıf verisi yüklenir.
   - Böylece tek giriş gerçekten çalışır ve gerçek çocuk verisi hiç görünmez.
   - Gerçek projeye `platform.sql` ancak canlıya geçişte (P6) uygulanır.

6. **Yerel (internetsiz) mod.** Ayar dosyası boşsa portal hesapsız çalışır; kurs kartlarından doğrudan kursa girilir, kurslar kendi yerel modlarındadır. İnternetsiz tek giriş (sahte sunucu) P5'e kaldı.

7. **TypeScript ve nesne yönelimli çekirdek.** `packages/bulut`:
   - Sınıflar: `Oturum`, `Kullanici` (soyut), `Ogrenci`, `Ogretmen`.
   - Arayüz: `KursYonlendirici`.
   - Supabase'e doğrudan değil, bir `SunucuBaglantisi` arayüzü üzerinden konuşur. Testlerde bunun sahte bir uygulaması kullanılır.

## Ekranlar

1. **Karşılama (`/`)**
   - Üstte akademi logosu ve platform adı.
   - Altında dört kart:
     - Blok Atölyesi (1–3. sınıf), "Yakında" rozetiyle;
     - Python Atölyesi Junior (4–6);
     - Python Atölyesi (ortaokul);
     - Robotik Laboratuvarı, "Yakında" rozetiyle.
   - Kartlarda kapak görseli, yaş aralığı, tek cümlelik açıklama ve "N dünya / N defter" bilgisi var.
   - Sağ üstte "Giriş yap".
2. **Giriş (`/#giris`)**
   - Junior'daki giriş akışının aynısı: öğrenci (sınıf kodu, takma ad, PIN) ya da öğretmen (e-posta, şifre).
   - Öğrenci girişte doğrudan kursuna gider.
   - Öğretmen "Panellerim" ekranına gider. Bu ekranda sınıflarının kurslara göre listesi ve ilgili kursun paneline geçiş bağlantıları bulunur. Birleşik panel P4'te gelir.
3. **Kurstan portala dönüş.** P1'de kurslara "← Platform" düğmesi eklenmez; iki siteye `storageKey` dışında dokunmamak için bu iş P5'e kalır. P1'de kurslar olduğu gibi açılır.

## Tasarım sistemi (`packages/tasarim`)

- **Temel:** Junior'ın derli toplu teması.
  - Kırmızı vurgu: `#d7262e` / `#a8141b`.
  - Düz arka plan, ince kenarlar, çizgi ikonlar (lucide).
  - Akademi logosu.
- **Değişkenler:** CSS custom properties.
  - `--sra-renk-*`, `--sra-yazi-*`, `--sra-bosluk-*`, `--sra-golge`, `--sra-kose`.
  - Açık tema yeterli; koyu tema yok.
- **Bileşenler:**
  - Düğme (ana, ikincil);
  - Kart (görselli kurs kartı);
  - Rozet;
  - Form alanı;
  - Uyarı mesajı;
  - Üst bar.
- Bileşenler sade TS fonksiyonları + CSS. Çerçeve kullanılmıyor, böylece Lab ve Blok da aynı paketi kullanabilir.
- Bir `ornekler.html` sayfası bütün bileşenleri tek ekranda gösterir. Tasarım sistemi buradan gözden geçirilir.

## Testler ve CI

- `packages/bulut` için Vitest birim testleri: rol ve kurs yönlendirmesi, hata metinleri, oturum kapanınca temizlik.
- Playwright uçtan uca testleri, masaüstü, tablet ve telefonda:
  - karşılama;
  - kart tıklayınca doğru kursun açılması (`/junior/`, `/ortaokul/`);
  - giriş formu doğrulamaları;
  - yerel modda hesapsız giriş;
  - sahte sunucuyla öğrenci girişinde doğru kursa yönlendirme.
- GitHub Actions: her push'ta kur, derle, birim ve uçtan uca testleri çalıştır.
  - **Yayın yok.** Platform henüz hiçbir yere yayınlanmıyor. Demo yerelde `npm run demo` ile açılır.

## Yapmayacaklarımız

- Junior ve ortaokul sitelerinin içeriğine, tasarımına ve testlerine dokunmayacağız. Tek istisna `storageKey`'in ayarlanabilir olması; bu değişiklik iki sitede ayrı commit olur ve o sitelerin kendi testleri geçmeden alınmaz.
- Gerçek öğrencilerin bulunduğu Supabase projesine hiçbir SQL çalıştırmayacağız.
- `service_role` anahtarı ya da herhangi bir gizli bilgi depoya girmeyecek. Depo herkese açık; ayar dosyasında yalnızca yayınlanabilir (publishable) anahtar olur, o da demo projesine ait.
- Gerçek çocuk adı ya da verisi örnek veriye girmeyecek.
- Lab, Blok Atölyesi, birleşik panel ve analitik bu fazda yapılmayacak.
- Ücretli hiçbir servise geçilmeyecek; platform hiçbir yere yayınlanmayacak.

## Bitti tanımı

- [ ] `npm install && npm run demo` temiz bir bilgisayarda portalı, Junior'ı ve ortaokul sitesini tek adresten açıyor.
- [ ] Karşılama ekranı masaüstü, tablet ve telefonda göz kontrolünden geçti (ekran görüntüsü).
- [ ] Demo projesiyle öğrenci girişi öğrenciyi doğru kursa götürüyor; kursta tekrar giriş istenmiyor (tek giriş).
- [ ] Öğretmen girişi "Panellerim" ekranını açıyor ve kurs panellerine geçiş çalışıyor.
- [ ] Ayar dosyası boşken her şey hesapsız çalışıyor.
- [ ] İki sitedeki `storageKey` değişikliği yayındaki siteleri etkilemedi (o sitelerin testleri yeşil).
- [ ] `ornekler.html` bütün bileşenleri gösteriyor.
- [ ] Birim ve uçtan uca testler GitHub Actions'ta yeşil.

## Senden gerekenler (başlamadan önce değil, giriş adımına gelince)

1. Ücretsiz katmanda yeni bir Supabase projesi aç: "platform-demo". Bana yalnızca URL'sini ve publishable anahtarını ver.
2. Hazırlayacağım SQL dosyalarını o projenin SQL Editor'ünde çalıştır.
