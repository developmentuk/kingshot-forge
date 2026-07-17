import {
  access,
  readFile,
} from "node:fs/promises"
import {
  constants,
} from "node:fs"
import {
  createHash,
} from "node:crypto"
import {
  resolve,
} from "node:path"
import process from "node:process"

const root = process.cwd()
const requiredFiles = [
  "shared/domains/player-identity/activeCharacter.ts",
  "shared/domains/player-identity/actors.ts",
  "shared/domains/player-identity/contracts.ts",
  "shared/domains/player-identity/events.ts",
  "shared/domains/player-identity/identifiers.ts",
  "shared/domains/player-identity/index.ts",
  "shared/domains/player-identity/ports.ts",
  "shared/domains/player-identity/projections.ts",
  "shared/domains/player-identity/resultCodes.ts",
  "shared/domains/player-identity/validation.ts",
  "shared/domains/player-identity/policies/characterLimitPolicy.ts",
  "shared/domains/player-identity/policies/primaryCharacterPolicy.ts",
  "shared/domains/player-identity/policies/visibilityPolicy.ts",
  "server/player-identity/activeCharacterResolution.ts",
  "server/player-identity/actorResolution.ts",
  "scripts/test-player-identity.mjs",
  "docs/reference/player-identity-schema-discovery.md",
  "docs/reference/player-identity-schema-discovery.sha256",
  "docs/releases/SPRINT_9_3_PLAYER_IDENTITY_FOUNDATION.md",
]
const sourceFiles = requiredFiles.filter(
  (path) => path.startsWith("shared/") || path.startsWith("server/"),
)
const forbiddenRuntimeFragments = [
  "@supabase/",
  "getSupabase",
  "localStorage",
  "sessionStorage",
  "from \"react\"",
  "from 'react'",
  "window.",
]

async function exists(path) {
  try {
    await access(resolve(root, path), constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function main() {
  const failures = []

  for (const path of requiredFiles) {
    if (!(await exists(path))) {
      failures.push(`Missing required Player Identity foundation file: ${path}`)
    }
  }

  for (const path of sourceFiles) {
    if (!(await exists(path))) continue

    const source = await readFile(resolve(root, path), "utf8")

    for (const fragment of forbiddenRuntimeFragments) {
      if (source.includes(fragment)) {
        failures.push(`${path} contains forbidden runtime coupling: ${fragment}`)
      }
    }
  }

  const contractsPath = "shared/domains/player-identity/contracts.ts"

  if (await exists(contractsPath)) {
    const contracts = await readFile(resolve(root, contractsPath), "utf8")
    const publicProjection = contracts.match(
      /export interface PublicPlayerProjection \{([\s\S]*?)\n\}/,
    )?.[1] ?? ""
    const forbiddenPublicFields = [
      "ForgeUserId",
      "GameCharacterId",
      "CharacterLinkId",
      "rawPlayerId",
      "evidenceReference",
    ]

    for (const field of forbiddenPublicFields) {
      if (publicProjection.includes(field)) {
        failures.push(`PublicPlayerProjection exposes forbidden field/type: ${field}`)
      }
    }
  }

  const discoveryPath = "docs/reference/player-identity-schema-discovery.md"
  const discoveryHashPath = "docs/reference/player-identity-schema-discovery.sha256"

  if (await exists(discoveryPath) && await exists(discoveryHashPath)) {
    const discovery = await readFile(resolve(root, discoveryPath))
    const expectedHash = (
      await readFile(resolve(root, discoveryHashPath), "utf8")
    ).trim().split(/\s+/u)[0]
    const actualHash = createHash("sha256").update(discovery).digest("hex")

    if (actualHash !== expectedHash) {
      failures.push("Player Identity schema-discovery integrity receipt is stale.")
    }
  }

  if (failures.length > 0) {
    console.error(failures.join("\n"))
    process.exitCode = 1
    return
  }

  console.log("Player Identity foundation structure validated.")
}

await main()
