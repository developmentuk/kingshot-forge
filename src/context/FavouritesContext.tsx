import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  addFavourite,
  listFavourites,
  removeFavourite,
  type Favourite,
  type FavouriteEntityType,
} from '../services/favouritesService'

type FavouritesContextValue = {
  favourites: Favourite[]
  loading: boolean
  error: string
  isFavourite: (entityType: FavouriteEntityType, entityId: string) => boolean
  toggle: (entityType: FavouriteEntityType, entityId: string) => Promise<void>
  remove: (entityType: FavouriteEntityType, entityId: string) => Promise<void>
  refresh: () => Promise<void>
}

const FavouritesContext = createContext<FavouritesContextValue | undefined>(undefined)

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    if (!user) {
      setFavourites([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      setFavourites(await listFavourites())
    } catch (loadError) {
      setFavourites([])
      setError(loadError instanceof Error ? loadError.message : 'Favourites could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    void refresh()
    // Auth user ID is the isolation boundary; refresh on account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  async function toggle(entityType: FavouriteEntityType, entityId: string) {
    if (!user) {
      setError('Sign in to manage favourites.')
      return
    }

    const existing = favourites.find((item) => item.entity_type === entityType && item.entity_id === entityId)
    setError('')
    try {
      if (existing) {
        await removeFavourite(entityType, entityId)
        setFavourites((current) => current.filter((item) => item.id !== existing.id))
      } else {
        await addFavourite(entityType, entityId)
        await refresh()
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Favourite could not be updated.')
    }
  }

  async function remove(entityType: FavouriteEntityType, entityId: string) {
    if (!user) return
    try {
      await removeFavourite(entityType, entityId)
      setFavourites((current) => current.filter((item) => !(item.entity_type === entityType && item.entity_id === entityId)))
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Favourite could not be removed.')
    }
  }

  const value: FavouritesContextValue = {
    favourites,
    loading,
    error,
    isFavourite: (entityType, entityId) => favourites.some((item) => item.entity_type === entityType && item.entity_id === entityId),
    toggle,
    remove,
    refresh,
  }

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
}

export { FavouritesContext }
