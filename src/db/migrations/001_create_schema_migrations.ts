import type { Migration } from './types';

export const migration001CreateSchemaMigrations: Migration = {
  id: 1,
  name: 'create_schema_migrations',
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
  },
};
