-- Sprint 8.0C: secure Forge Contributor application workflow.
begin;

create table if not exists public.forge_contributor_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  primary_role_key text not null,
  additional_role_keys text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','submitted','under_review','more_information_requested','conversation','accepted','declined','withdrawn','onboarding','active','closed')),
  display_name text not null default '',
  discord_username text,
  timezone text,
  kingdom text,
  experience_summary text not null default '',
  motivation text not null default '',
  relevant_skills text not null default '',
  portfolio_links text[] not null default '{}',
  availability_summary text not null default '',
  accessibility_support text,
  confirmation_unpaid boolean not null default false,
  confirmation_age_18 boolean not null default false,
  confirmation_conduct boolean not null default false,
  confirmation_privacy boolean not null default false,
  assigned_reviewer_user_id uuid references auth.users(id),
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(display_name)) <= 160),
  check (length(trim(experience_summary)) <= 6000),
  check (length(trim(motivation)) <= 6000),
  check (length(trim(relevant_skills)) <= 6000),
  check (length(trim(availability_summary)) <= 2000),
  check (array_length(portfolio_links, 1) is null or array_length(portfolio_links, 1) <= 5),
  check (status <> 'submitted' or (confirmation_unpaid and confirmation_age_18 and confirmation_conduct and confirmation_privacy))
);

create table if not exists public.forge_contributor_application_answers (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.forge_contributor_applications(id) on delete cascade,
  question_key text not null, answer_text text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(application_id, question_key), check (length(trim(question_key)) between 1 and 120), check (length(answer_text) <= 6000)
);

create table if not exists public.forge_contributor_application_reviews (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.forge_contributor_applications(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id), recommendation text, internal_notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (recommendation is null or recommendation in ('recommend','hold','decline')), check (length(internal_notes) <= 10000)
);

create table if not exists public.forge_contributor_application_messages (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.forge_contributor_applications(id) on delete cascade,
  author_user_id uuid not null references auth.users(id), message_text text not null, visibility text not null check (visibility in ('applicant_visible','internal')), created_at timestamptz not null default now(),
  check (length(trim(message_text)) between 1 and 10000)
);

create table if not exists public.forge_contributor_application_events (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.forge_contributor_applications(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id), action text not null, previous_status text, new_status text, reason text not null default '', safe_metadata jsonb not null default '{}', created_at timestamptz not null default now(),
  check (length(trim(action)) between 1 and 120), check (length(reason) <= 2000)
);

create table if not exists public.forge_contributor_onboarding (
  id uuid primary key default gen_random_uuid(), application_id uuid not null unique references public.forge_contributor_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id), approved_role_key text not null, onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started','in_progress','awaiting_applicant','awaiting_internal_action','completed','cancelled')),
  assigned_owner_user_id uuid references auth.users(id), checklist_json jsonb not null default '[]', started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists forge_contributor_applications_status_idx on public.forge_contributor_applications(status);
create index if not exists forge_contributor_applications_applicant_idx on public.forge_contributor_applications(applicant_user_id);
create index if not exists forge_contributor_applications_role_idx on public.forge_contributor_applications(primary_role_key);
create index if not exists forge_contributor_applications_submitted_idx on public.forge_contributor_applications(submitted_at desc);
create index if not exists forge_contributor_applications_reviewer_idx on public.forge_contributor_applications(assigned_reviewer_user_id);
create index if not exists forge_contributor_application_events_time_idx on public.forge_contributor_application_events(application_id, created_at desc);

alter table public.forge_contributor_applications enable row level security; alter table public.forge_contributor_applications force row level security;
alter table public.forge_contributor_application_answers enable row level security; alter table public.forge_contributor_application_answers force row level security;
alter table public.forge_contributor_application_reviews enable row level security; alter table public.forge_contributor_application_reviews force row level security;
alter table public.forge_contributor_application_messages enable row level security; alter table public.forge_contributor_application_messages force row level security;
alter table public.forge_contributor_application_events enable row level security; alter table public.forge_contributor_application_events force row level security;
alter table public.forge_contributor_onboarding enable row level security; alter table public.forge_contributor_onboarding force row level security;

revoke all on table public.forge_contributor_applications, public.forge_contributor_application_answers, public.forge_contributor_application_reviews, public.forge_contributor_application_messages, public.forge_contributor_application_events, public.forge_contributor_onboarding from anon, authenticated;
grant all on table public.forge_contributor_applications, public.forge_contributor_application_answers, public.forge_contributor_application_reviews, public.forge_contributor_application_messages, public.forge_contributor_application_events, public.forge_contributor_onboarding to service_role;

insert into public.forge_permissions(permission_key, label, description) values
('applications.read','Read contributor applications','Read safe recruitment application projections.'),
('applications.review','Review contributor applications','Start and assess recruitment reviews.'),
('applications.request_information','Request application information','Ask applicants for more information.'),
('applications.change_status','Change application status','Perform validated recruitment status changes.'),
('applications.assign_reviewer','Assign application reviewer','Assign a recruitment reviewer.'),
('applications.view_internal_notes','View internal application notes','Read reviewer-only recruitment notes.'),
('applications.manage_onboarding','Manage contributor onboarding','Start and manage contributor onboarding.'),
('applications.manage_role_catalogue','Manage contributor role catalogue','Manage recruitment role availability.')
on conflict (permission_key) do nothing;

insert into public.forge_role_permissions(role, permission_key)
select mapping.role::public.forge_platform_role, mapping.permission_key from (values
('owner','applications.read'),('owner','applications.review'),('owner','applications.request_information'),('owner','applications.change_status'),('owner','applications.assign_reviewer'),('owner','applications.view_internal_notes'),('owner','applications.manage_onboarding'),('owner','applications.manage_role_catalogue'),
('admin','applications.read'),('admin','applications.review'),('admin','applications.request_information'),('admin','applications.change_status'),('admin','applications.assign_reviewer'),('admin','applications.view_internal_notes'),('admin','applications.manage_onboarding'),('admin','applications.manage_role_catalogue')
) mapping(role, permission_key)
where not exists (select 1 from public.forge_role_permissions existing where existing.role = mapping.role::public.forge_platform_role and existing.permission_key = mapping.permission_key);

commit;
