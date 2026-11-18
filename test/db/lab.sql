-- lab.sql senaryosu (senaryo.sql'den sonra, aynı veritabanında)
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

select kod as kod_j from public.siniflar where ad = '5-A' \gset
select id as sinif_j from public.siniflar where ad = '5-A' \gset
set role authenticated;
-- b1 senaryo.sql'de Ece olarak giriş yapmıştı
select pg_temp.olarak('b1', true);
select pg_temp.esit(public.lab_robotum(), null::jsonb, 'kayıtlı robot yokken null');
select public.lab_robot_kaydet('  Kar Avcısı ', E'def hamle(robot):\n    return "ileri"\n');
select pg_temp.esit(public.lab_robotum() ->> 'ad', 'Kar Avcısı', 'robot kaydedildi, ad kırpıldı');
select public.lab_robot_kaydet('Kar Avcısı 2', 'def hamle(robot):\n    return "bekle"\n');
select pg_temp.esit(public.lab_robotum() ->> 'ad', 'Kar Avcısı 2', 'ikinci kayıt öncekinin yerine geçer');
select pg_temp.hata_bekle(format('select public.lab_robot_kaydet(%L, %L)', 'x', repeat('a', 4001)), 'veri_gecersiz', '4000 karakterden uzun kod reddedilir');
select pg_temp.hata_bekle(format('select public.lab_robot_kaydet(%L, %L)', '', 'kod'), 'veri_gecersiz', 'boş ad reddedilir');
select pg_temp.hata_bekle(format('select public.lab_sinif_robotlari(%L)', :'sinif_j'), 'yetki_yok', 'öğrenci sınıf robotlarını göremez');
-- giriş yapmamış anonim
select pg_temp.olarak('b2', true);
select pg_temp.hata_bekle(format('select public.lab_robot_kaydet(%L, %L)', 'x', 'y'), 'oturum_yok', 'girişsiz oturum robot kaydedemez');
-- öğretmenler
reset role; select pg_temp.olarak('a1', false); set role authenticated;
select pg_temp.esit(jsonb_array_length(public.lab_sinif_robotlari(:'sinif_j')), 1, 'sınıfın öğretmeni robotları görür');
select pg_temp.esit(public.lab_sinif_robotlari(:'sinif_j') -> 0 ->> 'takma_ad', 'Ece', 'robotun sahibi takma adla gelir');
reset role; select pg_temp.olarak('a2', false); set role authenticated;
select pg_temp.hata_bekle(format('select public.lab_sinif_robotlari(%L)', :'sinif_j'), 'yetki_yok', 'başka öğretmen göremez');
reset role; select pg_temp.olarak('d1', false); set role authenticated;
select pg_temp.esit(jsonb_array_length(public.lab_sinif_robotlari(:'sinif_j')), 1, 'müdür görür');
reset role; set role anon;
select pg_temp.hata_bekle('select public.lab_robotum()', 'permission denied', 'anon çağıramaz');
reset role;
select pg_temp.hata_bekle('select count(*) from public.lab_robotlar', 'permission denied', 'tabloya doğrudan erişim yok (authenticated)') from (select set_config('role', 'authenticated', true)) x;
\echo 'Lab veritabanı doğrulamaları geçti'
