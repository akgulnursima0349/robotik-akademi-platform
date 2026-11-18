-- =====================================================================
--  SİVAS ROBOTİK AKADEMİ PLATFORMU · ROBOTİK LABORATUVARI (Supabase)
--  platform.sql'den sonra çalıştırılır. Ekleme niteliğinde, tekrar çalıştırılabilir.
--  ŞİMDİLİK YALNIZCA DEMO PROJESİNDE. Kod sunucuda ÇALIŞTIRILMAZ; yalnızca metin olarak saklanır.
-- =====================================================================

-- Öğrencinin lig robotu: öğrenci başına tek kayıt
create table if not exists public.lab_robotlar (
  ogrenci_id uuid primary key references public.ogrenciler(id) on delete cascade,
  ad         text not null check (char_length(ad) between 1 and 40),
  kod        text not null check (char_length(kod) <= 4000),
  guncelleme timestamptz not null default now()
);
alter table public.lab_robotlar enable row level security;
revoke all on public.lab_robotlar from anon, authenticated;

create or replace function public.lab_robot_kaydet(p_ad text, p_kod text) returns void
language plpgsql volatile security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  if char_length(trim(coalesce(p_ad, ''))) not between 1 and 40 or char_length(coalesce(p_kod, '')) > 4000 then raise exception 'veri_gecersiz'; end if;
  insert into public.lab_robotlar (ogrenci_id, ad, kod) values (og, trim(p_ad), p_kod)
    on conflict (ogrenci_id) do update set ad = excluded.ad, kod = excluded.kod, guncelleme = now();
end $$;

create or replace function public.lab_robotum() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  return (select jsonb_build_object('ad', ad, 'kod', kod) from public.lab_robotlar where ogrenci_id = og);
end $$;

-- Sınıfın robotları: sınıfa erişebilen öğretmen ya da müdür
create or replace function public.lab_sinif_robotlari(p_sinif uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  return coalesce((select jsonb_agg(jsonb_build_object('takma_ad', o.takma_ad, 'ad', r.ad, 'kod', r.kod, 'guncelleme', r.guncelleme) order by o.takma_ad)
    from public.lab_robotlar r join public.ogrenciler o on o.id = r.ogrenci_id where o.sinif_id = p_sinif), '[]'::jsonb);
end $$;

revoke execute on function public.lab_robot_kaydet(text, text), public.lab_robotum(), public.lab_sinif_robotlari(uuid) from public, anon;
grant execute on function public.lab_robot_kaydet(text, text), public.lab_robotum(), public.lab_sinif_robotlari(uuid) to authenticated;
