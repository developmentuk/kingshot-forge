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
- The current branch and latest commit must be inspected at the start of every session; never assume this file's branch status is still current.
- Do not request local ZIP snapshots while GitHub is available. Use repository files and the active branch directly unless Clark explicitly requests another workflow.

## Tool boundaries

- The GitHub connector in ChatGPT can inspect and, when permission is available, modify the repository directly.
- Supabase tools in ChatGPT can inspect or modify the configured project when connected and authorised.
- VS Code MCP is local to Clark's VS Code session. A ChatGPT conversation cannot operate the local VS Code MCP server directly.
- A new chat may require Clark to mention `@GitHub` once so the connector is brought into that session. The repository itself does not need reconnecting or reinstalling.
- Never ask Clark to reinstall MCP merely because a new chat started. First attempt to use the installed connector/tool.
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

Run before committing:

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
6. Run validation before committing.
7. Push and verify the exact commit deployed by Vercel.
8. Do not infer deployment freshness from bundle hash names; compare commit SHAs.
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
- Validate Vercel's server-function compilation, not only the local Vite client build.
- OAuth must preserve the deployment origin. Production and Vercel preview deployments must return to the origin that initiated sign-in.
- Supabase Authentication redirect URLs must explicitly allow the production domain and supported Vercel preview domains; otherwise Supabase falls back to its configured Site URL.

## Current milestone

### Platform Milestone 2B — Editorial Workflow Stabilisation

PM2B platform layers have been added, including:

- dataset contracts and registries;
- draft, review and approval workflows;
- publication lifecycle;
- version history and diff services;
- role and permission services;
- publication queue;
- scheduled publishing;
- admin editorial UI components;
- Supabase persistence and migration;
- authenticated editorial API scaffolding;
- Record Editor connection;
- PM2B validation and release checklist.

### Current blocking issue

Vercel client and server-function compilation now succeeds at branch commit `427bcb38fd571899a33aa7b506abf7134de7a9ad`.

The active blocker is preview authentication:

- `src/context/AuthContext.tsx` correctly sets the Google OAuth `redirectTo` value from `window.location.origin`.
- Supabase rejects an unlisted Vercel preview redirect and falls back to the configured Site URL.
- Authentication therefore returns to the default Vercel deployment instead of the PM2B preview deployment.
- The session is origin-scoped, so the authenticated default deployment and unauthenticated preview deployment cannot share it.
- Heroes Edit cannot be validated until the relevant preview URL is added to Supabase Authentication redirect URLs.

The current work branch is:

```text
feature/pm2b-editorial-workflow
```

Always inspect its live head before making changes.

### Stabilisation order

1. Add the production and supported preview callback patterns to Supabase Authentication redirect URLs.
2. Confirm Google sign-in returns to the same PM2B preview origin.
3. Verify `/api/editorial/record` authentication and response.
4. Verify `/api/editorial/action` draft creation.
5. Confirm Heroes Edit opens and saves a first draft.
6. Test review, approval, queue, publish, archive, restore and rollback.
7. Complete `docs/testing/PM2B-END-TO-END-CHECKLIST.md`.
8. Update Roadmap and Release Notes, merge, tag and deploy.

Do not add new product features until this sequence passes.

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
- Heroes declares the editing capability, has a registered dataset adapter and has a registered Record Editor schema on the PM2B branch.
- `DatasetTable` disables Edit only when no edit handler is supplied.
- Edit-button behaviour must be tested on an authenticated PM2B preview origin before it can be considered fixed or broken.

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

Keep this file operational and concise. Detailed implementation history belongs in change-set, architecture and release documents.
