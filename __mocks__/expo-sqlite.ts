/**
 * Manual Jest mock for `expo-sqlite`, applied automatically by Jest for all
 * tests (see https://jestjs.io/docs/manual-mocks#mocking-node-modules).
 *
 * `expo-sqlite` wraps a native SQLite engine that isn't available under
 * Jest's Node test environment. Rather than stubbing out the SQL behavior
 * entirely, this mock is backed by Node's built-in `node:sqlite` module so
 * the real connection and migration-runner logic under test still executes
 * against an actual SQLite engine.
 */
/// <reference types="node" />
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export interface SQLiteRunResult {
  lastInsertRowId: number;
  changes: number;
}

export class SQLiteDatabase {
  private readonly db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(':memory:');
  }

  execSync(source: string): void {
    this.db.exec(source);
  }

  runSync(source: string, params: SQLInputValue[] = []): SQLiteRunResult {
    const info = this.db.prepare(source).run(...params);
    return { lastInsertRowId: Number(info.lastInsertRowid), changes: Number(info.changes) };
  }

  getFirstSync<T>(source: string, params: SQLInputValue[] = []): T | null {
    const row = this.db.prepare(source).get(...params);
    // T is the caller-supplied row shape; node:sqlite returns untyped rows,
    // so this cast is unavoidable at the SQLite boundary.
    return row === undefined ? null : (row as T);
  }

  getAllSync<T>(source: string, params: SQLInputValue[] = []): T[] {
    // Same untyped-row caveat as getFirstSync above.
    return this.db.prepare(source).all(...params) as T[];
  }

  withTransactionSync(task: () => void): void {
    this.db.exec('BEGIN');
    try {
      task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function openDatabaseSync(_databaseName: string): SQLiteDatabase {
  return new SQLiteDatabase();
}
