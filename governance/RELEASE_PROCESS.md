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
