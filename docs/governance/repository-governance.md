# Repository Governance

## Branching

- `main` is protected and always deployable.
- Work occurs on `feature/<milestone>-<description>`, `fix/<description>`, `docs/<description>` or `chore/<description>` branches.
- Direct pushes to `main` are prohibited after governance activation.
- Pull requests are squash-merged with a conventional commit title.

## Required pull-request checks

1. Install from lockfile (`npm ci`)
2. Typecheck
3. Lint
4. Unit tests
5. Integration tests where affected
6. Production build
7. Dependency and secret scanning

## Review policy

- Founder/Product Owner approves product scope and acceptance.
- Technical Lead approves architecture, security and maintainability.
- Changes to permissions, database schema, publishing or public contracts require an ADR or linked existing ADR.
- No self-approved privileged or destructive production change.

## Versioning and releases

- Adopt Semantic Versioning from the platform baseline.
- Use `0.x` while platform contracts remain intentionally unstable; move to `1.0.0` when the CMS publishing contract and primary public platform APIs are stable.
- Maintain `CHANGELOG.md` using Added, Changed, Fixed, Security and Deprecated.
- Create a Git tag and release notes for production releases.

## Commit convention

Use Conventional Commits:

- `feat(cms): add draft validation workflow`
- `fix(data-engine): preserve source metadata`
- `docs(architecture): record publication model`
- `refactor(player-profile): extract account repository`

## Ownership

Add `CODEOWNERS` for:

- `/docs/architecture/`
- `/api/`
- `/packages/platform/`
- `/packages/data-engine/`
- `/supabase/migrations/`
- `/apps/web/src/cms/`

## Issue and milestone governance

- GitHub Milestones represent platform milestones.
- Issues represent outcomes or defects, not conversational steps.
- Every implementation pack links to one parent issue and contains acceptance criteria.
- Technical debt has an owner, severity, target milestone and status.

## Repository hygiene

Never commit or distribute:

- `.env*` containing credentials
- `node_modules`
- `dist`
- `.vercel`
- local logs or generated TypeScript build metadata

Use `.env.example` with names and descriptions only.
