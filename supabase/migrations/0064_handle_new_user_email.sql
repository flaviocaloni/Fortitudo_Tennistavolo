-- Migration 0064: handle_new_user deve valorizzare profiles.email.
-- Problema: la 0052 ha reso profiles.email NOT NULL (constraint profiles_email_not_null),
-- ma il trigger handle_new_user (0001) inserisce il profilo senza email.
-- Risultato: ogni insert in auth.users fallisce, Supabase Auth risponde 500
-- (es. creazione utente da /admin/utenti con errore senza messaggio).
-- Questa migrazione ricrea la funzione includendo new.email.
-- Eseguire nel SQL Editor di Supabase.

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
  insert into public.profiles (id, email, full_name, role, weekly_limit)
  values (new.id,
          new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.email),
          v_role, v_limit);
  return new;
end; $$;

-- Eventuali utenti in auth.users senza profilo (creati mentre il trigger era rotto)
-- non vengono toccati qui: verificare con
--   select u.id, u.email from auth.users u left join public.profiles p on p.id = u.id where p.id is null;
