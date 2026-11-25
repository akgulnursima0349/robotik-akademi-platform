-- analitik.sql senaryosu (senaryo.sql ve lab.sql'den sonra)
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

set role authenticated;
select pg_temp.olarak('b1', true);   -- Ece
select pg_temp.esit(public.platform_ilerleme_getir('blok'), null::jsonb, 'kayıt yokken null');
select public.platform_ilerleme_kaydet('blok', '{"yildiz": {"1-1": 3}, "deneme": {"1-1": 2}}');
select public.platform_ilerleme_kaydet('lab', '{"gorevler": {"kose": {"yildiz": 2, "deneme": 4}}}');
select pg_temp.esit(public.platform_ilerleme_getir('blok') -> 'veri' -> 'yildiz' ->> '1-1', '3', 'blok ilerlemesi geri geldi');
select public.platform_ilerleme_kaydet('blok', '{"yildiz": {"1-1": 3, "1-2": 1}}');
select pg_temp.esit(public.platform_ilerleme_getir('blok') -> 'veri' -> 'yildiz' ->> '1-2', '1', 'ikinci kayıt öncekinin yerine geçer');
select public.platform_ilerleme_kaydet('dersler', '{"dersler": {"siroline-sensor": {"anlat": {"adim": 3, "bitti": true}}}}');
select pg_temp.esit(public.platform_ilerleme_getir('dersler') -> 'veri' -> 'dersler' -> 'siroline-sensor' -> 'anlat' ->> 'bitti', 'true', 'ders ilerlemesi kaydedilir ve geri gelir');
select pg_temp.hata_bekle($$select public.platform_ilerleme_kaydet('junior', '{}')$$, 'veri_gecersiz', 'bilinmeyen uygulama reddedilir');
select pg_temp.hata_bekle($$select public.platform_ilerleme_kaydet('lab', '[1,2]')$$, 'veri_gecersiz', 'nesne olmayan veri reddedilir');
select pg_temp.hata_bekle(format('select public.platform_sinif_raporu(%L)', :'sinif_j'), 'yetki_yok', 'öğrenci sınıf raporunu göremez');
select pg_temp.olarak('b2', true);
select pg_temp.hata_bekle($$select public.platform_ilerleme_kaydet('lab', '{}')$$, 'oturum_yok', 'girişsiz anonim oturum yazamaz');

reset role; select pg_temp.olarak('a1', false); set role authenticated;
select pg_temp.esit(jsonb_array_length(public.platform_sinif_raporu(:'sinif_j')), 1, 'öğretmen raporu görür');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 -> 'lab' -> 'gorevler' -> 'kose' ->> 'deneme', '4', 'raporda Lab verisi var');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 ? 'pin', false, 'PIN rapora girmez');
select pg_temp.esit(public.platform_sinif_raporu(:'sinif_j') -> 0 ->> 'son_giris' is not null, true, 'kayıt son girişi günceller');
reset role; select pg_temp.olarak('a2', false); set role authenticated;
select pg_temp.hata_bekle(format('select public.platform_sinif_raporu(%L)', :'sinif_j'), 'yetki_yok', 'başka öğretmen raporu göremez');
reset role; set role anon;
select pg_temp.hata_bekle(format('select public.platform_sinif_raporu(%L)', :'sinif_j'), 'permission denied', 'anon çağıramaz');
reset role;
\echo 'Analitik veritabanı doğrulamaları geçti'
