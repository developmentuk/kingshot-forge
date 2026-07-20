# Sprint R3 — Authenticated Runtime Validation

R3 was carried forward into R4 because approved authenticated access and a clean Vercel TypeScript build were not available at its close. The fixture and deployment recovery is recorded in [`SPRINT-R4-AUTHENTICATED-FIXTURES-AND-DEPLOYMENT.md`](./SPRINT-R4-AUTHENTICATED-FIXTURES-AND-DEPLOYMENT.md).

Status: **superseded by completed R4 authenticated fixture validation**
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting head: `748d7777f59968e61ca98e791d28fc9fc068ccc9`

## Evidence captured

- `npm run check` passed, including the recovered workspace, identity and contributor-application contracts, lint and production build.
- The connected Supabase project `hrvdhjscwitqpwjhnjkm` was queried read-only for fixture inventory. It contains four Auth users, three active role-assignment rows covering `owner`, `content_creator` and `beta_tester`, zero contributor applications and eleven community-art submissions.
- No test credentials, disposable account labels or approved fixture-cleanup procedure were found in the repository.
- The Vercel project is `kingshot-forge`; the latest available READY deployment is from an unrelated integration commit. The preview is Vercel-authenticated, and the connected browser has no existing signed-in session.
- The R3 documentation candidates were deployed as READY previews: `https://kingshot-forge-1huohvzaw-clarksim-7474s-projects.vercel.app` (`dpl_4FcyuXe1VKXFKHjUVrCTNmFjvyMz`) and follow-up `https://kingshot-forge-2az6nyatx-clarksim-7474s-projects.vercel.app` (`dpl_7jEHc5Prj3aBwjgAVYomAw8zsUy8`). Vercel's build log reports pre-existing TypeScript diagnostics in broader Player Identity and record-editor code even though local `npm run check` passes.
- Signed-out smoke of `/operations`, `/operations/users`, `/operations/applications` and `/admin/community-art` produced non-blank guarded states with no horizontal overflow at 390, 768 and 1280px.

## Gates not claimed

The following were not executed and are intentionally not represented as passing evidence: sign-in, session restoration, profile/capability loading, role-aware workspace selection, workspace switching, direct-route authorization in a signed-in browser, multi-role isolation, account switching, authenticated API/RLS checks, authenticated responsive content review at 390/768/1280px, and authenticated runtime-log review.

## Safety record

No Supabase migration, account creation, role assignment, application submission, moderation mutation, provider transport, push, merge, tag, or production promotion was performed.

## Sprint R2 recommendation

Provide an approved isolated preview fixture set or sign-in-ready accounts for the required roles, plus the exact preview deployment authority. Then rerun the R3 validation matrix end-to-end before beginning Render Engine recovery.
