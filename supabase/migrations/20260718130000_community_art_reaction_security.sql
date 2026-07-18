create or replace function public.set_community_art_reaction_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace view public.community_art_reaction_counts
with (security_barrier = true, security_invoker = true)
as
select
  reaction.artwork_id,
  reaction.reaction_type,
  count(*)::integer as reaction_count
from public.community_art_reactions reaction
join public.community_art_submissions submission on submission.id = reaction.artwork_id
where submission.status = 'published'
group by reaction.artwork_id, reaction.reaction_type;
