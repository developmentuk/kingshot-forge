begin;

alter table public.favourites
  rename column item_type to entity_type;

alter table public.favourites
  rename column item_id to entity_id;

alter table public.favourites
  alter column user_id set default auth.uid(),
  alter column user_id set not null,
  alter column entity_type set not null,
  alter column entity_id set not null;

alter table public.favourites
  drop constraint if exists favourites_user_id_item_type_item_id_key;

alter table public.favourites
  add constraint favourites_user_id_entity_type_entity_id_key
    unique (user_id, entity_type, entity_id),
  add constraint favourites_entity_type_check
    check (entity_type in ('hero', 'event', 'guide', 'kingdom', 'alliance', 'creator', 'tool')),
  add constraint favourites_entity_id_check
    check (length(trim(entity_id)) between 1 and 256);

create index if not exists favourites_user_id_created_at_idx
  on public.favourites (user_id, created_at desc);

create index if not exists favourites_entity_lookup_idx
  on public.favourites (entity_type, entity_id);

alter table public.favourites enable row level security;

drop policy if exists "Users can create their own favourites" on public.favourites;
drop policy if exists "Users can delete their own favourites" on public.favourites;
drop policy if exists "Users can view their own favourites" on public.favourites;

create policy "Users can create their own favourites"
  on public.favourites for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own favourites"
  on public.favourites for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can view their own favourites"
  on public.favourites for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on public.favourites from anon;
grant select, insert, delete on public.favourites to authenticated;
grant all on public.favourites to service_role;

commit;
