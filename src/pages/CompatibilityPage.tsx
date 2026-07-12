import { useMemo, useState } from 'react'
import {
  checkCharacter,
  compatibilityRecords,
} from '../data/compatibility'

function CompatibilityPage() {
  const [input, setInput] = useState('ᚱ')
  const [selectedCharacter, setSelectedCharacter] = useState('ᚱ')

  const result = useMemo(
    () => checkCharacter(selectedCharacter),
    [selectedCharacter],
  )

  const testedCount = compatibilityRecords.reduce(
    (total, record) => total + record.characters.length,
    0,
  )

  function testFirstCharacter() {
    const characters = Array.from(input.trim())

    setSelectedCharacter(characters[0] ?? '')
  }

  function selectInputCharacter(character: string) {
    setSelectedCharacter(character)
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Compatibility Lab</p>

        <h1 className="page-title">
          Check a Kingshot character
        </h1>

        <p>
          Paste a character to see whether it belongs to one of our tested
          character groups.
        </p>
      </div>

      <div className="compatibility-stats">
        <div>
          <strong>{testedCount}</strong>
          <span>characters recorded</span>
        </div>

        <div>
          <strong>{compatibilityRecords.length}</strong>
          <span>tested groups</span>
        </div>

        <div>
          <strong>
            {
              compatibilityRecords.filter(
                (record) => record.status === 'Supported',
              ).length
            }
          </strong>
          <span>supported groups</span>
        </div>
      </div>

      <div className="compatibility-tool">
        <div className="compatibility-tool__controls">
          <div className="field">
            <label htmlFor="compatibility-input">
              Paste one or more characters
            </label>

            <textarea
              id="compatibility-input"
              rows={5}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste a character here"
            />

            <span className="field__help">
              Choose a character below or test the first character entered.
            </span>
          </div>

          <button
            type="button"
            className="button button--primary"
            disabled={!input.trim()}
            onClick={testFirstCharacter}
          >
            Test First Character
          </button>

          {Array.from(input.trim()).length > 0 && (
            <div className="input-character-list">
              {Array.from(input.trim()).map((character, index) => (
                <button
                  key={`${character}-${index}`}
                  type="button"
                  className={
                    selectedCharacter === character
                      ? 'input-character input-character--active'
                      : 'input-character'
                  }
                  onClick={() => selectInputCharacter(character)}
                >
                  {character}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="compatibility-result">
          <p className="preview-window__label">Result</p>

          {selectedCharacter ? (
            <>
              <div className="compatibility-glyph">
                {selectedCharacter}
              </div>

              <div
                className={
                  result
                    ? `compatibility-status compatibility-status--${result.status.toLowerCase()}`
                    : 'compatibility-status compatibility-status--untested'
                }
              >
                <strong>
                  {result?.status ?? 'Untested'}
                </strong>

                <span>
                  {result
                    ? result.name
                    : 'This character is not yet in our database.'}
                </span>
              </div>

              <dl className="compatibility-details">
                <div>
                  <dt>Character</dt>
                  <dd>{selectedCharacter}</dd>
                </div>

                <div>
                  <dt>Unicode code point</dt>
                  <dd>
                    U+
                    {selectedCharacter
                      .codePointAt(0)
                      ?.toString(16)
                      .toUpperCase()
                      .padStart(4, '0')}
                  </dd>
                </div>

                <div>
                  <dt>Group</dt>
                  <dd>{result?.name ?? 'Unknown'}</dd>
                </div>

                <div>
                  <dt>Category</dt>
                  <dd>{result?.category ?? 'Not recorded'}</dd>
                </div>
              </dl>

              <div className="compatibility-notes">
                <strong>Research note</strong>

                <p>
                  {result?.notes ??
                    'We have not yet tested or recorded this character.'}
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span>🧪</span>
              <h2>No character selected</h2>
              <p>Paste a character to begin.</p>
            </div>
          )}
        </div>
      </div>

      <div className="compatibility-disclaimer">
        <strong>Important</strong>

        <p>
          A supported result means the character or its group rendered during
          our Kingshot chat testing. Player names, alliance names and mail may
          use different filters.
        </p>
      </div>
    </section>
  )
}

export default CompatibilityPage