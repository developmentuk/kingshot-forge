import { useMemo, useState } from 'react'
import EmojiPicker from '../components/EmojiPicker'
import {
  buildChatMessage,
  chatTemplates,
  type ChatTemplateName,
} from '../data/chatTemplates'

function ChatStudioPage() {
  const [templateName, setTemplateName] =
    useState<ChatTemplateName>('Important')

  const [heading, setHeading] = useState(
    chatTemplates.Important.defaultHeading,
  )

  const [message, setMessage] = useState(
    chatTemplates.Important.defaultMessage,
  )

  const [copied, setCopied] = useState(false)

  const output = useMemo(
    () => buildChatMessage(templateName, heading, message),
    [templateName, heading, message],
  )

  const isNearLimit = output.length >= 450
  const isOverLimit = output.length > 500

  function changeTemplate(newTemplateName: ChatTemplateName) {
    const template = chatTemplates[newTemplateName]

    setTemplateName(newTemplateName)
    setHeading(template.defaultHeading)
    setMessage(template.defaultMessage)
    setCopied(false)
  }

  function addEmoji(emoji: string) {
    setMessage((currentMessage) => {
      const needsSpace =
        currentMessage.length > 0 &&
        !currentMessage.endsWith(' ') &&
        !currentMessage.endsWith('\n')

      return `${currentMessage}${needsSpace ? ' ' : ''}${emoji}`
    })
  }

  async function copyMessage() {
    if (!output || isOverLimit) {
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1600)
    } catch {
      alert(
        'Copy failed. Please select and copy the message manually.',
      )
    }
  }

  function resetMessage() {
    const template = chatTemplates[templateName]

    setHeading(template.defaultHeading)
    setMessage(template.defaultMessage)
    setCopied(false)
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Chat Forge</p>

        <h1 className="page-title">
          Forge a Kingshot announcement
        </h1>

        <p>
          Choose a template, customise the wording and copy the
          finished message into Kingshot chat.
        </p>
      </div>

      <div className="chat-builder">
        <div className="chat-builder__controls">
          <div className="field">
            <label htmlFor="chat-template">Template</label>

            <select
              id="chat-template"
              value={templateName}
              onChange={(event) =>
                changeTemplate(
                  event.target.value as ChatTemplateName,
                )
              }
            >
              {Object.entries(chatTemplates).map(
                ([name, template]) => (
                  <option key={name} value={name}>
                    {template.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="chat-heading">Heading</label>

            <input
              id="chat-heading"
              type="text"
              value={heading}
              maxLength={100}
              onChange={(event) => setHeading(event.target.value)}
              placeholder="Enter a heading"
            />
          </div>

          <div className="field">
            <label htmlFor="chat-message">Message</label>

            <textarea
              id="chat-message"
              value={message}
              maxLength={600}
              rows={7}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Enter your message"
            />

            <span className="field__help">
              {message.length}/600 message characters
            </span>
          </div>

          <EmojiPicker onSelect={addEmoji} />

          <button
            type="button"
            className="button button--secondary"
            onClick={resetMessage}
          >
            Reset Template
          </button>
        </div>

        <div className="chat-builder__result">
          <p className="preview-window__label">
            Kingshot chat preview
          </p>

          <pre className="chat-output" aria-live="polite">
            {output || 'Your message will appear here'}
          </pre>

          <div className="generated-name__actions">
            <button
              type="button"
              className="button button--primary"
              disabled={!output || isOverLimit}
              onClick={copyMessage}
            >
              {copied ? 'Copied!' : 'Copy Message'}
            </button>

            <span>{output.length}/500 characters</span>
          </div>

          <div
            className={
              isOverLimit
                ? 'chat-warning chat-warning--danger'
                : isNearLimit
                  ? 'chat-warning chat-warning--caution'
                  : 'chat-warning'
            }
          >
            <strong>
              {isOverLimit
                ? 'Message is over the limit'
                : isNearLimit
                  ? 'Approaching the recommended limit'
                  : 'Kingshot-friendly format'}
            </strong>

            <p>
              {isOverLimit
                ? 'Shorten the heading or message before copying.'
                : isNearLimit
                  ? 'Your message is close to 500 characters.'
                  : 'This template uses tested Kingshot-friendly characters.'}
            </p>
          </div>
        </div>
      </div>

      <div className="template-gallery">
        {Object.entries(chatTemplates).map(
          ([name, template]) => (
            <button
              key={name}
              type="button"
              className={
                templateName === name
                  ? 'template-card template-card--active'
                  : 'template-card'
              }
              onClick={() =>
                changeTemplate(name as ChatTemplateName)
              }
            >
              <span className="template-card__label">
                {template.label}
              </span>

              <pre>{`${template.top}
${template.defaultHeading}
${template.defaultMessage}
${template.bottom}`}</pre>
            </button>
          ),
        )}
      </div>
    </section>
  )
}

export default ChatStudioPage