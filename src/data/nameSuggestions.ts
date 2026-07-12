export type NameSuggestionTheme =
  | 'Cat'
  | 'Viking'
  | 'Royal'
  | 'Fire'
  | 'Frost'
  | 'Shadow'
  | 'Nature'
  | 'Mythic'

export type NameSuggestion = {
  name: string
  theme: NameSuggestionTheme
  tags: string[]
}

export const nameSuggestions: NameSuggestion[] = [
  {
    name: 'Kitty',
    theme: 'Cat',
    tags: ['cute', 'short', 'female'],
  },
  {
    name: 'Whisker',
    theme: 'Cat',
    tags: ['cute', 'animal', 'readable'],
  },
  {
    name: 'Purrfect',
    theme: 'Cat',
    tags: ['funny', 'cute', 'cat'],
  },
  {
    name: 'Mooncat',
    theme: 'Cat',
    tags: ['mystic', 'cat', 'night'],
  },
  {
    name: 'Claw',
    theme: 'Cat',
    tags: ['short', 'warrior', 'cat'],
  },
  {
    name: 'Shadowpaw',
    theme: 'Cat',
    tags: ['dark', 'cat', 'fantasy'],
  },
  {
    name: 'Stormpaw',
    theme: 'Cat',
    tags: ['battle', 'cat', 'strong'],
  },
  {
    name: 'Purrsia',
    theme: 'Cat',
    tags: ['cute', 'female', 'fantasy'],
  },

  {
    name: 'Ragnar',
    theme: 'Viking',
    tags: ['warrior', 'male', 'runic'],
  },
  {
    name: 'Freya',
    theme: 'Viking',
    tags: ['female', 'royal', 'norse'],
  },
  {
    name: 'Bjorn',
    theme: 'Viking',
    tags: ['male', 'strong', 'norse'],
  },
  {
    name: 'Astrid',
    theme: 'Viking',
    tags: ['female', 'norse', 'readable'],
  },
  {
    name: 'Fenrir',
    theme: 'Viking',
    tags: ['wolf', 'mythic', 'dark'],
  },
  {
    name: 'Skadi',
    theme: 'Viking',
    tags: ['female', 'frost', 'norse'],
  },
  {
    name: 'Ulf',
    theme: 'Viking',
    tags: ['short', 'wolf', 'warrior'],
  },
  {
    name: 'Valkyr',
    theme: 'Viking',
    tags: ['warrior', 'mythic', 'norse'],
  },

  {
    name: 'Sovereign',
    theme: 'Royal',
    tags: ['leader', 'formal', 'powerful'],
  },
  {
    name: 'Regalia',
    theme: 'Royal',
    tags: ['elegant', 'female', 'royal'],
  },
  {
    name: 'Majesty',
    theme: 'Royal',
    tags: ['leader', 'royal', 'readable'],
  },
  {
    name: 'Empress',
    theme: 'Royal',
    tags: ['female', 'leader', 'royal'],
  },
  {
    name: 'Monarch',
    theme: 'Royal',
    tags: ['leader', 'strong', 'royal'],
  },
  {
    name: 'Crown',
    theme: 'Royal',
    tags: ['short', 'royal', 'readable'],
  },
  {
    name: 'Regent',
    theme: 'Royal',
    tags: ['formal', 'leader', 'royal'],
  },
  {
    name: 'Noble',
    theme: 'Royal',
    tags: ['elegant', 'short', 'royal'],
  },

  {
    name: 'Inferno',
    theme: 'Fire',
    tags: ['strong', 'battle', 'fire'],
  },
  {
    name: 'Ember',
    theme: 'Fire',
    tags: ['short', 'female', 'fire'],
  },
  {
    name: 'Blaze',
    theme: 'Fire',
    tags: ['short', 'warrior', 'fire'],
  },
  {
    name: 'Phoenix',
    theme: 'Fire',
    tags: ['mythic', 'fire', 'rebirth'],
  },
  {
    name: 'Ashfall',
    theme: 'Fire',
    tags: ['dark', 'fire', 'fantasy'],
  },
  {
    name: 'Flare',
    theme: 'Fire',
    tags: ['short', 'fire', 'readable'],
  },
  {
    name: 'Cinder',
    theme: 'Fire',
    tags: ['dark', 'fire', 'fantasy'],
  },
  {
    name: 'Pyra',
    theme: 'Fire',
    tags: ['female', 'short', 'fire'],
  },

  {
    name: 'Frost',
    theme: 'Frost',
    tags: ['short', 'cold', 'warrior'],
  },
  {
    name: 'Iceborn',
    theme: 'Frost',
    tags: ['fantasy', 'strong', 'cold'],
  },
  {
    name: 'Winter',
    theme: 'Frost',
    tags: ['readable', 'nature', 'cold'],
  },
  {
    name: 'Snowfall',
    theme: 'Frost',
    tags: ['elegant', 'nature', 'cold'],
  },
  {
    name: 'Glacia',
    theme: 'Frost',
    tags: ['female', 'fantasy', 'cold'],
  },
  {
    name: 'Rime',
    theme: 'Frost',
    tags: ['short', 'ancient', 'cold'],
  },
  {
    name: 'Frostfang',
    theme: 'Frost',
    tags: ['warrior', 'animal', 'cold'],
  },
  {
    name: 'Iceveil',
    theme: 'Frost',
    tags: ['mystic', 'cold', 'fantasy'],
  },

  {
    name: 'Shadow',
    theme: 'Shadow',
    tags: ['dark', 'readable', 'mystic'],
  },
  {
    name: 'Spectre',
    theme: 'Shadow',
    tags: ['dark', 'ghost', 'mystic'],
  },
  {
    name: 'Nocturne',
    theme: 'Shadow',
    tags: ['dark', 'night', 'elegant'],
  },
  {
    name: 'Umbra',
    theme: 'Shadow',
    tags: ['short', 'dark', 'mystic'],
  },
  {
    name: 'Void',
    theme: 'Shadow',
    tags: ['short', 'dark', 'powerful'],
  },
  {
    name: 'Nightfall',
    theme: 'Shadow',
    tags: ['dark', 'night', 'fantasy'],
  },
  {
    name: 'Wraith',
    theme: 'Shadow',
    tags: ['dark', 'ghost', 'warrior'],
  },
  {
    name: 'Eclipse',
    theme: 'Shadow',
    tags: ['dark', 'mystic', 'readable'],
  },

  {
    name: 'Willow',
    theme: 'Nature',
    tags: ['soft', 'tree', 'female'],
  },
  {
    name: 'Maple',
    theme: 'Nature',
    tags: ['tree', 'readable', 'soft'],
  },
  {
    name: 'Briar',
    theme: 'Nature',
    tags: ['nature', 'fantasy', 'short'],
  },
  {
    name: 'Oakheart',
    theme: 'Nature',
    tags: ['strong', 'tree', 'fantasy'],
  },
  {
    name: 'Fern',
    theme: 'Nature',
    tags: ['short', 'nature', 'soft'],
  },
  {
    name: 'Thorn',
    theme: 'Nature',
    tags: ['strong', 'nature', 'warrior'],
  },
  {
    name: 'Wildwood',
    theme: 'Nature',
    tags: ['forest', 'fantasy', 'nature'],
  },
  {
    name: 'Roseveil',
    theme: 'Nature',
    tags: ['female', 'nature', 'mystic'],
  },

  {
    name: 'Drakon',
    theme: 'Mythic',
    tags: ['dragon', 'strong', 'fantasy'],
  },
  {
    name: 'Aether',
    theme: 'Mythic',
    tags: ['mystic', 'ancient', 'fantasy'],
  },
  {
    name: 'Oracle',
    theme: 'Mythic',
    tags: ['mystic', 'readable', 'ancient'],
  },
  {
    name: 'Titan',
    theme: 'Mythic',
    tags: ['strong', 'ancient', 'warrior'],
  },
  {
    name: 'Nyx',
    theme: 'Mythic',
    tags: ['short', 'female', 'dark'],
  },
  {
    name: 'Arcana',
    theme: 'Mythic',
    tags: ['mystic', 'magic', 'fantasy'],
  },
  {
    name: 'Hydra',
    theme: 'Mythic',
    tags: ['monster', 'warrior', 'fantasy'],
  },
  {
    name: 'Celestia',
    theme: 'Mythic',
    tags: ['female', 'elegant', 'mythic'],
  },
]

export const nameSuggestionThemes: NameSuggestionTheme[] = [
  'Cat',
  'Viking',
  'Royal',
  'Fire',
  'Frost',
  'Shadow',
  'Nature',
  'Mythic',
]