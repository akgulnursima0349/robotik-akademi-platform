-- =====================================================================
--  SİVAS ROBOTİK AKADEMİ PLATFORMU · DERS İLERLEMESİ (Supabase)
--  analitik.sql'den sonra çalıştırılır. Var olan kuruluma ders motorunun ilerleme kaydını ekler:
--  platform_ilerleme tablosu 'dersler' uygulamasını da kabul eder. Yeni tablo yok. Tekrar çalıştırılabilir.
--  (analitik.sql'in güncel hâli bunu zaten içerir; yeni kurulumda bu dosya bir şey değiştirmez.)
-- =====================================================================

alter table public.platform_ilerleme drop constraint if exists platform_ilerleme_uygulama_check;
alter table public.platform_ilerleme add constraint platform_ilerleme_uygulama_check check (uygulama in ('lab', 'blok', 'dersler'));

create or replace function public.platform_ilerleme_kaydet(p_uygulama text, p_veri jsonb) returns timestamptz
language plpgsql volatile security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi(); t timestamptz := now();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  if p_uygulama not in ('lab', 'blok', 'dersler') then raise exception 'veri_gecersiz'; end if;
  if jsonb_typeof(p_veri) <> 'object' or pg_column_size(p_veri) > 200000 then raise exception 'veri_gecersiz'; end if;
  insert into public.platform_ilerleme (ogrenci_id, uygulama, veri, guncelleme) values (og, p_uygulama, p_veri, t)
    on conflict (ogrenci_id, uygulama) do update set veri = excluded.veri, guncelleme = t;
  update public.ogrenciler set son_giris = t where id = og;
  return t;
end $$;
