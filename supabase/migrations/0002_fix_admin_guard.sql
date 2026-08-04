-- Fix: il guard su ruolo/limite bloccava anche SQL Editor e service role
-- (contesti senza utente autenticato). Ora blocca solo gli utenti
-- autenticati non-admin. Eseguire nel SQL Editor dei progetti creati
-- con la versione precedente di 0001_init.sql.

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() null = SQL editor / service role: sempre consentito
  if (new.role <> old.role or new.weekly_limit <> old.weekly_limit)
     and auth.uid() is not null
     and public.current_user_role() is distinct from 'admin' then
    raise exception 'Solo l''admin può modificare ruolo e limite settimanale';
  end if;
  return new;
end; $$;
