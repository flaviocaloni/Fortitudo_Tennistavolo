-- Aggiungi campo per la scadenza del certificato medico
alter table public.profiles
add column medical_certificate_expiry date;

-- Aggiungi impostazione admin per i giorni di avviso (default 30)
insert into public.app_settings (key, value)
values ('medical_cert_warning_days', '30')
on conflict (key) do update set value = excluded.value;

-- Funzione helper per calcolare lo stato del certificato
create or replace function public.medical_cert_status(cert_expiry date)
returns text
language sql immutable as $$
  select case
    when cert_expiry is null then 'missing'
    when cert_expiry < current_date then 'expired'
    when cert_expiry <= current_date + interval '30 days' then 'expiring'
    else 'valid'
  end;
$$;
