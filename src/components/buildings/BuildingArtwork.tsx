import { useState } from 'react'
import BuildingIllustration from './BuildingIllustration'
import type { BuildingCompanionRecord } from '../../features/buildings/buildingData'

type BuildingArtworkProps = {
  building: BuildingCompanionRecord
  compact?: boolean
  decorative?: boolean
  className?: string
}

export default function BuildingArtwork({
  building,
  compact = false,
  decorative = false,
  className = '',
}: BuildingArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (building.imageUrl && !imageFailed) {
    const imageClassName = [
      compact
        ? 'building-media-image building-media-image--compact'
        : 'building-media-image',
      className,
    ].filter(Boolean).join(' ')

    return <img
      className={imageClassName}
      src={building.imageUrl}
      alt={decorative ? '' : building.imageAltText || `${building.name} building`}
      aria-hidden={decorative ? true : undefined}
      onError={() => setImageFailed(true)}
    />
  }

  return <BuildingIllustration
    buildingKey={building.key}
    name={building.name}
    compact={compact}
    decorative={decorative}
  />
}
