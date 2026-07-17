export type LegacyValueClassification =
  | "authoritative"
  | "legacy"
  | "inferred"
  | "unsafe"
  | "unavailable"

export interface LegacyMappedValue<Value> {
  readonly classification: LegacyValueClassification
  readonly value?: Value
  readonly reason: string
}

export interface LegacyPlayerIdentityReport {
  readonly account: LegacyMappedValue<Readonly<Record<string, unknown>>>
  readonly profile: LegacyMappedValue<Readonly<Record<string, unknown>>>
  readonly kingdomMembership: LegacyMappedValue<Readonly<Record<string, unknown>>>
  readonly allianceMembership: LegacyMappedValue<Readonly<Record<string, unknown>>>
  readonly publicProjection: LegacyMappedValue<Readonly<Record<string, unknown>>>
  readonly verification: LegacyMappedValue<"unverified">
  readonly compatibilityIssues: readonly string[]
}

export interface ReadOnlyLegacyPlayerIdentitySource {
  inspectByForgeUserId(forgeUserId: string): Promise<LegacyPlayerIdentityReport>
}

export function classifyLegacyVerification(value: unknown): LegacyMappedValue<"unverified"> {
  return {
    classification: value === undefined ? "unavailable" : "legacy",
    value: "unverified",
    reason: "Legacy verification is never promoted to Character Ownership Verification.",
  }
}
