-- ornek-veri.sql'in demo projesinde çalışacağını doğrular (e-posta sütunu Supabase'de var; taklitte eklenir).
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
alter table auth.users add column if not exists email text;
insert into auth.users (id, is_anonymous, email) values ('00000000-0000-0000-0000-0000000000e1', false, 'ogretmen@ornek.com');
insert into public.ogretmenler (id, ad) values ('00000000-0000-0000-0000-0000000000e1', 'Örnek Öğretmen');
\i supabase/ornek-veri.sql
\i supabase/ornek-veri.sql
select case when (select count(*) from public.ogrenciler o join public.siniflar s on s.id = o.sinif_id where s.kod in ('JNR123','ORT456','BLK789')) = 6
            and (select kurs from public.siniflar where kod = 'JNR123') = 'junior'
            and (select pin_hash = extensions.crypt('1234', pin_hash) from public.ogrenciler where takma_ad = 'Ece' and sinif_id = (select id from public.siniflar where kod = 'JNR123'))
       then 'Örnek veri doğru ve tekrar çalıştırılabilir' else 'BAŞARISIZ: örnek veri' end;
