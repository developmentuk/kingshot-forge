# Art Studio Community Audit

## Audit status

- Date: 17 July 2026
- Branch: `feature/art-studio-community`
- Audit base: `f47b40d1a090a3131342293ce7b88a360fdad8f5`
- Worktree: `C:\Users\clark\Projects\kingshot-forge-art-studio`
- Supabase project: `hrvdhjscwitqpwjhnjkm`
- Supabase access used by this audit: read-only metadata and `SELECT` queries only
- Production writes, storage writes, migration application, deployment and push: none

This audit is Milestone A of the Art Studio Community work. It records the
current implementation and the safe boundary for a future implementation. It
does not claim that submissions, likes, reports or moderation are complete.

The following labels are used throughout:

- **Confirmed**: directly observed in the checked-out repository or through a
  read-only query against the connected Supabase project.
- **Inferred**: a conclusion supported by current code or schema but not proven
  through a complete runtime journey.
- **Missing**: required capability for which no implementation was found.
- **Proposed**: recommended implementation subject to the approvals listed in
  this document.
- **Deferred**: intentionally excluded until a safe supporting capability or
  explicit product decision exists.

## Repository and release context

**Confirmed**

- The independent worktree was created from the exact local
  `release/0.7.0-player-domain` HEAD that existed at creation time.
- The new worktree was clean immediately after creation.
- The local release branch was six commits ahead of
  `origin/release/0.7.0-player-domain` at creation time. The remote branch was
  fetched before the worktree was created.
- Codex A advanced the release branch after this branch was created. That does
  not change the recorded Art Studio base.
- The Codex A worktree contained active Editorial/Verification Centre work
  during the initial safety check. The Codex B Gift Centre and Codex C Player
  Domain worktrees were clean.
- This audit adds only a new Art Studio audit file and does not modify files in
  any other worktree.
- `package.json` reports version `0.7.1`.
- `docs/AEGIS.md` defines Release 0.7.1 as Editorial Platform Completion.
- No dedicated 0.7.1 release-notes document exists in `docs/releases` on this
  branch. The available 0.7.1 validation document is
  `docs/TESTING/SPRINT-9.2-MILESTONE-3.md`.
- `docs/FORGE_BLUEPRINT.md` places creative studios, submissions, moderation
  and the reusable community library in Epic 10, after the currently active
  editorial, player and operations work.

**Inferred**

- The explicit Art Studio brief authorises independent discovery work despite
  the Blueprint's normal single-active-epic sequence. It does not by itself
  authorise a database migration, a Supabase development branch or changes to
  shared production permissions.

## Existing route and page structure

**Confirmed**

- `src/App.tsx` registers one public route: `/art-studio`.
- There is no artwork detail route, submission route, My Submissions route or
  Art Studio Admin route.
- `src/components/AppLayout.tsx` includes Art Studio in the desktop/sidebar
  Forge tools navigation.
- Art Studio is not one of the five persistent mobile bottom-navigation items.
- `src/pages/ArtStudioPage.tsx` is a single client-side catalogue page with:
  search, category filters, sorting, a favourites-only filter, artwork cards,
  copy buttons, an empty state, and a full artwork preview dialog.
- The page contains no loading or remote-data error state because it does not
  make a remote request.

## Artwork source and current schema

**Confirmed**

- Artwork is compiled into the application from:
  `src/data/art/starterArt.ts` and
  `src/data/art/allianceSubmissions.ts`.
- `src/data/art/index.ts` concatenates those arrays and
  `src/data/artTemplates.ts` re-exports the result.
- The current catalogue contains 25 records: 16 Forge starter records and 9
  alliance-submission records.
- All 16 starter records are marked `Published`.
- All 9 alliance-submission records are marked `Needs Testing`.
- The TypeScript `ArtTemplate` model owns:
  `id`, `title`, `category`, `description`, `tags`, `art`, `size`, `source`,
  `status`, optional attribution fields, timestamps, featured/compact flags,
  and `testedInKingshot`.
- The model does not own a user ID, public identifier distinct from its code
  key, immutable revision, published revision, moderation event, visibility,
  like count, report count or concurrency version.
- The current corpus is small. The longest observed template is 496 UTF-16
  code units; the largest observed line count is 11. These observations are
  not validation rules.

## Artwork types and rendering safety

**Confirmed**

- The only evidenced artwork type is Kingshot-oriented text/Unicode artwork.
- The catalogue includes ASCII art, Unicode box drawing, emoji, symbols and
  whitespace-sensitive banners.
- There are no image artwork records, image-upload controls, generated markup
  artwork records or mixed text/image records.
- Cards and the full preview render artwork as React text inside `<pre>`.
- The renderer does not use `dangerouslySetInnerHTML` or trust submitted HTML.
- CSS uses `white-space: pre` and monospace fonts to preserve line breaks and
  spacing.
- The full preview uses a contained overflow region, so wide text can scroll
  without requiring trusted markup.

**Missing**

- Authoritative input validation for Unicode artwork.
- A content-size limit, line limit or per-line limit.
- Checks for malformed Unicode, control characters, invisible abuse text or
  excessive combining characters.
- A compatibility contract that distinguishes "safe to store" from "tested
  successfully in Kingshot".

**Proposed**

- Support one type initially: `text_unicode`.
- Store the artwork body as plain text and always render it as text.
- Preserve the exact body, including leading/trailing spaces and line breaks.
- Use a separately approved platform ceiling. A conservative starting proposal
  is 2,000 Unicode scalar values, 100 lines, 200 scalar values per line and a
  16 KiB UTF-8 request-body ceiling. This is a service safety limit, not a
  claim that every accepted artwork will paste into Kingshot.
- Record compatibility separately as `untested`, `confirmed`, `issue_reported`
  or an equivalent approved vocabulary.

**Deferred**

- Image artwork and screenshot attachments. The product contains no evidence
  that Art Studio currently supports them, and there is no Art Studio storage
  bucket or approved upload policy.
- HTML, SVG or generated-markup artwork.

## Current copy and preview behaviour

**Confirmed**

- A card preview shows at most eight lines and appends an ellipsis when more
  lines exist.
- Selecting the preview opens the complete artwork in a modal-style dialog.
- Copy uses `navigator.clipboard.writeText` with the stored artwork string.
- Copy success changes button text to `Copied!` for 1.5 seconds.
- Copy failure uses a browser `alert` and asks the user to copy manually, but
  it does not select the artwork or provide a fallback text area.
- The preview closes through its backdrop, close button or Escape key.
- Body scrolling is disabled while the preview is open.

**Missing**

- Focus placement, focus containment and focus restoration for the preview.
- An `aria-live` copy-result announcement.
- A reliable manual-copy fallback.
- A stable artwork detail URL.

## Visibility and publication behaviour

**Confirmed**

- The public catalogue hides only records with status `Archived`.
- `Draft`, `Needs Testing` and `Published` all pass the current visibility
  check.
- Consequently, all nine `Needs Testing` alliance submissions are public even
  though they have no governed approval or publication record.
- Status and `testedInKingshot` are separate fields and can contradict each
  other.

**Missing**

- A published-only projection.
- Explicit approval and publication operations.
- Immutable publication history.
- A distinction between approved content and live content.

## Current authentication behaviour

**Confirmed**

- `/art-studio` is public and does not consume `AuthContext`.
- Browsing, copying, previewing and favouriting do not require authentication.
- No Submit, Like, Share or Report control exists on the Art Studio page.
- Google sign-in in `AuthContext` always redirects to `/my-forge`.
- The sign-in implementation does not preserve an intended return route such
  as `/art-studio?submit=1`.
- The server-side `requireForgeActor` helper validates a bearer token with
  Supabase Auth `getUser(token)` and loads the actor's Forge role.

## Current favourites and likes

**Confirmed**

- Art Studio "favourites" are an array of static artwork IDs stored in browser
  local storage under `kingshot-forge-art-favourites`.
- `MyForgePage` reads the same device-local key and displays matching static
  artwork.
- Favourites are not account-synchronised, server-authoritative or counted.
- There is no like/unlike service, API, database constraint or accessible
  `aria-pressed` state.

**Missing**

- Every requested like requirement, including authentication, uniqueness,
  published-only enforcement, count consistency, idempotency and reconciliation
  of optimistic UI.

## Current submission UI and user status

**Confirmed**

- There is no artwork submission form, draft editor, preview-before-submit
  journey, rights confirmation, attribution confirmation or submission
  acknowledgement.
- There is no My Submissions view.
- Users cannot inspect, edit, resubmit or withdraw Art Studio submissions.
- The static alliance-submission file does not record an authenticated owner or
  moderation history.

**Missing**

- Every requested authenticated submission and submission-status capability.

## Live database discovery

The following findings are from read-only queries against the connected
Supabase project. No data was inserted, changed or deleted.

### Legacy `submissions` table

**Confirmed**

- Production contains `public.submissions` with zero rows and RLS enabled.
- Its columns include:
  `id`, `user_id`, `type`, `title`, `description`, `content`, `category`,
  `tags`, `author_name`, `alliance`, `status`, `moderation_notes`,
  `tested_in_kingshot`, `created_at`, `updated_at` and `published_at`.
- `submission_type` includes `artwork`, `name_style`, `chat_template` and
  `character_test`.
- `submission_status` includes `draft`, `pending`, `approved`, `rejected` and
  `changes_requested`.
- The table has no revision, audit, public-ID, visibility, optimistic
  concurrency or published-revision constraint.
- The public SELECT policy allows `anon` and `authenticated` to read rows whose
  status is `approved`.
- That policy applies to the base table, not to a column-restricted public
  projection. A public `select('*')` could therefore return the internal
  `user_id` and `moderation_notes` of every approved row.
- There are currently no rows, so no existing reporter or submitter record was
  exposed during this audit. The policy shape is nevertheless unsafe for any
  future approved row.
- An owner can UPDATE a row when its old status is `draft` or
  `changes_requested`. The policy's `WITH CHECK` only verifies that `user_id`
  remains the owner. It does not constrain the new status or moderation fields.
- An authenticated owner could therefore set their own draft to `approved` and
  change moderation-owned columns through a direct Data API update.
- No submission moderation policy, server route or Admin surface was found.

### Legacy `favourites` table

**Confirmed**

- Production contains `public.favourites` with zero rows and RLS enabled.
- It has a unique constraint on `(user_id, item_type, item_id)` and owner-only
  SELECT/INSERT/DELETE policies.
- It is not used by the current Art Studio or My Forge code.
- It has no foreign key to a canonical artwork and no published-only check.
- It models private favourites, not public likes, and cannot provide an
  authoritative community like count as written.

### Migration reproducibility

**Confirmed**

- No checked-in migration creates `submissions`, `favourites`,
  `submission_type` or `submission_status`.
- No current Git history reachable in this checkout contains that schema
  creation.
- The live migration list returned by Supabase does not identify a migration
  that creates those legacy tables.
- The checked-in migration set therefore cannot reproduce the live legacy
  submission/favourite schema from a clean database.

**Stop condition**

The brief requires work to stop when the current artwork schema cannot be
reproduced from migrations, when a public projection would expose internal user
IDs, or when moderation permissions conflict with shared capabilities. All
three conditions apply to the legacy `submissions` table. It must not be reused
or expanded without a reviewed schema decision and explicit migration
authorisation.

## Supabase storage

**Confirmed**

- Production has one bucket: `companion-images`.
- It is public, limited to 2 MiB, and permits JPEG, PNG and WebP MIME types.
- The checked-in storage migration updates that existing bucket; it does not
  create an Art Studio bucket.
- The related policies are intended for Companion editorial images and contain
  role-name checks for owner, admin, moderator and content creator.
- The Art Studio page does not use Supabase Storage.

**Proposed**

- Do not use `companion-images` for community artwork.
- Text/Unicode artwork needs no Storage bucket.

**Deferred**

- Any Art Studio bucket, screenshot attachment or image-artwork upload until
  product scope, malware/file-signature validation, moderation-before-publication
  and storage policies are explicitly approved.

## Existing reporting and moderation support

**Confirmed**

- Forge has a generic `feedback_reports` table, `FeedbackDialog`, client-side
  service and `/admin/feedback` queue.
- Generic feedback accepts anonymous submissions and broad report types. It
  does not implement the required artwork categories or compatibility context.
- Generic feedback is inserted directly from the browser.
- Feedback moderation updates are also sent directly from the browser.
- `/admin/feedback` is protected in the UI by `cms.view`, not by
  `moderation.manage`.
- The checked-in RLS policy grants generic feedback read/update access by
  hard-coded role names including `content_creator`.
- The feedback queue provides useful visual patterns for cards, filters,
  internal notes and status timelines, but it does not append immutable
  moderation events.
- The Editorial Platform provides immutable versions, workflow transitions,
  permission evaluation, audit events and stable server error patterns for
  registered datasets. Artwork is not a registered dataset and no Art Studio
  adapter exists.

**Inferred**

- Reusing the generic feedback table for artwork reports would mix public
  product feedback with moderation records and would not meet duplicate,
  category, privacy, lifecycle or compatibility-reproduction requirements.

**Proposed**

- Reuse the Admin shell, card/status visual language, authenticated server
  actor and stable error-envelope conventions.
- Use dedicated artwork report records and append-only artwork moderation
  events.
- Enforce `moderation.manage` for review/triage and `cms.publish` for publication
  until Art Studio-specific capabilities are approved.
- Keep reporter identity out of every public projection and response.

## Existing roles and permissions

**Confirmed**

- Client permission keys include `contributions.submit`,
  `moderation.manage` and `cms.publish`.
- Live read-only permission inspection showed:
  - `moderation.manage`: owner, admin and moderator;
  - `cms.publish`: owner and admin;
  - `contributions.submit`: owner, admin, moderator, content creator,
    beta tester and contributor.
- The default `viewer` role does not currently receive
  `contributions.submit`.
- `ProtectedRoute` and navigation filtering are presentation checks only.
- The server actor currently returns a role but not resolved capability keys.

**Missing**

- A shared server-side capability assertion for non-dataset domain endpoints.
- An approved mapping that lets every authenticated standard user submit,
  like and report while retaining privileged moderation boundaries.

**Proposed**

- Add or reuse shared capabilities through the permission tables; do not
  hard-code role names in Art Studio handlers.
- Resolve capabilities server-side after validating the bearer token.
- Treat ownership checks as additional resource checks, not as a substitute
  for capabilities.
- Keep publication limited to actors with the existing `cms.publish`
  capability unless a later approval defines `art.publish`.

## Public URLs, sharing and analytics

**Confirmed**

- `/art-studio` is the only stable Art Studio URL.
- There is no public artwork-detail URL, Web Share integration or copy-link
  fallback.
- No analytics abstraction, `gtag` initialisation or measurement ID was found
  in application source, `index.html` or package dependencies.
- The repository therefore contains no existing Art Studio analytics events and
  no duplicate Google Analytics initialisation to reuse or remove.

**Proposed**

- Use `/art-studio/:publicId` with a non-sensitive public identifier.
- Add a small shared analytics abstraction before emitting Art Studio events.
- If Google Analytics is initialised by this repository, initialise measurement
  ID `G-8L3HYETN51` exactly once and do not send artwork bodies, report text,
  user IDs, email addresses or moderator notes.

**Approval required**

- Confirm whether analytics is injected outside the repository by Vercel or a
  production shell before adding any initialisation.

## Mobile experience

**Confirmed**

- Art Studio uses one card column below 700 px and stacks modal actions at
  390 px.
- The category row scrolls horizontally.
- The preview becomes a bottom sheet and accounts for safe-area insets.
- The full artwork area provides contained scrolling.
- The sort control is hidden below 700 px, so mobile users lose a catalogue
  function that desktop users have.
- Art Studio is reachable from the mobile drawer but not from persistent bottom
  navigation.

**Inferred**

- The current layout is a useful responsive baseline, but the complete
  submission, report and moderation journeys have no mobile implementation to
  validate at 390 x 844.

## Accessibility

**Confirmed strengths**

- Search and sort controls have visible labels.
- Cards use headings and native buttons.
- The preview has `role="dialog"`, `aria-modal`, an accessible title, a close
  button and Escape handling.
- Tested/needs-testing state is written as text and does not rely only on
  colour.

**Confirmed gaps**

- The preview does not move focus into the dialog, contain focus, mark the
  background inert or restore focus to the opener.
- Favourite buttons do not expose `aria-pressed`.
- Active categories do not expose a programmatic selected state.
- Copy feedback is not announced with `aria-live`.
- Copy failure relies on `alert`.
- No submission or report form exists, so error summaries, field errors and
  consent accessibility are missing.

## Broken or incomplete journeys

1. Community records marked `Needs Testing` are public without approval.
2. The static catalogue cannot receive a user submission.
3. Sign-in cannot return a user to an intended Art Studio action.
4. Device-local favourites do not follow the authenticated user.
5. Likes, counts, sharing, reports and stable detail URLs do not exist.
6. Users cannot see submission or report status.
7. Moderators cannot review artwork through Forge Admin.
8. No authoritative Art Studio API exists.
9. No rate limiting or duplicate-submission/report control exists.
10. The discovered live submission schema is unsafe and migration-unreproducible.
11. The current public-table policy would expose internal ownership and
    moderation fields for approved legacy submissions.
12. The current owner UPDATE policy can permit self-approval of a legacy
    submission.

## Reusable elements

The following can be reused safely with adaptation:

- category definitions and existing static text artwork as reviewed seed-source
  material, not as the permanent canonical store;
- plain-text `<pre>` rendering and whitespace-preserving styles;
- search, category filtering, card layout and contained wide-art scrolling;
- clipboard copy with a new accessible fallback;
- AuthContext session access and server bearer-token validation;
- Forge permission tables and the existing moderation/publish capability
  boundaries;
- Forge Admin page shell, status badges, cards, filters and timeline visual
  patterns;
- Editorial Platform principles: explicit transitions, immutable revisions,
  optimistic concurrency and append-only audit events;
- server error-envelope and validation patterns.

The following must not be reused as-is:

- the live legacy `submissions` table or its RLS policies;
- the live generic `favourites` table as an artwork-like model;
- direct browser writes used by generic feedback moderation;
- hard-coded role lists for Art Studio authority;
- `companion-images` for community artwork;
- the current `status !== 'Archived'` public visibility rule.

## Proposed focused domain boundary

Subject to approval, the smallest model that satisfies the brief is:

- `artworks`: stable public identity and live state, referencing exactly one
  approved published revision;
- `artwork_revisions`: immutable text/metadata snapshots;
- `artwork_submissions`: owner-scoped draft and review workflow referencing a
  candidate revision;
- `artwork_likes`: one row per authenticated user and artwork;
- `artwork_reports`: private reporter-scoped moderation tickets with approved
  categories and compatibility context;
- `artwork_moderation_events`: append-only actor/action/reason/status audit.

An artwork share table is not justified. Aggregate, privacy-conscious analytics
events are sufficient. Tags can be stored on the immutable revision initially;
a separate tag table is unnecessary until discovery requirements prove it.

Recommended lifecycle:

```text
Draft -> Submitted -> In Review
In Review -> Changes Requested -> Submitted
In Review -> Approved -> Published
In Review -> Rejected
Draft / Submitted / Changes Requested -> Withdrawn
Published -> new controlled revision (never in-place body replacement)
```

Archive/unarchive semantics should remain disabled until their public and audit
effects are approved.

## Required approvals before implementation

1. Authorise creation of a new checked-in Art Studio migration proposal. The
   migration must not be applied to production.
2. Decide whether to replace the legacy `submissions`/`favourites` tables or
   migrate them into dedicated Art Studio tables. There are no rows to preserve
   today, but destructive treatment still requires explicit approval.
3. Approve text/Unicode-only scope and continued deferral of image uploads.
4. Approve the platform and compatibility size limits.
5. Approve public attribution rules and whether a profile display name,
   pseudonym or explicit per-submission attribution is published.
6. Approve whether users may like their own artwork. Recommendation: allow it
   unless a documented community policy prohibits it.
7. Approve duplicate report behaviour. Recommendation: one active report per
   user, artwork and category; later reports are allowed after a terminal
   outcome if new evidence exists.
8. Approve report visibility to creators. Recommendation: creators receive only
   a moderator-authored safe outcome message, never reporter identity or raw
   staff notes.
9. Confirm that `moderation.manage` owns submission/report review and
   `cms.publish` owns publication.
10. Approve no automatic unpublication threshold. Serious reports should
    create a prioritised moderation task; unpublication remains an explicit
    authorised action.
11. Approve manual copyright escalation and retention policy.
12. Confirm screenshot attachments remain deferred.
13. Approve revision, withdrawal and archive semantics.
14. Confirm whether reporter/creator notifications are deferred until Forge has
    an approved notification service.
15. Approve `/art-studio/:publicId` as the public share URL shape.
16. Confirm whether Google Analytics is initialised outside this repository.
17. Approve a non-production Supabase validation environment before any schema
    or RLS verification that requires writes or test data.

## Stop decision

Implementation stops after this audit because the discovered live submission
schema is not reproducible from checked-in migrations, its approved-row public
policy is not column-safe, and its owner update policy conflicts with the
required moderation boundary. Continuing without a reviewed replacement would
silently build the new workflow on an unsafe, production-only contract.

No production migration was applied. No database or storage write occurred. No
deployment occurred. Nothing was pushed.
