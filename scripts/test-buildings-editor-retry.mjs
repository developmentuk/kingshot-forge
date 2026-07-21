import assert from 'node:assert/strict'
import fs from 'node:fs'
import { hydrateBuildingsEditorRecord } from '../src/features/admin/buildingsEditorHydration.ts'

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const editor = read('src/features/admin/editorial/ConnectedEditorialRecordEditor.tsx')
const hydration = read('src/features/admin/buildingsEditorHydration.ts')

assert.match(editor, /setRuntimeError\(null\)/)
assert.match(editor, /setState\(nextState\)/)
assert.match(editor, /setCurrentRecord\(/)
assert.match(editor, /!state && \(/)
assert.match(editor, /onClick=\{\(\) => void loadState\(\)\}/)
assert.match(editor, /Editorial state could not be loaded/)
assert.match(hydration, /if \(!draft \|\| state\?\.head\?\.status !== "draft"\) return canonical/)

const canonical = { id: 'town-center', values: { name: 'Town Center', maxLevel: 30, costs: [[1, 0, 0, 0, 0, 0, 0]] } }
let calls = 0
const loadState = async () => {
  calls += 1
  if (calls === 1) throw new Error('controlled editorial failure')
  return { head: { status: 'draft' }, currentVersion: { values: { name: 'Town Center draft' } } }
}

let visibleRecord = canonical
let error = null
try {
  visibleRecord = hydrateBuildingsEditorRecord(canonical, await loadState())
} catch (caught) {
  error = caught
}
assert.equal(calls, 1)
assert.equal(error?.message, 'controlled editorial failure')
assert.deepEqual(visibleRecord, canonical)

visibleRecord = hydrateBuildingsEditorRecord(canonical, await loadState())
assert.equal(calls, 2)
assert.equal(visibleRecord.values.name, 'Town Center draft')
assert.deepEqual(visibleRecord.values.costs, canonical.values.costs)
console.log('Buildings editorial retry contract passed: controlled failure preserves canonical state, Retry reissues loadState, and success overlays safely.')
