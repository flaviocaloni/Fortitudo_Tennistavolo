-- ============================================================
-- Aggiornare validazione prenotazione per slot PIZZA
-- Controllare che selected_participants non superi max_participants
-- ============================================================

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
  elsif v_slot.pizza_date is not null then
    if new.session_date <> v_slot.pizza_date then
      raise exception 'La data non corrisponde all''evento pizza';
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

  -- Validazione specifica per slot PIZZA
  if v_slot.pizza_date is not null then
    -- Se non è specificato, default a 1
    if new.selected_participants is null then
      new.selected_participants := 1;
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
