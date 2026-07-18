export const ART_STUDIO_TEXT_LIMITS = {
  maximumCharacters: 20_000,
  maximumLines: 100,
  maximumLineCharacters: 400,
  maximumTitleCharacters: 120,
  maximumDescriptionCharacters: 2_000,
  maximumTags: 10,
  maximumTagCharacters: 32,
} as const

export function countArtworkCharacters(artwork: string): number {
  return Array.from(artwork).length
}

export function countArtworkLines(artwork: string): number {
  return artwork.split('\n').length
}

export type TextArtworkValidationIssue = {
  field: 'title' | 'description' | 'artwork' | 'tags' | 'attribution'
  message: string
}

export function validateTextArtwork(input: {
  title: string
  description: string
  artwork: string
  tags: string[]
  attributionType: string
  attributionName: string | null
}): TextArtworkValidationIssue[] {
  const issues: TextArtworkValidationIssue[] = []
  if (!input.title.trim() || countArtworkCharacters(input.title) > ART_STUDIO_TEXT_LIMITS.maximumTitleCharacters) issues.push({ field: 'title', message: 'Enter a title of 120 characters or fewer.' })
  if (countArtworkCharacters(input.description) > ART_STUDIO_TEXT_LIMITS.maximumDescriptionCharacters) issues.push({ field: 'description', message: 'Keep the description to 2,000 characters or fewer.' })
  const characters = countArtworkCharacters(input.artwork)
  const lines = countArtworkLines(input.artwork)
  if (!input.artwork.trim()) issues.push({ field: 'artwork', message: 'Enter the artwork you want players to copy.' })
  if (characters > ART_STUDIO_TEXT_LIMITS.maximumCharacters) issues.push({ field: 'artwork', message: 'Keep artwork to 20,000 characters or fewer.' })
  if (lines > ART_STUDIO_TEXT_LIMITS.maximumLines) issues.push({ field: 'artwork', message: 'Keep artwork to 100 lines or fewer.' })
  if (input.artwork.split('\n').some((line) => countArtworkCharacters(line) > ART_STUDIO_TEXT_LIMITS.maximumLineCharacters)) issues.push({ field: 'artwork', message: 'Keep each artwork line to 400 characters or fewer.' })
  if (input.tags.length > ART_STUDIO_TEXT_LIMITS.maximumTags || input.tags.some((tag) => !tag || countArtworkCharacters(tag) > ART_STUDIO_TEXT_LIMITS.maximumTagCharacters)) issues.push({ field: 'tags', message: 'Use up to 10 non-empty tags of 32 characters or fewer.' })
  if (!['profile', 'custom', 'anonymous'].includes(input.attributionType) || (input.attributionType !== 'anonymous' && !input.attributionName?.trim()) || (input.attributionType === 'anonymous' && input.attributionName)) issues.push({ field: 'attribution', message: 'Choose a valid attribution option.' })
  return issues
}
