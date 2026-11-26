-- =====================================================================
--  SİVAS ROBOTİK AKADEMİ PLATFORMU · DERSLERDE ÖĞRETMEN ONAYI (Supabase)
--  dersler.sql'den sonra çalıştırılır. Ekleme niteliğinde, tekrar çalıştırılabilir.
--  Öğretmen, öğrencinin gerçek robot etkinliğini sınıfta yaptığını onaylar. Onay öğretmenin kaydıdır:
--  öğrenci kendi ilerleme kaydına yazamaz, yalnız kendi onaylarını okuyabilir.
-- =====================================================================

create table if not exists public.platform_ders_onay (
  ogrenci_id   uuid not null references public.ogrenciler(id) on delete cascade,
  ders         text not null check (ders ~ '^[a-z0-9-]{1,64}$'),
  sinif_id     uuid not null references public.siniflar(id) on delete cascade,
  ogretmen_uid uuid not null,
  zaman        timestamptz not null default now(),
  primary key (ogrenci_id, ders)
);
alter table public.platform_ders_onay enable row level security;
revoke all on public.platform_ders_onay from anon, authenticated;

-- Onay ver (p_onay true) ya da geri al (false). Yalnız öğrencinin sınıfına erişimi olan öğretmen.
create or replace function public.platform_ders_onayla(p_ogrenci uuid, p_ders text, p_onay boolean) returns timestamptz
language plpgsql volatile security definer set search_path = public as $$
declare s uuid; t timestamptz := now();
begin
  select sinif_id into s from public.ogrenciler where id = p_ogrenci;
  if s is null then raise exception 'yetki_yok'; end if;
  perform public._sinifim(s);
  if p_ders is null or p_ders !~ '^[a-z0-9-]{1,64}$' then raise exception 'veri_gecersiz'; end if;
  if p_onay then
    insert into public.platform_ders_onay (ogrenci_id, ders, sinif_id, ogretmen_uid, zaman) values (p_ogrenci, p_ders, s, auth.uid(), t)
      on conflict (ogrenci_id, ders) do nothing;
    return (select zaman from public.platform_ders_onay where ogrenci_id = p_ogrenci and ders = p_ders);
  end if;
  delete from public.platform_ders_onay where ogrenci_id = p_ogrenci and ders = p_ders;
  return null;
end $$;

-- Öğrencinin kendi onayları: { "ders-kimligi": "zaman", ... }
create or replace function public.platform_ders_onaylarim() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  return coalesce((select jsonb_object_agg(ders, zaman) from public.platform_ders_onay where ogrenci_id = og), '{}'::jsonb);
end $$;

-- Sınıf raporu: önceki alanlara ek olarak ders ilerlemesi ve öğretmen onayları. PIN rapora girmez.
create or replace function public.platform_sinif_raporu(p_sinif uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', o.id, 'takma_ad', o.takma_ad, 'son_giris', o.son_giris,
      'junior', coalesce((select veri from public.junior_ilerleme j where j.ogrenci_id = o.id), '{}'::jsonb),
      'ortaokul', coalesce((select veri from public.ilerleme i where i.ogrenci_id = o.id), '{}'::jsonb),
      'lab', coalesce((select veri from public.platform_ilerleme p where p.ogrenci_id = o.id and p.uygulama = 'lab'), '{}'::jsonb),
      'blok', coalesce((select veri from public.platform_ilerleme p where p.ogrenci_id = o.id and p.uygulama = 'blok'), '{}'::jsonb),
      'dersler', coalesce((select veri from public.platform_ilerleme p where p.ogrenci_id = o.id and p.uygulama = 'dersler'), '{}'::jsonb),
      'onaylar', coalesce((select jsonb_object_agg(d.ders, d.zaman) from public.platform_ders_onay d where d.ogrenci_id = o.id), '{}'::jsonb)
    ) order by lower(o.takma_ad)) from public.ogrenciler o where o.sinif_id = p_sinif), '[]'::jsonb);
end $$;

revoke execute on function public.platform_ders_onayla(uuid, text, boolean), public.platform_ders_onaylarim(), public.platform_sinif_raporu(uuid) from public, anon;
grant execute on function public.platform_ders_onayla(uuid, text, boolean), public.platform_ders_onaylarim(), public.platform_sinif_raporu(uuid) to authenticated;
