import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } })
const { certifyRelease } = await vite.ssrLoadModule('/shared/data-pipeline/releaseCertification.ts')
const { warningId, sortedUniqueWarningIds } = await vite.ssrLoadModule('/shared/data-pipeline/warningIdentity.ts')

const first = { dataset: 'buildings', code: 'unresolved_prerequisite', sheet: 'buildings_import', row: 7, record_id: 'town-center:5', building_key: 'town-center', source_text: 'Hero Hall Lv. 1', parsed_name: 'Hero Hall', required_level: 1, required_stage: null }
const second = { ...first, source_text: 'House 3 Lv. 3', parsed_name: 'House 3', required_level: 3 }
assert.notEqual(warningId(first), warningId(second), 'distinct warnings on one source row must retain distinct identities')
assert.equal(sortedUniqueWarningIds([warningId(first), warningId(second)]).length, 2)

const ids = [warningId(first), warningId(second)]
const pass = certifyRelease({ validationIds: ids, storedIds: ids, reviewIds: ids, publicationIds: ids, auditIds: ids, importRunIds: ['cc925b58-ac6e-4776-875a-1021067118c4'], relationshipIds: [], searchRefreshIds: [], rollbackIds: [], publicationVersion: null })
assert.equal(pass.status, 'PASS')
assert.deepEqual(pass.checks, { validationStored: true, storedReview: true, reviewPublication: true, publicationAudit: true })

for (const stage of ['storedIds', 'reviewIds', 'publicationIds', 'auditIds']) {
  const failing = { validationIds: ids, storedIds: ids, reviewIds: ids, publicationIds: ids, auditIds: ids, importRunIds: [], relationshipIds: [], searchRefreshIds: [], rollbackIds: [], publicationVersion: null }
  failing[stage] = ids.slice(0, 1)
  assert.equal(certifyRelease(failing).status, 'FAIL', `${stage} mismatch must fail certification`)
}

console.log('publication integrity tests passed')
await vite.close()
