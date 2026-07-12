import { Link } from 'react-router'

type CodexEntry = {
  title: string
  status: 'Supported' | 'Unsupported' | 'Partial'
  summary: string
  examples: string
}

const codexEntries: CodexEntry[] = [
  {
    title: 'Runic',
    status: 'Supported',
    summary:
      'The tested Runic alphabet rendered clearly and works particularly well for Viking and fantasy-style names.',
    examples: 'ᚠ ᚨ ᚱ ᚲ ᛁ ᛏ ᛟ ᛉ',
  },
  {
    title: 'Greek',
    status: 'Supported',
    summary:
      'Uppercase and lowercase Greek characters rendered successfully and provide many readable Latin-style alternatives.',
    examples: 'Α Δ Θ Λ Ξ Ω Ψ α β γ δ λ π ω',
  },
  {
    title: 'Cyrillic',
    status: 'Supported',
    summary:
      'Uppercase and lowercase Cyrillic rendered successfully and offer a large number of useful name characters.',
    examples: 'А Б В Ж И Ф Ц Ч Ш Щ Ю Я',
  },
  {
    title: 'Armenian and Georgian',
    status: 'Supported',
    summary:
      'The tested Armenian and Georgian scripts rendered clearly and include many distinctive fantasy-style shapes.',
    examples: 'Ա Բ Գ Դ Ֆ Ք Օ Ⴀ Ⴁ ა ბ გ',
  },
  {
    title: 'Coptic and Glagolitic',
    status: 'Supported',
    summary:
      'These historic scripts rendered successfully and are useful for ancient, mystical and unusual name styles.',
    examples: 'Ⲁ Ⲃ Ⲅ Ⲙ Ⲱ Ⰰ Ⰱ Ⰲ Ⰳ',
  },
  {
    title: 'Latin Extended and IPA',
    status: 'Supported',
    summary:
      'Many extended Latin and phonetic characters rendered successfully and remain relatively easy to read.',
    examples: 'Ⱥ Ƀ Ȼ Ƒ Ƭ Ɍ Ɏ ʚ ɞ ɸ ɯ',
  },
  {
    title: 'Canadian Aboriginal Syllabics',
    status: 'Supported',
    summary:
      'These characters rendered successfully and include several popular lookalikes used in fantasy usernames.',
    examples: 'ᐁ ᐊ ᑭ ᒪ ᕼ ᖇ',
  },
  {
    title: 'Thai and Tibetan Decorations',
    status: 'Supported',
    summary:
      'Thai numerals and Tibetan ornamental characters rendered well and are useful for framing player names.',
    examples: '๑ ๒ ๓ ༺ ༻ ༼ ༽ ༄',
  },
  {
    title: 'CJK Brackets and Japanese Characters',
    status: 'Supported',
    summary:
      'CJK brackets, punctuation, Katakana and selected Japanese characters rendered and work well in names and text art.',
    examples: '【 】 《 》 『 』 ツ シ ソ ン ノ',
  },
  {
    title: 'Box Drawing and Geometric Shapes',
    status: 'Supported',
    summary:
      'Borders, corners, triangles, circles and diamonds rendered well and are useful for banners and artwork.',
    examples: '╔ ═ ╗ ║ ╚ ╝ ◢ ◣ ◤ ◥ ◆ ◇',
  },
  {
    title: 'Braille Patterns',
    status: 'Supported',
    summary:
      'Braille patterns rendered successfully and can be combined to create detailed shading and pixel-style artwork.',
    examples: '⣿ ⣶ ⣤ ⣀ ⠿ ⠛ ⠉',
  },
  {
    title: 'Technical and Mathematical Operators',
    status: 'Supported',
    summary:
      'Several older technical and mathematical symbols rendered successfully and can be used as decorative building blocks.',
    examples: '⌚ ⌛ ⊕ ⊗ ⊙ ⊥ ⊢ ⊣',
  },
  {
    title: 'Mathematical Fancy Alphabets',
    status: 'Unsupported',
    summary:
      'Most bold, script, Fraktur, monospace and other mathematical alphabet styles were stripped or normalised.',
    examples: '𝐀 𝑨 𝒜 𝓐 𝔄 𝕬 𝖠 𝗔',
  },
  {
    title: 'Chess, Mahjong, Domino and Playing Cards',
    status: 'Unsupported',
    summary:
      'The tested characters from these symbol blocks did not render in Kingshot chat.',
    examples: '♔ ♛ 🀄 🀱 🂡',
  },
  {
    title: 'Zodiac and Alchemical Symbols',
    status: 'Unsupported',
    summary:
      'The tested zodiac and alchemical symbols did not render.',
    examples: '♈ ♉ ♊ 🜁 🜂 🜃',
  },
  {
    title: 'Osmanya',
    status: 'Unsupported',
    summary:
      'The tested Osmanya characters did not render, likely because the script sits outside the Basic Multilingual Plane.',
    examples: '𐒀 𐒁 𐒂',
  },
  {
    title: 'Combining Marks',
    status: 'Partial',
    summary:
      'Most combining marks were removed, normalised or displayed inconsistently, so they are not recommended for reliable designs.',
    examples: 'A̶ A̷ A̲ A⃝',
  },
]

const supportedCount = codexEntries.filter(
  (entry) => entry.status === 'Supported',
).length

const unsupportedCount = codexEntries.filter(
  (entry) => entry.status === 'Unsupported',
).length

const partialCount = codexEntries.filter(
  (entry) => entry.status === 'Partial',
).length

function CodexPage() {
  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Kingshot Codex</p>

        <h1 className="page-title">Our Kingshot character research</h1>

        <p>
          A record of the scripts, symbols and character families tested
          manually inside Kingshot chat.
        </p>
      </div>

      <div className="codex-summary">
        <div>
          <strong>{supportedCount}</strong>
          <span>Supported groups</span>
        </div>

        <div>
          <strong>{unsupportedCount}</strong>
          <span>Unsupported groups</span>
        </div>

        <div>
          <strong>{partialCount}</strong>
          <span>Partial groups</span>
        </div>
      </div>

      <div className="codex-intro">
        <div>
          <h2>What our results mean</h2>

          <p>
            <strong>Supported</strong> means the tested character group
            displayed successfully in Kingshot chat.
          </p>

          <p>
            <strong>Unsupported</strong> means the tested characters
            disappeared, were replaced or failed to render.
          </p>

          <p>
            <strong>Partial</strong> means results were inconsistent or not
            dependable enough for general use.
          </p>
        </div>

        <div className="codex-actions">
          <Link className="button button--primary" to="/characters">
            Browse Characters
          </Link>

          <Link className="button button--secondary" to="/compatibility">
            Test a Character
          </Link>
        </div>
      </div>

      <div className="codex-grid">
        {codexEntries.map((entry) => (
          <article className="codex-card" key={entry.title}>
            <div className="codex-card__heading">
              <h2>{entry.title}</h2>

              <span
                className={`codex-status codex-status--${entry.status.toLowerCase()}`}
              >
                {entry.status}
              </span>
            </div>

            <p>{entry.summary}</p>

            <div className="codex-examples">
              <span>Examples</span>
              <pre>{entry.examples}</pre>
            </div>
          </article>
        ))}
      </div>

      <div className="codex-warning">
        <div>
          <strong>Chat-tested does not always mean name-tested</strong>

          <p>
            Kingshot may apply different restrictions to chat, player names,
            alliance names and mail.
          </p>
        </div>

        <p>
          Always paste a finished name into Kingshot before spending a
          name-change item.
        </p>
      </div>
    </section>
  )
}

export default CodexPage