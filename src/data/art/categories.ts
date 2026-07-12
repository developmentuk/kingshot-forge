import type { ArtCategory } from './types'

export type ArtCategoryDetails = {
  name: ArtCategory
  icon: string
  description: string
}

export const artCategoryDetails: ArtCategoryDetails[] = [
  {
    name: 'Cats',
    icon: '🐱',
    description: 'Cats, kittens and feline chat artwork.',
  },
  {
    name: 'Animals',
    icon: '🐾',
    description: 'Llamas, ravens, bears, dragons and other animals.',
  },
  {
    name: 'Characters',
    icon: '🎭',
    description: 'Recognisable characters and themed pixel artwork.',
  },
  {
    name: 'Announcements',
    icon: '📢',
    description: 'Notices, reminders and alliance announcements.',
  },
  {
    name: 'Battle',
    icon: '⚔️',
    description: 'Battle alerts, rallies and combat artwork.',
  },
  {
    name: 'KvK',
    icon: '🏰',
    description: 'Artwork and reminders for Kingdom versus Kingdom.',
  },
  {
    name: 'Alliance',
    icon: '🛡️',
    description: 'Alliance messages, leadership posts and recruitment.',
  },
  {
    name: 'Flags',
    icon: '🚩',
    description: 'Country flags and national designs.',
  },
  {
    name: 'Pixel Art',
    icon: '🟩',
    description: 'Large emoji and block-based artwork.',
  },
  {
    name: 'Nature',
    icon: '🌳',
    description: 'Trees, flowers, moon scenes and seasonal nature.',
  },
  {
    name: 'Funny',
    icon: '😂',
    description: 'Memes, jokes and funny alliance messages.',
  },
  {
    name: 'Gaming',
    icon: '🎮',
    description: 'Gaming-themed characters and artwork.',
  },
  {
    name: 'Seasonal',
    icon: '🎄',
    description: 'Christmas, Halloween and seasonal artwork.',
  },
  {
    name: 'Other',
    icon: '✨',
    description: 'Artwork that does not fit another category.',
  },
]

export const artCategories: Array<'All' | ArtCategory> = [
  'All',
  ...artCategoryDetails.map((category) => category.name),
]

export function getArtCategoryDetails(
  categoryName: ArtCategory,
) {
  return artCategoryDetails.find(
    (category) => category.name === categoryName,
  )
}