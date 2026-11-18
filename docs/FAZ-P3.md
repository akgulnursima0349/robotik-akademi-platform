# Faz P3 · Blok Atölyesi MVP (1–3. sınıf)

**Not:** Nur'un "hepsini adım adım bitir" talimatıyla onaylanmış sayıldı; dönüşünde gözden geçirilecek.

## Amaç

Okumayı yeni söken çocuklar için kodlamaya giriş. Çocuk büyük blokları dizer, Bit bir bahçede yürüyüp havuçları toplar. Her yönerge sesli okunur.

Üç kursu birbirine bağlayan parça "Bunun Python'u" düğmesi. Blok dizisinin Python karşılığı gösterilir. Böylece çocuk Junior'a geçtiğinde aynı komutları tanır: `ileri()`, `for`.

## Kararlar

1. **Kendi blok düzenleyicimiz.** Blockly gibi büyük bir kütüphane yerine (yaklaşık 1 MB, küçük çocuk için fazla karmaşık), bu yaşa özel sade bir düzenleyici yazıyoruz:
   - Paletten bloğa dokununca program şeridine eklenir.
   - Bloklar sürüklenerek yeniden sıralanır.
   - Çarpıdan silinir.
   - "Tekrarla" bloğu içine blok alır. Sayı + ve − düğmeleriyle 2–9 arası seçilir.
   - Bütün dokunma hedefleri en az 48 piksel.
   - Klavyeyle de kullanılabilir.
2. **Aynı motor.** Bahçe, Lab'in ızgara motoruyla (`@sra/robot-motoru`) çalışır:
   - havuç = toplanacak kare;
   - ağaç = geçilmez kare.
   - Bloklar Python'a gerek kalmadan doğrudan motora komut olarak verilir.
   - Motorun çıkardığı iz, SVG sahnede oynatılır.
3. **Sesli yönerge.**
   - Tarayıcının kendi konuşma motoru kullanılır (`speechSynthesis`, tr-TR): ücretsiz ve internetsiz.
   - Her bölümde 🔊 düğmesi var. Bölüm açılınca yönerge kendiliğinden okunur; tarayıcı izin vermezse düğme yeter.
   - Bloklara dokununca adları okunur. Bu ses ayarlardan kapatılabilir.
   - Türkçe ses yoksa düğme gizlenir ve yazı yine görünür.
4. **Görünüm.**
   - Tepeden bakılan, yumuşak renkli bir bahçe. SVG çizimler; dosya yok, keskin ve hafif.
   - Bit, Junior'daki robotun aynısı: üç kurs aynı karakteri paylaşır.
5. **İlerleme ve yıldız.**
   - 3 yıldız: en az blokla bitirmek.
   - 2 yıldız: en fazla iki fazla blokla bitirmek.
   - 1 yıldız: bitirmek.
   - Bölümler sırayla açılır. İlerleme cihazda saklanır; bulut senkronu P4'te gelir.
   - Öğrenci girişte (ilkokul sınıfı) doğrudan buraya gelir.

## İçerik: 3 dünya, 12 bölüm

| Dünya | Bölümler | Öğrettiği |
|---|---|---|
| 1 · Havuç Bahçesi | 4 | Sıralı komut: ileri, sola dön, sağa dön |
| 2 · Tekrar Tarlası | 4 | Tekrarla bloğu (döngü) |
| 3 · Dolambaçlı Yol | 4 | Tekrar + dönüş, en kısa yol |

## Yapmayacaklarımız

- Koşul (eğer) blokları, değişkenler, olaylar: sonraki dünyalar.
- Blockly ya da başka bir büyük blok kütüphanesi.
- İnternetten ses, görsel ya da yazı tipi yüklemek.
- Okuma gerektiren uzun metinler. Her yönerge en fazla iki kısa cümle ve sesli okunur.

## Bitti tanımı

- [x] Blok → komut ve blok → Python çevirisinin birim testleri:
  - iç içe tekrar;
  - boş tekrar;
  - en az blok sayısı.
- [x] 12 bölümün en kısa çözümü 3 yıldız alıyor (test).
- [x] Dokunarak ekleme, silme, tekrarın içine ekleme, sayı değiştirme ve sürükleyerek araya bırakma uçtan uca testte çalışıyor.
- [x] "Bunun Python'u" doğru kodu gösteriyor.
- [x] Ses düğmesi Türkçe ses yokken gizleniyor (test).
- [ ] Türkçe sesle okuma gerçek cihazda denenmeli; test ortamında Türkçe ses yok.
- [x] Masaüstü, tablet ve telefonda göz kontrolü; telefonda tek elle kullanılabilir.
- [x] Portal kartı açıldı; ilkokul sınıfındaki öğrenci girişte `/blok/` adresine gidiyor.
