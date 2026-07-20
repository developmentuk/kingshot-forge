-- Sprint 8.0B: additive Forge Identity and User Management foundation.
-- Legacy forge_user_roles remains readable for compatibility; privileged
-- mutations use the service-authorized assignment/status/audit tables below.

begin;

create table if not exists public.forge_user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.forge_platform_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  grant_reason text not null,
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  revoke_reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(grant_reason)) between 1 and 2000),
  check (revoked_at is null or active = false),
  check (revoked_at is null or revoke_reason is not null and length(trim(revoke_reason)) between 1 and 2000)
);

create unique index if not exists forge_user_role_assignments_active_unique
  on public.forge_user_role_assignments(user_id, role) where active;
create index if not exists forge_user_role_assignments_user_active_idx
  on public.forge_user_role_assignments(user_id, active, role);

insert into public.forge_user_role_assignments (user_id, role, granted_at, grant_reason, active)
select fur.user_id, fur.role, fur.created_at, 'Legacy Forge role assignment preserved during Sprint 8.0B migration.', true
from public.forge_user_roles fur
where not exists (
  select 1 from public.forge_user_role_assignments assignment
  where assignment.user_id = fur.user_id and assignment.role = fur.role and assignment.active
);

create table if not exists public.forge_user_account_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'restricted', 'suspended', 'deactivated')),
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  reason text,
  updated_at timestamptz not null default now(),
  check (reason is null or length(trim(reason)) between 1 and 2000)
);

insert into public.forge_user_account_status (user_id)
select id from auth.users
where not exists (select 1 from public.forge_user_account_status status where status.user_id = auth.users.id);

create index if not exists forge_user_account_status_status_idx
  on public.forge_user_account_status(status, changed_at desc);

create table if not exists public.forge_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_workspace text not null default 'player',
  updated_at timestamptz not null default now(),
  check (last_workspace in ('player', 'contributor', 'creator', 'moderation', 'operations'))
);

insert into public.forge_user_preferences (user_id)
select id from auth.users
where not exists (select 1 from public.forge_user_preferences preference where preference.user_id = auth.users.id);

create table if not exists public.forge_identity_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  target_user_id uuid not null references auth.users(id),
  action text not null,
  domain text not null default 'identity',
  reason text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now(),
  check (length(trim(action)) between 1 and 120),
  check (length(trim(domain)) between 1 and 120),
  check (length(trim(reason)) between 1 and 2000)
);

create index if not exists forge_identity_audit_target_created_idx
  on public.forge_identity_audit_events(target_user_id, created_at desc);
create index if not exists forge_identity_audit_actor_created_idx
  on public.forge_identity_audit_events(actor_user_id, created_at desc);

alter table public.forge_user_role_assignments enable row level security;
alter table public.forge_user_role_assignments force row level security;
alter table public.forge_user_account_status enable row level security;
alter table public.forge_user_account_status force row level security;
alter table public.forge_user_preferences enable row level security;
alter table public.forge_user_preferences force row level security;
alter table public.forge_identity_audit_events enable row level security;
alter table public.forge_identity_audit_events force row level security;

revoke all on table public.forge_user_role_assignments from anon, authenticated;
revoke all on table public.forge_user_account_status from anon, authenticated;
revoke all on table public.forge_user_preferences from anon, authenticated;
revoke all on table public.forge_identity_audit_events from anon, authenticated;
grant all on table public.forge_user_role_assignments to service_role;
grant all on table public.forge_user_account_status to service_role;
grant all on table public.forge_user_preferences to service_role;
grant all on table public.forge_identity_audit_events to service_role;

-- New users receive a safe default identity state without granting privilege.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  insert into public.forge_user_role_assignments (user_id, role, grant_reason)
  values (new.id, 'viewer'::public.forge_platform_role, 'Default Forge Identity role.')
  on conflict do nothing;
  insert into public.forge_user_account_status (user_id)
  values (new.id) on conflict (user_id) do nothing;
  insert into public.forge_user_preferences (user_id)
  values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.current_forge_role()
returns public.forge_platform_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select assignment.role from public.forge_user_role_assignments assignment where assignment.user_id = auth.uid() and assignment.active order by case assignment.role when 'owner' then 1 when 'admin' then 2 when 'moderator' then 3 when 'content_creator' then 4 when 'contributor' then 5 when 'beta_tester' then 6 else 7 end limit 1),
    (select legacy.role from public.forge_user_roles legacy where legacy.user_id = auth.uid() limit 1),
    'viewer'::public.forge_platform_role
  );
$$;

create or replace function public.has_forge_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.forge_role_permissions permission
    join public.forge_user_role_assignments assignment on assignment.role = permission.role
    where assignment.user_id = auth.uid() and assignment.active and permission.permission_key = requested_permission
  ) or exists (
    select 1
    from public.forge_role_permissions permission
    join public.forge_user_roles legacy on legacy.role = permission.role
    where legacy.user_id = auth.uid() and permission.permission_key = requested_permission
  );
$$;

-- Keep the capability vocabulary in the existing role-permission authority.
insert into public.forge_permissions (permission_key, label, description)
select permission_key, label, description
from (values
  ('users.read','Read Forge identities','View the safe Operations user projection.'),
  ('users.read_sensitive','Read sensitive identity fields','View authorized email addresses in Operations.'),
  ('users.manage_status','Manage account status','Change active, restricted, suspended or deactivated status.'),
  ('users.manage_roles','Manage Forge roles','Assign and revoke non-Owner Forge roles.'),
  ('users.view_audit','View identity audit','Read safe identity mutation history.'),
  ('roles.assign_standard','Assign standard roles','Assign viewer, contributor or beta tester roles.'),
  ('roles.assign_privileged','Assign privileged roles','Assign approved contributor, creator, moderator or admin roles.'),
  ('roles.assign_owner','Assign Owner','Assign or revoke Owner only under Owner authority.'),
  ('roles.revoke','Revoke Forge roles','Revoke active Forge role assignments.'),
  ('audit.read','Read audit records','Read safe operational audit records.')
) capability(permission_key, label, description)
where not exists (select 1 from public.forge_permissions existing where existing.permission_key = capability.permission_key);

insert into public.forge_role_permissions (role, permission_key)
select mapping.role::public.forge_platform_role, mapping.permission_key
from (values
  ('owner','users.read'),('owner','users.read_sensitive'),('owner','users.manage_status'),('owner','users.manage_roles'),('owner','users.view_audit'),('owner','roles.assign_standard'),('owner','roles.assign_privileged'),('owner','roles.assign_owner'),('owner','roles.revoke'),('owner','audit.read'),
  ('admin','users.read'),('admin','users.manage_status'),('admin','users.manage_roles'),('admin','users.view_audit'),('admin','roles.assign_standard'),('admin','roles.assign_privileged'),('admin','roles.revoke'),('admin','audit.read')
) mapping(role, permission_key)
where not exists (select 1 from public.forge_role_permissions existing where existing.role = mapping.role::public.forge_platform_role and existing.permission_key = mapping.permission_key);

create or replace function public.get_my_forge_access()
returns table(role public.forge_platform_role, permission_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct access.role, permission.permission_key
  from (
    select assignment.role from public.forge_user_role_assignments assignment where assignment.user_id = auth.uid() and assignment.active
    union
    select legacy.role from public.forge_user_roles legacy where legacy.user_id = auth.uid()
  ) access
  join public.forge_role_permissions permission on permission.role = access.role;
$$;
revoke all on function public.get_my_forge_access() from public;
grant execute on function public.get_my_forge_access() to authenticated;

commit;
