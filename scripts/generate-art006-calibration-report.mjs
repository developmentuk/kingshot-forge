import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { ADAPTIVE_CLIPBOARD_CALIBRATION, analyseClipboardDocument } from '../src/render-engine/adaptiveCalibration.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'

const slugs = ['i-have-come-to', 'dont-ask-me', 'ah-ah-oops', 'free-hard-spanking', 'where-is-all-the-good-text-art', 'alliance-coffee-time', 'wow-im-so-cute-expanded']
const visible = JSON.parse(await readFile('artifacts/art006/visible-ink-report.json', 'utf8'))
const fixtures = []

for (const slug of slugs) {
  const directory = `fixtures/community-art/adaptive-clipboard/${slug}`
  const metadata = JSON.parse(await readFile(`${directory}/metadata.json`, 'utf8'))
  const bytes = Buffer.from((await readFile(`${directory}/${metadata.source.filename}`, 'utf8')).replace(/\s/g, ''), 'base64')
  const lines = bytes.toString('utf8').split(/\r\n|\r|\n/)
  const layout = analyseClipboardDocument(lines, 'kingshot-clipboard')
  const grid = buildFixedCellGrid(lines, undefined, 'kingshot-clipboard')
  const measurement = visible.fixtures.find((fixture) => fixture.slug === slug)
  fixtures.push({
    slug,
    source: {
      sha256: createHash('sha256').update(bytes).digest('hex'),
      utf8ByteLength: bytes.byteLength,
      lineCount: lines.length,
      exact: createHash('sha256').update(bytes).digest('hex') === metadata.source.sha256 && bytes.byteLength === metadata.source.utf8ByteLength && lines.length === metadata.source.lineCount,
    },
    profile: layout.rows[0]?.sourceProfile,
    horizontalOffsetCells: layout.rows[0]?.horizontalOffsetCells,
    maximumLogicalWidth: Math.max(...grid.map((row) => row.cells.reduce((width, cell) => width + cell.span, 0))),
    maximumSemanticGapDistortion: Math.max(...layout.rows.map((row) => row.semanticGapDistortion ?? 1)),
    visibleResidual: measurement?.maximumHorizontalError ?? null,
    visibleStatus: measurement?.status ?? 'canonical comparison measured',
  })
}

const report = {
  generatedAt: new Date().toISOString(),
  objective: 'constrained shared-coefficient fit minimising bubble-normalised visible-ink landmark error while preserving accepted controls and exact source provenance',
  penalties: {
    fixtureSpecificParameters: 'forbidden',
    sourceOrderMutation: 'forbidden',
    semanticGapDistortionAbove: ADAPTIVE_CLIPBOARD_CALIBRATION.maximumSemanticGapDistortion,
    acceptedEmojiControlRegression: 'forbidden',
  },
  coefficients: ADAPTIVE_CLIPBOARD_CALIBRATION,
  baseline: {
    sha: '410fa374928bbb8d87dfd62dc5b1d30fb32b8fa5',
    invalidAssumptions: ['ART-005 equality outside semantic gaps', 'max-left-bound shared prose anchor', 'logical cells as a proxy for visible ink'],
  },
  fixtures,
}
await writeFile('artifacts/art006/calibration-report.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(`Wrote ART-006 coefficient and seven-fixture trade-off report for ${fixtures.length} fixtures.`)
