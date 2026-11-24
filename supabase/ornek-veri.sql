-- =====================================================================
--  DEMO PROJESİ · ÖRNEK SINIFLAR VE ÖĞRENCİLER
--  Yalnızca ayrı bir deneme projesinde çalıştırılır; akademinin asıl projesinde ÇALIŞTIRILMAZ. Takma adlar uydurmadır.
--  Önce platform üzerinden bir öğretmen hesabı aç (KURULUM.md, adım 4); aşağıdaki e-postayı o hesapla değiştir.
-- =====================================================================
do $$
declare
  eposta text := 'ogretmen@ornek.com';   -- ← kendi demo öğretmen e-postan
  t uuid;
begin
  select u.id into t from auth.users u join public.ogretmenler o on o.id = u.id where lower(u.email) = lower(eposta);
  if t is null then raise exception 'Önce % ile öğretmen hesabı açılıp tamamlanmalı', eposta; end if;

  insert into public.siniflar (ogretmen_id, ad, kod, kurs) values (t, '5-A Junior', 'JNR123', 'junior') on conflict (kod) do nothing;
  insert into public.siniflar (ogretmen_id, ad, kod, kurs) values (t, '7-B Python', 'ORT456', 'ortaokul') on conflict (kod) do nothing;
  insert into public.siniflar (ogretmen_id, ad, kod, kurs) values (t, '2-C Bloklar', 'BLK789', 'ilkokul') on conflict (kod) do nothing;

  -- öğrenciler: takma ad + PIN (PIN'in okunabilir kopyası yalnızca öğretmen panelinde görünür)
  insert into public.ogrenciler (sinif_id, takma_ad, pin_hash, pin)
  select sn.id, x.ad, extensions.crypt(x.pin, extensions.gen_salt('bf')), x.pin
    from (values ('JNR123', 'Ece', '1234'), ('JNR123', 'Deniz', '2345'), ('JNR123', 'Kuzey', '3456'),
                 ('ORT456', 'Mert', '5678'), ('ORT456', 'Ada', '6789'),
                 ('BLK789', 'Bulut', '1111')) as x(kod, ad, pin)
    join public.siniflar sn on sn.kod = x.kod
  on conflict (sinif_id, (lower(takma_ad))) do nothing;
end $$;
