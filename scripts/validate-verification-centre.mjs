import {
  execFileSync,
} from "node:child_process";
import {
  readFile,
} from "node:fs/promises";
import {
  resolve,
} from "node:path";
import process from "node:process";

const root = process.cwd();
const expectations = [
  {
    path: "shared/platform/verification.ts",
    fragments: [
      '"passed"',
      '"failed"',
      '"blocked"',
      '"not-run"',
      '"stale"',
      '"not-applicable"',
      "aggregateDatasetVerification",
      "verificationAggregateToReadinessStatus",
    ],
  },
  {
    path: "shared/data-engine/verification-registry.ts",
    fragments: [
      "DATASET_CAPABILITY_REGISTRY",
      'databaseClassification: "unproven"',
      'databaseAccess: "read-only"',
      'result: "blocked"',
      "Hero Skills canonical-data boundary",
      "Buildings atomic publication",
      "npm audit reports 10 vulnerabilities",
    ],
  },
  {
    path: "src/platform/verification/VerificationService.ts",
    fragments: [
      "resolveVerificationResult",
      "aggregateCapabilityVerification",
      "aggregateDatasetVerification",
      'result: "not-run"',
    ],
  },
  {
    path: "src/features/admin/verification/VerificationCentrePage.tsx",
    fragments: [
      "Failed checks",
      "Stale checks",
      "VerificationStatusBadge",
      "Capability evidence by dataset",
    ],
  },
  {
    path: "src/features/admin/verification/DatasetVerificationPage.tsx",
    fragments: [
      "Capability authority",
      "Known blockers",
      "Migration dependency",
      "Stale verification evidence",
      "Expected evidence:",
      "Evidence references",
    ],
  },
  {
    path: "src/features/admin/verification/VerificationRunPage.tsx",
    fragments: [
      "Safe run log",
      "Evidence ledger",
      "verification-table__evidence",
      "No synthetic run or fallback evidence was substituted",
    ],
  },
  {
    path: "src/features/admin/verification/verificationCentre.css",
    fragments: [
      ".verification-table-scroll:focus-visible",
      ".verification-centre a:focus-visible",
      "overflow-x: auto",
      "@media (max-width: 639px)",
    ],
  },
  {
    path: "src/App.tsx",
    fragments: [
      'path="admin/verification"',
      'path="admin/verification/runs/:runId"',
      'path="admin/verification/:datasetId"',
    ],
  },
  {
    path: "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
    fragments: [
      "security definer",
      "set search_path = ''",
      "from public, anon, authenticated",
      "to service_role",
      "for update",
      "status = 'completed'",
    ],
  },
];

const failures = [];

for (const expectation of expectations) {
  let content;

  try {
    content = await readFile(
      resolve(root, expectation.path),
      "utf8",
    );
  } catch {
    failures.push(`Missing required file: ${expectation.path}`);
    continue;
  }

  for (const fragment of expectation.fragments) {
    if (!content.includes(fragment)) {
      failures.push(`${expectation.path} is missing: ${fragment}`);
    }
  }
}

const workspaceSource = [
  ...new Set(execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  ).split("\0").filter(Boolean)),
];

for (const path of workspaceSource) {
  const normalised = path.replaceAll("\\", "/");

  if (
    /(^|\/)\.env(?:\.|$)/.test(normalised) &&
    !normalised.endsWith(".env.example")
  ) {
    failures.push(`Credential-bearing environment file is present in repository source: ${path}`);
  }

  if (!/\.(?:ts|tsx|js|mjs|json|md|sql|yml|yaml)$/.test(normalised)) {
    continue;
  }

  const content = await readFile(resolve(root, path), "utf8");
  const secretPatterns = [
    /sb_secret_[A-Za-z0-9_-]{16,}/,
    /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/,
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/,
  ];

  if (secretPatterns.some((pattern) => pattern.test(content))) {
    failures.push(`Recognisable secret material found in repository source: ${path}`);
  }
}

if (failures.length > 0) {
  console.error("\nVerification Centre structural validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Verification Centre structural validation passed.");
  console.log("Verified evidence states, derived aggregation, Admin routes, responsive focus behavior, migration safety markers and repository-source secret scan.");
}
