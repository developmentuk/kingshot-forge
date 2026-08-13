import assert from 'node:assert/strict'
import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const packageLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
const releaseSource = fs.readFileSync(new URL('../src/config/release.ts', import.meta.url), 'utf8')
const homeSource = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
const roadmapSource = fs.readFileSync(new URL('../src/pages/RoadmapPage.tsx', import.meta.url), 'utf8')

assert.equal(packageJson.version, '1.1.0', 'the candidate package version must be 1.1.0')
assert.equal(packageLock.version, packageJson.version, 'package-lock top-level version must match package.json')
assert.equal(packageLock.packages?.['']?.version, packageJson.version, 'package-lock root package version must match package.json')
assert.equal(packageJson.dependencies?.['react-router'], undefined, 'the unused direct react-router dependency must stay removed')
assert.equal(packageJson.dependencies?.['react-router-dom'], '^7.18.2', 'react-router-dom must remain on the patched 7.18.2 line')
assert.equal(packageJson.dependencies?.xlsx, 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz', 'SheetJS must use the pinned official 0.20.3 distribution')
assert.match(releaseSource, /`Version \$\{APP_VERSION\}`/, 'production release display must derive from package metadata')
assert.match(homeSource, /Version \{APP_VERSION\}/, 'the homepage release identity must derive from package metadata')
assert.match(roadmapSource, /Version \{APP_VERSION\}/, 'the player-facing roadmap identity must derive from package metadata')

console.log('OPS-REBASE-001 release identity and dependency contracts passed.')
