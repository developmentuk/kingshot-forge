import { useAuth } from '../context/AuthContext'
import { useFavourites } from '../context/useFavourites'
import type { FavouriteEntityType } from '../services/favouritesService'

export default function FavouriteButton({ entityType, entityId, label, className = 'favourite-button' }: { entityType: FavouriteEntityType; entityId: string; label: string; className?: string }) {
  const { user } = useAuth()
  const { isFavourite, loading, toggle } = useFavourites()
  const active = isFavourite(entityType, entityId)
  const action = active ? `Remove ${label} from favourites` : `Add ${label} to favourites`

  return <button type="button" className={active ? `${className} favourite-button--active` : className} aria-label={user ? action : `Sign in to favourite ${label}`} aria-pressed={active} disabled={!user || loading} title={!user ? 'Sign in to save favourites across devices.' : action} onClick={() => void toggle(entityType, entityId)}>{active ? '★' : '☆'}</button>
}
