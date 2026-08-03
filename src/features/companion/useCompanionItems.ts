import { useEffect, useState } from 'react'

import { fetchDataset } from '../admin/dataEngineApi'
import {
  normaliseCompanionItems,
  type CompanionItemViewRecord,
} from './itemData'

export type CompanionItemsState = {
  items: CompanionItemViewRecord[]
  loading: boolean
  error: string | null
  updatedAt: string | null
}

export function useCompanionItems(): CompanionItemsState {
  const [items, setItems] = useState<CompanionItemViewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load(): Promise<void> {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchDataset('items', controller.signal)
        const normalised = normaliseCompanionItems(result.records)

        if (normalised.length !== result.recordCount) {
          throw new Error(
            'The published item projection contained invalid or incomplete records.',
          )
        }

        setItems(normalised)
        setUpdatedAt(result.metadata?.updated ?? result.fetchedAt)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return
        }

        setItems([])
        setError(
          caught instanceof Error
            ? caught.message
            : 'The Companion item catalogue could not be loaded.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [])

  return {
    items,
    loading,
    error,
    updatedAt,
  }
}
