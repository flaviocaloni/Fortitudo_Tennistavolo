-- ============================================================
-- Data inizio/fine per gli slot ricorrenti settimanali.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.training_slots add column start_date date;
alter table public.training_slots add column end_date date;

alter table public.training_slots
  add constraint valid_slot_date_range
  check (end_date is null or start_date is null or end_date > start_date);

-- Slot ricorrenti esistenti: stagione 2026/2027 (07/09/2026 - 10/06/2027)
update public.training_slots
set start_date = '2026-09-07', end_date = '2027-06-10'
where event_date is null;
