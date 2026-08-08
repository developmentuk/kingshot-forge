# Release Process

## Release Readiness

A release candidate must have:

- passing build;
- passing lint;
- completed manual testing;
- completed milestone documentation;
- updated release notes;
- updated roadmap;
- no known critical defects.

## Release Flow

```text
Feature complete
  ↓
Validation complete
  ↓
Release notes updated
  ↓
Roadmap updated
  ↓
Merge to main
  ↓
Create version tag
  ↓
Deploy
  ↓
Smoke test production
  ↓
Confirm release
```

## Version Tagging

Use semantic version tags:

```text
v0.6.0
v0.6.1
v0.7.0
v1.0.0
```

## Production Smoke Test

After deployment, verify:

- application loads;
- authentication works;
- primary navigation works;
- affected feature works;
- privileged routes remain protected;
- API health endpoints respond;
- no obvious console or server errors appear.

## Vercel Deployment Cost Control

Forge uses the repository's `vercel.json` Git deployment policy to keep
ordinary development pushes out of Vercel build consumption while preserving
the normal production path:

- `main` continues to create the automatic production deployment;
- all non-`main` branches, including feature, fix, docs, ops and future branch
  namespaces, do not create an automatic Vercel deployment;
- an owner-approved Preview is created explicitly from the approved feature
  worktree with `vercel deploy` (or `vercel deploy <project-path>`), without
  `--prod`.

The explicit `vercel deploy` command targets the Preview environment and does
not modify `main`. Production remains the result of merging to `main`; an
explicit `vercel deploy --prod` is a separate production operation and is not
part of the normal Preview workflow.

Do not run an explicit Preview deployment until owner approval is recorded.

## Rollback

When a release causes a critical regression:

1. stop further deployment;
2. identify the last known-good release;
3. revert or redeploy that version;
4. document the incident;
5. create a focused fix branch;
6. validate before redeployment.

## Release Ownership

The Product Owner approves the release.

The Technical Architect confirms technical readiness.
