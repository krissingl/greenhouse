import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'greenhouse.db';

let database: SQLiteDatabase | undefined;

/**
 * Returns the single app database connection, opening it (and enabling
 * foreign key enforcement) on first access. Intended for use only within
 * `src/db` and `src/repositories` — no other layer should import this.
 */
export function getDatabase(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync(DATABASE_NAME);
    database.execSync('PRAGMA foreign_keys = ON;');
  }

  return database;
}
