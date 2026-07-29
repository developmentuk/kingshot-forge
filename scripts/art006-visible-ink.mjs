import sharp from 'sharp'

const colourDistance = (data, offset, colour) => {
  const red = data[offset] - colour[0]
  const green = data[offset + 1] - colour[1]
  const blue = data[offset + 2] - colour[2]
  return red * red + green * green + blue * blue
}

function dominantColour(data, channels) {
  const counts = new Map()
  for (let offset = 0; offset < data.length; offset += channels) {
    const key = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2]
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const key = [...counts].sort((left, right) => right[1] - left[1])[0][0]
  return [(key >> 16) & 255, (key >> 8) & 255, key & 255]
}

function components(mask, width, height) {
  const seen = new Uint8Array(mask.length)
  const result = []
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue
    const queue = [start]
    const pixels = []
    seen[start] = 1
    for (let head = 0; head < queue.length; head += 1) {
      const position = queue[head]
      pixels.push(position)
      const x = position % width
      const y = Math.floor(position / width)
      for (let nextY = Math.max(0, y - 1); nextY <= Math.min(height - 1, y + 1); nextY += 1) {
        for (let nextX = Math.max(0, x - 1); nextX <= Math.min(width - 1, x + 1); nextX += 1) {
          const next = nextY * width + nextX
          if (!seen[next] && mask[next]) {
            seen[next] = 1
            queue.push(next)
          }
        }
      }
    }
    let left = width
    let right = 0
    let top = height
    let bottom = 0
    pixels.forEach((position) => {
      const x = position % width
      const y = Math.floor(position / width)
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    })
    result.push({
      pixels,
      area: pixels.length,
      left,
      right,
      top,
      bottom,
    })
  }
  return result
}

function mergeBandsToCount(bands, expectedCount) {
  const result = bands.map((band) => ({ ...band }))
  while (result.length > expectedCount) {
    let mergeAt = 0
    let smallestGap = Number.POSITIVE_INFINITY
    for (let index = 0; index < result.length - 1; index += 1) {
      const gap = result[index + 1].top - result[index].bottom
      if (gap < smallestGap) {
        smallestGap = gap
        mergeAt = index
      }
    }
    const left = result[mergeAt]
    const right = result[mergeAt + 1]
    result.splice(mergeAt, 2, {
      top: left.top,
      bottom: right.bottom,
      left: Math.min(left.left, right.left),
      right: Math.max(left.right, right.right),
      pixelCount: left.pixelCount + right.pixelCount,
    })
  }
  while (result.length < expectedCount) {
    let splitAt = 0
    for (let index = 1; index < result.length; index += 1) {
      if (result[index].bottom - result[index].top > result[splitAt].bottom - result[splitAt].top) splitAt = index
    }
    const band = result[splitAt]
    if (band.bottom - band.top < 3) break
    const middle = Math.floor((band.top + band.bottom) / 2)
    result.splice(splitAt, 1, { ...band, bottom: middle }, { ...band, top: middle + 1 })
  }
  if (result.length !== expectedCount) throw new Error(`Expected ${expectedCount} visible rows but measured ${result.length}.`)
  return result
}

export async function measureVisibleInk(file, sourceRows) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const fill = dominantColour(data, channels)
  const fillMask = new Uint8Array(width * height)
  for (let position = 0; position < fillMask.length; position += 1) {
    if (colourDistance(data, position * channels, fill) < 900) fillMask[position] = 1
  }
  const bubbleComponent = components(fillMask, width, height).sort((left, right) => right.area - left.area)[0]
  if (!bubbleComponent) throw new Error(`${file}: no bubble fill component found.`)
  const bubble = {
    left: bubbleComponent.left,
    right: bubbleComponent.right,
    top: bubbleComponent.top,
    bottom: bubbleComponent.bottom,
    width: bubbleComponent.right - bubbleComponent.left + 1,
    height: bubbleComponent.bottom - bubbleComponent.top + 1,
  }

  const inkMask = new Uint8Array(width * height)
  for (let y = bubble.top; y <= bubble.bottom; y += 1) {
    for (let x = bubble.left; x <= bubble.right; x += 1) {
      const position = y * width + x
      const offset = position * channels
      const red = data[offset]
      const green = data[offset + 1]
      const blue = data[offset + 2]
      const luminance = .2126 * red + .7152 * green + .0722 * blue
      const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
      if (colourDistance(data, offset, fill) > 2500 && (luminance < 205 || chroma > 45)) inkMask[position] = 1
    }
  }

  const acceptedComponents = components(inkMask, width, height).filter((component) => {
    const touchesEdge = component.left <= bubble.left + 1 || component.right >= bubble.right - 1 || component.top <= bubble.top + 1 || component.bottom >= bubble.bottom - 1
    const borderLike = component.bottom - component.top > bubble.height * .55 && component.right - component.left < 8
    return component.area >= 2 && !touchesEdge && !borderLike
  })
  const acceptedMask = new Uint8Array(width * height)
  acceptedComponents.forEach((component) => component.pixels.forEach((position) => { acceptedMask[position] = 1 }))

  const rawBands = []
  for (let y = bubble.top + 2; y <= bubble.bottom - 2; y += 1) {
    let count = 0
    let left = width
    let right = 0
    for (let x = bubble.left + 2; x <= bubble.right - 2; x += 1) {
      if (!acceptedMask[y * width + x]) continue
      count += 1
      left = Math.min(left, x)
      right = Math.max(right, x)
    }
    if (count < 2) continue
    const previous = rawBands.at(-1)
    if (previous && y - previous.bottom <= 2) {
      previous.bottom = y
      previous.left = Math.min(previous.left, left)
      previous.right = Math.max(previous.right, right)
      previous.pixelCount += count
    } else rawBands.push({ top: y, bottom: y, left, right, pixelCount: count })
  }

  const sourceIndexes = sourceRows.map((line, index) => line.length ? index : -1).filter((index) => index >= 0)
  const bands = mergeBandsToCount(rawBands, sourceIndexes.length).map((band) => {
    let left = width
    let right = 0
    let pixelCount = 0
    for (let y = band.top; y <= band.bottom; y += 1) {
      for (let x = bubble.left + 2; x <= bubble.right - 2; x += 1) {
        if (!acceptedMask[y * width + x]) continue
        pixelCount += 1
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
    return { ...band, left, right, pixelCount }
  })
  const rows = bands.map((band, index) => {
    const sourceRow = sourceIndexes[index]
    const occupiedColumns = []
    for (let x = bubble.left + 2; x <= bubble.right - 2; x += 1) {
      let occupied = false
      for (let y = band.top; y <= band.bottom && !occupied; y += 1) occupied = Boolean(acceptedMask[y * width + x])
      if (occupied) occupiedColumns.push(x)
    }
    const horizontalGaps = []
    for (let column = 1; column < occupiedColumns.length; column += 1) {
      const gap = occupiedColumns[column] - occupiedColumns[column - 1] - 1
      if (gap >= 2) {
        horizontalGaps.push({
          left: occupiedColumns[column - 1],
          right: occupiedColumns[column],
          width: gap,
          normalisedLeft: (occupiedColumns[column - 1] - bubble.left) / bubble.width,
          normalisedRight: (occupiedColumns[column] - bubble.left) / bubble.width,
        })
      }
    }
    const principalGap = horizontalGaps
      .filter((gap) => gap.normalisedRight >= .5)
      .sort((left, right) => right.width - left.width)[0] ?? null
    return {
      sourceRow,
      ...band,
      centreY: (band.top + band.bottom) / 2,
      normalised: {
        left: (band.left - bubble.left) / bubble.width,
        right: (band.right - bubble.left) / bubble.width,
        centreY: ((band.top + band.bottom) / 2 - bubble.top) / bubble.height,
      },
      landmarks: { horizontalGaps, principalGap },
    }
  })
  return { file, image: { width, height }, fill, bubble, rows }
}

export function compareVisibleRows(reference, candidate) {
  const referenceByRow = new Map(reference.rows.map((row) => [row.sourceRow, row]))
  return candidate.rows.map((row) => {
    const expected = referenceByRow.get(row.sourceRow)
    if (!expected) return { sourceRow: row.sourceRow, status: 'unmatched' }
    return {
      sourceRow: row.sourceRow,
      leftError: Math.abs(row.normalised.left - expected.normalised.left),
      rightError: Math.abs(row.normalised.right - expected.normalised.right),
      centreYError: Math.abs(row.normalised.centreY - expected.normalised.centreY),
      reference: expected.normalised,
      candidate: row.normalised,
    }
  })
}
