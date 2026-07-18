-- Community Art reactions are public aggregates with private per-user ownership.
create table if not exists public.community_art_reactions (
  artwork_id uuid not null references public.community_art_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'heart', 'smile', 'wow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (artwork_id, user_id)
);

create index if not exists community_art_reactions_artwork_type_idx
  on public.community_art_reactions (artwork_id, reaction_type);

create or replace function public.set_community_art_reaction_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists community_art_reactions_updated_at on public.community_art_reactions;
create trigger community_art_reactions_updated_at
before update on public.community_art_reactions
for each row execute function public.set_community_art_reaction_updated_at();

alter table public.community_art_reactions enable row level security;
revoke all on table public.community_art_reactions from anon, authenticated;
grant select, insert, update, delete on table public.community_art_reactions to authenticated;

drop policy if exists community_art_reactions_select_owner on public.community_art_reactions;
create policy community_art_reactions_select_owner
on public.community_art_reactions
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists community_art_reactions_insert_owner_published on public.community_art_reactions;
create policy community_art_reactions_insert_owner_published
on public.community_art_reactions
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.community_art_submissions submission
    where submission.id = artwork_id and submission.status = 'published'
  )
);

drop policy if exists community_art_reactions_update_owner_published on public.community_art_reactions;
create policy community_art_reactions_update_owner_published
on public.community_art_reactions
for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.community_art_submissions submission
    where submission.id = artwork_id and submission.status = 'published'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.community_art_submissions submission
    where submission.id = artwork_id and submission.status = 'published'
  )
);

drop policy if exists community_art_reactions_delete_owner on public.community_art_reactions;
create policy community_art_reactions_delete_owner
on public.community_art_reactions
for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace view public.community_art_reaction_counts
with (security_barrier = true)
as
select
  reaction.artwork_id,
  reaction.reaction_type,
  count(*)::integer as reaction_count
from public.community_art_reactions reaction
join public.community_art_submissions submission on submission.id = reaction.artwork_id
where submission.status = 'published'
group by reaction.artwork_id, reaction.reaction_type;

revoke all on table public.community_art_reaction_counts from public;
grant select on table public.community_art_reaction_counts to anon, authenticated;
