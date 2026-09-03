import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const migration = await readFile(new URL('../supabase/migrations/20260831150000_mightpulse_001c_b_alliance_persistence.sql', import.meta.url), 'utf8');
const directory = await mkdtemp(join(tmpdir(), 'mightpulse-001c-b-'));
const sqlPath = join(directory, 'persistence.sql');
const fixture = `
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create role service_role;
create role anon;
create role authenticated;
create table public.alliances (id uuid primary key);
create table public.player_accounts (id uuid primary key, player_id text not null);
create function public.gen_random_uuid() returns uuid language sql volatile as $$ select extensions.gen_random_uuid() $$;
${migration}
insert into public.alliances(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.alliance_provider_bindings
  (id, alliance_id, provider, provider_kingdom_number, provider_tag, provider_alliance_id, source, first_seen_at)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'mightpulse', 123, 'MiXeD', 'aid-1', 'fixture', now());

do $$
declare first_id uuid; second_id uuid; first_hash text; second_hash text; first_envelope text; second_envelope text; source_rejected boolean := false;
begin
  select private.persist_mightpulse_alliance_observation(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    jsonb_build_object('provider','mightpulse','provider_kingdom_number',123,'provider_tag','MiXeD','provider_alliance_id','aid-1','source','mightpulse-alliance-provider','freshness_shape','scalar','info_fresh',null,'roster_fresh',null,'provider_fresh',true,'member_count',2,'provider_cached_at',null,'provider_age_seconds',null,'provider_fetched_at','2026-08-31T12:00:00Z','observed_at','2026-08-31T12:00:00Z'),
    jsonb_build_array(jsonb_build_object('governor_id','Å','nickname','É','power',4,'kills',5,'online',true), jsonb_build_object('governor_id','Ä','last_active_value',false,'online',false)),
    '11111111-1111-4111-8111-111111111111') into first_id;
  select content_sha256, refresh_envelope_sha256 into first_hash, first_envelope from public.alliance_intelligence_observations where id = first_id;
  if first_hash is null or first_envelope is null then raise exception 'database fingerprints were not generated'; end if;

  select private.persist_mightpulse_alliance_observation(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    jsonb_build_object('provider','mightpulse','provider_kingdom_number',123,'provider_tag','MiXeD','provider_alliance_id','aid-1','source','mightpulse-alliance-provider','freshness_shape','scalar','info_fresh',null,'roster_fresh',null,'provider_fresh',true,'member_count',2,'provider_cached_at',null,'provider_age_seconds',null,'provider_fetched_at','2026-08-31T12:00:00Z','observed_at','2026-08-31T12:00:00Z'),
    jsonb_build_array(jsonb_build_object('governor_id','Ä','last_active_value',false,'online',false), jsonb_build_object('governor_id','Å','nickname','É','power',4,'kills',5,'online',true)),
    '11111111-1111-4111-8111-111111111111') into second_id;
  if second_id is distinct from first_id then raise exception 'reordered roster was not idempotent'; end if;
  begin
    begin
      perform private.persist_mightpulse_alliance_observation(
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        jsonb_build_object('provider','mightpulse','provider_kingdom_number',123,'provider_tag','MiXeD','provider_alliance_id','aid-1','source',jsonb_build_object('unexpected',true),'freshness_shape','scalar','info_fresh',null,'roster_fresh',null,'provider_fresh',true,'member_count',2,'provider_fetched_at','2026-08-31T12:00:00Z','observed_at','2026-08-31T12:00:00Z'),
        jsonb_build_array(jsonb_build_object('governor_id','Å','nickname','É','power',4,'kills',5,'online',true), jsonb_build_object('governor_id','Ä','last_active_value',false,'online',false)),
        '22222222-2222-4222-8222-222222222222');
    exception when sqlstate '22023' then
      if sqlerrm <> 'Invalid Alliance observation source.' then raise; end if;
      source_rejected := true;
    end;
    if not source_rejected then raise exception 'invalid source was accepted'; end if;
  end;
end $$;
`;
await writeFile(sqlPath, fixture, 'utf8');
try {
  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '-f', sqlPath], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else console.log('MIGHTPULSE-001C-B disposable PostgreSQL persistence tests passed');
} finally {
  await rm(directory, { recursive: true, force: true });
}
