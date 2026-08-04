-- ============================================================
-- Impostazioni applicative configurabili dall'admin.
-- Prima impostazione: finestra di visibilità del calendario (giorni).
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

create table public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "settings readable" on public.app_settings for select
  using (auth.role() = 'authenticated');
create policy "admin manages settings" on public.app_settings for all
  using (public.current_user_role() = 'admin');

insert into public.app_settings (key, value)
values ('calendar_days_ahead', '90');
