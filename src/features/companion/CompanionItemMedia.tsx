import { useState } from 'react'

type CompanionItemMediaProps = {
  imageUrl: string | null
  alt: string
  role: 'full_artwork' | 'compact_icon' | null
  compact?: boolean
}

export default function CompanionItemMedia({
  imageUrl,
  alt,
  role,
  compact = false,
}: CompanionItemMediaProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const mediaSource = imageUrl && role ? `${imageUrl}|${role}|${compact ? 'compact' : 'full'}` : null
  const canRender = Boolean(mediaSource && (!compact || role === 'compact_icon'))

  if (canRender && failedSource !== mediaSource) {
    return (
      <img
        className={`companion-item-media companion-item-media--${role}${compact ? ' companion-item-media--compact' : ''}`}
        src={imageUrl ?? undefined}
        alt={alt}
        width={compact ? 72 : 300}
        height={compact ? 72 : 300}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSource(mediaSource)}
      />
    )
  }

  return (
    <div className="companion-item-media-fallback" role="img" aria-label={`${alt} unavailable`}>
      <span aria-hidden="true">◇</span>
      <small>{role ? 'Media unavailable' : 'No media published'}</small>
    </div>
  )
}
