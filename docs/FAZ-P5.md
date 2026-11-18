# Faz P5 · Demo cilası

**Not:** Nur'un "hepsini adım adım bitir" talimatıyla onaylanmış sayıldı; dönüşünde gözden geçirilecek.

## Amaç

Akademiye 10 dakikalık, aksamayan bir sunum. Demo tek bilgisayarda, gerekirse internetsiz açılır. "Bunu bir bilgisayar mühendisi kurdu" mesajını taşıyan bir "Nasıl kuruldu?" sayfası da sunumun parçası.

## Kapsam

1. **Kurslardan platforma dönüş.**
   - Junior ve ortaokul sitelerinin sağ alt köşesinde küçük bir "← Platform" düğmesi.
   - İki sitenin koduna dokunulmaz. Düğme, platform derlemesinin zaten yeniden yazdığı `ayarlar.js` dosyasına eklenen küçük bir betikle gelir; yalnızca platform altında görünür.
2. **"Nasıl kuruldu?" sayfası (`#nasil`):**
   - mimari şema;
   - kullanılan teknikler (nesne yönelimli çekirdek, deterministik simülasyon, tarayıcıda Python, öğrenme analitiği);
   - testler;
   - çocuk verisi ilkeleri (KVKK);
   - internetsiz çalışma.
   - Karşılama ekranının altından bağlantı verilir.
3. **Sunum akışı:** `docs/DEMO.md`, adım adım ne tıklanacağı, hangi hesapla girileceği, ne söyleneceği. Plan dokümanındaki 10 dakikalık akışın uygulanmış hâli.
4. **Kurulum kolaylığı:**
   - `npm run demo:deneme`: sahte sunucuyla, internetsiz tek giriş.
   - GitHub Actions her başarılı çalışmada indirilebilir bir **demo paketi** üretir: derlenmiş site + sunucu betiği + BAŞLAT talimatı. Bilgisayarda yalnızca Node.js gerekir.
5. **Lab ve Blok kapakları için görsel istemleri:** `docs/GORSEL-ISTEMLERI.md`. İsteğe bağlı; şu anki kapaklar kodla çizilmiş.

## Yapmayacaklarımız

- Platformu bir yere yayınlamak (akademinin onayından sonra, P6).
- Junior ve ortaokul depolarına yeni değişiklik.
- Sunum için sahte rakam: deneme verisinin uydurma olduğu sayfada ve sunum metninde açıkça söylenir.

## Bitti tanımı

- [x] Junior ve ortaokul sayfalarında "← Platform" düğmesi var ve portala dönüyor (uçtan uca test). Tek başına açılan sitelerde görünmüyor.
- [x] `#nasil` sayfası 3 boyutta göz kontrolünden geçti.
- [x] `docs/DEMO.md` adımları uçtan uca testle aynı sırada doğrulandı.
- [x] Demo paketi Actions'ta üretiliyor (bu commit'in çalışmasında doğrulanacak).
- [x] Bütün testler yeşil.
