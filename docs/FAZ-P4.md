# Faz P4 · Öğrenme analitiği

**Not:** Nur'un "hepsini adım adım bitir" talimatıyla onaylanmış sayıldı; dönüşünde gözden geçirilecek.

## Amaç

Öğretmen ve müdür "sınıfım nerede zorlanıyor, kurs işe yarıyor mu?" sorusuna tek ekrandan cevap alsın. Akademinin velilere ve kurumlara gösterebileceği somut rakam: başlangıç ve bitiş testi arasındaki fark ve etki büyüklüğü.

## Kapsam

1. **Lab ve Blok ilerlemesi buluta.**
   - Yeni tablo: `platform_ilerleme` (öğrenci + uygulama: `lab` | `blok`).
   - Giriş yapmış öğrencinin yıldızları ve deneme sayıları her cihazda aynı olur.
   - Birleştirme kuralı: yıldızda büyük olan, denemede toplam değil büyük olan kazanır; kod en son yazılan.
   - Ortak sınıf: `IlerlemeEsitleyici` (`@sra/bulut`). Gecikmeli yazma, ağ hatasında yeniden deneme.
2. **Deneme sayısı.** Lab görevlerinde ve Blok bölümlerinde her "Çalıştır" bir deneme sayılır. Bu, "en zor bölümler" için gerekli.
3. **Sınıf raporu (`platform_sinif_raporu`).**
   - Öğrenci başına tek kayıt: takma ad, son giriş, Junior verisi, ortaokul verisi, Lab, Blok. PIN rapora girmez.
   - Yetki: sınıfa erişebilen öğretmen ya da müdür.
4. **`packages/analitik` (saf TypeScript, testli):**
   - **Kazanım ısı haritası:** satırda öğrenci, sütunda Junior'ın 12 kazanımı. Hücre durumları:
     - öğrendi (ön test yanlış, son test doğru);
     - biliyordu (ikisi de doğru);
     - zorlanıyor (ikisi de yanlış);
     - geriledi (ön doğru, son yanlış);
     - yalnız ön test.
     - Renk tek başına anlam taşımaz: her hücrede simge var, ayrıca açıklama tablosu var.
   - **Kazanım özeti:** her kazanımda ön ve son test doğru oranı (gruplanmış çubuk grafik).
   - **Kursun etkisi:** iki testi de çözen öğrencilerde:
     - ortalama ön ve son puan, ortalama fark;
     - eşleştirilmiş etki büyüklüğü (Cohen dz = fark ortalaması / fark standart sapması);
     - yorum: küçük < 0,5 ≤ orta < 0,8 ≤ büyük.
     - Öğrenci sayısı 5'in altındaysa "yorum için az" uyarısı.
   - **En zor bölümler (Blok ve Lab):** deneyen sayısı, ortalama deneme, bitirme oranı. Zorluk puanı = ortalama deneme × (1 − bitirme oranı + 0,1).
   - **Desteğe ihtiyacı olanlar** (nazik dil, her öğrenci için gerekçe):
     - 7 günden uzun süredir girmemiş;
     - son testte gerilemiş;
     - bir bölümde 5'ten fazla deneyip bitirememiş.
   - **Dışa aktarma:** CSV (Excel'in Türkçe ayarı için `;` ayraç, UTF-8 BOM) ve yazdırma (A4).
5. **Portal ekranı `#rapor/<sınıf>`:** Panellerim'deki her sınıfta "Rapor" düğmesi. Bölümler:
   - üstte dört özet kart;
   - etki kartı;
   - kazanım grafiği;
   - ısı haritası;
   - zor bölümler;
   - destek listesi.
   - Her grafiğin tablo görünümü ve üzerine gelince ipucu (tooltip) var.
6. **Deneme modu verisi:**
   - Sahte sunucuda 5-A sınıfına uydurma takma adlı 9 öğrenci eklenir. Ön ve son test cevapları, Blok ve Lab ilerlemesi sabit tohumla üretilir.
   - Rapor sunumda dolu görünür. Gerçek çocuk verisi yok.

## Yapmayacaklarımız

- Öğrenciye başkalarının verisini göstermek; öğrenciye rapor ekranı.
- Kişisel veri eklemek (ad-soyad, e-posta, fotoğraf). Rapor yalnızca takma adla çalışır.
- Yapay zekâyla öğrenci hakkında yorum üretmek. Gerekçeler kural tabanlı ve açık.
- Ücretli analitik ya da izleme servisi (Google Analytics vb.).
- Junior ve ortaokul sitelerinin kodunu değiştirmek. Junior'ın test cevap anahtarı yalnızca okunur.

## Bitti tanımı

- [x] `packages/analitik` birim testleri:
  - ısı haritası durumları;
  - kazanım özeti;
  - etki büyüklüğü (bilinen veriyle elle hesaplanmış değer);
  - zor bölüm sıralaması;
  - destek gerekçeleri;
  - CSV biçimi.
- [x] Lab ve Blok ilerlemesi giriş yapmış öğrencide sunucuya yazılıyor ve başka cihazda geri geliyor (uçtan uca test, sahte sunucu).
- [x] `analitik.sql` Postgres senaryosu:
  - yetki (başka öğretmen göremez, öğrenci göremez, PIN rapora girmez);
  - birleştirme.
- [x] Rapor ekranı 3 boyutta göz kontrolünden geçti; yazdırma tek sütun ve okunaklı.
- [x] Bütün testler GitHub Actions'ta yeşil.
