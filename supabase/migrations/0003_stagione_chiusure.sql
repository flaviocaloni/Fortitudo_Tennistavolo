-- ============================================================
-- Stagione 2026/2027: chiusure del centro + regola 1 turno/giorno
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

-- ---------- CHIUSURE ----------
create table public.club_closures (
  id         uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date   date not null,
  reason     text not null default 'Chiusura',
  created_at timestamptz not null default now(),
  constraint valid_closure_range check (end_date >= start_date)
);

alter table public.club_closures enable row level security;

create policy "closures readable" on public.club_closures for select
  using (auth.role() = 'authenticated');
create policy "admin manages closures" on public.club_closures for all
  using (public.current_user_role() = 'admin');

-- ---------- VALIDAZIONE PRENOTAZIONE (v2) ----------
-- Aggiunge: blocco nelle date di chiusura e, per i non-admin,
-- massimo UNA prenotazione al giorno (es. lunedì: 1° O 2° turno).
create or replace function public.check_booking_valid()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_slot   public.training_slots%rowtype;
  v_prof   public.profiles%rowtype;
  v_count  int;
  v_reason text;
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

  -- chiusure del centro (valgono per tutti)
  select reason into v_reason
  from public.club_closures
  where new.session_date between start_date and end_date
  limit 1;
  if v_reason is not null then
    raise exception 'Centro chiuso: %', v_reason;
  end if;

  select * into v_prof from public.profiles where id = new.user_id;

  if v_prof.role <> 'admin' then
    if v_slot.audience = 'agonisti' and v_prof.role <> 'agonista' then
      raise exception 'Slot riservato agli agonisti';
    end if;
    if v_slot.audience = 'amatori' and v_prof.role <> 'amatore' then
      raise exception 'Slot riservato agli amatori';
    end if;

    -- un solo turno al giorno
    if exists (
      select 1 from public.bookings
      where user_id = new.user_id
        and session_date = new.session_date
        and status = 'active'
        and id <> new.id
    ) then
      raise exception 'Hai già una prenotazione per questo giorno: è possibile un solo turno al giorno';
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

  -- capienza massima
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

-- ---------- CHIUSURE STAGIONE 2026/2027 ----------
insert into public.club_closures (start_date, end_date, reason) values
  ('2026-08-04', '2026-09-06', 'Inizio stagione il 07/09/2026'),
  ('2026-12-22', '2027-01-06', 'Chiusura natalizia'),
  ('2027-03-25', '2027-03-25', 'Pasqua'),
  ('2027-03-29', '2027-03-29', 'Pasqua'),
  ('2027-06-02', '2027-06-02', 'Festa della Repubblica'),
  ('2027-06-11', '2027-09-05', 'Pausa estiva — stagione terminata il 10/06/2027');
