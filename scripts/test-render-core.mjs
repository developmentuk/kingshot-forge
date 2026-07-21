import assert from 'node:assert/strict'
import { createArtifact, inspectPipeline, measureText } from '../src/render-engine/core/index.ts'
const raw = 'A\r\nB\t😀'
const artifact = await createArtifact('raw-bytes', raw)
assert.equal(artifact.text, raw)
assert.equal(artifact.statistics.carriageReturns, 1)
assert.equal(artifact.statistics.lineFeeds, 1)
assert.equal(artifact.statistics.utf16Length, raw.length)
assert.equal(artifact.statistics.codePointCount, Array.from(raw).length)
assert.equal(artifact.statistics.byteLength, new TextEncoder().encode(raw).byteLength)
assert.equal(artifact.sha256.length, 64)
const pipeline = await inspectPipeline({ raw, normalised: 'A\nB    😀', approved: 'A\nB    😀', clipboard: 'A\nB    😀' })
assert.equal(pipeline.stages[0].text, raw)
assert.equal(pipeline.transitions[1].before.text, raw)
assert.ok(pipeline.transitions.some((transition) => transition.differences.length > 0))
assert.deepEqual(measureText('x'), { byteLength: 1, utf16Length: 1, codePointCount: 1, graphemeCount: 1, lineCount: 1, ordinarySpaces: 0, nonBreakingSpaces: 0, ideographicSpaces: 0, tabs: 0, carriageReturns: 0, lineFeeds: 0, whitespaceCount: 0 })
console.log('Render Engine core tests passed: immutable bytes, SHA-256, statistics, transition diffs, and audit shape.')
