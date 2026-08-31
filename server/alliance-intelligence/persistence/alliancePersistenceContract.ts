import { createHash } from 'node:crypto';

export type Freshness = boolean | null;

export type AllianceRosterMember = {
  governorId: string;
  providerInternalUid?: string | null;
  providerFid?: string | null;
  playerAccountId?: string | null;
  matchStatus?: 'unmatched' | 'matched' | 'ambiguous' | 'invalid';
  [key: string]: unknown;
};

export type AllianceObservationInput = {
  bindingId: string;
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
  roster: AllianceRosterMember[];
  [key: string]: unknown;
};

export function validateProviderBindingIdentity(input: {
  provider: string;
  kingdomNumber: number;
  providerTag: string;
  providerAllianceId: string;
}): void {
  if (input.provider !== 'mightpulse') throw new Error('unsupported provider');
  if (!Number.isInteger(input.kingdomNumber) || input.kingdomNumber < 1 || input.kingdomNumber > 9999) {
    throw new Error('invalid provider kingdom');
  }
  if (input.providerTag.trim() !== input.providerTag || input.providerTag.length < 2 || input.providerTag.length > 12) {
    throw new Error('provider tag must remain raw and untrimmed');
  }
  if (!input.providerAllianceId || input.providerAllianceId.trim() !== input.providerAllianceId) {
    throw new Error('invalid provider aid');
  }
}

export function observationFingerprint(input: AllianceObservationInput): string {
  const stable = JSON.stringify({
    ...input,
    roster: [...input.roster].sort((a, b) => a.governorId.localeCompare(b.governorId)),
  });
  return createHash('sha256').update(stable, 'utf8').digest('hex');
}

export function validateWholeRoster(input: AllianceObservationInput, existingPlayerAccountIds: ReadonlySet<string>): void {
  if (input.providerFresh === true && input.freshnessShape === 'sectioned' && (input.infoFresh !== true || input.rosterFresh !== true)) {
    throw new Error('sectioned freshness cannot be fresh without both sections');
  }
  const governorIds = new Set<string>();
  const providerUids = new Set<string>();
  const providerFids = new Set<string>();
  for (const member of input.roster) {
    if (!member.governorId || governorIds.has(member.governorId)) throw new Error('duplicate or missing governor id');
    governorIds.add(member.governorId);
    if (member.providerInternalUid && providerUids.has(member.providerInternalUid)) throw new Error('duplicate provider uid');
    if (member.providerFid && providerFids.has(member.providerFid)) throw new Error('duplicate provider fid');
    if (member.providerInternalUid) providerUids.add(member.providerInternalUid);
    if (member.providerFid) providerFids.add(member.providerFid);
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
  return Object.freeze({
    ...input,
    roster: Object.freeze(input.roster.map((member) => Object.freeze({ ...member }))),
    contentSha256: observationFingerprint(input),
  });
}
