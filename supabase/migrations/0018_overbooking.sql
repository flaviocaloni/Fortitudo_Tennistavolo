-- ============================================================
-- Overbooking per slot ricorrenti.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.bookings add column is_overbooking boolean not null default false;

-- Trigger per promuovere da overbooking quando si libera un posto su slot ricorrenti
create or replace function public.promote_from_overbooking()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_slot public.training_slots%rowtype;
  v_count int;
  v_promoted_booking public.bookings%rowtype;
begin
  if old.status = 'active' and new.status = 'cancelled' then
    select * into v_slot from public.training_slots where id = old.slot_id;

    -- Promuovi solo se è uno slot ricorrente (event_date is null)
    if v_slot.event_date is null then
      select count(*) into v_count
      from public.bookings
      where slot_id = old.slot_id
        and session_date = old.session_date
        and status = 'active'
        and is_overbooking = false;

      -- Se c'è spazio e ci sono utenti in overbooking, promuovi il primo
      if v_count < v_slot.max_capacity then
        select * into v_promoted_booking
        from public.bookings
        where slot_id = old.slot_id
          and session_date = old.session_date
          and status = 'active'
          and is_overbooking = true
        order by created_at asc
        limit 1;

        if v_promoted_booking.id is not null then
          update public.bookings
          set is_overbooking = false
          where id = v_promoted_booking.id;
        end if;
      end if;
    end if;
  end if;

  return new;
end; $$;

create trigger trg_promote_from_overbooking
  after update on public.bookings
  for each row
  execute function public.promote_from_overbooking();
