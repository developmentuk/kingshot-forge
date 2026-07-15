# Contributing to Kingshot Forge

## Working Branches

- `main` contains production-ready code.
- Product work is completed on focused branches.
- Branch names use a clear prefix and description.

Examples:

```text
feature/pm2b-editorial-workflow
feature/player-profile-editor
fix/admin-dataset-refresh
docs/governance-foundation
```

Do not commit feature work directly to `main`.

## Development Process

1. Confirm scope.
2. Review the relevant architecture and contracts.
3. Implement the complete change.
4. Run build and lint checks.
5. Test the affected workflow.
6. Update documentation.
7. Commit with a meaningful message.
8. Push the branch.
9. Review before merge.

## Commit Messages

Use concise conventional prefixes:

```text
feat: add publication lifecycle
fix: prevent stale editorial updates
refactor: simplify dataset registry
docs: add governance foundation
test: cover rollback validation
style: improve admin layout
chore: update development tooling
```

A commit should represent one logical piece of work.

## Pull Requests

A pull request should explain:

- what changed;
- why it changed;
- user or developer impact;
- validation completed;
- known limitations;
- follow-up work, if any.

Keep unrelated work out of the same pull request.

## Required Validation

Before requesting review:

```bash
npm run build
npm run lint
```

Also test the affected user journey manually.

## Documentation

Update documentation whenever a change affects:

- architecture;
- workflow;
- permissions;
- publishing;
- public behaviour;
- release scope.

## Definition of Done

A change is complete only when it is:

- functional;
- tested;
- responsive where applicable;
- integrated;
- documented;
- ready to merge.
