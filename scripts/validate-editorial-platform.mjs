import {
  access,
  readFile,
} from "node:fs/promises";
import {
  constants,
} from "node:fs";
import {
  resolve,
} from "node:path";
import process from "node:process";

const root = process.cwd();
const migrationPath =
  "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql";
const expectations = [
  {
    path: "shared/data-engine/dataset-capabilities.ts",
    fragments: [
      "DATASET_CAPABILITY_REGISTRY",
      "creation: true",
      "publishing: true",
      "archive: false",
      "rollback: false",
    ],
  },
  {
    path: "server/editorial/executeEditorialAction.ts",
    fragments: [
      "validateEditorialValues",
      "requireBoundQueueItem",
      "requireBoundSchedule",
      "is intentionally unavailable",
      "head.status !== \"approved\"",
    ],
  },
  {
    path: "src/platform/persistence/supabase/SupabaseAtomicPublicationRepository.ts",
    fragments: [
      "publish_editorial_queue_item",
      "queueOutcomeCommitted: true",
      "recoverCompletedResult",
    ],
  },
  {
    path: "src/features/admin/editorial/ConnectedEditorialRecordEditor.tsx",
    fragments: [
      "canRolePerformStandardEditorialAction",
      "editingDisabled",
      "publishingAvailable &&",
    ],
  },
  {
    path: migrationPath,
    fragments: [
      "forge_private.has_permission",
      "cms.history.view",
      "cms.publish",
      "public.publish_editorial_queue_item",
      "for update",
      "update public.heroes",
      "insert into public.hero_skills",
      "insert into public.editorial_record_versions",
      "insert into public.editorial_audit_events",
      "status = 'completed'",
      "to service_role",
    ],
  },
];

const failures = [];

async function exists(path) {
  try {
    await access(resolve(root, path), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

for (const expectation of expectations) {
  if (!(await exists(expectation.path))) {
    failures.push(`Missing required file: ${expectation.path}`);
    continue;
  }

  const content = await readFile(
    resolve(root, expectation.path),
    "utf8",
  );

  for (const fragment of expectation.fragments) {
    if (!content.includes(fragment)) {
      failures.push(
        `${expectation.path} is missing: ${fragment}`,
      );
    }
  }
}

if (await exists(migrationPath)) {
  const migration = await readFile(
    resolve(root, migrationPath),
    "utf8",
  );
  const lower = migration.toLowerCase();
  const beginCount =
    lower.match(/\bbegin;/g)?.length ?? 0;
  const commitCount =
    lower.match(/\bcommit;/g)?.length ?? 0;

  if (beginCount !== 1 || commitCount !== 1) {
    failures.push(
      "Atomic publication migration must have one explicit transaction boundary.",
    );
  }

  if (
    lower.includes(
      "authenticated users can read editorial versions\"\non public.editorial_record_versions\nfor select\nto authenticated\nusing (true)",
    )
  ) {
    failures.push(
      "Atomic publication migration must not recreate unrestricted authenticated editorial reads.",
    );
  }
}

if (failures.length > 0) {
  console.error("\nEditorial platform validation failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "Editorial platform structural validation passed.",
  );
  console.log(
    "Verified shared capabilities, server enforcement, Admin gating, restricted RLS policy SQL and atomic publication transaction structure.",
  );
}
