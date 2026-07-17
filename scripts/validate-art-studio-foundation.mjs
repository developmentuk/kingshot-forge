import assert from "node:assert/strict";
import {
  readFile,
} from "node:fs/promises";
import process from "node:process";

const migrationPath =
  "supabase/migrations/20260717130232_art_studio_community_foundation.sql";
const migration = await readFile(migrationPath, "utf8");
const normalizedMigration = migration.replace(/\r\n/gu, "\n");
const lower = normalizedMigration.toLowerCase();

const expectedTables = [
  "art_studio_artworks",
  "art_studio_artwork_revisions",
  "art_studio_submissions",
  "art_studio_likes",
  "art_studio_reports",
  "art_studio_moderation_events",
  "art_studio_published_artworks",
];

for (const table of expectedTables) {
  assert.ok(
    lower.includes(`create table public.${table}`),
    `Missing table ${table}.`,
  );
  assert.ok(
    lower.includes(`alter table public.${table} enable row level security;`),
    `RLS is not enabled for ${table}.`,
  );
  assert.ok(
    lower.includes(`alter table public.${table} force row level security;`),
    `RLS is not forced for ${table}.`,
  );
  assert.ok(
    lower.includes(`revoke all on table public.${table} from anon, authenticated;`),
    `Explicit base grants are not reset for ${table}.`,
  );
}

for (const fragment of [
  "primary key (artwork_id, user_id)",
  "art_studio_reports_one_open_category_key",
  "where status in ('open', 'reviewing')",
  "users cannot like their own artwork",
  "artwork owners cannot approve or publish their own work",
  "approved art studio revisions are immutable",
  "art studio revisions are append-only",
  "art studio moderation history is append-only",
  "art_studio_private.has_valid_tags(tags)",
  "content !~ '(.)\\1{255}\\1{255}\\1{2}'",
  "forge_private.has_permission('moderation.manage')",
  "forge_private.has_permission('cms.publish')",
  "forge_private.has_permission('contributions.submit')",
  "security_invoker = true",
  "security_barrier = true",
  "to service_role",
]) {
  assert.ok(lower.includes(fragment), `Missing migration guard: ${fragment}`);
}

assert.equal(lower.match(/\bbegin;/gu)?.length, 1);
assert.equal(lower.match(/\bcommit;/gu)?.length, 1);

const viewMatches = [
  ...normalizedMigration.matchAll(
    /create or replace view public\.(art_studio_public_(?:catalogue|details))[\s\S]*?\nas\n([\s\S]*?);/giu,
  ),
];
assert.equal(viewMatches.length, 2, "Both public projection views are required.");

const forbiddenPublicColumns = [
  "artwork_id",
  "revision_id",
  "user_id",
  "reporter",
  "moderation_notes",
  "metadata",
  "submission_id",
];
for (const [, viewName, body] of viewMatches) {
  for (const forbidden of forbiddenPublicColumns) {
    assert.equal(
      body.toLowerCase().includes(forbidden),
      false,
      `${viewName} leaks ${forbidden}.`,
    );
  }
}

assert.equal(
  lower.includes(
    "grant select on table public.art_studio_published_artworks to anon",
  ),
  false,
  "The projection base table must use column-level public grants.",
);
for (const unsafeGrant of [
  "grant select on table public.art_studio_artworks to authenticated",
  "grant select on table public.art_studio_artwork_revisions to authenticated",
  "grant select on table public.art_studio_submissions to authenticated",
  "grant select on table public.art_studio_reports to authenticated",
]) {
  assert.equal(
    lower.includes(unsafeGrant),
    false,
    `Private workflow table has an unsafe full-row grant: ${unsafeGrant}`,
  );
}
for (const privateColumn of [
  "moderation_notes",
  "reviewer_user_id",
  "assigned_moderator_user_id",
  "reporter_user_id",
  "approval_note",
  "approved_by_user_id",
  "status_changed_by_user_id",
]) {
  const grantBlocks = [
    ...normalizedMigration.matchAll(/grant select \([\s\S]*?\) on table public\.art_studio_[a-z_]+ to authenticated;/giu),
  ].map((match) => match[0].toLowerCase());
  assert.equal(
    grantBlocks.some((grant) => grant.includes(privateColumn)),
    false,
    `Authenticated safe-column grants expose ${privateColumn}.`,
  );
}
assert.ok(
  lower.includes("grant select (\n  slug,"),
  "The projection base table must grant only safe columns.",
);

const reportPolicy = normalizedMigration.match(
  /create policy art_studio_reports_select_reporter_or_non_owner_moderator[\s\S]*?\n\);/iu,
)?.[0] ?? "";
assert.ok(reportPolicy.includes("reporter_user_id = (select auth.uid())"));
assert.ok(reportPolicy.includes("artwork.owner_user_id <> (select auth.uid())"));

assert.equal(
  lower.includes(
    "grant select, insert, update on table public.art_studio_reports to authenticated",
  ),
  false,
  "Reports must not expose privileged browser updates.",
);
assert.equal(
  lower.includes(
    "grant select, insert, update on table public.art_studio_submissions to authenticated",
  ),
  false,
  "Submissions must not expose privileged browser updates.",
);

const contracts = await readFile(
  "shared/domains/art-studio/contracts.ts",
  "utf8",
);
for (const operation of [
  "createSubmission",
  "updateDraft",
  "submitForReview",
  "withdrawSubmission",
  "listMySubmissions",
  "readMySubmissionStatus",
  "likeArtwork",
  "unlikeArtwork",
  "reportArtwork",
  "reportRenderingFailure",
  "listModerationQueue",
  "requestChanges",
  "approve",
  "reject",
  "publish",
  "unpublish",
  "resolveReport",
  "dismissReport",
]) {
  assert.ok(contracts.includes(operation), `Missing server contract: ${operation}`);
}

const eventSource = await readFile(
  "shared/domains/art-studio/events.ts",
  "utf8",
);
for (const eventName of [
  "ArtworkSubmissionCreated",
  "ArtworkSubmittedForReview",
  "ArtworkChangesRequested",
  "ArtworkApproved",
  "ArtworkPublished",
  "ArtworkUnpublished",
  "ArtworkRejected",
  "ArtworkLiked",
  "ArtworkUnliked",
  "ArtworkReported",
  "ArtworkRenderingIssueReported",
  "ArtworkReportResolved",
]) {
  assert.ok(eventSource.includes(eventName), `Missing domain event: ${eventName}`);
}

console.log("Art Studio schema and privacy structural validation passed.");
console.log("Verified dedicated entities, RLS/grants, uniqueness guards, immutable history, reporter privacy, public projection exclusions, endpoint contracts and internal events.");

process.exitCode = 0;
