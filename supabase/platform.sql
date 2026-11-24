-- =====================================================================
--  SİVAS ROBOTİK AKADEMİ PLATFORMU · VERİTABANI EKLENTİSİ (Supabase)
--  Önce python-atolyesi/site/supabase/kurulum.sql ve python-atolyesi-junior/supabase/junior.sql kurulmuş olmalı.
--  Ekleme niteliğinde: eski tablolara yalnızca bir sütun ekler, veri silmez; tekrar çalıştırılabilir.
-- =====================================================================

-- Sınıfın kursu: öğrenci girişte bu kursa yönlendirilir
alter table public.siniflar add column if not exists kurs text not null default 'ortaokul';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'siniflar_kurs_gecerli') then
    alter table public.siniflar add constraint siniflar_kurs_gecerli check (kurs in ('ilkokul', 'junior', 'ortaokul'));
  end if;
end $$;

-- Göç: Junior ilerlemesi olan sınıflar Junior sınıfıdır (yalnızca hâlâ varsayılandaysa)
update public.siniflar s set kurs = 'junior'
 where s.kurs = 'ortaokul'
   and exists (select 1 from public.ogrenciler o join public.junior_ilerleme j on j.ogrenci_id = o.id where o.sinif_id = s.id)
   and not exists (select 1 from public.ogrenciler o join public.ilerleme i on i.ogrenci_id = o.id where o.sinif_id = s.id);

-- Ben kimim? ben() ile aynı, öğrenciye sınıfının kursu eklenir
create or replace function public.platform_ben() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb := public.ben(); k text;
begin
  if r ->> 'rol' = 'ogrenci' then
    select s.kurs into k from public.oturumlar t join public.ogrenciler o on o.id = t.ogrenci_id join public.siniflar s on s.id = o.sinif_id
     where t.uid = auth.uid();
    r := r || jsonb_build_object('kurs', coalesce(k, 'ortaokul'));
  end if;
  return r;
end $$;

-- Öğretmenin erişebildiği sınıflar, kurslarıyla
create or replace function public.platform_siniflarim() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._ogretmen_mi() then raise exception 'yetki_yok'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'ad', s.ad, 'kod', s.kod, 'kurs', s.kurs,
           'benim', s.ogretmen_id = auth.uid(), 'sahip_ad', t.ad,
           'ogrenci_sayisi', (select count(*) from public.ogrenciler o where o.sinif_id = s.id)) order by s.olusturma)
           from public.siniflar s join public.ogretmenler t on t.id = s.ogretmen_id
          where public._erisim(s.id)), '[]'::jsonb);
end $$;

-- Sınıfın kursunu değiştir (sınıfa erişebilen öğretmen ya da müdür)
create or replace function public.platform_sinif_kurs(p_sinif uuid, p_kurs text) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  if p_kurs not in ('ilkokul', 'junior', 'ortaokul') then raise exception 'kurs_gecersiz'; end if;
  update public.siniflar set kurs = p_kurs where id = p_sinif;
end $$;

revoke execute on function public.platform_ben(), public.platform_siniflarim(), public.platform_sinif_kurs(uuid, text) from public, anon;
grant execute on function public.platform_ben(), public.platform_siniflarim(), public.platform_sinif_kurs(uuid, text) to authenticated;
