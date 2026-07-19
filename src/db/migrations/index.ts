import { migration001CreateSchemaMigrations } from './001_create_schema_migrations';
import { migration002CreateInterests } from './002_create_interests';
import type { Migration } from './types';

export const migrations: Migration[] = [
  migration001CreateSchemaMigrations,
  migration002CreateInterests,
].sort((a, b) => a.id - b.id);

export type { Migration } from './types';
