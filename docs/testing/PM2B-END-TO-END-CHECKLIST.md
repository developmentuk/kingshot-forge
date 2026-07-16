# PM2B End-to-End Validation Checklist

## Automated Validation

Run:

```powershell
npm run check
```

Expected result:

- PM2B structural validation passes
- lint completes with no errors
- production build completes successfully

Existing warnings must be recorded and must not increase because of PM2B.

## Database Validation

Confirm the following exist in Supabase:

- `editorial_record_versions`
- `editorial_record_heads`
- `editorial_audit_events`
- `publication_queue`
- `scheduled_publications`
- `commit_editorial_version(jsonb,jsonb,jsonb,integer)`

Run:

```text
supabase/verification/pm2b_editorial_verification.sql
```

All table and function checks must return `true`.

All five tables must have RLS enabled.

Both active-version uniqueness indexes must exist.

## Editorial Workflow Scenario

Complete the following against a non-production test record:

1. Create a draft.
2. Save a second draft version.
3. Submit for review.
4. Return to draft.
5. Submit again.
6. Approve.
7. Publish.
8. Archive.
9. Restore.
10. Roll back to an older immutable version.

Verify after every step:

- the record head advances by one version;
- the old version remains unchanged;
- the expected status is applied;
- an audit event is appended;
- stale expected versions are rejected.

## Permission Scenario

Verify:

- viewer can read but cannot mutate;
- contributor can create and update drafts;
- content creator can create and update drafts;
- moderator can review but cannot publish;
- admin can approve, publish, archive and restore;
- owner can perform all editorial operations;
- beta tester receives no editorial mutation permission by default.

Client-side hidden buttons do not count as enforcement. Server-side permission checks must deny unauthorised mutations.

## Version History Scenario

Verify:

- newest versions appear first;
- actor, status, action and date filters work;
- nested object changes display correct paths;
- array changes display indexed paths;
- comparisons reject versions from different records;
- rollback preview does not mutate data.

## Publication Queue Scenario

Verify:

- an approved version can be queued;
- the same version cannot have two active queue items;
- processing publishes the expected version;
- stale expected versions fail;
- failed items record a message;
- retry respects the maximum-attempt limit;
- pending and failed items can be cancelled.

## Scheduled Publishing Scenario

Verify:

- past times are rejected;
- future times are accepted;
- the same version cannot have two active schedules;
- due schedules enter the publish queue;
- cancelled schedules are not queued;
- queue failures are recorded on the schedule.

## Admin UI Scenario

Verify at desktop and mobile widths:

- status badge is correct;
- permitted actions are shown;
- unavailable actions are hidden;
- busy states disable duplicate actions;
- history is readable;
- diff values wrap or scroll safely;
- queue and schedule status are clear;
- destructive actions are visually distinct.

## Release Gate

PM2B is ready to merge only when:

- automated validation passes;
- database validation passes;
- the manual scenarios above pass;
- roadmap and release notes are updated;
- no critical or high-severity defects remain.
