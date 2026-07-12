import { useMemo, useState } from 'react'

type CharacterGroup = {
  id: string
  name: string
  category: string
  description: string
  characters: string[]
  nameFriendly?: boolean
}

function createCharacters(value: string) {
  return value.split(/\s+/).filter(Boolean)
}

const characterGroups: CharacterGroup[] = [
  {
    id: 'decorations',
    name: 'Decorations and Ornaments',
    category: 'Decorations',
    description: 'Ornaments, wings and decorative framing characters.',
    characters: createCharacters(`
      ༺ ༻ ༼ ༽ ༄ ༅ ༈
      ʚ ɞ
      ๓ ๑ ๒ ๔ ๕
    `),
    nameFriendly: true,
  },
  {
    id: 'runic',
    name: 'Runic',
    category: 'Historic Scripts',
    description: 'Runic letters tested successfully in Kingshot.',
    characters: createCharacters(`
      ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ
      ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛋ
      ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ
    `),
    nameFriendly: true,
  },
  {
    id: 'greek-uppercase',
    name: 'Greek Uppercase',
    category: 'Greek',
    description: 'Uppercase Greek letters.',
    characters: createCharacters(`
      Α Β Γ Δ Ε Ζ Η Θ
      Ι Κ Λ Μ Ν Ξ Ο Π
      Ρ Σ Τ Υ Φ Χ Ψ Ω
    `),
    nameFriendly: true,
  },
  {
    id: 'greek-lowercase',
    name: 'Greek Lowercase',
    category: 'Greek',
    description: 'Lowercase Greek letters.',
    characters: createCharacters(`
      α β γ δ ε ζ η θ
      ι κ λ μ ν ξ ο π
      ρ σ τ υ φ χ ψ ω
    `),
    nameFriendly: true,
  },
  {
    id: 'cyrillic-uppercase',
    name: 'Cyrillic Uppercase',
    category: 'Cyrillic',
    description: 'Uppercase Cyrillic letters.',
    characters: createCharacters(`
      А Б В Г Д Е Ж З
      И Й К Л М Н О П
      Р С Т У Ф Х Ц Ч
      Ш Щ Ъ Ы Ь Э Ю Я
    `),
    nameFriendly: true,
  },
  {
    id: 'cyrillic-lowercase',
    name: 'Cyrillic Lowercase',
    category: 'Cyrillic',
    description: 'Lowercase Cyrillic letters.',
    characters: createCharacters(`
      а б в г д е ж з
      и й к л м н о п
      р с т у ф х ц ч
      ш щ ъ ы ь э ю я
    `),
    nameFriendly: true,
  },
  {
    id: 'armenian-uppercase',
    name: 'Armenian Uppercase',
    category: 'Armenian',
    description: 'Uppercase Armenian letters.',
    characters: createCharacters(`
      Ա Բ Գ Դ Ե Զ Է Ը
      Թ Ժ Ի Լ Խ Ծ Կ Հ
      Ձ Ղ Ճ Մ Յ Ն Շ Ո
      Չ Պ Ջ Ռ Ս Վ Տ Ր
      Ց Ւ Փ Ք Օ Ֆ
    `),
    nameFriendly: true,
  },
  {
    id: 'armenian-lowercase',
    name: 'Armenian Lowercase',
    category: 'Armenian',
    description: 'Lowercase Armenian letters.',
    characters: createCharacters(`
      ա բ գ դ ե զ է ը
      թ ժ ի լ խ ծ կ հ
      ձ ղ ճ մ յ ն շ ո
      չ պ ջ ռ ս վ տ ր
      ց ւ փ ք օ ֆ
    `),
    nameFriendly: true,
  },
  {
    id: 'georgian-uppercase',
    name: 'Georgian Uppercase',
    category: 'Georgian',
    description: 'Historic Georgian uppercase characters.',
    characters: createCharacters(`
      Ⴀ Ⴁ Ⴂ Ⴃ Ⴄ Ⴅ Ⴆ Ⴇ
      Ⴈ Ⴉ Ⴊ Ⴋ Ⴌ Ⴍ Ⴎ Ⴏ
      Ⴐ Ⴑ Ⴒ Ⴓ Ⴔ Ⴕ Ⴖ Ⴗ
      Ⴘ Ⴙ Ⴚ Ⴛ Ⴜ Ⴝ Ⴞ Ⴟ
    `),
    nameFriendly: true,
  },
  {
    id: 'georgian-lowercase',
    name: 'Georgian',
    category: 'Georgian',
    description: 'Modern Georgian characters.',
    characters: createCharacters(`
      ა ბ გ დ ე ვ ზ თ
      ი კ ლ მ ნ ო პ ჟ
      რ ს ტ უ ფ ქ ღ ყ
      შ ჩ ც ძ წ ჭ ხ ჯ ჰ
    `),
    nameFriendly: true,
  },
  {
    id: 'glagolitic',
    name: 'Glagolitic',
    category: 'Historic Scripts',
    description: 'Historic Slavic characters.',
    characters: createCharacters(`
      Ⰰ Ⰱ Ⰲ Ⰳ Ⰴ
      Ⰵ Ⰶ Ⰷ Ⰸ Ⰹ
      Ⰺ Ⰻ Ⰼ Ⰽ Ⰾ
      Ⰿ Ⱀ Ⱁ Ⱂ Ⱃ
    `),
    nameFriendly: true,
  },
  {
    id: 'coptic-uppercase',
    name: 'Coptic Uppercase',
    category: 'Coptic',
    description: 'Uppercase Coptic characters.',
    characters: createCharacters(`
      Ⲁ Ⲃ Ⲅ Ⲇ Ⲉ Ⲋ
      Ⲍ Ⲏ Ⲑ Ⲓ Ⲕ Ⲗ
      Ⲙ Ⲛ Ⲝ Ⲟ Ⲡ Ⲣ
      Ⲥ Ⲧ Ⲩ Ⲫ Ⲭ Ⲯ Ⲱ
    `),
    nameFriendly: true,
  },
  {
    id: 'coptic-lowercase',
    name: 'Coptic Lowercase',
    category: 'Coptic',
    description: 'Lowercase Coptic characters.',
    characters: createCharacters(`
      ⲁ ⲃ ⲅ ⲇ ⲉ ⲋ
      ⲍ ⲏ ⲑ ⲓ ⲕ ⲗ
      ⲙ ⲛ ⲝ ⲟ ⲡ ⲣ
      ⲥ ⲧ ⲩ ⲫ ⲭ ⲯ ⲱ
    `),
    nameFriendly: true,
  },
  {
    id: 'hebrew',
    name: 'Hebrew',
    category: 'Hebrew and Arabic',
    description: 'Hebrew letters tested in Kingshot.',
    characters: createCharacters(`
      א ב ג ד ה ו ז
      ח ט י כ ל מ נ
      ס ע פ צ ק ר ש ת
    `),
    nameFriendly: true,
  },
  {
    id: 'arabic',
    name: 'Arabic',
    category: 'Hebrew and Arabic',
    description: 'Arabic letters. Their shape may change when joined.',
    characters: createCharacters(`
      ا ب ت ث ج ح خ
      د ذ ر ز س ش ص
      ض ط ظ ع غ ف ق
      ك ل م ن ه و ي
    `),
    nameFriendly: true,
  },
  {
    id: 'thai-numerals',
    name: 'Thai Numerals',
    category: 'Thai',
    description: 'Thai numerals often used as decorations.',
    characters: createCharacters(`
      ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙ ๐
    `),
    nameFriendly: true,
  },
  {
    id: 'thai-letters',
    name: 'Thai Letters',
    category: 'Thai',
    description: 'Thai characters tested in Kingshot.',
    characters: createCharacters(`
      ก ข ฃ ค ฅ ฆ ง จ ฉ ช
      ซ ญ ฎ ฏ ฐ ฑ ฒ ณ ด ต
      ถ ท ธ น บ ป ผ ฝ พ ฟ
      ภ ม ย ร ล ว ศ ษ ส ห
      ฬ อ ฮ
    `),
    nameFriendly: true,
  },
  {
    id: 'ethiopic',
    name: 'Ethiopic',
    category: 'African Scripts',
    description: 'Ethiopic or Ge’ez characters.',
    characters: createCharacters(`
      ሀ ሁ ሂ ሃ ሄ ህ ሆ
      ለ ሉ ሊ ላ ሌ ል ሎ
      መ ሙ ሚ ማ ሜ ም ሞ
      ረ ሩ ሪ ራ ሬ ር ሮ
      ሰ ሱ ሲ ሳ ሴ ስ ሶ
    `),
    nameFriendly: true,
  },
  {
    id: 'tifinagh',
    name: 'Tifinagh',
    category: 'African Scripts',
    description: 'Geometric Tifinagh characters.',
    characters: createCharacters(`
      ⴰ ⴱ ⴳ ⴷ ⴹ
      ⴻ ⴼ ⴽ ⵀ ⵃ
      ⵄ ⵅ ⵇ ⵉ ⵊ
      ⵍ ⵎ ⵏ ⵓ ⵔ
      ⵕ ⵖ ⵙ ⵜ ⵡ
    `),
    nameFriendly: true,
  },
  {
    id: 'canadian',
    name: 'Canadian Aboriginal Syllabics',
    category: 'Canadian',
    description: 'Popular for fantasy-style names.',
    characters: createCharacters(`
      ᐁ ᐃ ᐅ ᐊ
      ᑕ ᑎ ᑐ ᑌ
      ᒥ ᒧ ᒪ
      ᓂ ᓄ ᓇ
      ᕼ ᕽ ᖇ ᖈ
    `),
    nameFriendly: true,
  },
  {
    id: 'latin-extended',
    name: 'Latin Extended',
    category: 'Latin and IPA',
    description: 'Stylised letters that remain part of real Latin scripts.',
    characters: createCharacters(`
      Ɓ Ƃ Ƅ Ƈ ƈ
      Ɗ Ƌ ƌ
      Ƒ Ɠ Ɨ
      Ɲ Ƥ ƥ
      Ƭ Ʈ
      Ʋ Ƴ
      Ⱥ Ƀ Ȼ Ɍ Ɏ
      Ƶ Ʒ
      ƛ ƾ Ƿ Ȣ Ȝ Ʌ Ɋ Ɂ
    `),
    nameFriendly: true,
  },
  {
    id: 'ipa',
    name: 'IPA and Phonetic Characters',
    category: 'Latin and IPA',
    description: 'Phonetic characters useful for stylised usernames.',
    characters: createCharacters(`
      ʚ ɞ
      ʘ ʬ ʭ
      ɷ ɸ ɹ ɺ
      ɯ ʎ ʀ
      ɑ ɓ ƈ ɖ ɛ ʄ ɠ ɦ
      ɨ ʝ ƙ ʟ ʍ ռ օ ք
      զ ʂ ȶ ʊ ʋ ʏ ʐ
    `),
    nameFriendly: true,
  },
  {
    id: 'katakana',
    name: 'Katakana',
    category: 'Japanese and Korean',
    description: 'Japanese Katakana characters useful in faces and art.',
    characters: createCharacters(`
      ア イ ウ エ オ
      カ キ ク ケ コ
      サ シ ス セ ソ
      タ チ ツ テ ト
      ナ ニ ヌ ネ ノ
      ハ ヒ フ ヘ ホ
      マ ミ ム メ モ
      ヤ ユ ヨ
      ラ リ ル レ ロ
      ワ ヲ ン
    `),
  },
  {
    id: 'halfwidth-katakana',
    name: 'Halfwidth Katakana',
    category: 'Japanese and Korean',
    description: 'Compact Japanese characters.',
    characters: createCharacters(`
      ｦ ｧ ｨ ｩ ｪ ｫ
      ｬ ｭ ｮ ｯ ｰ
    `),
  },
  {
    id: 'hangul-jamo',
    name: 'Hangul Jamo',
    category: 'Japanese and Korean',
    description: 'Korean letter components useful in text art.',
    characters: createCharacters(`
      ㅁ ㅇ ㄱ ㄴ ㅎ
      ㄷ ㄹ ㅂ ㅅ ㅈ
      ㅋ ㅌ ㅍ ㅊ
    `),
  },
  {
    id: 'cjk-brackets',
    name: 'CJK Brackets',
    category: 'CJK Punctuation',
    description: 'Useful for framing names and headings.',
    characters: createCharacters(`
      「 」 『 』 【 】 〖 〗
      《 》 〈 〉 〔 〕
    `),
    nameFriendly: true,
  },
  {
    id: 'cjk-punctuation',
    name: 'CJK Punctuation',
    category: 'CJK Punctuation',
    description: 'Japanese and CJK punctuation.',
    characters: createCharacters(`
      ・ ー 〜 ヽ ヾ
      ※ 〆 々 〇 〒 〓 〰 ﹏
    `),
  },
  {
    id: 'box-drawing-double',
    name: 'Box Drawing — Double',
    category: 'Drawing and Shapes',
    description: 'Double-line borders and frames.',
    characters: createCharacters(`
      ╔ ═ ╗ ║ ╚ ╝
      ╠ ╣ ╦ ╩ ╬
      ╢ ╟ ╤ ╧ ╪ ╫
    `),
  },
  {
    id: 'box-drawing-single',
    name: 'Box Drawing — Single',
    category: 'Drawing and Shapes',
    description: 'Single-line borders and frames.',
    characters: createCharacters(`
      ┌ ─ ┐ │ └ ┘
      ├ ┤ ┬ ┴ ┼
      ┏ ━ ┓ ┃ ┗ ┛
      ╭ ╮ ╰ ╯ ╳
    `),
  },
  {
    id: 'geometric',
    name: 'Geometric Shapes',
    category: 'Drawing and Shapes',
    description: 'Shapes useful in banners and pixel art.',
    characters: createCharacters(`
      ■ □ ▪ ▫
      ● ○ ◎ ◉
      ◆ ◇ ◈ ◊
      ▲ △ ▶ ▷ ▼ ▽
      ◢ ◣ ◤ ◥
    `),
  },
  {
    id: 'block-elements',
    name: 'Block Elements',
    category: 'Drawing and Shapes',
    description: 'Shading blocks for text and pixel art.',
    characters: createCharacters(`
      █ ▓ ▒ ░
      ▀ ▄ ▌ ▐
    `),
  },
  {
    id: 'technical',
    name: 'Technical Symbols',
    category: 'Technical',
    description: 'Technical characters that rendered successfully.',
    characters: createCharacters(`
      ⌂ ⌐ ⌒ ⌘ ⌙ ⌚ ⌛ ⏎
      ⊕ ⊗ ⊙ ⊥ ⊢ ⊣
    `),
  },
  {
    id: 'braille',
    name: 'Braille Drawing Blocks',
    category: 'Braille',
    description: 'Useful for detailed text art and shading.',
    characters: createCharacters(`
      ⣿ ⣶ ⣤ ⣀ ⠿ ⠛ ⠉
      ⣄ ⣾ ⣦ ⣆ ⣰ ⣇
      ⢀ ⢸ ⡇ ⠁ ⠂ ⠄
    `),
  },
]

const categories = [
  'All',
  ...Array.from(new Set(characterGroups.map((group) => group.category))),
]

function CharacterLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const filteredGroups = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return characterGroups.filter((group) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        group.category === selectedCategory

      const matchesSearch =
        !search ||
        group.name.toLowerCase().includes(search) ||
        group.category.toLowerCase().includes(search) ||
        group.description.toLowerCase().includes(search) ||
        group.characters.some((character) =>
          character.includes(searchTerm),
        )

      return matchesCategory && matchesSearch
    })
  }, [searchTerm, selectedCategory])

  const visibleCharacterCount = filteredGroups.reduce(
    (total, group) => total + group.characters.length,
    0,
  )

  async function copyValue(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(id)

      window.setTimeout(() => {
        setCopiedValue(null)
      }, 1400)
    } catch {
      alert('Copy failed. Please select and copy the text manually.')
    }
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Character Library</p>

        <h1 className="page-title">
          Explore Kingshot-friendly characters
        </h1>

        <p>
          Browse the scripts, ornaments, symbols and drawing characters
          discovered during our in-game testing.
        </p>
      </div>

      <div className="character-toolbar">
        <div className="field character-search">
          <label htmlFor="character-search">
            Search the library
          </label>

          <input
            id="character-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search Runic, Greek, brackets, Braille..."
          />
        </div>

        <div className="character-summary">
          <strong>{visibleCharacterCount}</strong>
          <span>characters across {filteredGroups.length} groups</span>
        </div>
      </div>

      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category
                ? 'category-button category-button--active'
                : 'category-button'
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredGroups.length > 0 ? (
        <div className="character-groups">
          {filteredGroups.map((group) => (
            <article className="character-group" key={group.id}>
              <div className="character-group__heading">
                <div>
                  <div className="character-group__title-row">
                    <h2>{group.name}</h2>

                    {group.nameFriendly && (
                      <span className="name-friendly-badge">
                        Good for names
                      </span>
                    )}
                  </div>

                  <p>{group.description}</p>

                  <span className="character-group__count">
                    {group.characters.length} characters · {group.category}
                  </span>
                </div>

                <button
                  type="button"
                  className="copy-group-button"
                  onClick={() =>
                    copyValue(
                      group.characters.join(''),
                      `group-${group.id}`,
                    )
                  }
                >
                  {copiedValue === `group-${group.id}`
                    ? 'Copied group!'
                    : 'Copy group'}
                </button>
              </div>

              <div className="character-grid character-grid--compact">
                {group.characters.map((character, index) => {
                  const characterId = `${group.id}-${index}`

                  return (
                    <button
                      key={characterId}
                      type="button"
                      className="character-card character-card--compact"
                      onClick={() =>
                        copyValue(character, characterId)
                      }
                      title={`Copy ${character}`}
                    >
                      <span className="character-card__glyph">
                        {character}
                      </span>

                      <span className="character-card__status">
                        {copiedValue === characterId
                          ? 'Copied!'
                          : 'Copy'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>🔍</span>
          <h2>No matching groups</h2>
          <p>Try another search term or category.</p>
        </div>
      )}

      <div className="library-note">
        <div>
          <strong>Group-tested characters</strong>

          <p>
            These libraries are based on the writing systems and character
            families we tested successfully inside Kingshot.
          </p>
        </div>

        <p>
          Individual player-name filters may be stricter than chat. Always test
          a finished name before using a name-change item.
        </p>
      </div>
    </section>
  )
}

export default CharacterLibraryPage