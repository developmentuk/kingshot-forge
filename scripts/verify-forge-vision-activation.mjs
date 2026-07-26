import { readFile } from 'node:fs/promises'
import { verifyVisionActivation } from '../shared/platform/vision/activationVerifier.ts'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/verify-forge-vision-activation.mjs path/to/vision-activation-metadata.json')
  process.exitCode = 2
} else {
  try {
    const metadata = JSON.parse(await readFile(file, 'utf8'))
    const result = verifyVisionActivation(metadata, Boolean(metadata.storageBucket))
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 2
  }
}
