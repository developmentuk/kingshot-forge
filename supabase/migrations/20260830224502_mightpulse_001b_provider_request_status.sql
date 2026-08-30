begin;

create or replace function public.get_provider_request_status(
  p_provider text,
  p_idempotency_key text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $status$
declare
  current_status text;
begin
  if p_provider <> 'mightpulse' then
    raise exception 'Unsupported provider.'
      using errcode = '22023';
  end if;

  if p_idempotency_key is null
    or char_length(p_idempotency_key) < 16
    or char_length(p_idempotency_key) > 128
    or p_idempotency_key <> lower(p_idempotency_key)
    or p_idempotency_key ~ '[^0-9a-f]' then
    raise exception 'Invalid provider request idempotency key.'
      using errcode = '22023';
  end if;

  select reservation.status
  into current_status
  from public.provider_quota_reservations reservation
  where reservation.provider = p_provider
    and reservation.idempotency_key = p_idempotency_key;

  return coalesce(current_status, 'missing');
end;
$status$;

revoke all on function public.get_provider_request_status(
  text,
  text
) from public;
revoke all on function public.get_provider_request_status(
  text,
  text
) from anon;
revoke all on function public.get_provider_request_status(
  text,
  text
) from authenticated;
grant execute on function public.get_provider_request_status(
  text,
  text
) to service_role;

commit;
