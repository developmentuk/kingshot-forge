export const COMMUNITY_ART_MAX_BYTES = 5 * 1024 * 1024
export const COMMUNITY_ART_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export async function validateCommunityArtFile(file: File): Promise<{ width: number; height: number }> {
  if (!COMMUNITY_ART_MIME_TYPES.includes(file.type as typeof COMMUNITY_ART_MIME_TYPES[number])) throw new Error('Use a PNG, JPEG or WebP image.')
  if (file.size < 1 || file.size > COMMUNITY_ART_MAX_BYTES) throw new Error('Images must be smaller than 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('This image could not be read.'))
    })
    if (image.naturalWidth < 128 || image.naturalHeight < 128 || image.naturalWidth > 4096 || image.naturalHeight > 4096) throw new Error('Images must be between 128 and 4096 pixels on each side.')
    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}
