# Aegis Project Bootstrap

This file is the canonical bootstrap for continuing Kingshot Forge work in a new AI-assisted development session.

## New-session instruction

Start a new chat in the **Kingshot Builders** project with:

```text
Continue Kingshot Forge. Read docs/AEGIS.md from @GitHub developmentuk/kingshot-forge on main, then inspect all active branches and continue from the current work branch.
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
- GitHub is the canonical source for code.
- Supabase is the canonical source for persistent platform data.
- The current branch and latest commit must be inspected at the start of every session; never assume this file's branch status is still current.

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
4. Make coherent commits with descriptive messages.
5. Run validation before committing.
6. Push and verify the exact commit deployed by Vercel.
7. Do not infer deployment freshness from bundle hash names; compare commit SHAs.
8. Merge to `main` only after runtime verification.

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

The client Vite build succeeds, but Vercel's server-function TypeScript compilation reports many errors under Node16/NodeNext resolution.

Primary error classes:

- `TS2834` / `TS2835`: server-reachable relative imports and barrel exports lack explicit `.js` extensions.
- `TS2305`: editorial runtime imports appear missing because affected barrel modules fail to resolve correctly.
- follow-on `TS2339` errors in server error handling caused by unresolved error-class types.

The current work branch is:

```text
feature/pm2b-editorial-workflow
```

Always inspect its live head before making changes.

### Stabilisation order

1. Reproduce Vercel's server compilation locally or with a dedicated server TypeScript check.
2. Correct ESM/NodeNext import paths for all server-reachable modules.
3. Restore platform barrel exports and eliminate `TS2305` follow-on errors.
4. Validate Vercel Functions compile successfully.
5. Verify `/api/editorial/record` authentication and response.
6. Verify `/api/editorial/action` draft creation.
7. Confirm Heroes Edit opens and saves a first draft.
8. Test review, approval, queue, publish, archive, restore and rollback.
9. Complete `docs/testing/PM2B-END-TO-END-CHECKLIST.md`.
10. Update Roadmap and Release Notes, merge, tag and deploy.

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
supabase/migrations/20260715210000_pm2b_editorial_persistence.sql
```

## Dataset and editor status

- Live Data Engine datasets are served through `/api/data-engine/dataset?dataset=<key>`.
- Heroes live dataset retrieval has been verified.
- Heroes has a registered dataset adapter and Record Editor schema on the PM2B branch.
- Edit-button behaviour must not be considered fixed until the latest commit is deployed and the server runtime is compiling.

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
- key integrations.

Keep this file operational and concise. Detailed implementation history belongs in change-set, architecture and release documents.
