# Faz P2 · Robotik Laboratuvarı MVP

**Not:** Nur, P2–P5'i sırayla bitirmemi istedi ve Supabase kurulumunu sona bıraktı. Bu spec bu talimatla onaylanmış sayıldı; dönüşünde gözden geçirilecek.

## Amaç

Platformu sıradan kodlama sitelerinden ayıran ilk iki etkinlik:

- **Kar Küreme Robotu:** Bataryası sınırlı bir robotla karlı bir mahallenin sokaklarını açan, Python ile yazılmış bir program. Sivas kışından bir hikâye.
- **Sınıf Robot Ligi:** Herkesin yazdığı robot aynı arenada yarışır. Turnuva tahtada oynatılır, maçlar tekrar izlenir.

Devre, breadboard ya da Arduino yok. Bunlar Tinkercad'de kalıyor.

## Mimari

```
packages/robot-motoru   saf TypeScript simülasyon: Izgara, Robot, Gorev, Mac, Turnuva (DOM yok, Vitest ile test)
packages/python         Skulpt sarmalayıcı: kodu çalıştır, robot komutlarını motora bağla, sonsuz döngü koruması
apps/lab                Lab arayüzü: görev seçimi, kod editörü, PixiJS (WebGL) izometrik sahne, lig ekranları
```

1. **Simülasyon ve çizim ayrı.**
   - Motor, kodu çalıştırıp her adımı kaydeder (iz).
   - Sahne bu izi oynatır.
   - Aynı kod her seferinde aynı sonucu verir (deterministik). Bu sayede:
     - testler motoru doğrudan sınar;
     - tekrar izleme bedavaya gelir;
     - lig maçları sunucuya gerek kalmadan aynı sonuçla yeniden oynatılabilir.
2. **Izgara tabanlı dünya.**
   - Sokaklar karelerden oluşur. Robot bir kare ilerler ya da 90° döner.
   - Çocuklar için tahmin edilebilir; ortaokulda yine de rota ve enerji planlaması ister.
   - Sürekli fizik (PID, diferansiyel sürüş) sonraki etkinliklerde ayrı motor olarak gelir.
3. **Python, tarayıcıda (Skulpt).**
   - Ortaokul sitesinin kullandığı yorumlayıcı.
   - Kar Küreme'de program baştan sona bir kez çalışır.
   - Ligde çocuk `def hamle(robot):` yazar; motor bu işlevi her turda çağırır.
   - Sonsuz döngüye karşı adım sınırı var.
   - Hata mesajları Türkçeleştirilir: satır numarası ve sade cümle.
4. **Görsel kalite (plandaki "Görsel kalite" bölümü):**
   - PixiJS 8, izometrik 2.5D görünüm.
   - Bütün çizimler kodla üretilir; tek ve tutarlı bir stil, harici görsel dosyası yok, internetsiz çalışır.
   - Kar parçacıkları, robotun arkasında açılan yol, küreğin önünde biriken kar, batarya göstergesi, yumuşak geçişler.
   - Kamera ızgarayı ekrana sığdırır.
   - Zayıf makinede parçacık sayısı otomatik azalır. `prefers-reduced-motion` açıksa parçacık yoktur.
5. **Lig.**
   - Arena: 9×9 karlı meydan, iki robot, dağınık kar topları. 60 turda en çok kar topu toplayan kazanır.
   - Robotlar aynı kareye giremez. Kar topları sabit tohumlu rastgele dağılır (her maç tekrar oynatılabilir). Galibiyet 3, beraberlik 1 puan.
   - Turnuva: herkes herkesle bir maç (lig usulü), puan tablosu, her maçın tekrarı.
   - **Hesapsız ve deneme modu:** Çocuğun robotu, hazır yazılmış 5 örnek robota karşı yarışır.
   - **Bulut modu:**
     - Öğrenci robotunu sınıfına kaydeder (`lab_robot_kaydet`).
     - Öğretmen sınıfın robotlarını (`lab_sinif_robotlari`) tahtada yarıştırır.
     - Maçlar öğretmenin tarayıcısında hesaplanır, sunucuya yalnızca kod gider.

## Görevler (Kar Küreme)

Altı görev, kolaydan zora:

| # | Ad | Öğrettiği |
|---|---|---|
| 1 | İlk sokak | `ileri()` sıralı komut |
| 2 | Köşeyi dön | `sola_don()`, `saga_don()` |
| 3 | Uzun cadde | `for` döngüsü (her adımı ayrı yazmak satır sınırını aşar) |
| 4 | Okul yolu | döngü + dönüş, en kısa rota |
| 5 | Kar nerede? | `if onunde_kar_var():` sensör |
| 6 | Bataryayı yönet | `batarya()` okuyup şarj istasyonuna dönmek |

Her görevde:

- Hedef: belli sokakların temizlenmesi.
- Batarya sınırı ve yıldızlar:
  - 1 yıldız: bitirmek;
  - 2 yıldız: bataryanın yarısından azıyla bitirmek;
  - 3 yıldız: satır sınırının altında kalmak.
- İpucu düğmesi ve örnek çözüm (öğretmen modunda).

İlerleme cihazda saklanır (`localStorage`). Bulut senkronu P4'te analitikle birlikte gelir.

## Veritabanı (`supabase/lab.sql`, yalnızca demo projesi)

- Tablo `lab_robotlar`:
  - alanlar: `ogrenci_id` (birincil anahtar), `ad`, `kod` (en fazla 4000 karakter), `guncelleme`;
  - RLS açık, doğrudan erişim yok.
- RPC'ler:
  - `lab_robot_kaydet(p_ad, p_kod)` (öğrenci oturumu);
  - `lab_robotum()`;
  - `lab_sinif_robotlari(p_sinif)` (sınıfa erişebilen öğretmen ya da müdür; takma ad + robot adı + kod).
- Postgres senaryosuyla test edilir (P1'deki gibi).

## Yapmayacaklarımız

- Tinkercad'de olan hiçbir şey (devre, breadboard, LED, Arduino kodu).
- Sürekli fizik, PID, kamera ile robot öğretme, sürü robotlar: sonraki etkinlikler.
- Harici görsel ya da ses dosyası, ücretli kütüphane, internetten yüklenen kaynak.
- Öğrenci kodunu sunucuda çalıştırmak: kod yalnızca tarayıcıda çalışır, sunucu yalnızca metni saklar.
- Junior ve ortaokul sitelerine dokunmak.

## Bitti tanımı

- [x] Motor birim testleri:
  - hareket, dönüş, sınırlar, batarya ve kar temizleme;
  - deterministik maç (aynı kod, aynı sonuç), eşitlik kuralı, turnuva puan tablosu.
- [x] Python köprüsü testleri:
  - komutlar motora ulaşıyor;
  - sonsuz döngü durduruluyor;
  - Türkçe hata mesajı ve satır numarası doğru.
- [x] Altı Kar Küreme görevinin örnek çözümü 3 yıldız alıyor (test).
- [x] Lig: 6 robotluk turnuva oynanıyor, puan tablosu ve maç tekrarı çalışıyor.
- [x] Sahne masaüstü, tablet ve telefonda göz kontrolünden geçti.
- [ ] Kurs bilgisayarında akıcılık: **gerçek bir kurs bilgisayarında denenmeli.**
  - Ölçüm, test ortamının yazılımsal grafik sürücüsüyle (GPU yok) yapıldı: 1× hızda 33 kare/sn, 4× CPU yavaşlatmada 19 kare/sn.
  - Gerçek ekran kartında daha yüksek olması beklenir ama doğrulanmadı.
  - Sahne yalnızca durum değişince yeniden çiziliyor; kare hızı düşerse kar parçacıkları kendiliğinden azalıyor.
- [x] Portal kartı "Robotik Laboratuvarı" artık açık ve `/lab/` adresine gidiyor.
- [x] `lab.sql` Postgres senaryosu geçiyor.
- [x] Bütün testler GitHub Actions'ta yeşil.
