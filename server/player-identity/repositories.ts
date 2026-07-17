import type {
  PlayerIdentityDomainEvent,
  PlayerIdentityOperationResult,
  PlayerIdentityStore,
  PlayerIdentityAggregate,
  PlayerSupportCaseId,
  PlayerSupportCaseSummary,
  PrivatePlayerProjection,
  PublicAliasRecord,
  PublicPlayerAlias,
  PublicPlayerProjection,
  ForgeUserId,
  ReadOnlyLegacyPlayerIdentitySource,
  LegacyPlayerIdentityReport,
} from "../../shared/domains/player-identity/index.js"

export interface InMemoryPlayerIdentityFixture {
  readonly aggregate: PlayerIdentityAggregate
  readonly privateProjection: PrivatePlayerProjection
  readonly publicProjection?: PublicPlayerProjection
}

export class InMemoryPlayerIdentityStore implements PlayerIdentityStore {
  readonly syntheticUnitTestData = true
  readonly events: PlayerIdentityDomainEvent[] = []
  readonly #aggregates = new Map<ForgeUserId, PlayerIdentityAggregate>()
  readonly #privateProjections = new Map<ForgeUserId, PrivatePlayerProjection>()
  readonly #publicProjections = new Map<PublicPlayerAlias, PublicPlayerProjection>()
  readonly #supportCases = new Map<PlayerSupportCaseId, PlayerSupportCaseSummary>()

  constructor(fixtures: readonly InMemoryPlayerIdentityFixture[] = []) {
    for (const fixture of fixtures) {
      this.#aggregates.set(fixture.aggregate.forgeUserId, fixture.aggregate)
      this.#privateProjections.set(fixture.aggregate.forgeUserId, fixture.privateProjection)
      if (fixture.publicProjection) {
        this.#publicProjections.set(fixture.publicProjection.publicAlias, fixture.publicProjection)
      }
    }
  }

  seedSupportCase(supportCase: PlayerSupportCaseSummary): void {
    this.#supportCases.set(supportCase.id, supportCase)
  }

  async readAggregate(forgeUserId: ForgeUserId): Promise<PlayerIdentityAggregate | undefined> {
    return this.#aggregates.get(forgeUserId)
  }

  async readPrivateProjection(forgeUserId: ForgeUserId): Promise<PrivatePlayerProjection | undefined> {
    return this.#privateProjections.get(forgeUserId)
  }

  async readPublicProjection(alias: PublicPlayerAlias): Promise<PublicPlayerProjection | undefined> {
    return this.#publicProjections.get(alias)
  }

  async findAlias(alias: PublicPlayerAlias): Promise<PublicAliasRecord | undefined> {
    for (const aggregate of this.#aggregates.values()) {
      if (aggregate.alias.routingAlias === alias) return aggregate.alias
    }
    return undefined
  }

  async listSupportCases(): Promise<readonly PlayerSupportCaseSummary[]> {
    return [...this.#supportCases.values()]
      .sort((left, right) => right.openedAt.localeCompare(left.openedAt))
  }

  async readSupportCase(caseId: PlayerSupportCaseId): Promise<PlayerSupportCaseSummary | undefined> {
    return this.#supportCases.get(caseId)
  }

  async saveAggregate(input: {
    readonly aggregate: PlayerIdentityAggregate
    readonly expectedRevision: PlayerIdentityAggregate["revision"]
    readonly event: PlayerIdentityDomainEvent
  }): Promise<PlayerIdentityOperationResult<PlayerIdentityAggregate>> {
    const current = this.#aggregates.get(input.aggregate.forgeUserId)
    if (!current || current.revision !== input.expectedRevision) {
      return { ok: false, code: "stale_revision" }
    }
    this.#aggregates.set(input.aggregate.forgeUserId, input.aggregate)
    this.events.push(input.event)
    return { ok: true, value: input.aggregate, revision: input.aggregate.revision }
  }

  async appendAudit(event: PlayerIdentityDomainEvent): Promise<PlayerIdentityOperationResult> {
    this.events.push(event)
    return { ok: true, value: undefined, revision: event.identityRevision }
  }
}

export class DisabledProductionPlayerIdentityStore implements PlayerIdentityStore {
  async readAggregate(): Promise<undefined> { return undefined }
  async readPrivateProjection(): Promise<undefined> { return undefined }
  async readPublicProjection(): Promise<undefined> { return undefined }
  async findAlias(): Promise<undefined> { return undefined }
  async listSupportCases(): Promise<readonly PlayerSupportCaseSummary[]> { return [] }
  async readSupportCase(): Promise<undefined> { return undefined }

  async saveAggregate(): Promise<PlayerIdentityOperationResult<PlayerIdentityAggregate>> {
    return { ok: false, code: "migration_required" }
  }

  async appendAudit(): Promise<PlayerIdentityOperationResult> {
    return { ok: false, code: "persistence_disabled" }
  }
}

export interface LegacyDiscoveryReader {
  readPlayerAccount(forgeUserId: string): Promise<Readonly<Record<string, unknown>> | undefined>
  readPlayerProfile(forgeUserId: string): Promise<Readonly<Record<string, unknown>> | undefined>
  readKingdomMembership(forgeUserId: string): Promise<Readonly<Record<string, unknown>> | undefined>
  readAllianceMembership(forgeUserId: string): Promise<Readonly<Record<string, unknown>> | undefined>
  readPublicView(forgeUserId: string): Promise<Readonly<Record<string, unknown>> | undefined>
}

export class ReadOnlyLegacyDiscoveryAdapter implements ReadOnlyLegacyPlayerIdentitySource {
  constructor(private readonly reader: LegacyDiscoveryReader) {}

  async inspectByForgeUserId(forgeUserId: string): Promise<LegacyPlayerIdentityReport> {
    const [account, profile, kingdom, alliance, publicView] = await Promise.all([
      this.reader.readPlayerAccount(forgeUserId),
      this.reader.readPlayerProfile(forgeUserId),
      this.reader.readKingdomMembership(forgeUserId),
      this.reader.readAllianceMembership(forgeUserId),
      this.reader.readPublicView(forgeUserId),
    ])
    return {
      account: { classification: account ? "legacy" : "unavailable", value: account, reason: "Legacy account is read-only." },
      profile: { classification: profile ? "legacy" : "unavailable", value: profile, reason: "Legacy profile is read-only." },
      kingdomMembership: { classification: kingdom ? "legacy" : "unavailable", value: kingdom, reason: "Membership requires reconciliation." },
      allianceMembership: { classification: alliance ? "unsafe" : "unavailable", reason: "Private notes and authority-like fields are not projected." },
      publicProjection: { classification: publicView ? "unsafe" : "unavailable", reason: "Whole-row legacy public views are not exposed." },
      verification: { classification: "legacy", value: "unverified", reason: "Legacy verified values are not ownership verification." },
      compatibilityIssues: [
        "legacy_one_user_one_character_constraint",
        "incomplete_migration_history",
        "whole_row_public_exposure",
      ],
    }
  }
}
