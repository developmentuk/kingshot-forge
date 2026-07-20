begin;

revoke all on function public.commit_editorial_version(jsonb, jsonb, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.commit_editorial_version(jsonb, jsonb, jsonb, integer)
  to service_role;

comment on function public.commit_editorial_version(jsonb, jsonb, jsonb, integer)
  is 'Server-only atomic append of an editorial head, immutable version and audit event.';

commit;
