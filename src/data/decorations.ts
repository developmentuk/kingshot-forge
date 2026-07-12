export type DecorationName =
  | 'None'
  | 'Tibetan'
  | 'Wings'
  | 'Brackets'
  | 'Double brackets'
  | 'Thai'

export const decorations: Record<
  DecorationName,
  [string, string]
> = {
  None: ['', ''],
  Tibetan: ['༺', '༻'],
  Wings: ['ʚ', 'ɞ'],
  Brackets: ['【', '】'],
  'Double brackets': ['《', '》'],
  Thai: ['๓', '๓'],
}