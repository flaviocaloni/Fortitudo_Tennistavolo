-- ============================================================
-- Migration 0066: ripristina overbooking su slot ricorrenti in check_booking_valid
-- Problema: la 0056 ha riscritto check_booking_valid senza la logica di overbooking
-- introdotta dalla 0019 (is_overbooking su slot ricorrenti). Così ogni slot pieno
-- rifiutava la prenotazione con "Slot al completo", anche per il pulsante
-- "Prenota in overbooking" del calendario.
-- Questa versione unisce:
--   - controllo chiusure del centro (0065)
--   - limite settimanale escluso per eventi e pizza (0056)
--   - overbooking sugli slot ricorrenti, blocco sugli eventi (0019)
-- Eseguire nel SQL Editor di Supabase.
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
  elsif extract(dow from new.session_date)::int <> v_slot.weekday then
    raise exception 'La data non corrisponde al giorno dello slot';
  end if;

  -- chiusure del centro (valgono per tutti, anche per le prenotazioni automatiche)
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

    -- limite settimanale: applica solo per slot ricorrenti, non per eventi o pizza
    if v_slot.event_date is null and v_slot.pizza_date is null then
      select count(*) into v_count
      from public.bookings b
      join public.training_slots ts on b.slot_id = ts.id
      where b.user_id = new.user_id
        and b.status = 'active'
        and ts.event_date is null
        and ts.pizza_date is null
        and date_trunc('week', b.session_date) = date_trunc('week', new.session_date)
        and b.id <> new.id;

      if v_count >= v_prof.weekly_limit then
        raise exception 'Limite settimanale raggiunto (max % prenotazioni)', v_prof.weekly_limit;
      end if;
    end if;
  end if;

  -- posti occupati da prenotazioni "regolari" (esclusi gli overbooking)
  select count(*) into v_count
  from public.bookings
  where slot_id = new.slot_id
    and session_date = new.session_date
    and status = 'active'
    and is_overbooking = false
    and id <> new.id;

  if v_slot.event_date is null then
    -- slot ricorrente: se non c'è spazio la prenotazione va in overbooking
    if v_count >= v_slot.max_capacity then
      new.is_overbooking := true;
    end if;
  else
    -- evento: blocca se non c'è spazio
    if v_count >= v_slot.max_capacity then
      raise exception 'Slot al completo (capienza massima: %)', v_slot.max_capacity;
    end if;
  end if;

  return new;
end; $$;
