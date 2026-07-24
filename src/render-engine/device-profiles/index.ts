import type { DeviceProfile, DeviceProfileId, DeviceProfileOverrides } from '../types'

/**
 * Default geometry is measured from the committed Kingshot reference captures.
 * The Android profile targets the compact chat capture. The iPhone profile
 * represents the expanded in-game capture and remains a calibration candidate.
 */
export const DEVICE_PROFILES: Record<DeviceProfileId, DeviceProfile> = {
  'android-default': { id: 'android-default', label: 'Phone · compact chat', cellWidth: 12.5, cellHeight: 32, gridFontSize: 22, lineHeight: 1, emojiScale: 1.05, chatBubbleWidth: 426, bubblePadding: 14, bubbleInlinePadding: 36, avatarSize: 34 },
  'iphone-default': { id: 'iphone-default', label: 'Phone · expanded game UI', cellWidth: 14, cellHeight: 32, gridFontSize: 26, lineHeight: 1, emojiScale: 1.03, chatBubbleWidth: 438, bubblePadding: 18, bubbleInlinePadding: 28, avatarSize: 42 },
  tablet: { id: 'tablet', label: 'Tablet', cellWidth: 11, cellHeight: 34, gridFontSize: 24, lineHeight: 1, emojiScale: 1.06, chatBubbleWidth: 520, bubblePadding: 20, bubbleInlinePadding: 24, avatarSize: 40 },
  'desktop-preview': { id: 'desktop-preview', label: 'Desktop preview', cellWidth: 12, cellHeight: 36, gridFontSize: 26, lineHeight: 1, emojiScale: 1.08, chatBubbleWidth: 640, bubblePadding: 24, bubbleInlinePadding: 28, avatarSize: 44 },
}

export function resolveDeviceProfile(id: DeviceProfileId, overrides: DeviceProfileOverrides = {}): DeviceProfile { return { ...DEVICE_PROFILES[id], ...overrides[id] } }
