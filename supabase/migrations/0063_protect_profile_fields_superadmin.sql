-- Migration 0063: il guard su ruolo/limite deve accettare anche il superadmin.
-- Problema: protect_profile_fields (0002) consentiva la modifica solo se
-- current_user_role() = 'admin', quindi un superadmin non poteva assegnare
-- ruoli (admin/superadmin) né cambiare il limite settimanale degli utenti.
-- Il trigger handle_new_user (0001) resta invariato: accetta dai metadati
-- solo agonista/amatore, per evitare escalation dal form di registrazione.
-- Eseguire nel SQL Editor di Supabase.

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() null = SQL editor / service role: sempre consentito
  if (new.role <> old.role or new.weekly_limit <> old.weekly_limit)
     and auth.uid() is not null
     and public.current_user_role() is distinct from 'admin'
     and public.current_user_role() is distinct from 'superadmin' then
    raise exception 'Solo l''admin può modificare ruolo e limite settimanale';
  end if;
  return new;
end; $$;
