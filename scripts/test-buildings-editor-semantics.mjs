import assert from 'node:assert/strict'
import { getBuildingProgressionCounts } from '../src/features/admin/buildingsProgressionSemantics.ts'

const townCenter = [
  { record_id: 'town-center:0', progression_phase: 'normal', base_level: 0 },
  ...Array.from({ length: 30 }, (_, index) => ({ progression_phase: 'normal', base_level: index + 1 })),
  ...Array.from({ length: 4 }, () => ({ progression_phase: 'pre_truegold', base_level: 30, stage: 0 })),
  ...Array.from({ length: 36 }, (_, index) => ({ progression_phase: 'truegold', base_level: 30, stage: Math.floor(index / 7), truegold_tier: (index % 7) + 1 })),
]
const townCounts = getBuildingProgressionCounts(townCenter)
assert.deepEqual({
  canonicalRecordCount: townCounts.canonicalRecordCount,
  upgradeRowCount: townCounts.upgradeRowCount,
  baseStateCount: townCounts.baseStateCount,
  truegoldStageCount: townCounts.truegoldStageCount,
}, { canonicalRecordCount: 71, upgradeRowCount: 70, baseStateCount: 1, truegoldStageCount: 36 })
assert.equal(townCounts.baseState?.record_id, 'town-center:0')

for (const count of [70, 70, 70, 30, 30, 36]) {
  const rows = Array.from({ length: count }, (_, index) => ({ progression_phase: 'normal', base_level: index + 1 }))
  const result = getBuildingProgressionCounts(rows)
  assert.equal(result.canonicalRecordCount, count)
  assert.equal(result.upgradeRowCount, count)
  assert.equal(result.baseStateCount, 0)
}
console.log('Buildings progression semantics passed: Town Center 71 = 70 upgrades + 1 base state; other counts preserved.')
