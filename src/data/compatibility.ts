export type CompatibilityStatus =
  | 'Supported'
  | 'Unsupported'
  | 'Partial'
  | 'Untested'

export type CompatibilityRecord = {
  name: string
  category: string
  status: Exclude<CompatibilityStatus, 'Untested'>
  characters: string[]
  notes: string
}

function splitCharacters(value: string) {
  return Array.from(value.replace(/\s+/g, ''))
}

export const compatibilityRecords: CompatibilityRecord[] = [
  {
    name: 'Runic',
    category: 'Historic script',
    status: 'Supported',
    characters: splitCharacters(
      'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟ',
    ),
    notes: 'Rendered clearly in Kingshot chat.',
  },
  {
    name: 'Greek',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
    ),
    notes: 'Uppercase and lowercase Greek rendered successfully.',
  },
  {
    name: 'Cyrillic',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
    ),
    notes: 'Uppercase and lowercase Cyrillic rendered successfully.',
  },
  {
    name: 'Armenian',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ',
    ),
    notes: 'The tested Armenian alphabet rendered successfully.',
  },
  {
    name: 'Georgian',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ႠႡႢႣႤႥႦႧႨႩႪႫႬႭႮႯႰႱႲႳႴႵႶႷႸႹႺႻႼႽႾႿაბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ',
    ),
    notes: 'Historic and modern Georgian characters rendered.',
  },
  {
    name: 'Coptic',
    category: 'Historic script',
    status: 'Supported',
    characters: splitCharacters(
      'ⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱ',
    ),
    notes: 'Uppercase and lowercase Coptic rendered.',
  },
  {
    name: 'Glagolitic',
    category: 'Historic script',
    status: 'Supported',
    characters: splitCharacters(
      'ⰀⰁⰂⰃⰄⰅⰆⰇⰈⰉⰊⰋⰌⰍⰎⰏⰐⰑⰒⰓ',
    ),
    notes: 'The tested Glagolitic characters rendered successfully.',
  },
  {
    name: 'Hebrew',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters('אבגדהוזחטיכלמנסעפצקרשת'),
    notes: 'Hebrew letters rendered successfully.',
  },
  {
    name: 'Arabic',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters('ابتثجحخدذرزسشصضطظعغفقكلمنهوي'),
    notes: 'Arabic letters rendered and joined according to context.',
  },
  {
    name: 'Thai',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      '๑๒๓๔๕๖๗๘๙๐กขฃคฅฆงจฉชซญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ',
    ),
    notes: 'Thai letters and numerals rendered successfully.',
  },
  {
    name: 'Ethiopic',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ሀሁሂሃሄህሆለሉሊላሌልሎመሙሚማሜምሞረሩሪራሬርሮሰሱሲሳሴስሶ',
    ),
    notes: 'The tested Ethiopic characters rendered.',
  },
  {
    name: 'Tifinagh',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ⴰⴱⴳⴷⴹⴻⴼⴽⵀⵃⵄⵅⵇⵉⵊⵍⵎⵏⵓⵔⵕⵖⵙⵜⵡ',
    ),
    notes: 'The tested Tifinagh characters rendered successfully.',
  },
  {
    name: 'Canadian Aboriginal Syllabics',
    category: 'Modern script',
    status: 'Supported',
    characters: splitCharacters(
      'ᐁᐃᐅᐊᑕᑎᑐᑌᒥᒧᒪᓂᓄᓇᕼᕽᖇᖈ',
    ),
    notes: 'Useful fantasy-style characters rendered successfully.',
  },
  {
    name: 'Latin Extended and IPA',
    category: 'Latin and phonetic',
    status: 'Supported',
    characters: splitCharacters(
      'ƁƂƄƇƈƊƋƌƑƓƗƝƤƥƬƮƲƳȺɃȻɌɎƵƷƛƾǷȢȜɅɊɁʚɞʘʬʭɷɸɹɺɯʎʀ',
    ),
    notes: 'Many tested letters are useful for player names.',
  },
  {
    name: 'CJK brackets and punctuation',
    category: 'Punctuation',
    status: 'Supported',
    characters: splitCharacters(
      '「」『』【】〖〗《》〈〉〔〕・ー〜ヽヾ※〆々〇〒〓〰﹏',
    ),
    notes: 'Useful for framing names, headings and banners.',
  },
  {
    name: 'Box Drawing',
    category: 'Drawing',
    status: 'Supported',
    characters: splitCharacters(
      '╔═╗║╚╝╠╣╦╩╬╢╟╤╧╪╫┌─┐│└┘├┤┬┴┼┏━┓┃┗┛╭╮╰╯╳',
    ),
    notes: 'Rendered well and is useful for chat art and borders.',
  },
  {
    name: 'Braille',
    category: 'Drawing',
    status: 'Supported',
    characters: splitCharacters(
      '⣿⣶⣤⣀⠿⠛⠉⣄⣾⣦⣆⣰⣇⢀⢸⡇⠁⠂⠄',
    ),
    notes: 'Rendered successfully and can be used for detailed text art.',
  },
  {
    name: 'Geometric and technical symbols',
    category: 'Symbols',
    status: 'Supported',
    characters: splitCharacters(
      '■□▪▫●○◎◉◆◇◈◊▲△▶▷▼▽◢◣◤◥⌂⌐⌒⌘⌙⌚⌛⏎⊕⊗⊙⊥⊢⊣',
    ),
    notes: 'The tested shapes and technical symbols rendered.',
  },
  {
    name: 'Mathematical Alphanumeric Symbols',
    category: 'Decorative fonts',
    status: 'Unsupported',
    characters: splitCharacters(
      '𝐀𝐁𝐂𝑨𝑩𝑪𝒜ℬ𝒞𝓐𝓑𝓒𝔄𝔅ℭ𝕬𝕭𝕮𝔸𝔹ℂ𝖠𝖡𝖢𝗔𝗕𝗖𝘈𝘉𝘊𝙰𝙱𝙲',
    ),
    notes: 'These fancy font characters were removed or normalised.',
  },
  {
    name: 'Playing Cards',
    category: 'Symbols',
    status: 'Unsupported',
    characters: splitCharacters('🂡🂱🃁🃑'),
    notes: 'The tested playing-card symbols did not render.',
  },
  {
    name: 'Mahjong and Domino Tiles',
    category: 'Symbols',
    status: 'Unsupported',
    characters: splitCharacters('🀄🀙🀚🀛🀱🀲🀳'),
    notes: 'The tested Mahjong and domino symbols did not render.',
  },
  {
    name: 'Chess and Zodiac Symbols',
    category: 'Symbols',
    status: 'Unsupported',
    characters: splitCharacters(
      '♔♕♖♗♘♙♚♛♜♝♞♟♈♉♊♋♌♍♎♏♐♑♒♓',
    ),
    notes: 'The tested chess and zodiac characters did not render.',
  },
  {
    name: 'Osmanya',
    category: 'Supplementary-plane script',
    status: 'Unsupported',
    characters: Array.from('𐒀𐒁𐒂𐒃𐒄𐒅𐒆𐒇'),
    notes: 'The tested Osmanya characters did not render.',
  },
  {
    name: 'Combining Marks',
    category: 'Text effects',
    status: 'Partial',
    characters: splitCharacters('̶̷̸̲̳̹͟͠⃝⃞⃤⃠'),
    notes:
      'Most combining effects were stripped, normalised or displayed inconsistently.',
  },
]

export function checkCharacter(character: string) {
  for (const record of compatibilityRecords) {
    if (record.characters.includes(character)) {
      return record
    }
  }

  return null
}