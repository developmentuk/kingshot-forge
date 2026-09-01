import assert from 'node:assert/strict';
import { observationFingerprint, prepareAllianceObservation, refreshEnvelopeFingerprint, serializeAllianceObservationForPersistence, validateFreshnessTuple, validateProviderAgeSeconds } from '../server/alliance-intelligence/persistence/alliancePersistenceContract.ts';

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
assert.deepEqual(serializeAllianceObservationForPersistence(prepared).p_observation, {
  provider: 'mightpulse', provider_kingdom_number: 123, provider_tag: 'MiXeD', provider_alliance_id: 'aid-1',
  alliance_name: 'Alliance', alliance_power: 42, member_count: 1, leader_identity: '125500337', leader_name: 'Leader',
  flag_reference: 'flag-1', power_rank: 1, source: 'test-source', freshness_shape: 'sectioned', info_fresh: true,
  roster_fresh: true, provider_fresh: true, provider_cached_at: null, provider_age_seconds: null,
  provider_fetched_at: '2026-08-31T12:00:00Z', observed_at: '2026-08-31T12:00:00Z',
});
assert.equal(observationFingerprint({ ...base, observedAt: '2026-08-31T13:00:00Z', providerFetchedAt: '2026-08-31T13:01:00Z' }), observationFingerprint(base));
assert.equal(observationFingerprint({ ...base, roster: [...base.roster].reverse() }), observationFingerprint(base));
assert.equal(observationFingerprint({ ...base, traceId: 'trace-a', debugMetadata: { attempt: 1 } }), observationFingerprint({ ...base, traceId: 'trace-b', debugMetadata: { attempt: 2 } }));
assert.equal(observationFingerprint({ ...base, roster: [{ ...base.roster[0], requestDiagnostic: 'a' }] }), observationFingerprint({ ...base, roster: [{ ...base.roster[0], requestDiagnostic: 'b' }] }));
assert.equal(observationFingerprint({ ...base, source: undefined }), observationFingerprint({ ...base, source: 'mightpulse-alliance-provider' }));
assert.equal(observationFingerprint({ ...base, roster: [{ ...base.roster[0], matchStatus: undefined }] }), observationFingerprint({ ...base, roster: [{ ...base.roster[0], matchStatus: 'unmatched' }] }));
assert.equal(observationFingerprint({ ...base, refreshId: '22222222-2222-4222-8222-222222222222' }), observationFingerprint(base));
assert.notEqual(refreshEnvelopeFingerprint({ ...base, observedAt: '2026-08-31T13:00:00Z' }), refreshEnvelopeFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, allianceName: 'Changed Alliance' }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, roster: [{ ...base.roster[0], power: 999 }] }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, providerTag: 'MIXED' }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, provider: 'other' }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, providerKingdomNumber: 124 }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, providerAllianceId: 'aid-2' }), observationFingerprint(base));
assert.notEqual(observationFingerprint({ ...base, roster: [{ ...base.roster[0], playerAccountId: '11111111-1111-4111-8111-111111111111', matchStatus: 'matched' }] }), observationFingerprint(base));
for (const level of [1, 30, 31, 35, 84]) assert.doesNotThrow(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], townCenterLevel: level }] }, new Set()));
for (const level of [0, 85]) assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], townCenterLevel: level }] }, new Set()), /town center/);
for (const rank of [1, 2, 3, 4, 5]) assert.doesNotThrow(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], allianceRank: rank }] }, new Set()));
for (const rank of [0, 6, 'R4']) assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], allianceRank: rank }] }, new Set()), /alliance rank/);
assert.throws(() => prepareAllianceObservation({ ...base, providerTag: ' MiXeD' }, new Set()), /raw and untrimmed/);
assert.throws(() => prepareAllianceObservation({ ...base, memberCount: 2, roster: [{ governorId: 'g-1' }, { governorId: 'g-1' }] }, new Set()), /duplicate/);
assert.throws(() => prepareAllianceObservation({ ...base, memberCount: 2, roster: [{ governorId: 'g-1', providerInternalUid: 'u-1' }, { governorId: 'g-2', providerInternalUid: 'u-1' }] }, new Set()), /provider uid/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'missing', matchStatus: 'matched' }] }, new Set()), /already exist/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'unmatched' }] }, new Set(['existing'])), /only matched/);
for (const [infoFresh, rosterFresh, providerFresh] of [[false, false, false], [false, true, false], [true, false, false], [true, true, true]]) {
  assert.doesNotThrow(() => validateFreshnessTuple({ freshnessShape: 'sectioned', infoFresh, rosterFresh, providerFresh }));
  assert.doesNotThrow(() => prepareAllianceObservation({ ...base, infoFresh, rosterFresh, providerFresh }, new Set()));
}
for (const tuple of [[false, false, true], [true, true, false], [true, null, true], [null, null, true]]) assert.throws(() => validateFreshnessTuple({ freshnessShape: 'sectioned', infoFresh: tuple[0], rosterFresh: tuple[1], providerFresh: tuple[2] }), /sectioned freshness/);
for (const providerFresh of [false, true]) assert.doesNotThrow(() => prepareAllianceObservation({ ...base, freshnessShape: 'scalar', infoFresh: null, rosterFresh: null, providerFresh }, new Set()));
for (const tuple of [[true, null, true], [null, false, true], [null, null, null]]) assert.throws(() => validateFreshnessTuple({ freshnessShape: 'scalar', infoFresh: tuple[0], rosterFresh: tuple[1], providerFresh: tuple[2] }), /scalar freshness/);
assert.doesNotThrow(() => prepareAllianceObservation({ ...base, freshnessShape: 'unknown', infoFresh: null, rosterFresh: null, providerFresh: null }, new Set()));
for (const tuple of [[null, null, false], [false, null, null], [null, true, null]]) assert.throws(() => validateFreshnessTuple({ freshnessShape: 'unknown', infoFresh: tuple[0], rosterFresh: tuple[1], providerFresh: tuple[2] }), /unknown freshness/);
assert.equal(prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'matched' }] }, new Set(['existing'])).roster[0].playerAccountId, 'existing');
assert.doesNotThrow(() => prepareAllianceObservation({ ...base, memberCount: 1 }, new Set()));
assert.doesNotThrow(() => prepareAllianceObservation({ ...base, memberCount: 0, roster: [] }, new Set()));
assert.doesNotThrow(() => prepareAllianceObservation({ ...base, memberCount: null }, new Set()));
assert.throws(() => prepareAllianceObservation({ ...base, memberCount: 2, roster: [] }, new Set()), /member count/);
assert.throws(() => prepareAllianceObservation({ ...base, memberCount: 0, roster: [{ ...base.roster[0] }] }, new Set()), /member count/);
for (const [memberCount, rosterLength] of [[2, 2], [0, 0]]) {
  assert.doesNotThrow(() => prepareAllianceObservation({ ...base, memberCount, roster: Array.from({ length: rosterLength }, (_, index) => ({ ...base.roster[0], governorId: `g-${index + 1}`, providerInternalUid: `u-${index + 1}`, providerFid: `f-${index + 1}` })) }, new Set()));
}
assert.doesNotThrow(() => prepareAllianceObservation({ ...base, memberCount: null, roster: [{ ...base.roster[0] }, { ...base.roster[0], governorId: 'g-2', providerInternalUid: 'u-2', providerFid: 'f-2' }] }, new Set()));
for (const [memberCount, rosterLength] of [[2, 1], [1, 2]]) {
  assert.throws(() => prepareAllianceObservation({ ...base, memberCount, roster: Array.from({ length: rosterLength }, (_, index) => ({ ...base.roster[0], governorId: `g-${index + 1}`, providerInternalUid: `u-${index + 1}`, providerFid: `f-${index + 1}` })) }, new Set()), /member count/);
}
const unicodeRoster = [
  { ...base.roster[0], governorId: 'Å' },
  { ...base.roster[0], governorId: 'Ä', providerInternalUid: 'u-2', providerFid: 'f-2' },
  { ...base.roster[0], governorId: 'é', providerInternalUid: 'u-3', providerFid: 'f-3' },
];
assert.equal(observationFingerprint({ ...base, roster: unicodeRoster }), observationFingerprint({ ...base, roster: [...unicodeRoster].reverse() }));
assert.equal(refreshEnvelopeFingerprint({ ...base, roster: unicodeRoster }), refreshEnvelopeFingerprint({ ...base, roster: [...unicodeRoster].reverse() }));
const persistenceSource = await (await import('node:fs/promises')).readFile(new URL('../server/alliance-intelligence/persistence/alliancePersistenceContract.ts', import.meta.url), 'utf8');
assert.doesNotMatch(persistenceSource, /localeCompare/iu);
for (const value of [null, '2026-08-31', 123, true]) {
  const payload = serializeAllianceObservationForPersistence(prepareAllianceObservation({ ...base, roster: [{ ...base.roster[0], lastActiveValue: value }] }, new Set()));
  assert.equal(payload.p_roster[0].last_active_value, value);
}
assert.equal(serializeAllianceObservationForPersistence(prepared).p_observation.leader_identity, '125500337');
assert.equal(serializeAllianceObservationForPersistence(prepared).p_observation.source, 'test-source');
assert.equal(serializeAllianceObservationForPersistence(prepared).p_roster[0].provider_internal_uid, 'u-1');
for (const age of [undefined, null, 0, 300, 2147483647]) assert.doesNotThrow(() => validateProviderAgeSeconds(age));
for (const age of [0.5, 300.25, -1, 2147483648, Number.NaN, Number.POSITIVE_INFINITY, '300', true, {}]) assert.throws(() => validateProviderAgeSeconds(age), /provider age/);
assert.notEqual(refreshEnvelopeFingerprint({ ...base, providerAgeSeconds: 300 }), refreshEnvelopeFingerprint({ ...base, providerAgeSeconds: 301 }));
assert.equal(observationFingerprint({ ...base, providerAgeSeconds: 300 }), observationFingerprint({ ...base, providerAgeSeconds: 301 }));
const serialized = serializeAllianceObservationForPersistence(prepared);
assert.deepEqual(Object.keys(serialized).sort(), ['p_binding_id', 'p_content_sha256', 'p_observation', 'p_refresh_envelope_sha256', 'p_refresh_id', 'p_roster']);
assert.equal(serialized.p_binding_id, prepared.bindingId);
assert.equal('bindingId' in serialized, false);
assert.equal('providerTag' in serialized.p_observation, false);
assert.equal(serialized.p_refresh_id, prepared.refreshId);
assert.equal(serialized.p_content_sha256, prepared.contentSha256);
assert.equal(serialized.p_refresh_envelope_sha256, prepared.refreshEnvelopeSha256);
assert.equal('extra' in serialized.p_observation, false);
assert.equal('traceId' in serialized.p_observation, false);
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
assert.match(sql, /create unique index alliance_provider_bindings_exact_lookup_idx[\s\S]*?where binding_status = 'active'/i);
assert.doesNotMatch(sql, /create unique index alliance_provider_bindings_exact_lookup_idx\s+on public\.alliance_provider_bindings\s*\([^;]+\);/i);
assert.match(sql, /alliance_provider_bindings_active_alliance_idx[\s\S]*?where binding_status = 'active'/i);
assert.match(sql, /alliance_provider_bindings_provider_aid_idx[\s\S]*?pg_advisory_xact_lock[\s\S]*?provider_alliance_id = new\.provider_alliance_id/i);
assert.match(sql, /lower\(b\.provider_tag\) = lower\(new\.provider_tag\)/i);
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
const rpc = sql.slice(sql.indexOf('create or replace function private.persist_mightpulse_alliance_observation'), sql.indexOf('create or replace function public.reject_alliance_observation_mutation'));
assert.match(rpc, /jsonb_typeof\(p_observation\) is distinct from 'object'[\s\S]*jsonb_typeof\(p_roster\) is distinct from 'array'/i);
assert.doesNotMatch(rpc, /jsonb_typeof\(p_observation\) <> 'object'|jsonb_typeof\(p_roster\) <> 'array'/i);
assert.match(rpc, /select \* into binding[\s\S]*where id = p_binding_id for update/i);
assert.match(rpc, /binding\.binding_status is distinct from 'active'/i);
assert.ok(rpc.indexOf('Inactive Alliance provider binding.') < rpc.indexOf('insert into public.alliance_intelligence_observations'));
assert.match(rpc, /Invalid Alliance freshness tuple\./i);
for (const shape of ['sectioned', 'scalar', 'unknown']) assert.match(rpc, new RegExp(`p_observation->>'freshness_shape'\\s*=\\s*'${shape}'`));
assert.match(sql, /freshness_shape = 'sectioned'[\s\S]*provider_fresh is not distinct from \(info_fresh and roster_fresh\)[\s\S]*freshness_shape = 'scalar'[\s\S]*info_fresh is null[\s\S]*roster_fresh is null[\s\S]*freshness_shape = 'unknown'/i);
for (const field of ['provider', 'provider_kingdom_number', 'provider_tag', 'provider_alliance_id']) {
  assert.match(rpc, new RegExp(`jsonb_typeof\\(p_observation->'${field}'\\)`), `RPC validates ${field} primitive`);
}
assert.match(rpc, /jsonb_typeof\(p_observation->'provider'\) is distinct from 'string'/i);
assert.match(rpc, /jsonb_typeof\(p_observation->'provider_kingdom_number'\) is distinct from 'number'/i);
assert.match(rpc, /p_observation->>'provider' is distinct from binding\.provider/i);
assert.match(rpc, /p_observation->>'provider_kingdom_number'\)::integer is distinct from binding\.provider_kingdom_number/i);
assert.match(rpc, /p_observation->>'provider_tag' is distinct from binding\.provider_tag/i);
assert.match(rpc, /p_observation->>'provider_alliance_id' is distinct from binding\.provider_alliance_id/i);
assert.doesNotMatch(rpc, /p_observation->>'provider(?:_kingdom_number|_tag|_alliance_id)'\s*<>/i, 'provider identity comparisons must not use nullable <> semantics');
const identityGuard = rpc.indexOf('Alliance observation provider identity does not match its selected binding.');
assert.ok(identityGuard < rpc.indexOf('insert into public.alliance_intelligence_observations'), 'binding identity mismatch must fail before parent persistence');
assert.ok(identityGuard < rpc.indexOf('for member in select value from jsonb_array_elements(p_roster)'), 'binding identity mismatch must fail before roster persistence');
assert.match(rpc, /jsonb_typeof\(p_observation->'member_count'\) not in \('null', 'number'\)/i);
assert.match(rpc, /p_observation->>'member_count' is not null[\s\S]*p_observation->>'member_count' !~ '\^\[0-9\]\+\$'[\s\S]*jsonb_array_length\(p_roster\)/i);
const cardinalityGuard = rpc.indexOf("Invalid Alliance member count.");
assert.ok(cardinalityGuard < rpc.indexOf('insert into public.alliance_intelligence_observations'), 'cardinality guard should run before parent persistence');
assert.ok(rpc.includes('jsonb_array_elements(p_roster)'), 'direct RPC path must persist the supplied roster');
assert.match(rpc, /provider_age_seconds[\s\S]*jsonb_typeof\(p_observation->'provider_age_seconds'\) is distinct from 'number'[\s\S]*!~ '\^\[0-9\]\+\$'[\s\S]*2147483647/i);
assert.ok(rpc.indexOf('Invalid Alliance provider age.') < rpc.indexOf('insert into public.alliance_intelligence_observations'), 'provider age validation must precede parent persistence');
assert.match(rpc, /p_observation->>'provider_age_seconds'\)::integer/i);
const ageValidation = rpc.indexOf('Invalid Alliance provider age.');
assert.ok(ageValidation < rpc.indexOf('insert into public.alliance_roster_observations'), 'provider age validation must precede roster persistence');
assert.equal((rpc.match(/\(p_observation->>'provider_age_seconds'\)::integer/g) ?? []).length, 2, 'parent and roster rows reuse the validated integer age');
for (const field of ['kingdom_number', 'avatar_reference', 'online', 'player_account_id', 'match_status']) {
  assert.match(rpc, new RegExp(`member \\? '${field}'`), `RPC checks ${field} presence`);
  assert.match(rpc, new RegExp(`jsonb_typeof\\(member->'${field}'\\)`), `RPC checks ${field} primitive type`);
}
assert.match(rpc, /kingdom_number[\s\S]*trunc\([\s\S]*< 1[\s\S]*> 9999/i);
assert.match(rpc, /player_account_id[\s\S]*!~\*/i);
assert.match(rpc, /match_status[\s\S]*not in \('unmatched', 'matched', 'ambiguous', 'invalid'\)/i);
assert.match(rpc, /coalesce\(member->>'match_status', 'unmatched'\)/i);
const rosterPrimitiveGuard = rpc.indexOf('Invalid Alliance roster member primitive.');
const rosterInsert = rpc.indexOf('insert into public.alliance_roster_observations');
assert.ok(rosterPrimitiveGuard >= 0 && rosterPrimitiveGuard < rosterInsert, 'roster primitive checks must precede roster INSERT');
assert.ok(rpc.indexOf('Invalid Alliance roster member kingdom.') < rosterInsert, 'Kingdom range check must precede roster INSERT');
assert.ok(rpc.indexOf('Invalid Alliance roster member Player Account UUID.') < rosterInsert, 'Player Account UUID check must precede roster INSERT');
assert.ok(rpc.indexOf('Invalid Alliance roster member match status.') < rosterInsert, 'match status check must precede roster INSERT');
assert.doesNotMatch(rpc, /member->>'avatar_reference'\s*::/i, 'avatar_reference must not be cast from text');
assert.match(rpc, /jsonb_typeof\(member\) is distinct from 'object'/i, 'roster member object shape is fail-closed');
assert.match(rpc, /jsonb_typeof\(member->'governor_id'\) is distinct from 'string'/i, 'governor ID type is fail-closed');
console.log('MIGHTPULSE-001C-B alliance persistence contract tests passed');
