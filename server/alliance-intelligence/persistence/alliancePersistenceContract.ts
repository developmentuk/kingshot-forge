import { isPersistableAllianceTimestamp } from '../persistableTimestamp.js';

export type Freshness = boolean | null;

export type AllianceRosterMember = {
  governorId: string;
  providerInternalUid?: string | null;
  providerFid?: string | null;
  playerAccountId?: string | null;
  matchStatus?: 'unmatched' | 'matched' | 'ambiguous' | 'invalid';
  lastActiveValue?: string | number | boolean | null;
  [key: string]: unknown;
};

export type AllianceObservationInput = {
  bindingId: string;
  refreshId: string;
  provider: 'mightpulse';
  providerKingdomNumber: number;
  providerTag: string;
  providerAllianceId: string;
  freshnessShape: 'sectioned' | 'scalar' | 'unknown';
  infoFresh: Freshness;
  rosterFresh: Freshness;
  providerFresh: Freshness;
  providerCachedAt?: string | null;
  providerAgeSeconds?: number | null;
  providerFetchedAt: string;
  observedAt: string;
  source?: string;
  allianceName?: string | null;
  alliancePower?: number | null;
  memberCount?: number | null;
  /** Normalized provider leaderPlayerId (Governor/player ID), not leaderInternalUid. */
  leaderIdentity?: string | null;
  leaderName?: string | null;
  flagReference?: string | null;
  powerRank?: number | null;
  roster: readonly AllianceRosterMember[];
  [key: string]: unknown;
};

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

export function validateProviderBindingIdentity(input: {
  provider: string;
  kingdomNumber: number;
  providerTag: string;
  providerAllianceId: string;
}): void {
  if (typeof input.provider !== 'string' || input.provider !== 'mightpulse') throw new Error('unsupported provider');
  if (!Number.isInteger(input.kingdomNumber) || input.kingdomNumber < 1 || input.kingdomNumber > 9999) {
    throw new Error('invalid provider kingdom');
  }
  if (typeof input.providerTag !== 'string' || input.providerTag.trim() !== input.providerTag || input.providerTag.length < 2 || input.providerTag.length > 12 || containsControlCharacter(input.providerTag)) {
    throw new Error('provider tag must remain raw and untrimmed');
  }
  if (typeof input.providerAllianceId !== 'string' || !input.providerAllianceId || input.providerAllianceId.trim() !== input.providerAllianceId || containsControlCharacter(input.providerAllianceId)) {
    throw new Error('invalid provider aid');
  }
}

export function validateProviderAgeSeconds(value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 2147483647) throw new Error('invalid provider age seconds');
}

function validatePersistableTimestamp(value: unknown, label: string, optional: boolean): void {
  if (value === undefined || value === null) {
    if (optional) return;
    throw new Error(`invalid ${label}`);
  }
  if (!isPersistableAllianceTimestamp(value)) throw new Error(`invalid ${label}`);
}

function validateOptionalSafeInteger(value: unknown, label: string): void {
  if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) throw new Error(`invalid ${label}`);
}

function validateOptionalIntegerRange(value: unknown, label: string, min: number, max: number): void {
  if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)) throw new Error(`invalid ${label}`);
}

function governedObservationFacts(input: AllianceObservationInput) {
  return {
    provider: input.provider,
    providerKingdomNumber: input.providerKingdomNumber,
    providerTag: input.providerTag,
    providerAllianceId: input.providerAllianceId,
    allianceName: input.allianceName ?? null,
    alliancePower: input.alliancePower ?? null,
    memberCount: input.memberCount ?? null,
    leaderIdentity: input.leaderIdentity ?? null,
    leaderName: input.leaderName ?? null,
    flagReference: input.flagReference ?? null,
    powerRank: input.powerRank ?? null,
    source: input.source ?? 'mightpulse-alliance-provider',
    freshnessShape: input.freshnessShape,
    infoFresh: input.infoFresh,
    rosterFresh: input.rosterFresh,
    providerFresh: input.providerFresh,
    roster: [...input.roster]
      .map((member) => ({
        governorId: member.governorId,
        providerInternalUid: member.providerInternalUid ?? null,
        providerFid: member.providerFid ?? null,
        nickname: typeof member.nickname === 'string' ? member.nickname : null,
        power: typeof member.power === 'number' ? member.power : null,
        townCenterLevel: typeof member.townCenterLevel === 'number' ? member.townCenterLevel : null,
        kills: typeof member.kills === 'number' ? member.kills : null,
        allianceRank: typeof member.allianceRank === 'number' ? member.allianceRank : null,
        allianceRankLabel: typeof member.allianceRankLabel === 'string' ? member.allianceRankLabel : null,
        kingdomNumber: typeof member.kingdomNumber === 'number' ? member.kingdomNumber : null,
        avatarReference: typeof member.avatarReference === 'string' ? member.avatarReference : null,
        lastActiveValue: member.lastActiveValue ?? null,
        online: typeof member.online === 'boolean' ? member.online : null,
        playerAccountId: member.playerAccountId ?? null,
        matchStatus: member.matchStatus ?? 'unmatched',
      }))
      .sort((left, right) => left.governorId < right.governorId ? -1 : left.governorId > right.governorId ? 1 : 0),
  };
}

export function validateFreshnessTuple(input: Pick<AllianceObservationInput, 'freshnessShape' | 'infoFresh' | 'rosterFresh' | 'providerFresh'>): void {
  if (input.freshnessShape === 'sectioned') {
    if (typeof input.infoFresh !== 'boolean' || typeof input.rosterFresh !== 'boolean' || typeof input.providerFresh !== 'boolean' || input.providerFresh !== (input.infoFresh && input.rosterFresh)) throw new Error('invalid sectioned freshness tuple');
    return;
  }
  if (input.freshnessShape === 'scalar') {
    if (input.infoFresh !== null || input.rosterFresh !== null || typeof input.providerFresh !== 'boolean') throw new Error('invalid scalar freshness tuple');
    return;
  }
  if (input.freshnessShape === 'unknown') {
    if (input.infoFresh !== null || input.rosterFresh !== null || input.providerFresh !== null) throw new Error('invalid unknown freshness tuple');
    return;
  }
  throw new Error('invalid freshness shape');
}

export function validateWholeRoster(input: AllianceObservationInput, existingPlayerAccountIdByGovernorId: ReadonlyMap<string, string>): void {
  validateFreshnessTuple(input);
  validateOptionalIntegerRange(input.memberCount, 'member count', 0, 2147483647);
  validateOptionalSafeInteger(input.alliancePower, 'alliance power');
  validateOptionalIntegerRange(input.powerRank, 'power rank', 1, 2147483647);
  if (input.memberCount !== undefined && input.memberCount !== null && input.memberCount !== input.roster.length) throw new Error('member count does not match roster');
  const governorIds = new Set<string>();
  const providerUids = new Set<string>();
  const providerFids = new Set<string>();
  for (const member of input.roster) {
    if (typeof member.governorId !== 'string' || !member.governorId || member.governorId.trim() !== member.governorId) throw new Error('invalid governor id');
    if (!member.governorId || governorIds.has(member.governorId)) throw new Error('duplicate or missing governor id');
    governorIds.add(member.governorId);
    if (member.providerInternalUid !== undefined && member.providerInternalUid !== null && (typeof member.providerInternalUid !== 'string' || !member.providerInternalUid || member.providerInternalUid.trim() !== member.providerInternalUid)) throw new Error('invalid provider uid');
    if (member.providerFid !== undefined && member.providerFid !== null && (typeof member.providerFid !== 'string' || !member.providerFid || member.providerFid.trim() !== member.providerFid)) throw new Error('invalid provider fid');
    if (member.providerInternalUid && providerUids.has(member.providerInternalUid)) throw new Error('duplicate provider uid');
    if (member.providerFid && providerFids.has(member.providerFid)) throw new Error('duplicate provider fid');
    if (member.providerInternalUid) providerUids.add(member.providerInternalUid);
    if (member.providerFid) providerFids.add(member.providerFid);
    const townCenterLevel = member.townCenterLevel;
    if (townCenterLevel !== undefined && townCenterLevel !== null && (typeof townCenterLevel !== 'number' || !Number.isInteger(townCenterLevel) || townCenterLevel < 1 || townCenterLevel > 84)) throw new Error('invalid town center level');
    const allianceRank = member.allianceRank;
    if (allianceRank !== undefined && allianceRank !== null && (typeof allianceRank !== 'number' || !Number.isInteger(allianceRank) || allianceRank < 1 || allianceRank > 5)) throw new Error('invalid alliance rank');
    validateOptionalSafeInteger(member.power, 'roster power');
    validateOptionalSafeInteger(member.kills, 'roster kills');
    validateOptionalIntegerRange(member.kingdomNumber, 'roster kingdom', 1, 9999);
    if (member.lastActiveValue !== undefined && member.lastActiveValue !== null && ((typeof member.lastActiveValue !== 'string' && typeof member.lastActiveValue !== 'number' && typeof member.lastActiveValue !== 'boolean') || (typeof member.lastActiveValue === 'number' && !Number.isFinite(member.lastActiveValue)))) throw new Error('invalid last-active value');
    if (member.matchStatus === 'matched' && (!member.playerAccountId || existingPlayerAccountIdByGovernorId.get(member.governorId) !== member.playerAccountId)) throw new Error('matched Player Account does not belong to roster governor');
    if (member.playerAccountId && member.matchStatus !== 'matched') throw new Error('only matched roster members may carry a reference');
  }
}

export function prepareAllianceObservation(input: AllianceObservationInput, existingPlayerAccountIdByGovernorId: ReadonlyMap<string, string>) {
  validatePersistableTimestamp(input.providerFetchedAt, 'provider fetched timestamp', false);
  validatePersistableTimestamp(input.observedAt, 'observed timestamp', false);
  validatePersistableTimestamp(input.providerCachedAt, 'provider cached timestamp', true);
  validateProviderAgeSeconds(input.providerAgeSeconds);
  validateProviderBindingIdentity({
    provider: input.provider,
    kingdomNumber: input.providerKingdomNumber,
    providerTag: input.providerTag,
    providerAllianceId: input.providerAllianceId,
  });
  validateWholeRoster(input, existingPlayerAccountIdByGovernorId);
  if (input.leaderIdentity !== undefined && input.leaderIdentity !== null && (typeof input.leaderIdentity !== 'string' || input.leaderIdentity.length < 1 || input.leaderIdentity.length > 120 || input.leaderIdentity.trim() !== input.leaderIdentity || containsControlCharacter(input.leaderIdentity))) throw new Error('invalid leader identity');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(input.refreshId)) throw new Error('invalid refresh id');
  return Object.freeze({
    ...input,
    roster: Object.freeze(input.roster.map((member) => Object.freeze({ ...member }))),
  });
}

export function serializeAllianceObservationForPersistence(prepared: ReturnType<typeof prepareAllianceObservation>) {
  const facts = governedObservationFacts(prepared);
  return Object.freeze({
    p_binding_id: prepared.bindingId,
    p_observation: Object.freeze({
      provider: facts.provider,
      provider_kingdom_number: facts.providerKingdomNumber,
      provider_tag: facts.providerTag,
      provider_alliance_id: facts.providerAllianceId,
      alliance_name: facts.allianceName,
      alliance_power: facts.alliancePower,
      member_count: facts.memberCount,
      leader_identity: facts.leaderIdentity,
      leader_name: facts.leaderName,
      flag_reference: facts.flagReference,
      power_rank: facts.powerRank,
      source: facts.source,
      freshness_shape: facts.freshnessShape,
      info_fresh: facts.infoFresh,
      roster_fresh: facts.rosterFresh,
      provider_fresh: facts.providerFresh,
      provider_cached_at: prepared.providerCachedAt ?? null,
      provider_age_seconds: prepared.providerAgeSeconds ?? null,
      provider_fetched_at: prepared.providerFetchedAt,
      observed_at: prepared.observedAt,
    }),
    p_roster: Object.freeze(facts.roster.map((member) => Object.freeze({
      governor_id: member.governorId,
      provider_internal_uid: member.providerInternalUid,
      provider_fid: member.providerFid,
      nickname: member.nickname,
      power: member.power,
      town_center_level: member.townCenterLevel,
      kills: member.kills,
      alliance_rank: member.allianceRank,
      alliance_rank_label: member.allianceRankLabel,
      kingdom_number: member.kingdomNumber,
      avatar_reference: member.avatarReference,
      last_active_value: member.lastActiveValue,
      online: member.online,
      player_account_id: member.playerAccountId,
      match_status: member.matchStatus,
    }))),
    p_refresh_id: prepared.refreshId,
  });
}
