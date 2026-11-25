-- =====================================================================
--  SİVAS ROBOTİK AKADEMİ PLATFORMU · ÖĞRENME ANALİTİĞİ (Supabase)
--  lab.sql'den sonra çalıştırılır. Ekleme niteliğinde, tekrar çalıştırılabilir.
-- =====================================================================

-- Lab, Blok Atölyesi ve ders ilerlemesi: öğrenci + uygulama başına tek kayıt
create table if not exists public.platform_ilerleme (
  ogrenci_id uuid not null references public.ogrenciler(id) on delete cascade,
  uygulama   text not null check (uygulama in ('lab', 'blok', 'dersler')),
  veri       jsonb not null default '{}'::jsonb,
  guncelleme timestamptz not null default now(),
  primary key (ogrenci_id, uygulama)
);
alter table public.platform_ilerleme enable row level security;
revoke all on public.platform_ilerleme from anon, authenticated;

create or replace function public.platform_ilerleme_getir(p_uygulama text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  return (select jsonb_build_object('veri', veri, 'guncelleme', guncelleme) from public.platform_ilerleme where ogrenci_id = og and uygulama = p_uygulama);
end $$;

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

-- Sınıf raporu: öğrenci başına bütün kursların verisi. PIN rapora girmez.
create or replace function public.platform_sinif_raporu(p_sinif uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', o.id, 'takma_ad', o.takma_ad, 'son_giris', o.son_giris,
      'junior', coalesce((select veri from public.junior_ilerleme j where j.ogrenci_id = o.id), '{}'::jsonb),
      'ortaokul', coalesce((select veri from public.ilerleme i where i.ogrenci_id = o.id), '{}'::jsonb),
      'lab', coalesce((select veri from public.platform_ilerleme p where p.ogrenci_id = o.id and p.uygulama = 'lab'), '{}'::jsonb),
      'blok', coalesce((select veri from public.platform_ilerleme p where p.ogrenci_id = o.id and p.uygulama = 'blok'), '{}'::jsonb)
    ) order by lower(o.takma_ad)) from public.ogrenciler o where o.sinif_id = p_sinif), '[]'::jsonb);
end $$;

revoke execute on function public.platform_ilerleme_getir(text), public.platform_ilerleme_kaydet(text, jsonb), public.platform_sinif_raporu(uuid) from public, anon;
grant execute on function public.platform_ilerleme_getir(text), public.platform_ilerleme_kaydet(text, jsonb), public.platform_sinif_raporu(uuid) to authenticated;
