# Mimari

## Genel bakış

Platform bir **npm workspaces** deposudur. Portal, Blok Atölyesi ve Robotik Laboratuvarı bu depoda; iki Python kursu kendi depolarında yaşar ve **git submodule** olarak bağlanır. Derleme betiği (`scripts/derle.mjs`) hepsini tek bir statik çıktıda toplar:

```
dist/            portal (karşılama, tek giriş, paneller)
dist/blok/       Blok Atölyesi
dist/lab/        Robotik Laboratuvarı
dist/junior/     Python Atölyesi Junior
dist/ortaokul/   Python Atölyesi
```

Çıktı tamamen statiktir. Herhangi bir statik sunucuda ya da GitHub Pages'te çalışır; sunucu tarafı kod yoktur.

## Tek giriş

- **Ortak oturum:** bütün uygulamalar aynı adresten açılır ve aynı Supabase oturum anahtarını (`sra-platform-auth`) paylaşır. Bir kez giriş yapan öğrenci kurslar arasında yeniden giriş yapmaz.
- **Yönlendirme:** `platform_ben()` RPC'si giriş yapan kişinin rolünü ve öğrenciyse sınıfının kursunu döndürür. Portal öğrenciyi kendi kursuna yönlendirir.
- **Çekirdek:** `packages/bulut` nesne yönelimlidir: `Oturum`, `Kullanici` (soyut), `Ogrenci`, `Ogretmen`, `KursYonlendirici`.
- **Bağlantı soyutlaması:** Supabase'e doğrudan değil, `SunucuBaglantisi` arayüzü üzerinden konuşulur. Bu arayüzün bir de sahte sunucu uygulaması vardır; deneme modu ve testler internetsiz çalışır.
- **Çalışma kipleri:**
  - **hesapsız:** ayar dosyası yok;
  - **deneme:** sahte sunucu ve hazır hesaplar;
  - **Supabase:** gerçek tek giriş.

## Veri ve gizlilik

- **En az veri:** öğrenci için yalnızca sınıf kodu, takma ad ve PIN tutulur. E-posta ya da gerçek ad istenmez; öğrenci girişi anonim oturumla çalışır.
- **Erişim:** tablolar satır düzeyi güvenlikle (RLS) korunur; veri, yetki denetimi yapan RPC fonksiyonları üzerinden okunup yazılır. Öğretmen kendi sınıflarının, öğrenci yalnızca kendi verisine erişir.
- **Anahtarlar:** istemcide yalnızca *publishable* anahtar bulunur. Derleme betiği gizli (secret / service_role) anahtar içeren bir ayar dosyasını reddeder.
- **Şema:** `supabase/` klasöründe: `platform.sql`, `lab.sql`, `analitik.sql`. Değişiklikler eklemelidir; mevcut kurs tabloları bozulmaz.

## Robotik Laboratuvarı

- **Deterministik simülasyonlar:** `packages/robot-motoru` DOM'suz, saf TypeScript'tir. Aynı kod her zaman aynı sonucu verir; maçlar ve koşular sunucu olmadan tekrar izlenebilir, gürültü sabit tohumludur.
  - **Kar Küreme:** ızgara dünyası, batarya ve enerji kuralları.
  - **Mini Sumo:** katı cisim fiziği, SAT çarpışma, bıçak altına girme, ışın sensörleri, üç rauntluk maç ve turnuva.
  - **Çizgi İzleyen:** diferansiyel sürüş, QTR sensör modeli, kitin PID beyni; 10 ms kontrol döngüsü, 2,5 ms fizik adımı.
  - **Labirent:** MEB Labirent Ustası ölçüleri (hücre 20 cm, duvar 18 mm). Hız profilinden süre hesabı, MEB puanlaması.
- **Python:** `packages/python`, çocuğun kodunu Skulpt ile tarayıcıda çalıştırır.
  - Her satırda adım sayar; bitmeyen döngüleri durdurur.
  - Hataları satır numarasıyla sade Türkçe cümlelere çevirir.
- **3D:** `apps/lab/src/sahne3d` (Three.js).
  - Robot modelleri kodla üretilir: Kenshin, SiroLine, RizBot. Kaynak, akademinin robotlarının fotoğrafları ve kumpas ölçüleri.
  - Ortak `Studyo` ilk saniyelerde kare hızını ölçer; düşük donanımda gölge ve çözünürlüğü kendiliğinden düşürür.
  - Three.js her ekranda ayrı yüklenir.

## Öğrenme analitiği

`packages/analitik` öğretmen paneli için hesaplar:
- bölüm ısı haritası ve kazanım özeti;
- ön/son test etki büyüklüğü;
- en zor bölümler ve destek listesi;
- CSV dışa aktarım.

Hesaplar saf fonksiyonlardır ve birim testleriyle doğrulanır.

## Testler

- **Birim:** Vitest. Simülasyonlar, Python köprüsü, analitik, oturum katmanı. Her görevin örnek çözümü otomatik çalıştırılıp yıldızları doğrulanır.
- **Veritabanı:** Postgres 16 üzerinde şema ve RLS senaryosu (`test/db`).
- **Uçtan uca:** Playwright. Masaüstü, tablet ve telefon boyutlarında; konsol hatası ve yatay taşma denetimi, ekran görüntüleri.
