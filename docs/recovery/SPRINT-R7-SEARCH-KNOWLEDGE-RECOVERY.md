# Sprint R7 — Search & Knowledge Platform Recovery

Status: **Accepted on owner-authenticated preview**  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `ac0756e564dbb9751060378133ca1e12cfb755df`  
Preview: `https://kingshot-forge-grnakjphz-clarksim-7474s-projects.vercel.app`  
Deployment: `dpl_HLEJ9xzFChtaUhwLS4qkYmyDAjp4`

## Outcome

R7 search recovery is accepted on the current preview. The deployed canonical
search route and admin Search Explorer load from the persistent projection
index. The owner-authenticated session reached the published hero result for
`sophia`, while the internal `truegold` war-academy rows remained visible in
Search Explorer and were not exposed by the public search query. This confirms
the published/public permission boundary.

## Acceptance evidence

- Global Search entry point: the deployed shell exposes one `Open global search`
  button and opens the Search Forge interface.
- Public search: `/search` rendered `Global Search`; query `sophia` returned the
  published `Heroes / Sophia` result with score 105. Query `truegold` returned
  no public published matches, despite internal admin rows being present.
- Search Explorer: `/admin/search` rendered the persisted index, showed
  published projections and a successful refresh timestamp. Query `truegold`
  returned published `war-academy` rows including `truegold-arrows-level-10`.
- Hero relationship navigation: `/companion/heroes/sophia` rendered the
  `Forge Connections` region, related content cards and an `Explore all` link
  carrying the canonical `relationshipFrom=heroes:<id>` route.
- Editorial/creator availability: no published creator-specific result was
  surfaced by the available preview data. The existing dataset/provider
  boundary remains intact; no synthetic creator content was added.
- Responsive smoke: explicit viewport overrides were exercised for 390px,
  768px and 1280px on `/search`; each rendered `Global Search` without
  horizontal overflow. The browser reported scaled CSS inner widths of
  433/853/1422px respectively, with `scrollWidth <= clientWidth` at each
  checkpoint.
- Console: Chrome dev logs were empty for errors and warnings after the final
  route pass. Vercel emitted only the existing Node `DEP0169` deprecation
  warning, with affected `/api/search` and `/api/admin/search` requests still
  returning 200.
- Network/status: Vercel logs recorded `/api/search` and `/api/admin/search`
  requests as preview serverless responses with status 200. The local search
  API contract test passed, including the JSON response contract; direct JSON
  endpoint navigation was not used because the browser client blocked it.

## Persistence and recovery

The deployed preview initially failed because the persistent search projection
tables were absent. The checked-in migration
`supabase/migrations/20260719090000_search_persistent_projections.sql` was
applied to project `hrvdhjscwitqpwjhnjkm` as migration version
`20260719171923`. It created the search projection, relationship, metadata,
refresh-run, refresh-error and permission-simulation tables with RLS enabled
and service-role-only access. No fixture records or unrelated database writes
were made.

The owner refresh path also required a narrow client fix in
`src/features/admin/SearchExplorerPage.tsx`: it now sends the same-origin
request with the authenticated cookie when no bearer token is available, while
preserving the bearer header when present. That fix was the only code change
that required the R7 deployment.

Post-refresh Supabase evidence: index version 4, 554 projections, 0 refresh
errors, 4 refresh runs, and last successful refresh `2026-07-19T17:26:49.42Z`.
The metadata row is now stale by age, which is expected for this preview
acceptance and is visible in Search Explorer.

## Local gates and non-actions

`npm run check`, `npx tsc -p tsconfig.server.json --noEmit`,
`npm run validate:nodenext`, `npm run build` and the focused search experience
test all passed. Existing fast-refresh lint warnings, the Vite bundle-size
warning and the npm audit notice were unchanged.

R7 did not push, merge, tag, promote to production or create a second preview
after the required fix. Recovery Matrix status is closed below.
