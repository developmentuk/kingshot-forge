export type ChatTemplateName =
  | 'Important'
  | 'Rally'
  | 'Bear Trap'
  | 'KvK'
  | 'Recruitment'
  | 'Funny'

export type ChatTemplate = {
  label: string
  top: string
  bottom: string
  defaultHeading: string
  defaultMessage: string
}

export const chatTemplates: Record<
  ChatTemplateName,
  ChatTemplate
> = {
  Important: {
    label: 'Important announcement',
    top: '✦ ━━━━━━━━━ ✦',
    bottom: '✦ ━━━━━━━━━ ✦',
    defaultHeading: '📢 IMPORTANT 📢',
    defaultMessage: 'Please read the message below.',
  },

  Rally: {
    label: 'Rally alert',
    top: '⚔️ ═══════════ ⚔️',
    bottom: '⚔️ ═══════════ ⚔️',
    defaultHeading: '🚨 RALLY NOW 🚨',
    defaultMessage:
      'Join the rally and use the correct formation.',
  },

  'Bear Trap': {
    label: 'Bear Trap',
    top: '🐻 ━━━━━━━━━ 🐻',
    bottom: '🐻 ━━━━━━━━━ 🐻',
    defaultHeading: '🔥 BEAR TRAP 🔥',
    defaultMessage: 'Bear Trap starts in 10 minutes!',
  },

  KvK: {
    label: 'KvK alert',
    top: '◤━━━━ ⚔️ ━━━━◥',
    bottom: '◣━━━━ ⚔️ ━━━━◢',
    defaultHeading: '🏰 KVK ALERT 🏰',
    defaultMessage:
      'Save your resources and prepare for battle.',
  },

  Recruitment: {
    label: 'Recruitment',
    top: '✯ ✯ ✯ ✯ ✯ ✯ ✯',
    bottom: '✯ ✯ ✯ ✯ ✯ ✯ ✯',
    defaultHeading: '📢 RECRUITING 📢',
    defaultMessage:
      'Active players wanted. Join us today!',
  },

  Funny: {
    label: 'Funny announcement',
    top: '✦ ━━━━━━━━━ ✦',
    bottom: '✦ ━━━━━━━━━ ✦',
    defaultHeading: '📢 IMPORTANT 📢',
    defaultMessage: '🍍 Pineapple belongs on pizza.',
  },
}

export function buildChatMessage(
  templateName: ChatTemplateName,
  heading: string,
  message: string,
) {
  const template = chatTemplates[templateName]

  return [
    template.top,
    heading.trim(),
    message.trim(),
    template.bottom,
  ]
    .filter(Boolean)
    .join('\n')
}