import {
  nameStyleMaps,
  transformName,
  type NameStyleName,
} from './nameStyles'

export type NameVariantGroup =
  | 'Fantasy'
  | 'Viking'
  | 'Royal'
  | 'Cute'
  | 'Dark'
  | 'Elegant'
  | 'Warrior'
  | 'Mystic'
  | 'Ancient'
  | 'Minimal'

export type NameVariant = {
  id: string
  group: NameVariantGroup
  label: string
  description: string
  build: (name: string) => string
}

function mapName(
  name: string,
  style: NameStyleName,
) {
  return transformName(name, style)
}

function mixedFantasyName(name: string) {
  const fantasy = nameStyleMaps.Fantasy

  return Array.from(name)
    .map((character, index) => {
      const lower = character.toLowerCase()
      const replacement = fantasy[lower]

      if (!replacement) {
        return character
      }

      return index % 2 === 0
        ? replacement
        : character.toUpperCase()
    })
    .join('')
}

function partialRunicName(name: string) {
  const runic = nameStyleMaps.Runic

  return Array.from(name)
    .map((character, index) => {
      const lower = character.toLowerCase()
      const replacement = runic[lower]

      if (!replacement) {
        return character
      }

      return index % 3 === 0
        ? replacement
        : character.toUpperCase()
    })
    .join('')
}

function readableElegantName(name: string) {
  const elegant = nameStyleMaps.Elegant

  return Array.from(name)
    .map((character, index) => {
      const lower = character.toLowerCase()
      const replacement = elegant[lower]

      if (!replacement) {
        return character
      }

      return index % 2 === 0
        ? replacement
        : character.toUpperCase()
    })
    .join('')
}

export const nameVariants: NameVariant[] = [
  {
    id: 'fantasy-ornate',
    group: 'Fantasy',
    label: 'Ornate Fantasy',
    description: 'Fantasy lettering framed with Tibetan ornaments.',
    build: (name) => `༺${mapName(name, 'Fantasy')}༻`,
  },
  {
    id: 'fantasy-readable',
    group: 'Fantasy',
    label: 'Readable Fantasy',
    description: 'A balanced mix of ordinary and fantasy letters.',
    build: (name) => `【${mixedFantasyName(name)}】`,
  },
  {
    id: 'fantasy-wings',
    group: 'Fantasy',
    label: 'Winged Fantasy',
    description: 'Fantasy characters framed with decorative wings.',
    build: (name) => `ʚ${mapName(name, 'Fantasy')}ɞ`,
  },

  {
    id: 'viking-full',
    group: 'Viking',
    label: 'Full Runic',
    description: 'The complete name converted into Runic.',
    build: (name) => `【${mapName(name, 'Runic')}】`,
  },
  {
    id: 'viking-readable',
    group: 'Viking',
    label: 'Readable Viking',
    description: 'Selected Runic letters keep the name recognisable.',
    build: (name) => `༺${partialRunicName(name)}༻`,
  },
  {
    id: 'viking-warrior',
    group: 'Viking',
    label: 'Viking Warrior',
    description: 'Runic text with bold ornamental framing.',
    build: (name) => `『${mapName(name, 'Runic')}』`,
  },

  {
    id: 'royal-crown',
    group: 'Royal',
    label: 'Royal',
    description: 'Elegant lettering with a formal frame.',
    build: (name) => `【${mapName(name, 'Elegant')}】`,
  },
  {
    id: 'royal-brackets',
    group: 'Royal',
    label: 'Royal Brackets',
    description: 'A clean and formal royal style.',
    build: (name) => `《${mapName(name, 'Elegant')}》`,
  },
  {
    id: 'royal-decree',
    group: 'Royal',
    label: 'Royal Decree',
    description: 'Readable elegant characters with ornaments.',
    build: (name) => `༼${readableElegantName(name)}༽`,
  },

  {
    id: 'cute-wings',
    group: 'Cute',
    label: 'Cute Wings',
    description: 'Soft phonetic characters with decorative wings.',
    build: (name) => `ʚ${mapName(name, 'Cute')}ɞ`,
  },
  {
    id: 'cute-soft',
    group: 'Cute',
    label: 'Soft Style',
    description: 'A friendly style with delicate framing.',
    build: (name) => `༼${mapName(name, 'Cute')}༽`,
  },
  {
    id: 'cute-brackets',
    group: 'Cute',
    label: 'Cute Brackets',
    description: 'A soft style with CJK brackets.',
    build: (name) => `『${mapName(name, 'Cute')}』`,
  },

  {
    id: 'dark-shadow',
    group: 'Dark',
    label: 'Shadow',
    description: 'A darker fantasy-style name.',
    build: (name) => `《${mixedFantasyName(name)}》`,
  },
  {
    id: 'dark-frame',
    group: 'Dark',
    label: 'Dark Frame',
    description: 'Fantasy lettering with a strong framed look.',
    build: (name) => `◤${mapName(name, 'Fantasy')}◥`,
  },
  {
    id: 'dark-mark',
    group: 'Dark',
    label: 'Dark Mark',
    description: 'Strong lettering with technical symbols.',
    build: (name) => `⊙${mapName(name, 'Fantasy')}⊙`,
  },

  {
    id: 'elegant-clean',
    group: 'Elegant',
    label: 'Clean Elegant',
    description: 'Simple extended Latin styling.',
    build: (name) => mapName(name, 'Elegant'),
  },
  {
    id: 'elegant-framed',
    group: 'Elegant',
    label: 'Elegant Frame',
    description: 'A neat and readable framed design.',
    build: (name) => `【${mapName(name, 'Elegant')}】`,
  },
  {
    id: 'elegant-wings',
    group: 'Elegant',
    label: 'Elegant Wings',
    description: 'Elegant characters with subtle wings.',
    build: (name) => `ʚ${readableElegantName(name)}ɞ`,
  },

  {
    id: 'warrior-cross',
    group: 'Warrior',
    label: 'Warrior Cross',
    description: 'A strong battle-themed name.',
    build: (name) => `╳${mixedFantasyName(name)}╳`,
  },
  {
    id: 'warrior-shield',
    group: 'Warrior',
    label: 'Shield Style',
    description: 'A bold geometric warrior style.',
    build: (name) => `◢${mapName(name, 'Fantasy')}◣`,
  },
  {
    id: 'warrior-mark',
    group: 'Warrior',
    label: 'Battle Mark',
    description: 'A strong name with geometric framing.',
    build: (name) => `◆${mixedFantasyName(name)}◆`,
  },

  {
    id: 'mystic-frame',
    group: 'Mystic',
    label: 'Mystic Frame',
    description: 'A mystical name using Tibetan ornaments.',
    build: (name) => `༺${mapName(name, 'Elegant')}༻`,
  },
  {
    id: 'mystic-symbol',
    group: 'Mystic',
    label: 'Mystic Symbol',
    description: 'Technical symbols create a magical frame.',
    build: (name) => `⊙${mapName(name, 'Fantasy')}⊙`,
  },
  {
    id: 'mystic-orb',
    group: 'Mystic',
    label: 'Mystic Orb',
    description: 'A compact mystical design.',
    build: (name) => `◉${readableElegantName(name)}◉`,
  },

  {
    id: 'ancient-runes',
    group: 'Ancient',
    label: 'Ancient Runes',
    description: 'A pure historic Runic conversion.',
    build: (name) => `༺${mapName(name, 'Runic')}༻`,
  },
  {
    id: 'ancient-stone',
    group: 'Ancient',
    label: 'Stone Carving',
    description: 'A restrained Runic name.',
    build: (name) => `『${partialRunicName(name)}』`,
  },
  {
    id: 'ancient-mark',
    group: 'Ancient',
    label: 'Ancient Mark',
    description: 'A compact design with technical symbols.',
    build: (name) => `⊕${mapName(name, 'Runic')}⊕`,
  },

  {
    id: 'minimal-fantasy',
    group: 'Minimal',
    label: 'Minimal Fantasy',
    description: 'Styled lettering without decorations.',
    build: (name) => mixedFantasyName(name),
  },
  {
    id: 'minimal-elegant',
    group: 'Minimal',
    label: 'Minimal Elegant',
    description: 'Readable and simple extended lettering.',
    build: (name) => readableElegantName(name),
  },
  {
    id: 'minimal-brackets',
    group: 'Minimal',
    label: 'Minimal Brackets',
    description: 'Ordinary text with a clean frame.',
    build: (name) => `【${name}】`,
  },
]

export const nameVariantGroups: NameVariantGroup[] = [
  'Fantasy',
  'Viking',
  'Royal',
  'Cute',
  'Dark',
  'Elegant',
  'Warrior',
  'Mystic',
  'Ancient',
  'Minimal',
]