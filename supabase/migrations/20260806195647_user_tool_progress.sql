begin;

create table if not exists public.user_tool_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_key text not null,
  progress_key text not null default 'default',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tool_progress_state_object check (jsonb_typeof(state) = 'object'),
  constraint user_tool_progress_unique_key unique (user_id, tool_key, progress_key)
);

create index if not exists user_tool_progress_user_tool_idx
  on public.user_tool_progress (user_id, tool_key);

create or replace function public.set_user_tool_progress_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_tool_progress_updated_at on public.user_tool_progress;
create trigger user_tool_progress_updated_at
before update on public.user_tool_progress
for each row execute function public.set_user_tool_progress_updated_at();

alter table public.user_tool_progress enable row level security;
revoke all on table public.user_tool_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.user_tool_progress to authenticated;

drop policy if exists user_tool_progress_select_owner on public.user_tool_progress;
create policy user_tool_progress_select_owner
on public.user_tool_progress
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists user_tool_progress_insert_owner on public.user_tool_progress;
create policy user_tool_progress_insert_owner
on public.user_tool_progress
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists user_tool_progress_update_owner on public.user_tool_progress;
create policy user_tool_progress_update_owner
on public.user_tool_progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists user_tool_progress_delete_owner on public.user_tool_progress;
create policy user_tool_progress_delete_owner
on public.user_tool_progress
for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
