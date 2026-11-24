# 10 dakikalık sunum akışı

Bu akış uçtan uca testlerle aynı sırayla doğrulanır (`test/e2e.mjs`). Deneme modundaki öğrenci ve öğretmenler uydurmadır; bunu sunumda açıkça söyle.

## Hazırlık (sunumdan önce, 5 dakika)

1. Bilgisayarda Node.js 20 ya da üstü kurulu olmalı.
2. Seçeneklerden biri:
   - **Demo paketi:** GitHub → Actions → son yeşil çalışma → *demo-paketi* dosyasını indir, aç, `BASLAT.txt`'deki komutu çalıştır.
   - **Depodan:** `npm install` ve `npm run demo:deneme`.
3. Tarayıcıda `http://localhost:4173` adresini aç. Tam ekran yap (F11).
4. Bir önceki provadan kalan ilerlemeyi silmek için tarayıcının geliştirici araçlarından *Application → Clear site data* yap. Ya da gizli pencere kullan.

Deneme hesapları giriş ekranında yazar:

| Kim | Giriş |
|---|---|
| Junior öğrencisi | JNR123 · Ece · 1234 |
| Ortaokul öğrencisi | ORT456 · Mert · 5678 |
| İlkokul öğrencisi | BLK789 · Ada · 1111 |
| Öğretmen | ogretmen@deneme.com · deneme123 |
| Müdür | mudur@deneme.com · deneme123 |

## Akış

| Dk | Ekran | Yap | Söyle |
|---|---|---|---|
| 0–1 | Karşılama | Kartları göster | "Akademinin bütün yaş grupları tek adreste: üç kurs ve bir robot laboratuvarı." |
| 1–3 | Blok Atölyesi | Giriş → BLK789 · Ada · 1111 → bölüm 1-1: iki "ileri git" → Başlat. Sonra "Bunun Python'u". | "Okumayı yeni söken çocuk için yönergeler sesli. Blokların Python karşılığını da görüyor; Junior'a geçince aynı komutları tanıyacak." |
| 3–5 | Lab · Kar Küreme | Kartlardan Robotik Laboratuvarı → Kar Küreme → Görev 1: `for i in range(4): ileri()` → Çalıştır. Bir hata yap (`ileri(`) ve Türkçe mesajı göster. | "Tinkercad'de devreyi kuruyoruz; burada robotun karar vermesini öğretiyoruz. Python tarayıcıda çalışıyor, hata mesajları Türkçe ve satır numaralı." |
| (+1) | Lab · SiroLine 3D | Robotik Laboratuvarı → Çizgi İzleyen Robot → İlk tur → Pistte dene → kamera "Takip" | "Bu, akademinin sattığı SiroLine. Çocuk sensörleri okuyor, motorları Python'la yönetiyor; aynı mantık masadaki robotta da çalışıyor." (Süre yetmezse Lig adımını kısalt.) |
| 5–7 | Lab · Mini Sumo Ligi | Mini Sumo Ligi → Turnuvayı başlat → bir maçın rauntlarını izle → rakiplerden "Kurnaz"ın kodunu aç | "Akademinin Kenshin'i ringde. Her çocuğun kodu bir robot; öğretmen tahtada sınıf turnuvası başlatır. Maçlar her seferinde aynı sonucu verir, tekrar izlenebilir." |
| (+1) | Lab · Labirent Ustası | Labirent Ustası → 6. görev "MEB pisti" → sağ el kuralını yapıştır → Çalıştır (2×) | "Pist MEB Labirent Ustası ölçülerinde. Çocuk önce sağ el kuralını öğreniyor, sonra çözemediği 'ada' labirentinde hafızalı aramaya geçiyor. RizBot modeli ürün fotoğraflarından." |
| 7–9 | Öğretmen paneli | Çıkış → öğretmen girişi → Panellerim → 5-A "Rapor" | "Hangi kazanımda zorlanıyorlar, ısı haritasında görülüyor. Başlangıç ve bitiş testi arasındaki fark ve etki büyüklüğü, akademinin velilere gösterebileceği bir rakam." (Deneme sınıfının verisinin uydurma olduğunu söyle.) |
| 9–10 | Nasıl kuruldu? | Ana sayfanın altındaki bağlantı | "Her parçası otomatik test ediliyor, çocuk verisi en az, internet olmadan da çalışıyor. Onay verirseniz canlıya almak bir sonraki adım." |

## Bir şey ters giderse

- **Ekran boş:** sayfayı yenile. Hâlâ boşsa terminaldeki sunucunun açık olduğunu kontrol et.
- **Giriş olmuyor:** deneme modunda olduğundan emin ol: giriş ekranında "Deneme modu" kutusu görünmeli. Görünmüyorsa `npm run demo:deneme` ile yeniden başlat.
- **İlerleme karıştı:** gizli pencerede aç.
