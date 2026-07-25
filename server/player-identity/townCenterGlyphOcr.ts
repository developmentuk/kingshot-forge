import sharp from 'sharp'
import type { VisionPixelBox } from '../../shared/platform/vision/contracts.js'
import type { KingshotProfileRegionConfig } from '../../shared/domains/player-identity/kingshotProfileMapping.js'

export type TownCenterGlyphMask = 'luminance' | 'outline' | 'adaptive_a' | 'adaptive_b'
export type TownCenterGlyphScale = 192 | 256 | 384
export type TownCenterGlyphKernel = 'nearest' | 'lanczos3'

export interface TownCenterGlyphComponent {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly area: number
  readonly centreDistance: number
}

export interface TownCenterGlyphPrepared {
  readonly bytes: Uint8Array
  readonly widthPx: number
  readonly heightPx: number
  readonly sourceRectangle: VisionPixelBox
  readonly mask: TownCenterGlyphMask
  readonly scale: TownCenterGlyphScale
  readonly kernel: TownCenterGlyphKernel
  readonly components: readonly TownCenterGlyphComponent[]
  readonly chosenPsm: 'single_char' | 'single_word'
  readonly warningCodes: readonly string[]
}

const MAX_GLYPH_PIXELS = 384 * 384

export function glyphSourceRectangle(region: KingshotProfileRegionConfig, widthPx: number, heightPx: number): VisionPixelBox {
  return { left: Math.max(0, Math.floor(region.x * widthPx)), top: Math.max(0, Math.floor(region.y * heightPx)), width: Math.max(1, Math.ceil(region.width * widthPx)), height: Math.max(1, Math.ceil(region.height * heightPx)) }
}

export async function prepareTownCenterGlyph(input: { bytes: Uint8Array; region: KingshotProfileRegionConfig; widthPx: number; heightPx: number; mask: TownCenterGlyphMask; scale: TownCenterGlyphScale; kernel?: TownCenterGlyphKernel }): Promise<TownCenterGlyphPrepared> {
  const sourceRectangle = glyphSourceRectangle(input.region, input.widthPx, input.heightPx)
  const { data, info } = await sharp(Buffer.from(input.bytes), { failOn: 'error' }).extract(sourceRectangle).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const mask = buildMask(data, info.width, info.height, input.mask)
  const components = analyseGlyphComponents(mask, info.width, info.height)
  const chosenPsm = components.filter((item) => item.width >= 2 && item.height >= 3).length > 1 ? 'single_word' : 'single_char'
  const kernel = input.kernel ?? 'lanczos3'
  if (input.scale * input.scale > MAX_GLYPH_PIXELS) throw new Error('Town Centre glyph preprocessing exceeded its bounded pixel budget.')
  const prepared = await sharp(Buffer.from(mask), { raw: { width: info.width, height: info.height, channels: 1 } }).resize({ width: input.scale, height: input.scale, fit: 'contain', position: 'centre', background: { r: 255, g: 255, b: 255 }, kernel }).png({ compressionLevel: 6 }).toBuffer()
  return { bytes: new Uint8Array(prepared), widthPx: input.scale, heightPx: input.scale, sourceRectangle, mask: input.mask, scale: input.scale, kernel, components, chosenPsm, warningCodes: [`glyph_${input.mask}_mask`, `glyph_${input.scale}px_${kernel}`, components.length > 1 ? 'multiple_central_components' : 'single_central_component'] }
}

function buildMask(data: Buffer, width: number, height: number, strategy: TownCenterGlyphMask): Buffer {
  const output = Buffer.alloc(width * height, 255)
  for (let index = 0; index < width * height; index += 1) {
    const red = data[index * 3]; const green = data[index * 3 + 1]; const blue = data[index * 3 + 2]
    const luminance = (2126 * red + 7152 * green + 722 * blue) / 10000
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue)
    const central = index % width > Math.floor(width * .12) && index % width < Math.ceil(width * .88) && Math.floor(index / width) > Math.floor(height * .35) && Math.floor(index / width) < Math.ceil(height * .96)
    const whiteGlyph = central && luminance >= 190 && spread <= 58 && nearContrast(data, width, height, index)
    const darkOutline = central && luminance <= 105
    const adaptive = strategy === 'adaptive_a' ? central && luminance >= 175 && spread <= 75 && nearContrast(data, width, height, index) : central && luminance >= 215 && spread <= 65 && nearContrast(data, width, height, index)
    const selected = strategy === 'luminance' || strategy === 'outline' ? whiteGlyph : adaptive
    output[index] = selected || (strategy === 'outline' && darkOutline && nearWhite(data, width, height, index)) ? 0 : 255
  }
  return output
}

function nearWhite(data: Buffer, width: number, height: number, index: number): boolean {
  const x = index % width; const y = Math.floor(index / width)
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
    const nx = x + dx; const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
    const offset = (ny * width + nx) * 3; const r = data[offset]; const g = data[offset + 1]; const b = data[offset + 2]
    if ((2126 * r + 7152 * g + 722 * b) / 10000 >= 190 && Math.max(r, g, b) - Math.min(r, g, b) <= 58) return true
  }
  return false
}

function nearContrast(data: Buffer, width: number, height: number, index: number): boolean {
  const x = index % width; const y = Math.floor(index / width)
  for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
    const nx = x + dx; const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
    const offset = (ny * width + nx) * 3; const r = data[offset]; const g = data[offset + 1]; const b = data[offset + 2]
    const neighbourLuminance = (2126 * r + 7152 * g + 722 * b) / 10000
    if (Math.max(r, g, b) - Math.min(r, g, b) >= 60 || neighbourLuminance < 150) return true
  }
  return false
}

export function analyseGlyphComponents(mask: Buffer, width: number, height: number): TownCenterGlyphComponent[] {
  const visited = new Uint8Array(width * height); const found: TownCenterGlyphComponent[] = []
  for (let start = 0; start < mask.length; start += 1) {
    if (visited[start] || mask[start] !== 0) continue
    const queue = [start]; visited[start] = 1; let area = 0; let left = width; let top = height; let right = 0; let bottom = 0
    while (queue.length) {
      const current = queue.pop()!; const x = current % width; const y = Math.floor(current / width); area += 1; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y)
      for (const next of [current - 1, current + 1, current - width, current + width]) {
        if (next < 0 || next >= mask.length || visited[next] || mask[next] !== 0) continue
        if (Math.abs((next % width) - x) + Math.abs(Math.floor(next / width) - y) !== 1) continue
        visited[next] = 1; queue.push(next)
      }
    }
    const touchesBorder = left === 0 || top === 0 || right === width - 1 || bottom === height - 1
    const componentWidth = right - left + 1; const componentHeight = bottom - top + 1
    if (!touchesBorder && area >= 2 && componentWidth <= width * .75 && componentHeight <= height * .9) found.push({ left, top, width: componentWidth, height: componentHeight, area, centreDistance: Math.hypot((left + right) / 2 - width / 2, (top + bottom) / 2 - height / 2) })
  }
  return found.sort((a, b) => a.centreDistance - b.centreDistance || b.area - a.area).slice(0, 2)
}
