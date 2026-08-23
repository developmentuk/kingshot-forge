# CASTLE-COMMAND-001F — F20/F21 Release Addendum

Status: **production schema activated / authenticated acceptance in progress**

This addendum records the membership-term consent and explicit alliance-scope corrections, followed by the owner-authorised production schema activation and alliance-authority execute hotfix discovered during real authenticated preview testing.

## F20 / P2 — sharing consent survived a completed membership term

Exact-alliance projection hid a shared profile after the owner left, but the stored `share_with_alliance = true` and `shared_alliance_id` remained armed. Rejoining that same alliance could therefore reactivate old Castle timing consent without a fresh opt-in.

Final rule: Castle timing sharing consent belongs to one **membership term**. When the selected current membership ends, consent is disarmed immediately and a later rejoin requires a new explicit opt-in.

Migration:

`20260823171500_castle_command_membership_term_consent.sql`

It:

- installs a SECURITY DEFINER internal consent-clear helper with no public execution grant;
- installs membership UPDATE and DELETE lifecycle triggers;
- clears `share_with_alliance` and `shared_alliance_id` when the exact selected current membership becomes non-current, changes owner/alliance identity, or is deleted;
- preserves the established `membership -> Castle profile` lock direction;
- performs a defensive activation cleanup of any scoped opt-in whose exact membership is already non-current.

## F21 / P2 — the client still used the single-membership compatibility save overload

The database already supported an explicit `target_shared_alliance_id`, but `saveCastleCommandCloudProfile(...)` omitted it. A player with more than one current alliance therefore hit the compatibility overload's deliberate `exactly one current alliance` guard.

Final rule: application saves carry the workspace's **explicit alliance scope** into the governed save RPC.

The application now:

- adds `sharedAllianceId` to the Castle cloud-save input;
- calls `save_castle_command_profile(...)` with `target_shared_alliance_id` whenever sharing is enabled;
- passes the workspace's selected/current alliance ID into the save;
- prefers an existing saved `sharedAllianceId` when that membership is still current, avoiding an accidental scope change for multi-alliance players;
- fails closed in the UI if sharing is requested without a current Forge alliance.

The explicit save overload continues to lock and revalidate that exact membership before profile/timing persistence.

## Production activation

On 2026-08-23 the owner explicitly authorised production schema activation. All 28 governed Castle Command migrations were applied successfully and in order to Supabase project `hrvdhjscwitqpwjhnjkm`; none failed or were skipped.

Real authenticated preview testing then exposed an older alliance privilege-contract inconsistency: authenticated RLS policies call `public.can_manage_alliance(uuid)` and `public.can_manage_alliance_members(uuid)`, while production allowed EXECUTE only to `postgres` and `service_role`. This produced `42501 permission denied for function can_manage_alliance` in Castle Command.

The owner explicitly authorised the narrow production activation hotfix:

`20260823185129_castle_command_alliance_authority_execute_hotfix.sql`

The hotfix:

- keeps both functions SECURITY DEFINER;
- keeps anonymous EXECUTE denied;
- grants EXECUTE only to `authenticated` in addition to the existing privileged roles;
- does not grant management authority by itself; each function still evaluates the caller's Forge role/alliance-admin state;
- restores the execution privilege required by the existing authenticated alliance RLS policies.

Post-hotfix verification confirmed `authenticated` can execute both helpers without `42501`, while `anon` remains denied.

## Final release chain

The production-aligned candidate now contains **29 ordered Castle Command migrations**. The latest is:

`20260823185129_castle_command_alliance_authority_execute_hotfix.sql`

The preceding membership-term consent migration remains:

`20260823171500_castle_command_membership_term_consent.sql`

## Current acceptance state

Completed:

- Castle Command production schema activation;
- all eight Castle tables present;
- Castle private Realtime receive/presence policies present;
- production migration ledger includes all 28 governed migrations plus the authority execute hotfix;
- authenticated alliance-authority helper execution verified;
- anonymous execution remains denied.

Still required before merge/release completion:

- real authenticated Castle Command profile save/load acceptance after the hotfix;
- manager/deputy/assigned/unassigned/former-member role acceptance;
- READY/SENT and tactical-plan acceptance;
- private Realtime channel acceptance;
- final source candidate validation for the 29-migration production-aligned branch;
- merge remains owner-controlled.
