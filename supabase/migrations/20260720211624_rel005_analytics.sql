create table if not exists public.forge_analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  session_hash text not null,
  properties jsonb not null default '{}'::jsonb,
  device_type text,
  user_agent_family text,
  traffic_source text,
  route text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists forge_analytics_events_occurred_at_idx on public.forge_analytics_events (occurred_at desc);
create index if not exists forge_analytics_events_event_name_idx on public.forge_analytics_events (event_name, occurred_at desc);
alter table public.forge_analytics_events enable row level security;
revoke all on public.forge_analytics_events from anon, authenticated;
grant all on public.forge_analytics_events to service_role;
