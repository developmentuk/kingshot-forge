begin;

create table if not exists public.editorial_record_versions (
  id text primary key,
  dataset_id text not null,
  record_id text not null,
  version integer not null check (version > 0),
  status text not null check (
    status in (
      'draft',
      'in_review',
      'approved',
      'published',
      'archived'
    )
  ),
  values jsonb not null default '{}'::jsonb,
  source jsonb,
  created_at timestamptz not null,
  created_by text not null,
  note text,
  unique (dataset_id, record_id, version)
);

create table if not exists public.editorial_record_heads (
  dataset_id text not null,
  record_id text not null,
  current_version integer not null check (
    current_version > 0
  ),
  current_version_id text not null references
    public.editorial_record_versions(id),
  status text not null check (
    status in (
      'draft',
      'in_review',
      'approved',
      'published',
      'archived'
    )
  ),
  updated_at timestamptz not null,
  updated_by text not null,
  primary key (dataset_id, record_id)
);

create table if not exists public.editorial_audit_events (
  id text primary key,
  dataset_id text not null,
  record_id text not null,
  version_id text not null references
    public.editorial_record_versions(id),
  action text not null,
  actor_id text not null,
  occurred_at timestamptz not null,
  from_status text,
  to_status text not null,
  note text,
  metadata jsonb
);

create index if not exists
  editorial_versions_record_idx
on public.editorial_record_versions (
  dataset_id,
  record_id,
  version
);

create index if not exists
  editorial_audit_record_idx
on public.editorial_audit_events (
  dataset_id,
  record_id,
  occurred_at
);

create table if not exists public.publication_queue (
  id text primary key,
  dataset_id text not null,
  record_id text not null,
  version_id text not null references
    public.editorial_record_versions(id),
  expected_version integer not null check (
    expected_version > 0
  ),
  requested_by text not null,
  requested_at timestamptz not null,
  status text not null check (
    status in (
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  attempts integer not null default 0 check (
    attempts >= 0
  ),
  last_attempt_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  failure_message text,
  note text,
  metadata jsonb
);

create unique index if not exists
  publication_queue_active_version_idx
on public.publication_queue (version_id)
where status in ('pending', 'processing');

create index if not exists
  publication_queue_status_idx
on public.publication_queue (
  status,
  requested_at
);

create table if not exists public.scheduled_publications (
  id text primary key,
  dataset_id text not null,
  record_id text not null,
  version_id text not null references
    public.editorial_record_versions(id),
  expected_version integer not null check (
    expected_version > 0
  ),
  requested_by text not null,
  requested_at timestamptz not null,
  publication_note text,
  publication_metadata jsonb,
  scheduled_for timestamptz not null,
  created_at timestamptz not null,
  created_by text not null,
  status text not null check (
    status in (
      'scheduled',
      'queued',
      'cancelled',
      'failed'
    )
  ),
  queued_at timestamptz,
  queue_item_id text references
    public.publication_queue(id),
  cancelled_at timestamptz,
  failure_message text,
  metadata jsonb
);

create unique index if not exists
  scheduled_publications_active_version_idx
on public.scheduled_publications (version_id)
where status = 'scheduled';

create index if not exists
  scheduled_publications_due_idx
on public.scheduled_publications (
  status,
  scheduled_for
);

create or replace function public.commit_editorial_version(
  p_head jsonb,
  p_version jsonb,
  p_audit_event jsonb,
  p_expected_version integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_version integer;
begin
  select current_version
  into existing_version
  from public.editorial_record_heads
  where dataset_id = p_head->>'dataset_id'
    and record_id = p_head->>'record_id'
  for update;

  if existing_version is null then
    if p_expected_version is not null then
      raise exception
        'Editorial record did not exist; expected version %',
        p_expected_version;
    end if;
  elsif existing_version is distinct from p_expected_version then
    raise exception
      'Editorial concurrency conflict: expected %, actual %',
      p_expected_version,
      existing_version;
  end if;

  insert into public.editorial_record_versions (
    id,
    dataset_id,
    record_id,
    version,
    status,
    values,
    source,
    created_at,
    created_by,
    note
  )
  values (
    p_version->>'id',
    p_version->>'dataset_id',
    p_version->>'record_id',
    (p_version->>'version')::integer,
    p_version->>'status',
    coalesce(p_version->'values', '{}'::jsonb),
    p_version->'source',
    (p_version->>'created_at')::timestamptz,
    p_version->>'created_by',
    p_version->>'note'
  );

  insert into public.editorial_record_heads (
    dataset_id,
    record_id,
    current_version,
    current_version_id,
    status,
    updated_at,
    updated_by
  )
  values (
    p_head->>'dataset_id',
    p_head->>'record_id',
    (p_head->>'current_version')::integer,
    p_head->>'current_version_id',
    p_head->>'status',
    (p_head->>'updated_at')::timestamptz,
    p_head->>'updated_by'
  )
  on conflict (dataset_id, record_id)
  do update set
    current_version = excluded.current_version,
    current_version_id = excluded.current_version_id,
    status = excluded.status,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;

  insert into public.editorial_audit_events (
    id,
    dataset_id,
    record_id,
    version_id,
    action,
    actor_id,
    occurred_at,
    from_status,
    to_status,
    note,
    metadata
  )
  values (
    p_audit_event->>'id',
    p_audit_event->>'dataset_id',
    p_audit_event->>'record_id',
    p_audit_event->>'version_id',
    p_audit_event->>'action',
    p_audit_event->>'actor_id',
    (p_audit_event->>'occurred_at')::timestamptz,
    p_audit_event->>'from_status',
    p_audit_event->>'to_status',
    p_audit_event->>'note',
    p_audit_event->'metadata'
  );

  return true;
end;
$$;

alter table public.editorial_record_versions
  enable row level security;
alter table public.editorial_record_heads
  enable row level security;
alter table public.editorial_audit_events
  enable row level security;
alter table public.publication_queue
  enable row level security;
alter table public.scheduled_publications
  enable row level security;

create policy
  "authenticated users can read editorial versions"
on public.editorial_record_versions
for select
to authenticated
using (true);

create policy
  "authenticated users can read editorial heads"
on public.editorial_record_heads
for select
to authenticated
using (true);

create policy
  "authenticated users can read editorial audit"
on public.editorial_audit_events
for select
to authenticated
using (true);

create policy
  "authenticated users can read publication queue"
on public.publication_queue
for select
to authenticated
using (true);

create policy
  "authenticated users can read schedules"
on public.scheduled_publications
for select
to authenticated
using (true);

revoke all on function public.commit_editorial_version(
  jsonb,
  jsonb,
  jsonb,
  integer
) from public;

grant execute on function public.commit_editorial_version(
  jsonb,
  jsonb,
  jsonb,
  integer
) to service_role;

commit;
