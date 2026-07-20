import { readFile, rm, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const projectRef = 'hrvdhjscwitqpwjhnjkm'
const projectUrl = `https://${projectRef}.supabase.co`
const statePath = process.env.FORGE_R4_FIXTURE_STATE ?? '.r4-fixtures.local.json'
const mode = process.argv[2] ?? 'provision'

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable ${name}.`)
  return value
}

function fixtureEmail(key) {
  return `forge-r4-${key}@kingshot-forge.test`
}

const fixtureDefinitions = [
  { key: 'player', label: 'Player / authenticated no elevated capability', roles: ['viewer'] },
  { key: 'contributor-creator', label: 'Contributor / Content Creator multi-role', roles: ['contributor', 'content_creator'] },
  { key: 'moderator', label: 'Moderator', roles: ['moderator'] },
  { key: 'admin-operations', label: 'Admin / Operations', roles: ['admin'] },
]

async function loadState() {
  try { return JSON.parse(await readFile(statePath, 'utf8')) } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function checkProject() {
  const url = required('SUPABASE_URL').replace(/\/$/u, '')
  if (url !== projectUrl) throw new Error(`Refusing unexpected Supabase project: ${url}`)
  return { url, key: required('SUPABASE_SERVICE_ROLE_KEY') }
}

async function provision() {
  if (await loadState()) throw new Error(`Fixture state already exists at ${statePath}; run cleanup first.`)
  const { url, key } = checkProject()
  const redirectTo = required('FORGE_R4_REDIRECT_URL')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const created = []
  const state = { projectRef, purpose: 'Sprint R4 authenticated runtime validation', users: [], applications: [], artSubmissions: [] }

  try {
    for (const definition of fixtureDefinitions) {
      const email = fixtureEmail(definition.key)
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: required('FORGE_R4_FIXTURE_PASSWORD'),
        email_confirm: true,
        user_metadata: { forge_fixture: 'r4', fixture_key: definition.key, fixture_label: definition.label },
      })
      if (error || !data.user) throw error ?? new Error(`Unable to create ${definition.key} fixture.`)
      const userId = data.user.id
      created.push(userId)
      const { error: clearRolesError } = await admin.from('forge_user_role_assignments').delete().eq('user_id', userId)
      if (clearRolesError) throw clearRolesError
      const { error: roleError } = await admin.from('forge_user_role_assignments').insert(definition.roles.map((role) => ({
        user_id: userId,
        role,
        grant_reason: `Sprint R4 isolated test fixture: ${definition.label}.`,
        active: true,
      })))
      if (roleError) throw roleError
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } })
      if (linkError || !linkData.properties?.action_link) throw linkError ?? new Error(`Unable to generate action link for ${definition.key}.`)
      state.users.push({ key: definition.key, id: userId, email, roles: definition.roles, actionLink: linkData.properties.action_link })
    }

    const contributor = state.users.find((user) => user.key === 'contributor-creator')
    const moderator = state.users.find((user) => user.key === 'moderator')
    if (!contributor || !moderator) throw new Error('Required fixture identities were not created.')

    const { data: application, error: applicationError } = await admin.from('forge_contributor_applications').insert({
      applicant_user_id: contributor.id,
      primary_role_key: 'programmer',
      additional_role_keys: ['general-contributor'],
      status: 'submitted',
      display_name: '[R4 FIXTURE] Contributor application',
      discord_username: 'r4-fixture',
      timezone: 'Europe/London',
      kingdom: '9999',
      experience_summary: 'Reversible Sprint R4 validation record.',
      motivation: 'Validate authenticated contributor application boundaries.',
      relevant_skills: 'Runtime validation and documentation.',
      portfolio_links: [],
      availability_summary: 'Temporary validation only.',
      confirmation_unpaid: true,
      confirmation_age_18: true,
      confirmation_conduct: true,
      confirmation_privacy: true,
      submitted_at: new Date().toISOString(),
    }).select('id').single()
    if (applicationError || !application) throw applicationError ?? new Error('Unable to create application fixture.')
    state.applications.push({ id: application.id, applicantUserId: contributor.id })
    const { error: eventError } = await admin.from('forge_contributor_application_events').insert({
      application_id: application.id,
      actor_user_id: contributor.id,
      action: 'r4_fixture_created',
      previous_status: 'draft',
      new_status: 'submitted',
      reason: 'Sprint R4 isolated test fixture.',
      safe_metadata: { forge_fixture: 'r4' },
    })
    if (eventError) throw eventError

    const artworkText = ' /\\_/\\\n( o.o )\n > ^ <'
    const { data: art, error: artError } = await admin.from('community_art_submissions').insert({
      user_id: contributor.id,
      title: '[R4 FIXTURE] Community Art moderation record',
      description: 'Reversible Sprint R4 moderation validation record.',
      category: 'Cats',
      tags: ['r4-fixture'],
      artwork_text: artworkText,
      attribution_type: 'custom',
      attribution_name: 'R4 Fixture Contributor',
      ownership_confirmed: true,
      guidelines_confirmed: true,
      status: 'pending',
      compatibility_status: 'untested',
    }).select('id').single()
    if (artError || !art) throw artError ?? new Error('Unable to create community art fixture.')
    state.artSubmissions.push({ id: art.id, submitterUserId: contributor.id, moderatorUserId: moderator.id })

    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    console.log(`Provisioned ${state.users.length} R4 users, ${state.applications.length} application, and ${state.artSubmissions.length} art submission.`)
    console.log(`Private fixture state written to ${statePath}. No credentials or links were logged.`)
  } catch (error) {
    for (const userId of created.reverse()) await admin.auth.admin.deleteUser(userId)
    throw error
  }
}

async function cleanup() {
  const { url, key } = checkProject()
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const savedState = await loadState()
  const state = savedState ?? { users: [], applications: [], artSubmissions: [] }
  if (!savedState) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    state.users = (data.users ?? [])
      .filter((user) => user.user_metadata?.forge_fixture === 'r4')
      .map((user) => ({ id: user.id }))
    await admin.from('community_art_submissions').delete().like('title', '[R4 FIXTURE]%')
    await admin.from('forge_contributor_applications').delete().like('display_name', '[R4 FIXTURE]%')
  }
  for (const item of state.artSubmissions ?? []) await admin.from('community_art_submissions').delete().eq('id', item.id)
  for (const item of state.applications ?? []) await admin.from('forge_contributor_applications').delete().eq('id', item.id)
  for (const user of [...(state.users ?? [])].reverse()) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error && error.status !== 404) throw error
  }
  await rm(statePath, { force: true })
  console.log(`Cleaned up ${state.users?.length ?? 0} R4 users and labelled records.`)
}

async function refreshLinks() {
  const state = await loadState()
  if (!state) throw new Error(`No fixture state found at ${statePath}.`)
  const { url, key } = checkProject()
  const redirectTo = required('FORGE_R4_REDIRECT_URL')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  for (const user of state.users) {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: user.email, options: { redirectTo } })
    if (error || !data.properties?.action_link) throw error ?? new Error(`Unable to refresh action link for ${user.key}.`)
    user.actionLink = data.properties.action_link
  }
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  console.log(`Refreshed private action links for ${state.users.length} R4 users. Links were not logged.`)
}

if (!['provision', 'cleanup', 'refresh-links'].includes(mode)) throw new Error('Usage: provision, refresh-links, or cleanup.')
if (mode === 'provision') await provision()
else if (mode === 'refresh-links') await refreshLinks()
else await cleanup()
