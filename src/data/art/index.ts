import { allianceSubmissions } from './allianceSubmissions'
import { starterArt } from './starterArt'

export {
  artCategories,
  artCategoryDetails,
  getArtCategoryDetails,
} from './categories'

export type {
  ArtCategory,
  ArtSize,
  ArtSource,
  ArtStatus,
  ArtTemplate,
} from './types'

export const artTemplates = [
  ...starterArt,
  ...allianceSubmissions,
]