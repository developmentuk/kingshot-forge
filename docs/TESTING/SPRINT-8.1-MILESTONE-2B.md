# Sprint 8.1 — Milestone 2B Validation

## Scope

Hero Skills editorial vertical slice for Release 0.6.0.

## Automated validation

`npm run check` now includes:

- NodeNext import validation;
- PM2B editorial-platform structural validation;
- Hero Skills milestone structural validation;
- lint;
- TypeScript production build;
- Vite production build.

The Hero Skills validator checks the shared domain contract, draft creation surface, editorial publication projection, published-only loader, public repository, Hero Companion integration, migration constraints, RLS and security-invoker view.

## Database verification

Validated against Supabase project `hrvdhjscwitqpwjhnjkm` using rollback-only transactions.

Passed:

- draft creation through `commit_editorial_version`;
- transition to review;
- approval;
- live Hero Skill upsert by stable editorial key;
- publication transition;
- four immutable versions retained;
- four audit events retained;
- stale expected version rejected;
- published record appears once in `published_hero_skills`;
- anonymous reader sees the published record;
- anonymous reader does not see an unpublished record;
- repeated publication updates the same live row rather than creating a duplicate.

No validation records were retained.

## Deployment verification

Vercel successfully built commit `a71701b5cd433ec3b9bc809803c3a123c8434a66` after the complete code path was connected.

## Validation journey

1. Open **Admin → Datasets → Hero Skills**.
2. Edit the **Create a Hero Skill** row.
3. Enter a valid Hero slug, skill identity, ordering and source information.
4. Save the first draft.
5. Submit for review.
6. Approve.
7. Queue publication and process the queue through the existing editorial controls.
8. Confirm the record status is Published and history contains each immutable transition.
9. Open `/companion/heroes/<hero-slug>`.
10. Confirm the published skill appears in deterministic display order.
11. Save a later draft without publishing and confirm the Companion continues to show the previous published version.

## Result

Milestone 2B is complete and ready for product-owner validation. The implementation reuses the existing editorial, permission, queue, history and audit architecture. No parallel Hero-specific workflow was introduced.
