import { VisionExtractorRegistry } from '../extractors/registry.js'
import {
  TesseractCliExtractor,
  type TesseractCliExtractorOptions,
} from '../extractors/tesseractCliExtractor.js'
import {
  ImageMagickCliProcessor,
  type ImageMagickCliProcessorOptions,
} from '../imageProcessing/imageMagickCliProcessor.js'
import { VisionWorkerHost } from './visionWorkerHost.js'

export interface LocalVisionWorkerOptions {
  tesseract?: TesseractCliExtractorOptions
  imageMagick?: ImageMagickCliProcessorOptions
  healthTtlMs?: number
  now?: () => Date
}

export function createLocalVisionWorker(options: LocalVisionWorkerOptions = {}): VisionWorkerHost {
  const registry = new VisionExtractorRegistry()
  registry.register(new TesseractCliExtractor(options.tesseract))
  return new VisionWorkerHost({
    registry,
    imageProcessor: new ImageMagickCliProcessor(options.imageMagick),
    healthTtlMs: options.healthTtlMs,
    now: options.now,
  })
}
