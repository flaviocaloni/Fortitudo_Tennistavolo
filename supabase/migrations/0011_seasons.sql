-- ============================================================
-- Stagioni: contenitore per slot e prenotazioni.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  start_date date not null,
  end_date   date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_season_range check (end_date > start_date)
);

-- Solo una stagione alla volta puo' essere "corrente"
create unique index uniq_current_season on public.seasons (is_current) where is_current;

alter table public.seasons enable row level security;

create policy "seasons readable" on public.seasons for select
  using (auth.role() = 'authenticated');
create policy "admin manages seasons" on public.seasons for all
  using (public.current_user_role() = 'admin');

-- ---------- Collega slot e prenotazioni alla stagione ----------
alter table public.training_slots add column season_id uuid references public.seasons(id);
alter table public.bookings        add column season_id uuid references public.seasons(id);

-- Stagione corrente 2026/2027
insert into public.seasons (name, start_date, end_date, is_current)
values ('2026/2027', '2026-09-01', '2027-06-10', true);

-- Tutti gli slot esistenti appartengono alla stagione 2026/2027
update public.training_slots
set season_id = (select id from public.seasons where name = '2026/2027')
where season_id is null;

alter table public.training_slots alter column season_id set not null;

-- ---------- Popola automaticamente bookings.season_id dallo slot ----------
create or replace function public.set_booking_season()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.season_id is null then
    select season_id into new.season_id from public.training_slots where id = new.slot_id;
  end if;
  return new;
end; $$;

create trigger trg_set_booking_season
  before insert on public.bookings
  for each row execute function public.set_booking_season();

-- Backfill delle prenotazioni esistenti
update public.bookings b
set season_id = ts.season_id
from public.training_slots ts
where b.slot_id = ts.id and b.season_id is null;
