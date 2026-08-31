import { createHash } from 'node:crypto';

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
  roster: AllianceRosterMember[];
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

const LOCAL_FINGERPRINT_FIELDS = new Set([
  'bindingId', 'refreshId', 'observedAt', 'providerFetchedAt', 'providerCachedAt',
  'providerAgeSeconds', 'contentSha256', 'refreshEnvelopeSha256',
]);

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
  return null;
}

function compareCanonicalJson(left: AllianceRosterMember, right: AllianceRosterMember): number {
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  return leftJson < rightJson ? -1 : leftJson > rightJson ? 1 : 0;
}

export function observationFingerprint(input: AllianceObservationInput): string {
  const providerFacts = Object.fromEntries(Object.entries(input)
    .filter(([key]) => !LOCAL_FINGERPRINT_FIELDS.has(key) && key !== 'roster')
    .map(([key, value]) => [key, canonicalize(value)]));
  const roster = [...input.roster]
    .map((member) => canonicalize(member) as AllianceRosterMember)
    .sort(compareCanonicalJson);
  const stable = JSON.stringify(canonicalize({ ...providerFacts, roster }));
  return createHash('sha256').update(stable, 'utf8').digest('hex');
}

export function refreshEnvelopeFingerprint(input: AllianceObservationInput): string {
  const envelope = {
    contentSha256: observationFingerprint(input),
    providerFresh: input.providerFresh,
    infoFresh: input.infoFresh,
    rosterFresh: input.rosterFresh,
    providerCachedAt: input.providerCachedAt ?? null,
    providerAgeSeconds: input.providerAgeSeconds ?? null,
    providerFetchedAt: input.providerFetchedAt,
    observedAt: input.observedAt,
  };
  return createHash('sha256').update(JSON.stringify(canonicalize(envelope)), 'utf8').digest('hex');
}

export function validateWholeRoster(input: AllianceObservationInput, existingPlayerAccountIds: ReadonlySet<string>): void {
  if (input.memberCount !== undefined && input.memberCount !== null && input.memberCount !== input.roster.length) throw new Error('member count does not match roster');
  if (input.providerFresh === true && input.freshnessShape === 'sectioned' && (input.infoFresh !== true || input.rosterFresh !== true)) {
    throw new Error('sectioned freshness cannot be fresh without both sections');
  }
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
    if (member.lastActiveValue !== undefined && member.lastActiveValue !== null && ((typeof member.lastActiveValue !== 'string' && typeof member.lastActiveValue !== 'number' && typeof member.lastActiveValue !== 'boolean') || (typeof member.lastActiveValue === 'number' && !Number.isFinite(member.lastActiveValue)))) throw new Error('invalid last-active value');
    if (member.playerAccountId && !existingPlayerAccountIds.has(member.playerAccountId)) throw new Error('player account must already exist');
    if (member.matchStatus === 'matched' && !member.playerAccountId) throw new Error('matched roster member requires a reference');
    if (member.playerAccountId && member.matchStatus !== 'matched') throw new Error('only matched roster members may carry a reference');
  }
}

export function prepareAllianceObservation(input: AllianceObservationInput, existingPlayerAccountIds: ReadonlySet<string>) {
  validateProviderBindingIdentity({
    provider: input.provider,
    kingdomNumber: input.providerKingdomNumber,
    providerTag: input.providerTag,
    providerAllianceId: input.providerAllianceId,
  });
  validateWholeRoster(input, existingPlayerAccountIds);
  if (input.leaderIdentity !== undefined && input.leaderIdentity !== null && (typeof input.leaderIdentity !== 'string' || input.leaderIdentity.length < 1 || input.leaderIdentity.length > 120 || input.leaderIdentity.trim() !== input.leaderIdentity || containsControlCharacter(input.leaderIdentity))) throw new Error('invalid leader identity');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(input.refreshId)) throw new Error('invalid refresh id');
  return Object.freeze({
    ...input,
    roster: Object.freeze(input.roster.map((member) => Object.freeze({ ...member }))),
    contentSha256: observationFingerprint(input),
    refreshEnvelopeSha256: refreshEnvelopeFingerprint(input),
  });
}

export function serializeAllianceObservationForPersistence(prepared: ReturnType<typeof prepareAllianceObservation>) {
  return Object.freeze({
    p_binding_id: prepared.bindingId,
    p_observation: Object.freeze({
      alliance_name: prepared.allianceName ?? null,
      alliance_power: prepared.alliancePower ?? null,
      member_count: prepared.memberCount ?? null,
      leader_identity: prepared.leaderIdentity ?? null,
      leader_name: prepared.leaderName ?? null,
      flag_reference: prepared.flagReference ?? null,
      power_rank: prepared.powerRank ?? null,
      source: prepared.source ?? 'mightpulse-alliance-provider',
      freshness_shape: prepared.freshnessShape,
      info_fresh: prepared.infoFresh,
      roster_fresh: prepared.rosterFresh,
      provider_fresh: prepared.providerFresh,
      provider_cached_at: prepared.providerCachedAt ?? null,
      provider_age_seconds: prepared.providerAgeSeconds ?? null,
      provider_fetched_at: prepared.providerFetchedAt,
      observed_at: prepared.observedAt,
    }),
    p_roster: Object.freeze(prepared.roster.map((member) => Object.freeze({
      governor_id: member.governorId,
      provider_internal_uid: member.providerInternalUid ?? null,
      provider_fid: member.providerFid ?? null,
      nickname: typeof member.nickname === 'string' ? member.nickname : null,
      power: typeof member.power === 'number' ? member.power : null,
      town_center_level: typeof member.townCenterLevel === 'number' ? member.townCenterLevel : null,
      kills: typeof member.kills === 'number' ? member.kills : null,
      alliance_rank: typeof member.allianceRank === 'number' ? member.allianceRank : null,
      alliance_rank_label: typeof member.allianceRankLabel === 'string' ? member.allianceRankLabel : null,
      kingdom_number: typeof member.kingdomNumber === 'number' ? member.kingdomNumber : null,
      avatar_reference: typeof member.avatarReference === 'string' ? member.avatarReference : null,
      last_active_value: member.lastActiveValue ?? null,
      online: typeof member.online === 'boolean' ? member.online : null,
      player_account_id: member.playerAccountId ?? null,
      match_status: member.matchStatus ?? 'unmatched',
    }))),
    p_refresh_id: prepared.refreshId,
    p_content_sha256: prepared.contentSha256,
    p_refresh_envelope_sha256: prepared.refreshEnvelopeSha256,
  });
}
