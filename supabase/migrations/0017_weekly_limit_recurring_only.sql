-- ============================================================
-- Applica limite settimanale solo ai slot ricorrenti, non agli eventi.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

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

    -- limite settimanale: applica solo per slot ricorrenti, non per eventi
    if v_slot.event_date is null then
      select count(*) into v_count
      from public.bookings b
      join public.training_slots ts on b.slot_id = ts.id
      where b.user_id = new.user_id
        and b.status = 'active'
        and ts.event_date is null
        and date_trunc('week', b.session_date) = date_trunc('week', new.session_date)
        and b.id <> new.id;

      if v_count >= v_prof.weekly_limit then
        raise exception 'Limite settimanale raggiunto (max % prenotazioni)', v_prof.weekly_limit;
      end if;
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
