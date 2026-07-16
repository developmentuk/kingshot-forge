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

const requiredFiles = [
  "src/platform/datasets/contracts/permissions.ts",
  "src/platform/editorial/contracts.ts",
  "src/platform/editorial/services/EditorialDraftService.ts",
  "src/platform/editorial/services/EditorialWorkflowService.ts",
  "src/platform/editorial/history/EditorialDiffService.ts",
  "src/platform/editorial/history/EditorialHistoryService.ts",
  "src/platform/editorial/AuthorisedEditorialService.ts",
  "src/platform/permissions/DatasetPermissionService.ts",
  "src/platform/permissions/EditorialPermissionService.ts",
  "src/platform/publishing/PublicationQueueService.ts",
  "src/platform/publishing/scheduling/ScheduledPublishingService.ts",
  "src/platform/persistence/supabase/SupabaseEditorialRepository.ts",
  "src/platform/persistence/supabase/SupabasePublicationQueueRepository.ts",
  "src/platform/persistence/supabase/SupabaseScheduledPublicationRepository.ts",
  "src/features/admin/editorial/EditorialAdminWorkspace.tsx",
  "src/styles/editorial-admin.css",
  "supabase/migrations/20260715210000_pm2b_editorial_persistence.sql",
];

const requiredMigrationFragments = [
  "create table if not exists public.editorial_record_versions",
  "create table if not exists public.editorial_record_heads",
  "create table if not exists public.editorial_audit_events",
  "create table if not exists public.publication_queue",
  "create table if not exists public.scheduled_publications",
  "create or replace function public.commit_editorial_version",
  "enable row level security",
  "grant execute on function public.commit_editorial_version",
];

const forbiddenClientFragments = [
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
];

async function fileExists(relativePath) {
  try {
    await access(
      resolve(root, relativePath),
      constants.R_OK,
    );
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(
    resolve(root, relativePath),
    "utf8",
  );
}

async function main() {
  const failures = [];

  for (const relativePath of requiredFiles) {
    if (!(await fileExists(relativePath))) {
      failures.push(
        `Missing required file: ${relativePath}`,
      );
    }
  }

  const migrationPath =
    "supabase/migrations/20260715210000_pm2b_editorial_persistence.sql";

  if (await fileExists(migrationPath)) {
    const migration = (
      await read(migrationPath)
    ).toLowerCase();

    for (
      const fragment of requiredMigrationFragments
    ) {
      if (
        !migration.includes(
          fragment.toLowerCase(),
        )
      ) {
        failures.push(
          `Migration is missing: ${fragment}`,
        );
      }
    }
  }

  const sourceFilesToCheck = [
    "src/platform/persistence/supabase/SupabaseEditorialRepository.ts",
    "src/platform/persistence/supabase/SupabasePublicationQueueRepository.ts",
    "src/platform/persistence/supabase/SupabaseScheduledPublicationRepository.ts",
  ];

  for (
    const relativePath of sourceFilesToCheck
  ) {
    if (!(await fileExists(relativePath))) {
      continue;
    }

    const source = await read(relativePath);

    if (
      /constructor\s*\(\s*(private|public|protected)\s+readonly/.test(
        source,
      )
    ) {
      failures.push(
        `${relativePath} uses constructor parameter properties, which are incompatible with erasableSyntaxOnly.`,
      );
    }

    for (
      const fragment of forbiddenClientFragments
    ) {
      if (source.includes(fragment)) {
        failures.push(
          `${relativePath} references forbidden client-side secret variable ${fragment}.`,
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error(
      "\nPM2B validation failed:\n",
    );

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    "PM2B structural validation passed.",
  );
  console.log(
    `Verified ${requiredFiles.length} required files.`,
  );
  console.log(
    "Verified migration tables, function, RLS and service-role execution grant.",
  );
  console.log(
    "Verified Supabase repositories are compatible with erasableSyntaxOnly.",
  );
}

await main();
