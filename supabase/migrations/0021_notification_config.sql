-- ============================================================
-- Notifiche email per prenotazioni evento non ricorrente.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

-- Tipo enum per codici notifica
create type public.notification_code as enum ('EVENT_NON_RECURRING_BOOKING');

-- Tipo enum per modalità destinatari
create type public.recipient_mode as enum ('ALL_ADMINS', 'ALL_USERS', 'MANUAL');

-- Tipo enum per stato delivery
create type public.delivery_status as enum ('pending', 'sent', 'failed');

-- Tabella configurazione notifiche
create table public.notification_configs (
  id bigserial primary key,
  notification_code public.notification_code not null unique,
  is_active boolean not null default true,
  delivery_channel text not null default 'EMAIL',
  recipient_mode public.recipient_mode not null default 'ALL_ADMINS',
  manual_recipient_ids uuid[] default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  constraint valid_recipient_ids check (
    recipient_mode != 'MANUAL' or manual_recipient_ids is not null
  )
);

-- Tabella storico invii
create table public.notification_delivery (
  id bigserial primary key,
  notification_config_id bigint not null references public.notification_configs(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  status public.delivery_status not null default 'pending',
  error_code text,
  error_message text,
  provider_response text,
  delivery_idempotency_key uuid not null unique default gen_random_uuid(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Tabella audit modifiche configurazione
create table public.notification_audit (
  id bigserial primary key,
  notification_config_id bigint not null references public.notification_configs(id) on delete cascade,
  change_type text not null check (change_type in ('created', 'updated', 'activated', 'deactivated')),
  modified_by uuid references public.profiles(id) on delete set null,
  previous_state jsonb,
  new_state jsonb,
  modified_at timestamptz not null default now()
);

-- RLS: notification_configs (solo admin legge/scrive)
alter table public.notification_configs enable row level security;

create policy "admin_read_notification_configs"
  on public.notification_configs
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "admin_write_notification_configs"
  on public.notification_configs
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS: notification_delivery (admin e destinatari legge, solo trigger scrive)
alter table public.notification_delivery enable row level security;

create policy "user_read_own_delivery"
  on public.notification_delivery
  for select
  using (
    recipient_user_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "delivery_insert_trigger_only"
  on public.notification_delivery
  for insert
  with check (true);

-- RLS: notification_audit (solo admin legge)
alter table public.notification_audit enable row level security;

create policy "admin_read_notification_audit"
  on public.notification_audit
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Trigger: aggiorna updated_at in notification_configs
create or replace function public.update_notification_config_timestamp()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger trg_notification_config_updated
  before update on public.notification_configs
  for each row
  execute function public.update_notification_config_timestamp();

-- Trigger: registra audit log per modifiche notification_configs
create or replace function public.audit_notification_config_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notification_audit (
      notification_config_id, change_type, modified_by, new_state
    ) values (
      new.id, 'created', auth.uid(), row_to_json(new)
    );
  elsif tg_op = 'UPDATE' then
    insert into public.notification_audit (
      notification_config_id, change_type, modified_by, previous_state, new_state
    ) values (
      new.id,
      case
        when old.is_active != new.is_active then
          case when new.is_active then 'activated' else 'deactivated' end
        else 'updated'
      end,
      auth.uid(),
      row_to_json(old),
      row_to_json(new)
    );
  end if;
  return new;
end; $$;

create trigger trg_audit_notification_config
  after insert or update on public.notification_configs
  for each row
  execute function public.audit_notification_config_change();

-- Indici per performance
create index idx_notification_delivery_booking_id on public.notification_delivery(booking_id);
create index idx_notification_delivery_recipient_user_id on public.notification_delivery(recipient_user_id);
create index idx_notification_delivery_status on public.notification_delivery(status);
create index idx_notification_audit_config_id on public.notification_audit(notification_config_id);

-- Inserisci configurazione iniziale (disattivata)
insert into public.notification_configs (
  notification_code, is_active, recipient_mode
) values (
  'EVENT_NON_RECURRING_BOOKING', false, 'ALL_ADMINS'
) on conflict (notification_code) do nothing;
