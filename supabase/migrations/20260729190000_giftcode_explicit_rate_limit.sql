-- Kingshot provider protocol hotfix, 29 July 2026.
-- A provider 40019 response is an explicit rejection before redemption rather
-- than an ambiguous mutation. Preserve the truthful sent disposition while
-- allowing the request to remain retryable.

alter table public.gift_code_redemption_attempts
  drop constraint if exists gift_code_redemption_attempts_check6;

alter table public.gift_code_redemption_attempts
  add constraint gift_code_redemption_attempts_check6
  check (
    outcome <> 'provider_retryable_failure'
    or (
      request_disposition = 'not_sent'
      and result_code in ('provider_retryable_failure', 'rate_limited')
    )
    or (
      request_disposition = 'sent'
      and result_code = 'rate_limited'
    )
  );

comment on constraint gift_code_redemption_attempts_check6
on public.gift_code_redemption_attempts is
  'Retryable provider failures are normally not sent; explicit provider rate-limit rejections may truthfully be recorded as sent.';
