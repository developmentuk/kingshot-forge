import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const repository = readFileSync(
  "src/platform/persistence/supabase/SupabaseEditorialRepository.ts",
  "utf8",
);
const checkedMigration = readFileSync(
  "supabase/migrations/20260803141000_editorial_atomic_rollback_concurrency.sql",
  "utf8",
);
const buildingsMigration = readFileSync(
  "supabase/migrations/20260802193000_buildings_editorial_media_projection.sql",
  "utf8",
);

assert.match(
  repository,
  /auditEvent\.action !== "rolled_back"/u,
  "The Supabase repository must identify rollback commits explicitly.",
);
assert.match(
  repository,
  /auditEvent\.metadata\?\.rolledBackToVersionId/u,
  "Rollback must use the immutable target-version audit metadata.",
);
assert.match(
  repository,
  /"rollback_editorial_version_checked"/u,
  "Rollback must use the atomic checked RPC instead of the generic version commit.",
);
assert.match(
  repository,
  /p_expected_version: expectedVersion/u,
  "The atomic rollback RPC must receive the caller's optimistic-concurrency version.",
);
assert.match(
  repository,
  /"commit_editorial_version"/u,
  "Non-rollback editorial commits must continue using the generic atomic commit RPC.",
);

assert.match(
  checkedMigration,
  /create or replace function public\.rollback_editorial_version_checked/u,
  "The checked rollback function is missing.",
);
assert.match(
  checkedMigration,
  /for update/u,
  "The checked rollback function must lock the current editorial head.",
);
assert.match(
  checkedMigration,
  /current_head\.current_version <> p_expected_version/u,
  "The checked rollback function must reject stale clients.",
);
assert.match(
  checkedMigration,
  /return public\.rollback_editorial_version\(/u,
  "The checked function must invoke the governed dataset-aware rollback wrapper.",
);
assert.match(
  checkedMigration,
  /grant execute[\s\S]*to service_role/iu,
  "Only the server role may execute the checked rollback function.",
);
assert.doesNotMatch(
  checkedMigration,
  /grant execute[\s\S]*to (?:anon|authenticated)/iu,
  "The checked rollback function must not be exposed directly to browser roles.",
);

assert.match(
  buildingsMigration,
  /perform forge_private\.apply_building_editorial_override/u,
  "The governed Buildings rollback wrapper must update the live editorial projection.",
);
assert.match(
  buildingsMigration,
  /'projection', 'building_editorial_overrides'/u,
  "The Buildings rollback result must identify its live projection.",
);

console.log(
  "Atomic editorial rollback concurrency and Buildings projection contracts passed.",
);
