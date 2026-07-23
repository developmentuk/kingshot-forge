import type { VisionExtractorPlugin } from '../../../shared/platform/vision/contracts.js'
import { assertExtractorManifest } from '../../../shared/platform/vision/contracts.js'

export class VisionExtractorRegistry {
  readonly #plugins = new Map<string, VisionExtractorPlugin>()

  register(plugin: VisionExtractorPlugin): void {
    assertExtractorManifest(plugin.manifest)
    if (this.#plugins.has(plugin.manifest.pluginKey)) {
      throw new Error(`Forge Vision extractor ${plugin.manifest.pluginKey} is already registered.`)
    }
    this.#plugins.set(plugin.manifest.pluginKey, plugin)
  }

  get(pluginKey: string): VisionExtractorPlugin {
    const plugin = this.#plugins.get(pluginKey)
    if (!plugin) throw new Error(`Forge Vision extractor ${pluginKey} is not registered.`)
    return plugin
  }

  list(): VisionExtractorPlugin[] {
    return [...this.#plugins.values()].sort((left, right) => left.manifest.pluginKey.localeCompare(right.manifest.pluginKey))
  }
}
