import type { ReactNode } from 'react'

export type GuideTheme = 'ice' | 'royal' | 'ocean' | 'mystic' | 'war' | 'ember' | 'polar'

export type GuideConnection = {
  label: string
  description: string
  to: string
  kind: 'guide' | 'hero' | 'item' | 'tool' | 'community'
}

export type GuideSection = {
  id: string
  eyebrow: string
  title: string
  content: ReactNode
}

export type GuideArticleDefinition = {
  slug: string
  title: string
  shortTitle: string
  eyebrow: string
  summary: string
  intro: string
  theme: GuideTheme
  tags: string[]
  sourceNote: string
  alert?: ReactNode
  sections: GuideSection[]
  connections: GuideConnection[]
}

export type GuideRegistryEntry = {
  slug: string
  path: string
  title: string
  shortTitle: string
  summary: string
  icon: string
  type: 'Event guide' | 'Hero guide'
  tags: string[]
}
