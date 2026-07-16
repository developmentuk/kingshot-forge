create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid null references auth.users(id) on delete set null,
  reporter_email text null,
  report_type text not null default 'data_issue'
    check (report_type in ('data_issue','update_request','bug','suggestion','other')),
  title text not null,
  description text not null,
  page_url text null,
  entity_type text null,
  entity_id text null,
  entity_name text null,
  status text not null default 'new'
    check (status in ('new','triaged','in_progress','resolved','closed')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  assigned_to uuid null references auth.users(id) on delete set null,
  admin_notes text null,
  resolution text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists feedback_reports_status_created_idx
  on public.feedback_reports(status, created_at desc);
create index if not exists feedback_reports_entity_idx
  on public.feedback_reports(entity_type, entity_id);

alter table public.feedback_reports enable row level security;

create policy "Anyone can submit feedback"
on public.feedback_reports for insert
to anon, authenticated
with check (reporter_id is null or reporter_id = auth.uid());

create policy "Reporters can read their feedback"
on public.feedback_reports for select
to authenticated
using (reporter_id = auth.uid());

create policy "Forge team can read feedback"
on public.feedback_reports for select
to authenticated
using (
  exists (
    select 1 from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role in ('owner','admin','moderator','content_creator')
  )
);

create policy "Forge team can update feedback"
on public.feedback_reports for update
to authenticated
using (
  exists (
    select 1 from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role in ('owner','admin','moderator','content_creator')
  )
)
with check (
  exists (
    select 1 from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role in ('owner','admin','moderator','content_creator')
  )
);

create or replace function public.set_feedback_report_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    new.resolved_at = now();
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

create trigger feedback_reports_updated_at
before update on public.feedback_reports
for each row execute function public.set_feedback_report_updated_at();
