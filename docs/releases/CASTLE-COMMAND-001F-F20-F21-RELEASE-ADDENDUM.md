# CASTLE-COMMAND-001F — F20/F21 Release Addendum

Status: **review-gated / production activation stopped**

This addendum records the membership-term consent and explicit alliance-scope corrections following fresh independent review of exact head `80efe5bf32c1d4d253f59bd3c0146cf576d1f221`.

## F20 / P2 — sharing consent survived a completed membership term

Exact-alliance projection hid a shared profile after the owner left, but the stored `share_with_alliance = true` and `shared_alliance_id` remained armed. Rejoining that same alliance could therefore reactivate old Castle timing consent without a fresh opt-in.

Final rule: Castle timing sharing consent belongs to one **membership term**. When the selected current membership ends, consent is disarmed immediately and a later rejoin requires a new explicit opt-in.

Final migration:

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

## Final release chain

The corrected candidate contains **28 ordered Castle Command migrations**. The latest is:

`20260823171500_castle_command_membership_term_consent.sql`

## Acceptance still required

Before any production activation the exact candidate must pass:

- Castle Command 001A–001F permanent regressions;
- F13–F19 focused authority/concurrency/privacy regressions;
- F20/F21 membership-term consent and explicit-scope regression;
- executable 28-migration count/order assertion;
- complete Vision integration validation;
- lint and production TypeScript/Vite build;
- Buildings Companion, Companion Index and Island Route validations;
- fresh independent exact-head review with no actionable finding;
- real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated role and private-Realtime acceptance.

## Exact validation candidate

The commit containing this section is the documentation-only CI trigger for the frozen F20/F21 source candidate. No application or SQL behaviour is changed by this note.

No Castle Command production migration, Realtime policy, production data mutation, merge, or paid Supabase branch is authorised by this addendum.
