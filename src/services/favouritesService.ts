import { supabase } from '../lib/supabase'

export const FAVOURITE_ENTITY_TYPES = [
  'hero',
  'event',
  'guide',
  'kingdom',
  'alliance',
  'creator',
  'tool',
] as const

export type FavouriteEntityType =
  (typeof FAVOURITE_ENTITY_TYPES)[number]

export type Favourite = {
  id: string
  user_id: string
  entity_type: FavouriteEntityType
  entity_id: string
  created_at: string
}

export function isFavouriteEntityType(
  value: string,
): value is FavouriteEntityType {
  return (FAVOURITE_ENTITY_TYPES as readonly string[]).includes(value)
}

function validateEntity(
  entityType: FavouriteEntityType,
  entityId: string,
) {
  if (!isFavouriteEntityType(entityType)) {
    throw new Error('Unsupported favourite entity type.')
  }

  if (!entityId.trim() || entityId.trim().length > 256) {
    throw new Error('Favourite entity ID is invalid.')
  }
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error('Sign in to manage favourites.')
  }

  return data.user.id
}

export async function listFavourites(
  entityType?: FavouriteEntityType,
): Promise<Favourite[]> {
  const userId = await currentUserId()
  let query = supabase
    .from('favourites')
    .select('id, user_id, entity_type, entity_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (entityType) {
    validateEntity(entityType, 'valid')
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Favourite[]
}

export async function checkFavourite(
  entityType: FavouriteEntityType,
  entityId: string,
) {
  validateEntity(entityType, entityId)
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('favourites')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId.trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

export async function addFavourite(
  entityType: FavouriteEntityType,
  entityId: string,
) {
  validateEntity(entityType, entityId)
  const userId = await currentUserId()
  const { error } = await supabase.from('favourites').insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId.trim(),
  })

  if (error && error.code !== '23505') {
    throw new Error(error.message)
  }
}

export async function removeFavourite(
  entityType: FavouriteEntityType,
  entityId: string,
) {
  validateEntity(entityType, entityId)
  const userId = await currentUserId()
  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId.trim())

  if (error) {
    throw new Error(error.message)
  }
}

export async function toggleFavourite(
  entityType: FavouriteEntityType,
  entityId: string,
) {
  const existing = await checkFavourite(entityType, entityId)
  if (existing) {
    await removeFavourite(entityType, entityId)
    return false
  }

  await addFavourite(entityType, entityId)
  return true
}
