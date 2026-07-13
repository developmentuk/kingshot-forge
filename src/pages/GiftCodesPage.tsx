import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  GiftCode,
  GiftCodesResponse,
} from '../types/giftCodes'

function formatExpiryDate(value: string | null) {
  if (!value) {
    return 'No expiry date'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function GiftCodesPage() {
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadGiftCodes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      const { data, error } =
        await supabase.functions.invoke<GiftCodesResponse>(
          'kingshot-gift-codes',
          {
            method: 'GET',
          },
        )

      if (error) {
        setErrorMessage(
          'Gift codes could not be loaded. Please try again shortly.',
        )
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!data || data.status !== 'success') {
        setErrorMessage(
          'The gift-code service returned an unexpected response.',
        )
        setLoading(false)
        setRefreshing(false)
        return
      }

      setGiftCodes(data.data.giftCodes)
      setActiveCount(data.data.activeCount)
      setLastUpdated(data.timestamp ?? new Date().toISOString())
      setLoading(false)
      setRefreshing(false)
    },
    [],
  )

  useEffect(() => {
    void loadGiftCodes()
  }, [loadGiftCodes])

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)

      window.setTimeout(() => {
        setCopiedCode(null)
      }, 1500)
    } catch {
      alert('Copy failed. Please copy the code manually.')
    }
  }

  return (
    <section className="section page-section gift-codes-page">
      <div className="section-heading gift-codes-heading">
        <p className="eyebrow">Kingshot Gift Codes</p>

        <h1 className="page-title">
          Active gift codes
        </h1>

        <p>
          Copy currently active Kingshot codes and redeem them
          inside the game.
        </p>
      </div>

      <div className="gift-codes-summary">
        <div>
          <strong>{activeCount}</strong>
          <span>Active codes</span>
        </div>

        <div>
          <strong>
            {lastUpdated
              ? new Intl.DateTimeFormat('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(lastUpdated))
              : '—'}
          </strong>
          <span>Last checked</span>
        </div>

        <button
          type="button"
          className="button button--secondary"
          disabled={refreshing}
          onClick={() => void loadGiftCodes(true)}
        >
          {refreshing ? 'Refreshing…' : 'Refresh codes'}
        </button>
      </div>

      {loading ? (
        <div className="gift-codes-state">
          <span>🎁</span>
          <h2>Loading gift codes…</h2>
        </div>
      ) : errorMessage ? (
        <div className="gift-codes-state gift-codes-state--error">
          <span>⚠️</span>
          <h2>Unable to load codes</h2>
          <p>{errorMessage}</p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => void loadGiftCodes()}
          >
            Try again
          </button>
        </div>
      ) : giftCodes.length === 0 ? (
        <div className="gift-codes-state">
          <span>🎁</span>
          <h2>No active codes found</h2>
          <p>Check back later for newly released gift codes.</p>
        </div>
      ) : (
        <div className="gift-code-grid">
          {giftCodes.map((giftCode) => (
            <article
              className="gift-code-card"
              key={giftCode.id}
            >
              <div className="gift-code-card__icon">
                🎁
              </div>

              <div className="gift-code-card__content">
                <span className="gift-code-card__label">
                  Active gift code
                </span>

                <strong className="gift-code-card__code">
                  {giftCode.code}
                </strong>

                <span className="gift-code-card__expiry">
                  Expires: {formatExpiryDate(giftCode.expiresAt)}
                </span>
              </div>

              <button
                type="button"
                className="button button--primary gift-code-card__copy"
                onClick={() => void copyCode(giftCode.code)}
              >
                {copiedCode === giftCode.code
                  ? 'Copied!'
                  : 'Copy code'}
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="compatibility-disclaimer">
        <strong>Code availability can change</strong>

        <p>
          Codes are supplied by the KingShot.net API. A code may
          become unavailable before the page refreshes.
        </p>
      </div>
    </section>
  )
}

export default GiftCodesPage