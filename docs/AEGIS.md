# Aegis Project Bootstrap

This file is the canonical bootstrap for continuing Kingshot Forge work in a new AI-assisted development session.

## New-session instruction

Start a new chat in the **Kingshot Builders** project with:

```text
Continue Kingshot Forge. Read docs/AEGIS.md from @GitHub developmentuk/kingshot-forge, then inspect the current branch before making changes.
```

When database work is required, add:

```text
Use the connected Supabase tools for project hrvdhjscwitqpwjhnjkm. Begin read-only unless a write is explicitly required.
```

## Identity and collaboration

- Product: **Kingshot Forge**
- Engineering partner name: **Aegis**
- Product owner: Clark
- Clark is not a full-time software developer; instructions should be clear and sequential.
- Prefer complete replacement files or direct repository commits over fragile partial snippets.
- Do not claim a feature is complete until it works end to end.
- Stop feature expansion when an existing workflow is incomplete or unstable.

## Canonical sources

- Repository: `developmentuk/kingshot-forge`
- Production application: `https://kingshot-forge.vercel.app/`
- Local repository: `C:\Users\Clark\Projects\kingshot-text-lab`
- Supabase project ref: `hrvdhjscwitqpwjhnjkm`
- Google Analytics measurement ID: `G-8L3HYETN51`
- GitHub is the canonical and single source of truth for code.
- Supabase is the canonical source for persistent platform data.
- Inspect the current branch and latest commit at the start of every session.
- Do not request local ZIP snapshots while GitHub is available unless Clark explicitly requests that workflow.

## Tool boundaries

- Use the GitHub connector to inspect and modify repository files directly when available.
- Use connected Supabase tools for project inspection and authorised database changes.
- VS Code MCP is local to Clark's VS Code session and cannot be operated from a separate ChatGPT conversation.
- Never ask Clark to reinstall MCP merely because a new chat started; first attempt to use the installed connector.
- Never expose service-role keys, access tokens, OAuth URLs or secrets in chat, documentation or commits.

## Stack

- Vite
- React
- TypeScript
- Vercel Functions
- Supabase
- GitHub and GitHub Desktop
- Node.js/npm

## Standard validation

Run before release-oriented commits:

```powershell
npm run check
```

This currently runs:

```text
npm run validate:pm2b
npm run lint
npm run build
```

Known non-blocking warnings at the current milestone:

- React Fast Refresh warnings in context files.
- React hook dependency warnings in `src/lib/dataEngine/useDataset.ts`.
- Vite large-chunk warning.

Do not treat these as newly introduced defects unless their count or scope changes.

## Git workflow

1. Inspect the current branch and clean/dirty state.
2. Pull/fetch before beginning work.
3. Work on a focused feature branch.
4. Inspect and modify repository files directly through GitHub when the connector is available.
5. Make coherent commits with descriptive messages.
6. Run validation before release-oriented commits.
7. Push and verify the exact commit deployed by Vercel.
8. Compare commit SHAs rather than inferring freshness from bundle names.
9. Merge to `main` only after runtime verification.

## Debugging standard

When runtime behaviour differs from the expected implementation:

1. Verify the exact deployed commit SHA.
2. Trace the router to the rendered component.
3. Trace state and capability checks through each layer.
4. Identify the first point where runtime behaviour diverges from repository source.
5. Do not assume cache, deployment, authentication or permissions are responsible without evidence.
6. Only change code after the failure point is identified.
7. Complete and validate the current workflow before expanding the platform.

## Architecture principles

- Keep client and server responsibilities separate.
- Authentication and permission enforcement for mutations must happen server-side.
- Client-side hidden or disabled controls are not security enforcement.
- Editorial versions are immutable.
- Record heads advance through optimistic concurrency.
- Every editorial mutation appends an audit event.
- Supabase service-role access must remain server-side only.
- Prefer vertical, end-to-end slices over disconnected layers.
- Validate Vercel server-function compilation, not only the local Vite client build.
- OAuth must preserve the deployment origin.
- Supabase Authentication redirect URLs must explicitly allow production and supported preview callbacks.
- Preview Vercel functions require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Preview environment.
- Unsaved editor changes must not be replaced by background refreshes or tab-focus events.
- Optimistic concurrency conflicts must preserve the user's unsaved working copy.

## Current milestone

### Platform Milestone 2B — Editorial Workflow Validation

Current branch:

```text
feature/pm2b-editorial-workflow
```

Always inspect its live head before making changes.

### Runtime validation completed

The following owner-role Heroes workflow has passed against the authenticated Vercel preview and Supabase project:

1. Preview OAuth returns to the initiating preview deployment.
2. Heroes Edit opens with owner permissions.
3. First draft saves and creates immutable version history.
4. Submit for review advances to `in_review`.
5. Approve advances to `approved`.
6. Publish creates a pending queue item.
7. Manual **Process now** invokes `process_queue` and publishes successfully.
8. Archive creates a new immutable archived version.
9. Restore creates a new immutable published version.
10. Compare correctly reports identical historical values where applicable.
11. Rollback creates a new immutable version rather than overwriting history.
12. Unsaved changes survive browser-tab switching.
13. Stale saves are rejected by Supabase optimistic concurrency, confirmed by `expected 11, actual 12`.

### Runtime changes made during validation

- Added deployment-aware preview authentication configuration guidance.
- Added Preview environment requirements for server-side Supabase access.
- Added **Process now** to pending publication queue items.
- Prevented dirty forms from being reset by refreshed record props.

### Remaining PM2B release gates

PM2B must not yet be described as fully complete. The following checklist areas remain unvalidated or only partially validated:

- automated `npm run check` at the final branch head;
- database verification script and RLS/index confirmation at the final schema state;
- return-to-draft and reject paths;
- full server-side permission matrix for viewer, contributor, content creator, moderator, admin, owner and beta tester;
- publication duplicate prevention, failure, retry, maximum-attempt and cancellation paths;
- scheduled publishing creation, cancellation, due processing and failure handling;
- actor/status/action/date filtering in global history;
- desktop and mobile responsive validation;
- friendly concurrency-conflict UX;
- user display names instead of raw UUIDs;
- Roadmap, Release Notes, merge, tag and production smoke test.

### Next validation order

1. Test return-to-draft and reject transitions on a fresh test record.
2. Validate the permission matrix with non-owner roles.
3. Validate scheduled publishing end to end.
4. Validate queue duplicate, cancel, failure and retry behaviour.
5. Run final automated and database verification.
6. Complete responsive UI checks.
7. Update Roadmap and Release Notes.
8. Merge, tag, deploy and smoke-test production.

Do not start PM2C product expansion until these release gates are closed or explicitly deferred and documented.

## Important files

```text
docs/AEGIS.md
governance/AEGIS.md
governance/ARCHITECTURE_PRINCIPLES.md
governance/CODING_STANDARDS.md
governance/DEVELOPMENT_WORKFLOW.md
governance/MILESTONES.md
governance/RELEASE_PROCESS.md
governance/VERSIONING.md
docs/testing/PM2B-END-TO-END-CHECKLIST.md
scripts/validate-pm2b.mjs
src/platform/
server/editorial/
api/editorial/
src/context/AuthContext.tsx
supabase/migrations/20260715210000_pm2b_editorial_persistence.sql
```

## Dataset and editor status

- Live Data Engine datasets are served through `/api/data-engine/dataset?dataset=<key>`.
- Heroes live dataset retrieval has been verified.
- `/admin/data/:datasetId` renders `AdminDatasetDetailPage`.
- Heroes has a registered adapter and Record Editor schema on the PM2B branch.
- Owner editing, workflow transitions, queue processing, archive, restore, rollback and concurrency have been runtime-validated for Heroes.

## Release discipline

A milestone is complete only when:

- structural validation passes;
- lint has no errors;
- client production build passes;
- Vercel server functions compile;
- required migrations are applied;
- authenticated runtime scenarios pass;
- manual end-to-end checks pass;
- Roadmap and Release Notes are updated;
- production smoke testing passes.

## Updating this file

Update `docs/AEGIS.md` whenever any of these change:

- canonical repository or local path;
- Supabase project;
- current milestone or blocker;
- standard validation commands;
- architecture or security rules;
- release workflow;
- key integrations;
- established collaboration or debugging workflow.

Keep this file operational and concise. Detailed implementation history belongs in testing, change-set, architecture and release documents.
