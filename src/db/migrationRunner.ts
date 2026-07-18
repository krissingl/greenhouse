import type { SQLiteDatabase } from 'expo-sqlite';

import { logger } from '../utils/logger';
import { migrations } from './migrations';

interface SchemaMigrationIdRow {
  id: number;
}

function schemaMigrationsTableExists(db: SQLiteDatabase): boolean {
  const row = db.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations';",
  );
  return row !== null;
}

function getAppliedMigrationIds(db: SQLiteDatabase): Set<number> {
  if (!schemaMigrationsTableExists(db)) {
    return new Set();
  }

  const rows = db.getAllSync<SchemaMigrationIdRow>('SELECT id FROM schema_migrations;');
  return new Set(rows.map((row) => row.id));
}

/**
 * Applies any pending migrations, in ascending id order, each inside its own
 * transaction so a failed migration cannot leave the database in a partial
 * state. Safe to call repeatedly — already-applied migrations (tracked in
 * `schema_migrations`) are skipped, so running this twice does not fail or
 * duplicate records.
 */
export function runMigrations(db: SQLiteDatabase): void {
  const applied = getAppliedMigrationIds(db);
  const pending = migrations
    .filter((migration) => !applied.has(migration.id))
    .sort((a, b) => a.id - b.id);

  for (const migration of pending) {
    try {
      db.withTransactionSync(() => {
        migration.up(db);
        db.runSync('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);', [
          migration.id,
          migration.name,
          new Date().toISOString(),
        ]);
      });
    } catch (error) {
      logger.error(`Migration ${migration.id} (${migration.name}) failed`, error);
      throw error;
    }
  }
}
