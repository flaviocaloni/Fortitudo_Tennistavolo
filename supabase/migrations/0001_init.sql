-- ============================================================
-- Tennistavolo Booking — Schema completo (Supabase / PostgreSQL)
-- Eseguire nel SQL Editor di Supabase o via `supabase db push`
-- ============================================================

-- ---------- ENUM ----------
create type public.user_role as enum ('admin', 'agonista', 'amatore');
create type public.slot_audience as enum ('agonisti', 'amatori', 'misto');
create type public.booking_status as enum ('active', 'cancelled');

-- ---------- PROFILI ----------
-- Estende auth.users (Supabase Auth: Google OAuth + email/password).
-- weekly_limit: max prenotazioni a settimana (1-3), scelto in registrazione,
-- modificabile solo dall'admin.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  role         public.user_role not null default 'amatore',
  weekly_limit smallint not null default 1 check (weekly_limit between 1 and 3),
  created_at   timestamptz not null default now()
);

-- Crea il profilo alla registrazione leggendo i metadata del form
-- (role: solo agonista/amatore — mai admin; weekly_limit: 1-3)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role  public.user_role := 'amatore';
  v_limit smallint := 1;
begin
  if new.raw_user_meta_data->>'role' in ('agonista', 'amatore') then
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  end if;
  if (new.raw_user_meta_data->>'weekly_limit') ~ '^[1-3]$' then
    v_limit := (new.raw_user_meta_data->>'weekly_limit')::smallint;
  end if;
  insert into public.profiles (id, full_name, role, weekly_limit)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.email),
          v_role, v_limit);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper per le policy RLS (security definer: evita ricorsione)
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Guard: solo l'admin può cambiare role e weekly_limit
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role <> old.role or new.weekly_limit <> old.weekly_limit)
     and public.current_user_role() is distinct from 'admin' then
    raise exception 'Solo l''admin può modificare ruolo e limite settimanale';
  end if;
  return new;
end; $$;

create trigger trg_protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------- SLOT DI ALLENAMENTO ----------
-- Due tipi, definiti dall'admin:
--  · ricorrente settimanale: weekday valorizzato, event_date NULL
--  · extra/evento una tantum: event_date valorizzato, weekday NULL
create table public.training_slots (
  id           uuid primary key default gen_random_uuid(),
  weekday      smallint check (weekday between 0 and 6), -- 0=domenica … 6=sabato
  event_date   date,                                     -- solo per slot extra
  title        text not null default 'Allenamento',
  start_time   time not null,
  end_time     time not null,
  audience     public.slot_audience not null default 'misto',
  min_capacity smallint not null default 2  check (min_capacity >= 0),
  max_capacity smallint not null default 12 check (max_capacity >= 1),
  is_active    boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time),
  constraint valid_capacity   check (max_capacity >= min_capacity),
  constraint recurring_xor_event
    check ((weekday is not null and event_date is null)
        or (weekday is null and event_date is not null))
);

-- ---------- PRENOTAZIONI ----------
create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  slot_id      uuid not null references public.training_slots (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  status       public.booking_status not null default 'active',
  created_at   timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id)
);

-- Una sola prenotazione ATTIVA per utente/slot/data
create unique index uniq_active_booking
  on public.bookings (slot_id, user_id, session_date)
  where status = 'active';

create index idx_bookings_session on public.bookings (slot_id, session_date);
create index idx_bookings_user    on public.bookings (user_id, session_date);

-- ---------- VALIDAZIONE PRENOTAZIONE ----------
-- Controlla: slot attivo, data coerente, audience/ruolo,
-- capienza massima e limite settimanale dell'utente.
create or replace function public.check_booking_valid()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_slot   public.training_slots%rowtype;
  v_prof   public.profiles%rowtype;
  v_count  int;
begin
  select * into v_slot from public.training_slots where id = new.slot_id for update;

  if not v_slot.is_active then
    raise exception 'Slot non attivo';
  end if;

  if v_slot.event_date is not null then
    if new.session_date <> v_slot.event_date then
      raise exception 'La data non corrisponde all''evento';
    end if;
  elsif extract(dow from new.session_date)::int <> v_slot.weekday then
    raise exception 'La data non corrisponde al giorno dello slot';
  end if;

  select * into v_prof from public.profiles where id = new.user_id;

  if v_prof.role <> 'admin' then
    if v_slot.audience = 'agonisti' and v_prof.role <> 'agonista' then
      raise exception 'Slot riservato agli agonisti';
    end if;
    if v_slot.audience = 'amatori' and v_prof.role <> 'amatore' then
      raise exception 'Slot riservato agli amatori';
    end if;

    -- limite settimanale (settimana ISO della data di sessione)
    select count(*) into v_count
    from public.bookings
    where user_id = new.user_id
      and status = 'active'
      and date_trunc('week', session_date) = date_trunc('week', new.session_date)
      and id <> new.id;

    if v_count >= v_prof.weekly_limit then
      raise exception 'Limite settimanale raggiunto (max % prenotazioni)', v_prof.weekly_limit;
    end if;
  end if;

  -- capienza massima (il FOR UPDATE sullo slot serializza gli inserimenti concorrenti)
  select count(*) into v_count
  from public.bookings
  where slot_id = new.slot_id
    and session_date = new.session_date
    and status = 'active'
    and id <> new.id;

  if v_count >= v_slot.max_capacity then
    raise exception 'Slot al completo (capienza massima: %)', v_slot.max_capacity;
  end if;

  return new;
end; $$;

create trigger trg_check_booking
  before insert on public.bookings
  for each row when (new.status = 'active')
  execute function public.check_booking_valid();

-- ---------- STORICO / AUDIT LOG ----------
create table public.booking_history (
  id           bigint generated always as identity primary key,
  booking_id   uuid not null,
  slot_id      uuid not null,
  user_id      uuid not null,
  action       text not null check (action in ('created', 'cancelled', 'admin_cancelled', 'admin_modified')),
  actor_id     uuid,
  session_date date not null,
  occurred_at  timestamptz not null default now()
);

create or replace function public.log_booking_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_history (booking_id, slot_id, user_id, action, actor_id, session_date)
    values (new.id, new.slot_id, new.user_id, 'created', auth.uid(), new.session_date);
  elsif tg_op = 'UPDATE' and old.status = 'active' and new.status = 'cancelled' then
    insert into public.booking_history (booking_id, slot_id, user_id, action, actor_id, session_date)
    values (new.id, new.slot_id, new.user_id,
            case when auth.uid() = new.user_id then 'cancelled' else 'admin_cancelled' end,
            auth.uid(), new.session_date);
  elsif tg_op = 'UPDATE' then
    insert into public.booking_history (booking_id, slot_id, user_id, action, actor_id, session_date)
    values (new.id, new.slot_id, new.user_id, 'admin_modified', auth.uid(), new.session_date);
  end if;
  return new;
end; $$;

create trigger trg_log_booking
  after insert or update on public.bookings
  for each row execute function public.log_booking_change();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles        enable row level security;
alter table public.training_slots  enable row level security;
alter table public.bookings        enable row level security;
alter table public.booking_history enable row level security;

-- profiles
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');
create policy "profiles update" on public.profiles for update
  using (id = auth.uid() or public.current_user_role() = 'admin');
  -- role/weekly_limit protetti dal trigger trg_protect_profile

-- training_slots
create policy "slots readable" on public.training_slots for select
  using (auth.role() = 'authenticated');
create policy "admin manages slots" on public.training_slots for all
  using (public.current_user_role() = 'admin');

-- bookings: l'utente gestisce le proprie, l'admin tutte.
-- I nomi degli altri prenotati passano dalla vista slot_occupancy (solo conteggi).
create policy "bookings read" on public.bookings for select
  using (user_id = auth.uid() or public.current_user_role() = 'admin');
create policy "bookings insert" on public.bookings for insert
  with check (user_id = auth.uid() or public.current_user_role() = 'admin');
create policy "bookings update" on public.bookings for update
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- booking_history: proprio storico o admin; scrive solo il trigger (security definer)
create policy "history read" on public.booking_history for select
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- ---------- VISTA: occupazione slot ----------
-- security definer di fatto (funzione), così TUTTI vedono i conteggi
-- senza vedere le prenotazioni altrui.
create or replace function public.slot_occupancy(p_from date, p_to date)
returns table (slot_id uuid, session_date date, booked int)
language sql stable security definer set search_path = public as $$
  select b.slot_id, b.session_date, count(*)::int
  from public.bookings b
  where b.status = 'active'
    and b.session_date between p_from and p_to
  group by b.slot_id, b.session_date;
$$;
