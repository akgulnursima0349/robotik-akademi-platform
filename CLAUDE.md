# Sivas Robotik Akademi Eğitim Platformu

- Kullanıcıyla Türkçe konuş. Kod içi adlar ve yorumlar Türkçe (mevcut iki siteyle aynı üslup).
- Her faz önce `docs/FAZ-*.md` spec'i ile başlar: "Yapmayacaklarımız" ve "Bitti tanımı" bölümleri zorunlu. Spec onaylanmadan koda geçme.
- `kurslar/junior` ve `kurslar/ortaokul` ayrı depoların submodule'leridir. İçlerinde değişiklik gerekiyorsa o depoda ayrı commit olarak yapılır ve o deponun kendi testleri geçmeden alınmaz.
- Depo herkese açık: `service_role` ya da başka gizli anahtar asla commit edilmez. Gerçek öğrencilerin bulunduğu Supabase projesine SQL çalıştırılmaz; demo ayrı projede.
- Öğrenci verisi en az: takma ad + PIN. Örnek verilerde gerçek çocuk adı yok.
- Bir değişiklik bitmiş sayılmadan önce: derleme, birim testleri ve Playwright uçtan uca testleri (masaüstü, tablet, telefon) geçer; ekranlar göz kontrolünden geçer.
- Platform henüz hiçbir yere yayınlanmıyor; yayın, akademinin onayından sonra ayrı bir karar.
