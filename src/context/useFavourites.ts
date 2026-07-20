import { useContext } from 'react'
import { FavouritesContext } from './FavouritesContext'

export function useFavourites() {
  const context = useContext(FavouritesContext)
  if (!context) throw new Error('useFavourites must be used inside FavouritesProvider.')
  return context
}
