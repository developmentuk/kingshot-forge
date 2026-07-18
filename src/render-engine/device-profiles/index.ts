import type { DeviceProfile, DeviceProfileId } from '../types'

export const DEVICE_PROFILES: Record<DeviceProfileId, DeviceProfile> = {
  'android-default': { id: 'android-default', label: 'Android default', cellWidth: 10, cellHeight: 17, gridFontSize: 13, lineHeight: 1.08, emojiScale: 1.08, chatBubbleWidth: 360, bubblePadding: 16, avatarSize: 34 },
  'iphone-default': { id: 'iphone-default', label: 'iPhone default', cellWidth: 10, cellHeight: 17, gridFontSize: 13, lineHeight: 1.08, emojiScale: 1.06, chatBubbleWidth: 360, bubblePadding: 16, avatarSize: 34 },
  tablet: { id: 'tablet', label: 'Tablet', cellWidth: 11, cellHeight: 18, gridFontSize: 14, lineHeight: 1.1, emojiScale: 1.1, chatBubbleWidth: 500, bubblePadding: 20, avatarSize: 40 },
  'desktop-preview': { id: 'desktop-preview', label: 'Desktop preview', cellWidth: 12, cellHeight: 20, gridFontSize: 15, lineHeight: 1.1, emojiScale: 1.12, chatBubbleWidth: 640, bubblePadding: 24, avatarSize: 44 },
}

export function resolveDeviceProfile(id: DeviceProfileId): DeviceProfile { return DEVICE_PROFILES[id] }

