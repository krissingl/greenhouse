import { migration001CreateSchemaMigrations } from './001_create_schema_migrations';
import { migration002CreateInterests } from './002_create_interests';
import { migration003CreateConstraints } from './003_create_constraints';
import { migration004AddTypeSkippedAtToInterests } from './004_add_type_skipped_at_to_interests';
import { migration005AddDueByToInterests } from './005_add_due_by_to_interests';
import { migration006CreateNotes } from './006_create_notes';
import { migration007SplitWeatherSeasonDimensions } from './007_split_weather_season_dimensions';
import type { Migration } from './types';

export const migrations: Migration[] = [
  migration001CreateSchemaMigrations,
  migration002CreateInterests,
  migration003CreateConstraints,
  migration004AddTypeSkippedAtToInterests,
  migration005AddDueByToInterests,
  migration006CreateNotes,
  migration007SplitWeatherSeasonDimensions,
].sort((a, b) => a.id - b.id);

export type { Migration } from './types';
