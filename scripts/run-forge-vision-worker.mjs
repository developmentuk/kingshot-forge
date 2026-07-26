import { createLocalVisionWorker } from '../server/vision/worker/createLocalVisionWorker.ts'
import { runVisionWorkerStdio } from '../server/vision/worker/stdioWorker.ts'

const worker = createLocalVisionWorker()
await runVisionWorkerStdio(worker)
