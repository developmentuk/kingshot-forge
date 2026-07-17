begin;

create schema if not exists forge_private;
create schema if not exists art_studio_private;

revoke all on schema forge_private from public;
revoke all on schema art_studio_private from public;
grant usage on schema forge_private to authenticated, service_role;
grant usage on schema art_studio_private to authenticated, service_role;

-- This repeats the shared capability helper because the CLI-generated migration
-- sorts before the existing future-dated editorial hardening migration.
create or replace function forge_private.has_permission(
  p_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.forge_user_roles as user_role
    join public.forge_role_permissions as role_permission
      on role_permission.role::text = user_role.role::text
    where user_role.user_id = (select auth.uid())
      and role_permission.permission_key::text = p_permission_key
  );
$$;

revoke all on function forge_private.has_permission(text) from public;
grant execute on function forge_private.has_permission(text)
  to authenticated, service_role;

create or replace function art_studio_private.has_valid_text(
  p_value text,
  p_maximum_code_points integer,
  p_required boolean default false
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_value is not null
    and (not p_required or length(trim(p_value)) > 0)
    and char_length(p_value) <= p_maximum_code_points
    and regexp_replace(p_value, E'[\t\n\r]', '', 'g') !~ '[[:cntrl:]]'
    and p_value !~ U&'[\200B\202A-\202E\2060\2066-\2069\FEFF]';
$$;

create or replace function art_studio_private.is_valid_artwork_transition(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('draft', 'submitted'),
    ('draft', 'archived'),
    ('submitted', 'draft'),
    ('submitted', 'changes_requested'),
    ('submitted', 'approved'),
    ('submitted', 'rejected'),
    ('changes_requested', 'submitted'),
    ('changes_requested', 'archived'),
    ('approved', 'published'),
    ('approved', 'rejected'),
    ('approved', 'archived'),
    ('published', 'unpublished'),
    ('unpublished', 'published'),
    ('unpublished', 'archived'),
    ('rejected', 'draft'),
    ('rejected', 'archived')
  );
$$;

create or replace function art_studio_private.has_valid_tags(
  p_tags text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_tags is not null
    and cardinality(p_tags) <= 10
    and not exists (
      select 1
      from unnest(p_tags) as tag(value)
      where not art_studio_private.has_valid_text(tag.value, 32, true)
    );
$$;

create or replace function art_studio_private.is_valid_report_transition(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('open', 'reviewing'),
    ('open', 'resolved'),
    ('open', 'dismissed'),
    ('reviewing', 'resolved'),
    ('reviewing', 'dismissed')
  );
$$;

create or replace function art_studio_private.is_valid_submission_transition(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('submitted', 'changes_requested'),
    ('submitted', 'approved'),
    ('submitted', 'rejected'),
    ('submitted', 'archived'),
    ('changes_requested', 'submitted'),
    ('changes_requested', 'archived'),
    ('approved', 'archived'),
    ('rejected', 'archived')
  );
$$;

revoke all on function art_studio_private.has_valid_text(text, integer, boolean)
  from public;
revoke all on function art_studio_private.is_valid_artwork_transition(text, text)
  from public;
revoke all on function art_studio_private.has_valid_tags(text[])
  from public;
revoke all on function art_studio_private.is_valid_report_transition(text, text)
  from public;
revoke all on function art_studio_private.is_valid_submission_transition(text, text)
  from public;
grant execute on function art_studio_private.has_valid_text(text, integer, boolean)
  to authenticated, service_role;
grant execute on function art_studio_private.is_valid_artwork_transition(text, text)
  to authenticated, service_role;
grant execute on function art_studio_private.has_valid_tags(text[])
  to authenticated, service_role;
grant execute on function art_studio_private.is_valid_report_transition(text, text)
  to authenticated, service_role;
grant execute on function art_studio_private.is_valid_submission_transition(text, text)
  to authenticated, service_role;

create table public.art_studio_artworks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  slug text not null,
  status text not null default 'draft'
    check (status in (
      'draft',
      'submitted',
      'changes_requested',
      'approved',
      'published',
      'unpublished',
      'rejected',
      'archived'
    )),
  current_revision_id uuid null,
  approved_revision_id uuid null,
  published_revision_id uuid null,
  version bigint not null default 1 check (version > 0),
  status_changed_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz null,
  approved_at timestamptz null,
  published_at timestamptz null,
  unpublished_at timestamptz null,
  archived_at timestamptz null,
  constraint art_studio_artworks_slug_format_check check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint art_studio_artworks_slug_key unique (slug),
  constraint art_studio_artworks_status_timestamp_check check (
    (status <> 'submitted' or submitted_at is not null)
    and (status <> 'approved' or approved_at is not null)
    and (status <> 'published' or published_at is not null)
    and (status <> 'unpublished' or unpublished_at is not null)
    and (status <> 'archived' or archived_at is not null)
  )
);

create table public.art_studio_artwork_revisions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.art_studio_artworks(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status text not null default 'draft'
    check (status in (
      'draft',
      'submitted',
      'changes_requested',
      'approved',
      'rejected'
    )),
  title text not null,
  description text not null default '',
  content text not null,
  category text not null check (category in (
    'Cats',
    'Animals',
    'Characters',
    'Announcements',
    'Battle',
    'KvK',
    'Alliance',
    'Flags',
    'Pixel Art',
    'Nature',
    'Funny',
    'Gaming',
    'Seasonal',
    'Other'
  )),
  tags text[] not null default '{}',
  on_behalf_of_another_creator boolean not null default false,
  attribution_display_name text null,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  approved_by_user_id uuid null references auth.users(id) on delete restrict,
  approval_note text null,
  workflow_version bigint not null default 1 check (workflow_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz null,
  approved_at timestamptz null,
  constraint art_studio_revision_identity_key unique (artwork_id, id),
  constraint art_studio_revision_number_key unique (artwork_id, revision_number),
  constraint art_studio_revision_title_check check (
    art_studio_private.has_valid_text(title, 120, true)
  ),
  constraint art_studio_revision_description_check check (
    art_studio_private.has_valid_text(description, 2000, false)
  ),
  constraint art_studio_revision_content_check check (
    art_studio_private.has_valid_text(content, 20000, true)
    and content !~ '(.)\1{255}\1{255}\1{2}'
  ),
  constraint art_studio_revision_tags_check check (
    art_studio_private.has_valid_tags(tags)
  ),
  constraint art_studio_revision_attribution_check check (
    art_studio_private.has_valid_text(
      coalesce(attribution_display_name, ''),
      120,
      on_behalf_of_another_creator
    )
  ),
  constraint art_studio_revision_approval_check check (
    status <> 'approved'
    or (
      approved_by_user_id is not null
      and approved_at is not null
    )
  )
);

alter table public.art_studio_artworks
  add constraint art_studio_artworks_current_revision_fkey
  foreign key (id, current_revision_id)
  references public.art_studio_artwork_revisions(artwork_id, id)
  on delete restrict;

alter table public.art_studio_artworks
  add constraint art_studio_artworks_approved_revision_fkey
  foreign key (id, approved_revision_id)
  references public.art_studio_artwork_revisions(artwork_id, id)
  on delete restrict;

alter table public.art_studio_artworks
  add constraint art_studio_artworks_published_revision_fkey
  foreign key (id, published_revision_id)
  references public.art_studio_artwork_revisions(artwork_id, id)
  on delete restrict;

create table public.art_studio_submissions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.art_studio_artworks(id) on delete restrict,
  revision_id uuid not null,
  submitter_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'submitted'
    check (status in (
      'submitted',
      'changes_requested',
      'approved',
      'rejected',
      'archived'
    )),
  reviewer_user_id uuid null references auth.users(id) on delete restrict,
  moderation_notes text null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  constraint art_studio_submission_revision_fkey
    foreign key (artwork_id, revision_id)
    references public.art_studio_artwork_revisions(artwork_id, id)
    on delete restrict,
  constraint art_studio_submission_revision_key unique (revision_id),
  constraint art_studio_submission_review_check check (
    status not in ('changes_requested', 'approved', 'rejected')
    or (
      reviewer_user_id is not null
      and reviewed_at is not null
    )
  )
);

create table public.art_studio_likes (
  artwork_id uuid not null references public.art_studio_artworks(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (artwork_id, user_id)
);

create table public.art_studio_reports (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.art_studio_artworks(id) on delete restrict,
  reporter_user_id uuid not null references auth.users(id) on delete restrict,
  category text not null check (category in (
    'rendering_issue',
    'offensive_abusive',
    'copyright_ownership',
    'misleading_misclassified',
    'other'
  )),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  details text not null,
  assigned_moderator_user_id uuid null references auth.users(id) on delete restrict,
  resolution text null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz null,
  constraint art_studio_report_details_check check (
    art_studio_private.has_valid_text(details, 2000, true)
  ),
  constraint art_studio_report_resolution_check check (
    resolution is null
    or art_studio_private.has_valid_text(resolution, 4000, false)
  ),
  constraint art_studio_report_resolution_state_check check (
    status not in ('resolved', 'dismissed')
    or (resolution is not null and resolved_at is not null)
  )
);

create table public.art_studio_moderation_events (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.art_studio_artworks(id) on delete restrict,
  revision_id uuid null references public.art_studio_artwork_revisions(id) on delete restrict,
  submission_id uuid null references public.art_studio_submissions(id) on delete restrict,
  report_id uuid null references public.art_studio_reports(id) on delete restrict,
  action text not null check (action in (
    'submitted',
    'withdrawn',
    'changes_requested',
    'approved',
    'rejected',
    'published',
    'unpublished',
    'report_reviewing',
    'report_resolved',
    'report_dismissed',
    'archived'
  )),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  from_status text null,
  to_status text not null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint art_studio_moderation_event_note_check check (
    note is null
    or art_studio_private.has_valid_text(note, 4000, false)
  )
);

-- The projection table is deliberately denormalised. It is the only source
-- behind public views, so workflow rows and user identifiers never need public
-- table privileges.
create table public.art_studio_published_artworks (
  artwork_id uuid primary key references public.art_studio_artworks(id) on delete restrict,
  source_revision_id uuid not null unique,
  slug text not null unique,
  title text not null,
  description text not null,
  content text not null,
  category text not null,
  tags text[] not null default '{}',
  creator_attribution text null,
  like_count bigint not null default 0 check (like_count >= 0),
  published_at timestamptz not null,
  updated_at timestamptz not null default now(),
  is_published boolean not null default true,
  constraint art_studio_public_revision_fkey
    foreign key (artwork_id, source_revision_id)
    references public.art_studio_artwork_revisions(artwork_id, id)
    on delete restrict
);

create unique index art_studio_reports_one_open_category_key
  on public.art_studio_reports (
    reporter_user_id,
    artwork_id,
    category
  )
  where status in ('open', 'reviewing');

create index art_studio_artworks_owner_status_updated_idx
  on public.art_studio_artworks (owner_user_id, status, updated_at desc);
create index art_studio_artworks_status_updated_idx
  on public.art_studio_artworks (status, updated_at desc);
create index art_studio_revisions_artwork_created_idx
  on public.art_studio_artwork_revisions (artwork_id, revision_number desc);
create index art_studio_revisions_created_by_idx
  on public.art_studio_artwork_revisions (created_by_user_id, created_at desc);
create index art_studio_submissions_submitter_status_idx
  on public.art_studio_submissions (submitter_user_id, status, updated_at desc);
create index art_studio_submissions_moderation_queue_idx
  on public.art_studio_submissions (status, updated_at asc)
  where status in ('submitted', 'changes_requested');
create index art_studio_likes_user_created_idx
  on public.art_studio_likes (user_id, created_at desc);
create index art_studio_reports_artwork_status_idx
  on public.art_studio_reports (artwork_id, status, created_at desc);
create index art_studio_reports_moderation_queue_idx
  on public.art_studio_reports (status, created_at asc)
  where status in ('open', 'reviewing');
create index art_studio_reports_assigned_moderator_idx
  on public.art_studio_reports (assigned_moderator_user_id, status)
  where assigned_moderator_user_id is not null;
create index art_studio_moderation_events_artwork_occurred_idx
  on public.art_studio_moderation_events (artwork_id, occurred_at desc);
create index art_studio_moderation_events_report_idx
  on public.art_studio_moderation_events (report_id, occurred_at desc)
  where report_id is not null;
create index art_studio_public_catalogue_idx
  on public.art_studio_published_artworks (category, published_at desc)
  where is_published;

create or replace function art_studio_private.enforce_revision_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  artwork_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    raise exception 'Art Studio revisions are append-only.'
      using errcode = 'integrity_constraint_violation';
  end if;

  if old.status = 'approved' then
    raise exception 'Approved Art Studio revisions are immutable.'
      using errcode = 'integrity_constraint_violation';
  end if;

  if new.artwork_id is distinct from old.artwork_id
    or new.revision_number is distinct from old.revision_number
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.content is distinct from old.content
    or new.category is distinct from old.category
    or new.tags is distinct from old.tags
    or new.on_behalf_of_another_creator is distinct from old.on_behalf_of_another_creator
    or new.attribution_display_name is distinct from old.attribution_display_name
    or new.created_by_user_id is distinct from old.created_by_user_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Art Studio revision content is immutable; create a new revision.'
      using errcode = 'integrity_constraint_violation';
  end if;

  if new.workflow_version <> old.workflow_version + 1 then
    raise exception 'Art Studio revision workflow version conflict.'
      using errcode = 'serialization_failure';
  end if;

  if new.status is distinct from old.status
    and not art_studio_private.is_valid_artwork_transition(old.status, new.status)
  then
    raise exception 'Invalid Art Studio revision transition from % to %.', old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status = 'approved' then
    select owner_user_id
    into artwork_owner_id
    from public.art_studio_artworks
    where id = new.artwork_id;

    if new.approved_by_user_id is null
      or new.approved_by_user_id = artwork_owner_id
    then
      raise exception 'Artwork owners cannot approve their own revisions.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function art_studio_private.enforce_artwork_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  approved_revision_status text;
  published_revision_status text;
begin
  if new.version <> old.version + 1 then
    raise exception 'Art Studio artwork version conflict.'
      using errcode = 'serialization_failure';
  end if;

  if new.owner_user_id is distinct from old.owner_user_id
    or new.slug is distinct from old.slug
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Artwork ownership, slug and creation time are immutable.'
      using errcode = 'integrity_constraint_violation';
  end if;

  if new.status is distinct from old.status
    and not art_studio_private.is_valid_artwork_transition(old.status, new.status)
  then
    raise exception 'Invalid Art Studio artwork transition from % to %.', old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status in ('approved', 'published')
    and new.status_changed_by_user_id = new.owner_user_id
  then
    raise exception 'Artwork owners cannot approve or publish their own work.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.approved_revision_id is not null then
    select status
    into approved_revision_status
    from public.art_studio_artwork_revisions
    where artwork_id = new.id
      and id = new.approved_revision_id;

    if approved_revision_status is distinct from 'approved' then
      raise exception 'Approved artwork pointer must reference an approved revision.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  if new.status = 'published' then
    if new.published_revision_id is null
      or new.published_revision_id is distinct from new.approved_revision_id
    then
      raise exception 'Published artwork must reference its approved revision.'
        using errcode = 'foreign_key_violation';
    end if;

    select status
    into published_revision_status
    from public.art_studio_artwork_revisions
    where artwork_id = new.id
      and id = new.published_revision_id;

    if published_revision_status is distinct from 'approved' then
      raise exception 'Published artwork must reference an immutable approved revision.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  new.updated_at := now();
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at := now();
  elsif new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  elsif new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  elsif new.status = 'unpublished' and old.status is distinct from 'unpublished' then
    new.unpublished_at := now();
  elsif new.status = 'archived' and old.status is distinct from 'archived' then
    new.archived_at := now();
  end if;
  return new;
end;
$$;

create or replace function art_studio_private.enforce_submission_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'Art Studio submission version conflict.'
      using errcode = 'serialization_failure';
  end if;
  if new.artwork_id is distinct from old.artwork_id
    or new.revision_id is distinct from old.revision_id
    or new.submitter_user_id is distinct from old.submitter_user_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Art Studio submission identity is immutable.'
      using errcode = 'integrity_constraint_violation';
  end if;
  if new.status is distinct from old.status
    and not art_studio_private.is_valid_submission_transition(old.status, new.status)
  then
    raise exception 'Invalid Art Studio submission transition from % to %.', old.status, new.status
      using errcode = 'check_violation';
  end if;
  if new.status = 'approved'
    and new.reviewer_user_id = new.submitter_user_id
  then
    raise exception 'Submitters cannot approve their own artwork.'
      using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function art_studio_private.enforce_report_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'Art Studio report version conflict.'
      using errcode = 'serialization_failure';
  end if;
  if new.artwork_id is distinct from old.artwork_id
    or new.reporter_user_id is distinct from old.reporter_user_id
    or new.category is distinct from old.category
    or new.details is distinct from old.details
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Art Studio report identity and evidence are immutable.'
      using errcode = 'integrity_constraint_violation';
  end if;
  if new.status is distinct from old.status
    and not art_studio_private.is_valid_report_transition(old.status, new.status)
  then
    raise exception 'Invalid Art Studio report transition from % to %.', old.status, new.status
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  if new.status in ('resolved', 'dismissed')
    and old.status not in ('resolved', 'dismissed')
  then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

create or replace function art_studio_private.reject_moderation_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Art Studio moderation history is append-only.'
    using errcode = 'integrity_constraint_violation';
end;
$$;

create or replace function art_studio_private.prepare_like_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  artwork_owner_id uuid;
  artwork_status text;
begin
  select owner_user_id, status
  into artwork_owner_id, artwork_status
  from public.art_studio_artworks
  where id = new.artwork_id;

  if not found or artwork_status <> 'published' then
    raise exception 'Only published artwork can be liked.'
      using errcode = 'check_violation';
  end if;
  if new.user_id = artwork_owner_id then
    raise exception 'Users cannot like their own artwork.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create or replace function art_studio_private.validate_report_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.art_studio_artworks
    where id = new.artwork_id
      and status = 'published'
  ) then
    raise exception 'Only published artwork can be reported.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function art_studio_private.prepare_public_projection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  artwork_row public.art_studio_artworks%rowtype;
  revision_row public.art_studio_artwork_revisions%rowtype;
begin
  select * into artwork_row
  from public.art_studio_artworks
  where id = new.artwork_id;

  select * into revision_row
  from public.art_studio_artwork_revisions
  where artwork_id = new.artwork_id
    and id = new.source_revision_id;

  if not found
    or revision_row.status <> 'approved'
    or artwork_row.published_revision_id is distinct from revision_row.id
  then
    raise exception 'Public projection must reference the artwork immutable approved revision.'
      using errcode = 'foreign_key_violation';
  end if;

  if new.is_published and artwork_row.status <> 'published' then
    raise exception 'Public projection cannot expose unpublished artwork.'
      using errcode = 'check_violation';
  end if;

  new.slug := artwork_row.slug;
  new.title := revision_row.title;
  new.description := revision_row.description;
  new.content := revision_row.content;
  new.category := revision_row.category;
  new.tags := revision_row.tags;
  new.creator_attribution := revision_row.attribution_display_name;
  new.published_at := artwork_row.published_at;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function art_studio_private.sync_public_projection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' then
    insert into public.art_studio_published_artworks (
      artwork_id,
      source_revision_id,
      slug,
      title,
      description,
      content,
      category,
      tags,
      creator_attribution,
      published_at,
      updated_at,
      is_published
    )
    select
      new.id,
      revision.id,
      new.slug,
      revision.title,
      revision.description,
      revision.content,
      revision.category,
      revision.tags,
      revision.attribution_display_name,
      new.published_at,
      now(),
      true
    from public.art_studio_artwork_revisions as revision
    where revision.id = new.published_revision_id
      and revision.artwork_id = new.id
      and revision.status = 'approved'
    on conflict (artwork_id)
    do update set
      source_revision_id = excluded.source_revision_id,
      slug = excluded.slug,
      title = excluded.title,
      description = excluded.description,
      content = excluded.content,
      category = excluded.category,
      tags = excluded.tags,
      creator_attribution = excluded.creator_attribution,
      published_at = excluded.published_at,
      updated_at = excluded.updated_at,
      is_published = true;
  elsif new.status in ('unpublished', 'archived') then
    update public.art_studio_published_artworks
    set is_published = false,
        updated_at = now()
    where artwork_id = new.id;
  end if;
  return null;
end;
$$;

create or replace function art_studio_private.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_artwork_id uuid;
begin
  changed_artwork_id := case when tg_op = 'DELETE'
    then old.artwork_id else new.artwork_id end;
  update public.art_studio_published_artworks as projection
  set like_count = (
        select count(*)
        from public.art_studio_likes as artwork_like
        where artwork_like.artwork_id = changed_artwork_id
      ),
      updated_at = now()
  where projection.artwork_id = changed_artwork_id
    and projection.is_published;
  return null;
end;
$$;

revoke all on function art_studio_private.enforce_revision_immutability() from public;
revoke all on function art_studio_private.enforce_artwork_transition() from public;
revoke all on function art_studio_private.enforce_submission_update() from public;
revoke all on function art_studio_private.enforce_report_update() from public;
revoke all on function art_studio_private.reject_moderation_event_mutation() from public;
revoke all on function art_studio_private.prepare_like_mutation() from public;
revoke all on function art_studio_private.validate_report_insert() from public;
revoke all on function art_studio_private.prepare_public_projection() from public;
revoke all on function art_studio_private.sync_public_projection() from public;
revoke all on function art_studio_private.sync_like_count() from public;

create trigger art_studio_revisions_immutable
before update or delete on public.art_studio_artwork_revisions
for each row execute function art_studio_private.enforce_revision_immutability();
create trigger art_studio_artworks_transition
before update on public.art_studio_artworks
for each row execute function art_studio_private.enforce_artwork_transition();
create trigger art_studio_submissions_update
before update on public.art_studio_submissions
for each row execute function art_studio_private.enforce_submission_update();
create trigger art_studio_reports_update
before update on public.art_studio_reports
for each row execute function art_studio_private.enforce_report_update();
create trigger art_studio_moderation_events_append_only
before update or delete on public.art_studio_moderation_events
for each row execute function art_studio_private.reject_moderation_event_mutation();
create trigger art_studio_likes_validate
before insert or update on public.art_studio_likes
for each row execute function art_studio_private.prepare_like_mutation();
create trigger art_studio_reports_validate_insert
before insert on public.art_studio_reports
for each row execute function art_studio_private.validate_report_insert();
create trigger art_studio_public_projection_validate
before insert or update on public.art_studio_published_artworks
for each row execute function art_studio_private.prepare_public_projection();
create trigger art_studio_artworks_sync_projection
after update of status, published_revision_id on public.art_studio_artworks
for each row execute function art_studio_private.sync_public_projection();
create trigger art_studio_likes_sync_count
after insert or delete on public.art_studio_likes
for each row execute function art_studio_private.sync_like_count();

alter table public.art_studio_artworks enable row level security;
alter table public.art_studio_artwork_revisions enable row level security;
alter table public.art_studio_submissions enable row level security;
alter table public.art_studio_likes enable row level security;
alter table public.art_studio_reports enable row level security;
alter table public.art_studio_moderation_events enable row level security;
alter table public.art_studio_published_artworks enable row level security;

alter table public.art_studio_artworks force row level security;
alter table public.art_studio_artwork_revisions force row level security;
alter table public.art_studio_submissions force row level security;
alter table public.art_studio_likes force row level security;
alter table public.art_studio_reports force row level security;
alter table public.art_studio_moderation_events force row level security;
alter table public.art_studio_published_artworks force row level security;

revoke all on table public.art_studio_artworks from anon, authenticated;
revoke all on table public.art_studio_artwork_revisions from anon, authenticated;
revoke all on table public.art_studio_submissions from anon, authenticated;
revoke all on table public.art_studio_likes from anon, authenticated;
revoke all on table public.art_studio_reports from anon, authenticated;
revoke all on table public.art_studio_moderation_events from anon, authenticated;
revoke all on table public.art_studio_published_artworks from anon, authenticated;

grant insert, update on table public.art_studio_artworks to authenticated;
grant select (
  id,
  slug,
  status,
  current_revision_id,
  approved_revision_id,
  published_revision_id,
  version,
  created_at,
  updated_at,
  submitted_at,
  approved_at,
  published_at,
  unpublished_at,
  archived_at
) on table public.art_studio_artworks to authenticated;
grant insert on table public.art_studio_artwork_revisions to authenticated;
grant select (
  id,
  artwork_id,
  revision_number,
  status,
  title,
  description,
  content,
  category,
  tags,
  on_behalf_of_another_creator,
  attribution_display_name,
  workflow_version,
  created_at,
  updated_at,
  submitted_at,
  approved_at
) on table public.art_studio_artwork_revisions to authenticated;
grant insert on table public.art_studio_submissions to authenticated;
grant select (
  id,
  artwork_id,
  revision_id,
  status,
  version,
  created_at,
  updated_at,
  reviewed_at
) on table public.art_studio_submissions to authenticated;
grant select, insert, delete on table public.art_studio_likes to authenticated;
grant insert on table public.art_studio_reports to authenticated;
grant select (
  id,
  artwork_id,
  category,
  status,
  details,
  version,
  created_at,
  updated_at,
  resolved_at
) on table public.art_studio_reports to authenticated;
grant select on table public.art_studio_moderation_events to authenticated;
grant select (
  slug,
  title,
  description,
  content,
  category,
  tags,
  creator_attribution,
  like_count,
  published_at,
  updated_at,
  is_published
) on table public.art_studio_published_artworks to anon, authenticated;

grant all on table public.art_studio_artworks to service_role;
grant all on table public.art_studio_artwork_revisions to service_role;
grant all on table public.art_studio_submissions to service_role;
grant all on table public.art_studio_likes to service_role;
grant all on table public.art_studio_reports to service_role;
grant all on table public.art_studio_moderation_events to service_role;
grant all on table public.art_studio_published_artworks to service_role;

create policy art_studio_artworks_select_own_or_staff
on public.art_studio_artworks
for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or (select forge_private.has_permission('moderation.manage'))
  or (select forge_private.has_permission('cms.publish'))
);

create policy art_studio_artworks_insert_own_draft
on public.art_studio_artworks
for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  and status_changed_by_user_id = (select auth.uid())
  and status = 'draft'
  and (select forge_private.has_permission('contributions.submit'))
);

create policy art_studio_artworks_update_own_draft_metadata
on public.art_studio_artworks
for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  and status in ('draft', 'changes_requested', 'rejected')
  and (select forge_private.has_permission('contributions.submit'))
)
with check (
  owner_user_id = (select auth.uid())
  and status_changed_by_user_id = (select auth.uid())
  and status in ('draft', 'changes_requested', 'rejected')
  and approved_revision_id is null
  and published_revision_id is null
  and (select forge_private.has_permission('contributions.submit'))
);

create policy art_studio_revisions_select_own_or_staff
on public.art_studio_artwork_revisions
for select
to authenticated
using (
  exists (
    select 1
    from public.art_studio_artworks as artwork
    where artwork.id = artwork_id
      and (
        artwork.owner_user_id = (select auth.uid())
        or (select forge_private.has_permission('moderation.manage'))
        or (select forge_private.has_permission('cms.publish'))
      )
  )
);

create policy art_studio_revisions_insert_own_draft
on public.art_studio_artwork_revisions
for insert
to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and status = 'draft'
  and (select forge_private.has_permission('contributions.submit'))
  and exists (
    select 1
    from public.art_studio_artworks as artwork
    where artwork.id = artwork_id
      and artwork.owner_user_id = (select auth.uid())
      and artwork.status in ('draft', 'changes_requested', 'rejected')
  )
);

create policy art_studio_submissions_select_own_or_staff
on public.art_studio_submissions
for select
to authenticated
using (
  submitter_user_id = (select auth.uid())
  or (select forge_private.has_permission('moderation.manage'))
  or (select forge_private.has_permission('cms.publish'))
);

create policy art_studio_submissions_insert_own
on public.art_studio_submissions
for insert
to authenticated
with check (
  submitter_user_id = (select auth.uid())
  and status = 'submitted'
  and reviewer_user_id is null
  and moderation_notes is null
  and (select forge_private.has_permission('contributions.submit'))
  and exists (
    select 1
    from public.art_studio_artworks as artwork
    where artwork.id = artwork_id
      and artwork.owner_user_id = (select auth.uid())
  )
);

create policy art_studio_likes_select_own
on public.art_studio_likes
for select
to authenticated
using (user_id = (select auth.uid()));

create policy art_studio_likes_insert_own
on public.art_studio_likes
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy art_studio_likes_delete_own
on public.art_studio_likes
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy art_studio_reports_select_reporter_or_non_owner_moderator
on public.art_studio_reports
for select
to authenticated
using (
  reporter_user_id = (select auth.uid())
  or (
    (select forge_private.has_permission('moderation.manage'))
    and exists (
      select 1
      from public.art_studio_artworks as artwork
      where artwork.id = artwork_id
        and artwork.owner_user_id <> (select auth.uid())
    )
  )
);

create policy art_studio_reports_insert_own
on public.art_studio_reports
for insert
to authenticated
with check (
  reporter_user_id = (select auth.uid())
  and status = 'open'
  and assigned_moderator_user_id is null
  and resolution is null
);

create policy art_studio_moderation_events_select_non_owner_staff
on public.art_studio_moderation_events
for select
to authenticated
using (
  (
    (select forge_private.has_permission('moderation.manage'))
    or (select forge_private.has_permission('cms.publish'))
  )
  and exists (
    select 1
    from public.art_studio_artworks as artwork
    where artwork.id = artwork_id
      and artwork.owner_user_id <> (select auth.uid())
  )
);

create policy art_studio_public_projection_select_published
on public.art_studio_published_artworks
for select
to anon, authenticated
using (is_published);

create or replace view public.art_studio_public_catalogue
with (security_invoker = true, security_barrier = true)
as
select
  slug,
  title,
  description,
  category,
  tags,
  creator_attribution,
  like_count,
  published_at,
  updated_at
from public.art_studio_published_artworks
where is_published;

create or replace view public.art_studio_public_details
with (security_invoker = true, security_barrier = true)
as
select
  slug,
  title,
  description,
  content,
  category,
  tags,
  creator_attribution,
  like_count,
  published_at,
  updated_at
from public.art_studio_published_artworks
where is_published;

revoke all on table public.art_studio_public_catalogue from public;
revoke all on table public.art_studio_public_details from public;
grant select on table public.art_studio_public_catalogue to anon, authenticated;
grant select on table public.art_studio_public_details to anon, authenticated;

comment on table public.art_studio_artworks is
  'Unapplied Sprint 9.2 Art Studio aggregate head; not a public projection.';
comment on table public.art_studio_published_artworks is
  'Sanitised publication projection. Internal source IDs have no anon/authenticated column grants.';
comment on view public.art_studio_public_catalogue is
  'Safe public catalogue without internal IDs, user IDs, reports, notes or audit metadata.';
comment on view public.art_studio_public_details is
  'Safe public text/Unicode artwork detail without internal IDs or private workflow data.';

commit;
