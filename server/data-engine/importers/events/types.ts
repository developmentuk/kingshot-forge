export interface EventSourceRecord {
  name?: unknown;
  schedule?: unknown;
  recurEveryHours?: unknown;

  slug?: unknown;
  recur_every_hours?: unknown;
}

export interface EventSourcePayload {
  _meta?: unknown;
  events: unknown[];
}

export interface NormalisedEventRecord {
  name: string;
  slug: string;
  schedule: string | null;
  recur_every_hours: number | null;

  is_active: boolean;

  source_updated_at: string | null;
  source_verified: string | null;
  source_accuracy_score: number | null;
  source_name: string;
  source_url: string;
}