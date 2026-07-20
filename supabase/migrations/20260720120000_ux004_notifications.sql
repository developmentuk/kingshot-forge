create table if not exists public.forge_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.forge_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.forge_notifications(id) on delete cascade,
  audit_event_id uuid null references public.forge_identity_audit_events(id) on delete set null,
  channel text not null check (channel in ('in_app','email')),
  status text not null,
  detail text null,
  created_at timestamptz not null default now()
);

alter table public.forge_notifications enable row level security;
alter table public.forge_notification_deliveries enable row level security;
create policy forge_notifications_owner_read on public.forge_notifications for select using (auth.uid() = user_id);
create policy forge_notifications_owner_update on public.forge_notifications for update using (auth.uid() = user_id);
create index if not exists forge_notifications_user_created_idx on public.forge_notifications(user_id, created_at desc);
