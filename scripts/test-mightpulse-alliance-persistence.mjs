import assert from 'node:assert/strict';
import { observationFingerprint, prepareAllianceObservation, refreshEnvelopeFingerprint, serializeAllianceObservationForPersistence } from '../server/alliance-intelligence/persistence/alliancePersistenceContract.ts';

const base = {
  bindingId: 'binding-1', refreshId: '11111111-1111-4111-8111-111111111111', provider: 'mightpulse', providerKingdomNumber: 123,
  providerTag: 'MiXeD', providerAllianceId: 'aid-1', freshnessShape: 'sectioned',
  infoFresh: true, rosterFresh: true, providerFresh: true,
  providerCachedAt: null, providerAgeSeconds: null, providerFetchedAt: '2026-08-31T12:00:00Z',
  observedAt: '2026-08-31T12:00:00Z',
  source: 'test-source', allianceName: 'Alliance', alliancePower: 42, memberCount: 1,
  leaderIdentity: '125500337', leaderName: 'Leader', flagReference: 'flag-1', powerRank: 1,
  roster: [{ governorId: 'g-1', providerInternalUid: 'u-1', providerFid: 'f-1', matchStatus: 'unmatched' }],
};

const prepared = prepareAllianceObservation(base, new Set());
assert.equal(prepared.providerTag, 'MiXeD');
assert.equal(prepared.providerFresh, true);
assert.equal(prepared.contentSha256, prepareAllianceObservation({ ...base }, new Set()).contentSha256);
assert.equal(observationFingerprint({ ...base, observedAt: '2026-08-31T13:00:00Z', providerFetchedAt: '2026-08-31T13:01:00Z' }), observationFingerprint(base));
assert.equal(observationFingerprint({ ...base, roster: [...base.roster].reverse() }), observationFingerprint(base));
assert.equal(observationFingerprint({ ...base, extra: { b: 2, a: 1 } }), observationFingerprint({ ...base, extra: { a: 1, b: 2 } }));
assert.equal(observationFingerprint({ ...base, refreshId: '22222222-2222-4222-8222-222222222222' }), observationFingerprint(base));
assert.notEqual(refreshEnvelopeFingerprint({ ...base, observedAt: '2026-08-31T13:00:00Z' }), refreshEnvelopeFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, allianceName: 'Changed Alliance' }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, roster: [{ ...base.roster[0], power: 999 }] }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, providerTag: 'MIXED' }), observationFingerprint(base));
for (const level of [1, 30, 31, 35, 84]) assert.doesNotThrow(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], townCenterLevel: level }] }, new Set()));
for (const level of [0, 85]) assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], townCenterLevel: level }] }, new Set()), /town center/);
for (const rank of [1, 2, 3, 4, 5]) assert.doesNotThrow(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], allianceRank: rank }] }, new Set()));
for (const rank of [0, 6, 'R4']) assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], allianceRank: rank }] }, new Set()), /alliance rank/);
assert.throws(() => prepareAllianceObservation({ ...base, providerTag: ' MiXeD' }, new Set()), /raw and untrimmed/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1' }, { governorId: 'g-1' }] }, new Set()), /duplicate/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', providerInternalUid: 'u-1' }, { governorId: 'g-2', providerInternalUid: 'u-1' }] }, new Set()), /provider uid/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'missing', matchStatus: 'matched' }] }, new Set()), /already exist/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'unmatched' }] }, new Set(['existing'])), /only matched/);
assert.throws(() => prepareAllianceObservation({ ...base, providerFresh: true, rosterFresh: null }, new Set()), /both sections/);
assert.equal(prepareAllianceObservation({ ...base, providerFresh: null, infoFresh: null, rosterFresh: null }, new Set()).providerFresh, null);
assert.equal(prepareAllianceObservation({ ...base, providerFresh: false, infoFresh: false, rosterFresh: true }, new Set()).providerFresh, false);
assert.equal(prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'matched' }] }, new Set(['existing'])).roster[0].playerAccountId, 'existing');
for (const value of [null, '2026-08-31', 123, true]) {
  const payload = serializeAllianceObservationForPersistence(prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], lastActiveValue: value }] }, new Set()));
  assert.equal(payload.p_roster[0].last_active_value, value);
}
assert.equal(serializeAllianceObservationForPersistence(prepared).p_observation.leader_identity, '125500337');
assert.equal(serializeAllianceObservationForPersistence(prepared).p_observation.source, 'test-source');
assert.equal(serializeAllianceObservationForPersistence(prepared).p_roster[0].provider_internal_uid, 'u-1');
assert.equal('providerTag' in serializeAllianceObservationForPersistence(prepared).p_observation, false);
assert.throws(() => prepareAllianceObservation({ ...base, leaderIdentity: ' bad' }, new Set()), /leader identity/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], lastActiveValue: {} }] }, new Set()), /last-active/);

const sql = await (await import('node:fs/promises')).readFile(new URL('../supabase/migrations/20260831150000_mightpulse_001c_b_alliance_persistence.sql', import.meta.url), 'utf8');
for (const required of [
  'alliance_provider_bindings', 'alliance_intelligence_observations', 'alliance_roster_observations',
  'provider_tag = btrim(provider_tag)', 'alliance_provider_bindings_provider_aid_idx',
  'alliance_intelligence_observations_immutable', 'alliance_roster_observations_immutable',
  'validate_alliance_observation_binding', 'alliance_intelligence_observations_binding_guard',
  'force row level security', 'revoke all on table public.alliance_roster_observations from public, anon, authenticated',
  'references public.player_accounts(id)', 'match_status', 'freshness_shape', 'content_sha256',
  'between 1 and 84', 'alliance_rank integer', 'between 1 and 5',
  'alliance_provider_bindings_identity_guard', 'persist_mightpulse_alliance_observation',
  'provider_alliance_id_collision', 'historical provider identity records',
  'pg_advisory_xact_lock', 'hashtextextended', 'lower(provider_tag)',
  'refresh_id uuid not null', 'refresh_envelope_sha256', 'alliance_intelligence_observations_refresh_idx',
  'refresh identity replay conflicts', 'alliance_intelligence_observations_content_idx',
  'No existing Alliance, membership, Player Account, authority, quota, or public',
  'leader_identity', "case when member ? 'last_active_value'", "jsonb_typeof(member->'last_active_value') not in ('null', 'string', 'number', 'boolean')",
]) assert.match(sql, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
assert.doesNotMatch(sql, /public\.alliance_memberships\s+(insert|update|delete)/i);
assert.doesNotMatch(sql, /public\.alliance_admins\s+(insert|update|delete)/i);
assert.doesNotMatch(sql, /create\s+(or replace\s+)?function[^;]+reserve_provider_request/i);
assert.doesNotMatch(sql, /grant select, insert, update on table public\.alliance_provider_bindings to service_role/i);
const bindingGuard = sql.slice(sql.indexOf('reject_alliance_provider_binding_identity_change'), sql.indexOf('create or replace function public.validate_alliance_observation_binding'));
for (const field of ['alliance_id', 'provider', 'provider_kingdom_number', 'provider_tag', 'provider_alliance_id', 'source', 'first_seen_at', 'created_at']) {
  assert.match(bindingGuard, new RegExp(`new\\.${field}\\s*<>\\s*old\\.${field}`));
}
assert.match(sql, /on conflict \(binding_id, refresh_id\) do nothing returning id/i);
assert.match(sql, /where binding_id = p_binding_id and refresh_id = p_refresh_id[\s\S]*content_sha256 = p_content_sha256[\s\S]*refresh_envelope_sha256 = p_refresh_envelope_sha256/i);
assert.match(sql, /Refresh identity replay conflicts with its persisted envelope/i);
assert.match(sql, /for member in select value from jsonb_array_elements\(p_roster\)/i);
console.log('MIGHTPULSE-001C-B alliance persistence contract tests passed');
