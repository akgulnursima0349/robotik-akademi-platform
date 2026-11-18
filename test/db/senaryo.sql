-- platform.sql senaryosu: her adım bir doğrulama; ilk hata dosyayı durdurur (ON_ERROR_STOP).
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
\pset format unaligned
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000a1', false), ('00000000-0000-0000-0000-0000000000a2', false), ('00000000-0000-0000-0000-0000000000d1', false),
  ('00000000-0000-0000-0000-0000000000b1', true), ('00000000-0000-0000-0000-0000000000b2', true);
insert into public.ayarlar values ('kurum_kodu', 'SRA-TEST'), ('mudur_kodu', 'MUDUR-TEST');

create or replace function pg_temp.olarak(u text, anonim boolean) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000' || u, 'is_anonymous', anonim)::text, false); end $$;
create or replace function pg_temp.esit(a anyelement, b anyelement, m text) returns void language plpgsql as $$
begin if a is distinct from b then raise exception 'BAŞARISIZ: % (beklenen %, bulunan %)', m, b, a; end if; raise notice 'ok · %', m; end $$;
create or replace function pg_temp.hata_bekle(sorgu text, kod text, m text) returns void language plpgsql as $$
begin
  begin execute sorgu; exception when others then
    if sqlerrm like '%' || kod || '%' then raise notice 'ok · %', m; return; end if;
    raise exception 'BAŞARISIZ: % (beklenen hata %, gelen %)', m, kod, sqlerrm;
  end;
  raise exception 'BAŞARISIZ: % (hata bekleniyordu)', m;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

set role authenticated;
-- öğretmen a1 ve iki sınıf
select pg_temp.olarak('a1', false);
select public.ogretmen_kaydol('Deneme Öğretmen', 'SRA-TEST');
select (public.sinif_olustur('5-A')) ->> 'kod' as kod_j \gset
select (public.sinif_olustur('7-B')) ->> 'kod' as kod_o \gset
select pg_temp.esit((select count(*) from jsonb_array_elements(public.platform_siniflarim()) e where e ->> 'kurs' = 'ortaokul')::int, 2, 'yeni sınıfların varsayılan kursu ortaokul');
select (select e ->> 'id' from jsonb_array_elements(public.platform_siniflarim()) e where e ->> 'kod' = :'kod_j') as sinif_j \gset
select public.platform_sinif_kurs(:'sinif_j', 'junior');
select pg_temp.esit((select e ->> 'kurs' from jsonb_array_elements(public.platform_siniflarim()) e where e ->> 'kod' = :'kod_j'), 'junior', 'öğretmen sınıfın kursunu değiştirebilir');
select pg_temp.hata_bekle(format('select public.platform_sinif_kurs(%L, %L)', :'sinif_j', 'lise'), 'kurs_gecersiz', 'geçersiz kurs reddedilir');
select (public.ogrenci_ekle(:'sinif_j', array['Ece']) -> 'eklenen' -> 0 ->> 'pin') as pin \gset
select pg_temp.esit(public.platform_ben() ->> 'rol', 'ogretmen', 'öğretmen için platform_ben = ben');

-- başka öğretmen a2 bu sınıfa dokunamaz
reset role; select pg_temp.olarak('a2', false); set role authenticated;
select public.ogretmen_kaydol('Diğer Öğretmen', 'SRA-TEST');
select pg_temp.esit(jsonb_array_length(public.platform_siniflarim()), 0, 'başka öğretmen sınıfları görmez');
select pg_temp.hata_bekle(format('select public.platform_sinif_kurs(%L, %L)', :'sinif_j', 'ilkokul'), 'yetki_yok', 'başka öğretmen kursu değiştiremez');

-- müdür d1 hepsini görür ve değiştirebilir
reset role; select pg_temp.olarak('d1', false); set role authenticated;
select public.ogretmen_kaydol('Müdür', 'MUDUR-TEST');
select pg_temp.esit(jsonb_array_length(public.platform_siniflarim()), 2, 'müdür bütün sınıfları görür');

-- öğrenci: anonim oturum, giriş, kursu öğrenir
reset role; select pg_temp.olarak('b1', true); set role authenticated;
select pg_temp.esit(public.platform_ben() ->> 'rol', null, 'girişsiz anonim oturumun rolü yok');
select public.ogrenci_giris(:'kod_j', 'ece', :'pin');
select pg_temp.esit(public.platform_ben() ->> 'kurs', 'junior', 'öğrenci sınıfının kursunu alır');
select pg_temp.esit(public.platform_ben() ->> 'takma_ad', 'Ece', 'ben() alanları korunur');
select pg_temp.hata_bekle('select public.platform_siniflarim()', 'yetki_yok', 'öğrenci sınıf listesini göremez');
select pg_temp.hata_bekle(format('select public.platform_sinif_kurs(%L, %L)', :'sinif_j', 'ortaokul'), 'yetki_yok', 'öğrenci kurs değiştiremez');

-- anon rolü hiçbir platform işlevini çağıramaz
reset role; set role anon;
select pg_temp.hata_bekle('select public.platform_ben()', 'permission denied', 'anon platform_ben çağıramaz');
reset role;

-- tablo kısıtı: geçersiz kurs yazılamaz
select pg_temp.hata_bekle(format('update public.siniflar set kurs = %L where kod = %L', 'lise', :'kod_o'), 'siniflar_kurs_gecerli', 'tablo kısıtı geçersiz kursu reddeder');
\echo 'Bütün veritabanı doğrulamaları geçti'
