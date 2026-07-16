import { getSupabaseAdmin, } from '../../../database/supabaseAdmin.js'

import { fetchJsonSource, } from '../../sourceFetcher.js'

import { heroesImporter, } from './index.js'

import type { NormalisedHeroRecord, } from './types.js'

export interface HeroesImportResult {
  runId: string
  received: number
  inserted: number
  updated: number
  deactivated: number
}

interface ExistingHeroRecord {
  slug: string
  is_active: boolean
}

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'Unknown Heroes import error.'
}

export async function importHeroesDataset():
  Promise<HeroesImportResult> {
  const supabase =
    getSupabaseAdmin()

  const startedAt =
    new Date().toISOString()

  const {
    data: createdRun,
    error: createRunError,
  } = await supabase
    .from('data_import_runs')
    .insert({
      source_name: 'KingshotPro',
      dataset: 'heroes',
      source_url: heroesImporter.sourceUrl,
      status: 'running',
      items_found: 0,
      items_imported: 0,
      started_at: startedAt,
    })
    .select('id')
    .single()

  if (createRunError || !createdRun) {
    throw new Error(
      `Unable to create Heroes import run: ${
        createRunError?.message ??
        'No import run was returned.'
      }`,
    )
  }

  const runId =
    createdRun.id as string

  try {
    const fetched =
      await fetchJsonSource(
        heroesImporter.sourceUrl,
      )

    const parsed =
      heroesImporter.parsePayload(
        fetched.payload,
      )

    const normalised =
      heroesImporter.normalisePayload(
        parsed,
      )

    const records =
      normalised.records as
        NormalisedHeroRecord[]

    if (records.length === 0) {
      throw new Error(
        'Heroes source contained no records.',
      )
    }

    const {
      data: existingHeroes,
      error: existingHeroesError,
    } = await supabase
      .from('heroes')
      .select('slug, is_active')

    if (existingHeroesError) {
      throw new Error(
        `Unable to read existing Heroes: ${existingHeroesError.message}`,
      )
    }

    const existing =
      (existingHeroes ?? []) as
        ExistingHeroRecord[]

    const existingSlugs =
      new Set(
        existing.map((hero) => hero.slug),
      )

    const sourceSlugs =
      new Set(
        records.map((hero) => hero.slug),
      )

    const inserted =
      records.filter(
        (hero) =>
          !existingSlugs.has(hero.slug),
      ).length

    const updated =
      records.length - inserted

    const slugsToDeactivate =
      existing
        .filter(
          (hero) =>
            hero.is_active &&
            !sourceSlugs.has(hero.slug),
        )
        .map((hero) => hero.slug)

    const {
      error: upsertError,
    } = await supabase
      .from('heroes')
      .upsert(
        records,
        {
          onConflict: 'slug',
        },
      )

    if (upsertError) {
      throw new Error(
        `Unable to upsert Heroes: ${upsertError.message}`,
      )
    }

    if (slugsToDeactivate.length > 0) {
      const {
        error: deactivateError,
      } = await supabase
        .from('heroes')
        .update({
          is_active: false,
        })
        .in(
          'slug',
          slugsToDeactivate,
        )

      if (deactivateError) {
        throw new Error(
          `Unable to deactivate removed Heroes: ${deactivateError.message}`,
        )
      }
    }

    const completedAt =
      new Date().toISOString()

    const {
      error: completeRunError,
    } = await supabase
      .from('data_import_runs')
      .update({
        status: 'published',
        source_url: fetched.sourceUrl,
        items_found: records.length,
        items_imported: records.length,
        error_message: null,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', runId)

    if (completeRunError) {
      throw new Error(
        `Heroes were imported, but the import run could not be completed: ${completeRunError.message}`,
      )
    }

    return {
      runId,
      received: records.length,
      inserted,
      updated,
      deactivated:
        slugsToDeactivate.length,
    }
  } catch (error) {
    const message =
      getErrorMessage(error)

    const completedAt =
      new Date().toISOString()

    await supabase
      .from('data_import_runs')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', runId)

    throw error
  }
}