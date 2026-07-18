import { migration001CreateSchemaMigrations } from './001_create_schema_migrations';
import type { Migration } from './types';

export const migrations: Migration[] = [migration001CreateSchemaMigrations].sort(
  (a, b) => a.id - b.id,
);

export type { Migration } from './types';
