export type GiftCode = {
  id: number
  code: string
  expiresAt: string | null
  createdAt: string
}

export type GiftCodesResponse = {
  status: 'success'
  data: {
    giftCodes: GiftCode[]
    total: number
    activeCount: number
    expiredCount: number
  }
  message: string
  timestamp: string
}