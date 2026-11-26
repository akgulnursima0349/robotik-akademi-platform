-- ders-onay.sql senaryosu (senaryo.sql, lab.sql ve analitik.sql'den sonra)
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
\pset format unaligned
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
select id as sinif_j from public.siniflar where ad = '5-A' \gset
select id as ece from public.ogrenciler where lower(takma_ad) = 'ece' \gset

-- öğrenci kendi kendini onaylayamaz; onaysızken liste boş
set role authenticated;
select pg_temp.olarak('b1', true);
select pg_temp.esit(public.platform_ders_onaylarim(), '{}'::jsonb, 'onay yokken öğrencinin listesi boş');
select pg_temp.hata_bekle(format('select public.platform_ders_onayla(%L, %L, true)', :'ece', 'siroline-sensor'), 'yetki_yok', 'öğrenci kendi kendini onaylayamaz');
select pg_temp.hata_bekle($$insert into public.platform_ders_onay values (gen_random_uuid(), 'x', gen_random_uuid(), gen_random_uuid())$$, 'permission denied', 'öğrenci tabloya doğrudan yazamaz');

-- sınıfın öğretmeni onaylar, geri alır
reset role; select pg_temp.olarak('a1', false); set role authenticated;
select pg_temp.esit(public.platform_ders_onayla(:'ece', 'siroline-sensor', true) is not null, true, 'öğretmen onaylar');
select pg_temp.esit(public.platform_ders_onayla(:'ece', 'siroline-sensor', true) is not null, true, 'aynı onay ikinci kez hata vermez');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 -> 'onaylar' ? 'siroline-sensor', true, 'raporda onay var');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 -> 'dersler' -> 'dersler' -> 'siroline-sensor' -> 'anlat' ->> 'bitti', 'true', 'raporda ders ilerlemesi var');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 -> 'lab' -> 'gorevler' -> 'kose' ->> 'deneme', '4', 'raporun eski alanları korunur');
select pg_temp.hata_bekle(format('select public.platform_ders_onayla(%L, %L, true)', :'ece', 'Kötü Ad!'), 'veri_gecersiz', 'geçersiz ders kimliği reddedilir');
select pg_temp.hata_bekle(format('select public.platform_ders_onayla(%L, %L, true)', gen_random_uuid(), 'siroline-sensor'), 'yetki_yok', 'olmayan öğrenci reddedilir');

-- öğrenci yalnız kendi onayını görür
reset role; select pg_temp.olarak('b1', true); set role authenticated;
select pg_temp.esit(public.platform_ders_onaylarim() ? 'siroline-sensor', true, 'öğrenci onayını görür');

-- başka öğretmen onaylayamaz, geri alamaz
reset role; select pg_temp.olarak('a2', false); set role authenticated;
select pg_temp.hata_bekle(format('select public.platform_ders_onayla(%L, %L, false)', :'ece', 'siroline-sensor'), 'yetki_yok', 'başka öğretmen onayı geri alamaz');

reset role; select pg_temp.olarak('a1', false); set role authenticated;
select pg_temp.esit(public.platform_ders_onayla(:'ece', 'siroline-sensor', false), null::timestamptz, 'öğretmen onayı geri alır');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 -> 'onaylar', '{}'::jsonb, 'geri alınan onay rapordan düşer');
reset role; select pg_temp.olarak('b1', true); set role authenticated;
select pg_temp.esit(public.platform_ders_onaylarim(), '{}'::jsonb, 'geri alınan onay öğrenciden düşer');

reset role; set role anon;
select pg_temp.hata_bekle($$select public.platform_ders_onaylarim()$$, 'permission denied', 'anon çağıramaz');
reset role;
\echo 'Ders onayı veritabanı doğrulamaları geçti'
