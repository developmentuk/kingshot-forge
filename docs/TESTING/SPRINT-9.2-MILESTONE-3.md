# Sprint 9.2 — Milestone 3 Validation

## Scope

Release 0.7.1 Editorial Platform Completion for the existing editor-backed datasets: Heroes, Hero Skills and Buildings.

This milestone does not change canonical Hero Skill content, Hero guidance, public recommendations or role definitions. Database changes described below are approved for creation and review only; they must not be applied without separate approval.

## Approved but unapplied database change

### Existing policies and functions affected

The proposed migration replaces the authenticated read policies created by `20260715210000_pm2b_editorial_persistence.sql` on:

- `public.editorial_record_versions`;
- `public.editorial_record_heads`;
- `public.editorial_audit_events`;
- `public.publication_queue`;
- `public.scheduled_publications`.

The existing `public.commit_editorial_version(jsonb, jsonb, jsonb, integer)` function remains service-role only and is not broadened. The migration adds a private permission helper and a service-role-only atomic publication function.

### Replacement authorization model

- Editorial head and version reads require the actor's existing Forge role to carry `cms.history.view` in `public.forge_role_permissions`.
- Editorial audit-event reads use the same `cms.history.view` permission.
- Publication queue and schedule reads require the existing `cms.publish` permission.
- No Publisher role or new permission key is introduced.
- Table grants are made explicit for the authenticated role because RLS policies do not grant table access by themselves.

### Live projection tables

The atomic publication function supports only the existing live projections:

- `public.heroes`, matched by canonical Hero slug and updated in place;
- `public.hero_skills`, matched by stable `editorial_key` and upserted through the existing Hero Skill projection contract.

Buildings remains non-publishable because there is no live Buildings publication projection. Archive, restore and rollback remain disabled in the API and Admin UI because their live-projection semantics are not unambiguous.

### Atomic transaction contract

One database function call must lock and verify the processing queue item, editorial head and approved source version, then update the supported live projection, append the immutable Published version, update the editorial head, append the actor-attributed audit event and mark the queue item Completed. PostgreSQL function execution is transactional: an exception rolls back all of those success-path writes.

The application queue service may subsequently mark the already-processing item Failed in a separate repository update. That failure marker is deliberately outside the rolled-back publication transaction so an operator receives a retryable outcome without a partially published projection.

### Rollback considerations

If this migration is later applied and must be reverted:

1. revoke and drop the new atomic publication function;
2. drop the private permission helper after dependent policies are removed;
3. remove the replacement policies;
4. recreate the prior authenticated read policies only if the security regression is explicitly accepted, otherwise replace them with an approved alternative;
5. preserve all editorial versions, heads, audit events, queue items, schedules and live records because the migration does not require destructive data changes.

Reverting the migration cannot automatically undo live records already published through a successful transaction; any content rollback would require a separately reviewed editorial operation.

## Validation status

### Automated checks

Passed on 17 July 2026:

- `npm run check`;
- `git diff --check`;
- NodeNext import validation;
- existing PM2B structural validation;
- existing Hero Skills structural validation updated only for the shared atomic publication plumbing;
- new editorial-platform structural validation;
- production TypeScript and Vite build.

Lint completed with seven existing warnings in `RoleContext`, `PlayerIdentityContext`, `AuthContext` and `useDataset`; no warning points to a file changed by this milestone. Vite retained its existing large-chunk advisory.

### Direct API and workflow contracts

The new focused suite used in-memory editorial, queue and schedule repositories only. It exercised:

- unauthenticated access → 401;
- Viewer draft mutation → 403;
- unknown dataset mutation → 404;
- browse-only Events mutation → 422;
- Buildings publication → 422;
- invalid editor payload → 422;
- stale expected version → 409;
- invalid workflow transition → 409;
- saving values while In Review → 409;
- Moderator rejection/return to Draft → success;
- Moderator approval → 403;
- Contributor draft save and submit for review → success;
- Admin approval, schedule and queue → success;
- mismatched queue and schedule resources → 409;
- non-Approved publication request → 409;
- archive/restore/rollback capability rejection → 422;
- Hero Skills schema-driven first draft creation → success with a synthetic in-memory fixture;
- Buildings first editorial draft for an existing synthetic source record → success;
- queue-service handling when the publication transaction commits its own Completed outcome.

A POST without a bearer token was also sent to the running local `/api/editorial/action` endpoint and returned HTTP 401. No authenticated live mutation request was sent.

### Browser evidence

- Authenticated desktop verification used an exact 1440×1000 CSS viewport.
- Authenticated mobile verification used an exact 390×844 CSS viewport.
- Heroes loaded 27 live source records and exposed View/Edit for the owner session. The Record Editor opened with no page-level or panel-level horizontal overflow; no field was changed and Save remained disabled.
- Buildings exposed View/Edit, reported Live publishing as Not implemented, showed no Publish control and used an internal 803 px table scroller within a 347 px mobile container.
- Browse-only Events exposed View only.
- UI controls now require both the relevant signed-in permission key and the same standard role-policy action enforced by the server. Moderators receive a Review entry point rather than a misleading editable form when they have the existing review-related permission.
- An unknown Admin dataset route showed the intentional Dataset not found state.
- No current Vite error overlay or new console error was observed after the final reload. Earlier HMR errors from an intermediate capability-registry edit remained in the browser log history and predated the successful reload.
- Screenshot capture timed out in both available browser surfaces, so layout evidence is DOM- and metric-based rather than image-based.

### Unexercised database behavior

Live RLS policy behavior and the atomic publication function remain unexercised. The dedicated Moderator browser journey was not available in the signed-in owner session, so Moderator UI gating is supported by shared-policy inspection and direct API tests rather than a role-switched browser test. There is no dedicated Publisher role; the existing owner/admin role policy plus `cms.publish` remains authoritative as required.

The migration was created locally but was not applied, no Supabase database command was run after approval, and no production data was created or modified. Publication must remain Partial until the migration is reviewed, applied outside production and verified with controlled rollback-safe records.
