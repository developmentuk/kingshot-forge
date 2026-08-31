import assert from 'node:assert/strict';
import { prepareAllianceObservation } from '../server/alliance-intelligence/persistence/alliancePersistenceContract.ts';

const base = {
  bindingId: 'binding-1', provider: 'mightpulse', providerKingdomNumber: 123,
  providerTag: 'MiXeD', providerAllianceId: 'aid-1', freshnessShape: 'sectioned',
  infoFresh: true, rosterFresh: true, providerFresh: true,
  providerCachedAt: null, providerAgeSeconds: null, providerFetchedAt: '2026-08-31T12:00:00Z',
  observedAt: '2026-08-31T12:00:00Z',
  roster: [{ governorId: 'g-1', providerInternalUid: 'u-1', providerFid: 'f-1', matchStatus: 'unmatched' }],
};

const prepared = prepareAllianceObservation(base, new Set());
assert.equal(prepared.providerTag, 'MiXeD');
assert.equal(prepared.providerFresh, true);
assert.equal(prepared.contentSha256, prepareAllianceObservation({ ...base }, new Set()).contentSha256);
assert.throws(() => prepareAllianceObservation({ ...base, providerTag: ' MiXeD' }, new Set()), /raw and untrimmed/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1' }, { governorId: 'g-1' }] }, new Set()), /duplicate/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', providerInternalUid: 'u-1' }, { governorId: 'g-2', providerInternalUid: 'u-1' }] }, new Set()), /provider uid/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'missing', matchStatus: 'matched' }] }, new Set()), /already exist/);
assert.throws(() => prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'unmatched' }] }, new Set(['existing'])), /only matched/);
assert.throws(() => prepareAllianceObservation({ ...base, providerFresh: true, rosterFresh: null }, new Set()), /both sections/);
assert.equal(prepareAllianceObservation({ ...base, providerFresh: null, infoFresh: null, rosterFresh: null }, new Set()).providerFresh, null);
assert.equal(prepareAllianceObservation({ ...base, providerFresh: false, infoFresh: false, rosterFresh: true }, new Set()).providerFresh, false);
assert.equal(prepareAllianceObservation({ ...base, roster: [{ governorId: 'g-1', playerAccountId: 'existing', matchStatus: 'matched' }] }, new Set(['existing'])).roster[0].playerAccountId, 'existing');

const sql = await (await import('node:fs/promises')).readFile(new URL('../supabase/migrations/20260831150000_mightpulse_001c_b_alliance_persistence.sql', import.meta.url), 'utf8');
for (const required of [
  'alliance_provider_bindings', 'alliance_intelligence_observations', 'alliance_roster_observations',
  'provider_tag = btrim(provider_tag)', 'alliance_provider_bindings_provider_aid_idx',
  'alliance_intelligence_observations_immutable', 'alliance_roster_observations_immutable',
  'validate_alliance_observation_binding', 'alliance_intelligence_observations_binding_guard',
  'force row level security', 'revoke all on table public.alliance_roster_observations from public, anon, authenticated',
  'references public.player_accounts(id)', 'match_status', 'freshness_shape', 'content_sha256',
  'No existing Alliance, membership, Player Account, authority, quota, or public',
]) assert.match(sql, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
assert.doesNotMatch(sql, /public\.alliance_memberships\s+(insert|update|delete)/i);
assert.doesNotMatch(sql, /public\.alliance_admins\s+(insert|update|delete)/i);
assert.doesNotMatch(sql, /create\s+(or replace\s+)?function[^;]+reserve_provider_request/i);
console.log('MIGHTPULSE-001C-B alliance persistence contract tests passed');
