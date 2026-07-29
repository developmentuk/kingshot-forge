import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { measureVisibleInk, compareVisibleRows } from './art006-visible-ink.mjs'

const fixtureRoot = path.resolve('fixtures/community-art/adaptive-clipboard')
const candidateRoot = path.resolve(process.env.ART006_CAPTURE_DIR ?? 'artifacts/art006/candidates')
const output = path.resolve(process.env.ART006_METRICS_FILE ?? 'artifacts/art006/visible-ink-report.json')
const passingRoot = path.resolve(process.env.ART006_PASSING_CAPTURE_DIR ?? 'artifacts/art006/baseline-410fa')
const ownerRoot = process.env.ART006_OWNER_EVIDENCE_DIR ? path.resolve(process.env.ART006_OWNER_EVIDENCE_DIR) : null
const productionRoot = process.env.ART006_PRODUCTION_EVIDENCE_DIR ? path.resolve(process.env.ART006_PRODUCTION_EVIDENCE_DIR) : null
const slugs = ['i-have-come-to', 'dont-ask-me', 'ah-ah-oops', 'free-hard-spanking', 'where-is-all-the-good-text-art', 'alliance-coffee-time', 'wow-im-so-cute-expanded']
const fixtures = []
const evidenceNames = {
  'i-have-come-to': { owner: 'i-have-come-to-art006-owner-rereview2-fail.png', production: 'i-have-come-to-production-failing.png' },
  'dont-ask-me': { owner: 'dont-ask-me-art006-owner-rereview2-fail.png', production: 'dont-ask-me-production-failing.png' },
  'ah-ah-oops': { owner: 'ah-ah-oops-art006-owner-rereview2-pass.png', production: 'ah-ah-oops-production-control.png' },
}

for (const slug of slugs) {
  const directory = path.join(fixtureRoot, slug)
  const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
  const source = Buffer.from((await readFile(path.join(directory, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64').toString('utf8')
  const sourceRows = source.split(/\r\n|\r|\n/)
  const referenceFile = metadata.evidence.referenceScreenshot ? path.join(directory, metadata.evidence.referenceScreenshot) : null
  const candidateFile = path.join(candidateRoot, `${slug}-mobile.png`)
  const fixture = { slug, referenceFile, candidateFile }
  try {
    fixture.candidate = await measureVisibleInk(candidateFile, sourceRows)
    if (referenceFile) {
      fixture.reference = await measureVisibleInk(referenceFile, sourceRows)
      fixture.residuals = compareVisibleRows(fixture.reference, fixture.candidate)
      fixture.maximumHorizontalError = Math.max(...fixture.residuals.flatMap((row) => [row.leftError ?? 0, row.rightError ?? 0]))
      if (slug === 'i-have-come-to') {
        fixture.landmarkResiduals = [1, 2, 3, 4].map((sourceRow) => {
          const reference = fixture.reference.rows.find((row) => row.sourceRow === sourceRow)?.landmarks.principalGap
          const candidate = fixture.candidate.rows.find((row) => row.sourceRow === sourceRow)?.landmarks.principalGap
          if (!reference || !candidate) throw new Error(`${slug}/${sourceRow}: principal structural/prose gap unavailable`)
          return {
            sourceRow,
            structuralEndError: Math.abs(reference.normalisedLeft - candidate.normalisedLeft),
            proseStartError: Math.abs(reference.normalisedRight - candidate.normalisedRight),
            reference,
            candidate,
          }
        })
      }
      if (slug === 'dont-ask-me') {
        const referenceBody = fixture.reference.rows.find((row) => row.sourceRow === 5)
        const candidateBody = fixture.candidate.rows.find((row) => row.sourceRow === 5)
        const referenceCaption = fixture.reference.rows.find((row) => row.sourceRow === 8)
        const candidateCaption = fixture.candidate.rows.find((row) => row.sourceRow === 8)
        const centre = (row) => (row.normalised.left + row.normalised.right) / 2
        fixture.captionCentreError = Math.abs(centre(referenceCaption) - centre(candidateCaption))
        fixture.captionBaselineError = Math.abs(referenceCaption.normalised.centreY - candidateCaption.normalised.centreY)
        const referenceDistance = (referenceCaption.top - referenceBody.bottom) / fixture.reference.bubble.height
        const candidateDistance = (candidateCaption.top - candidateBody.bottom) / fixture.candidate.bubble.height
        fixture.bodyToCaption = { reference: referenceDistance, candidate: candidateDistance }
        fixture.bodyToCaptionError = Math.abs(referenceDistance - candidateDistance)
      }
    } else fixture.status = 'source-coordinate regression control; canonical screenshot unavailable'
    if (slug === 'ah-ah-oops') {
      const passingFile = path.join(passingRoot, 'ah-ah-oops-mobile.png')
      await access(passingFile)
      fixture.passingBaseline = await measureVisibleInk(passingFile, sourceRows)
      fixture.passingRegression = compareVisibleRows(fixture.passingBaseline, fixture.candidate)
    }
    const evidence = evidenceNames[slug]
    if (evidence && ownerRoot && productionRoot) {
      try {
        fixture.failed410fa = await measureVisibleInk(path.join(ownerRoot, evidence.owner), sourceRows)
        fixture.art005Production = await measureVisibleInk(path.join(productionRoot, evidence.production), sourceRows)
      } catch (error) {
        fixture.evidenceMeasurementStatus = `raw evidence retained; row matching unavailable: ${error.message}`
      }
    }
  } catch (error) {
    fixture.status = `measurement unavailable: ${error.message}`
  }
  fixtures.push(fixture)
}

const report = {
  generatedAt: new Date().toISOString(),
  method: 'dominant bubble-fill segmentation, connected-component edge rejection, constrained source-row matching; no OCR',
  normalisation: 'bubble width/height',
  fixtures,
}
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Wrote ART-006 visible-ink measurements for ${fixtures.length} fixtures to ${output}.`)
