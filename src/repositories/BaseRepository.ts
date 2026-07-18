import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '../db';
import { RepositoryError } from './errors';

/**
 * Shared base for concrete repositories (e.g. the future InterestRepository).
 * Provides protected access to the single database connection and a single
 * strategy for wrapping SQLite-level failures into a typed RepositoryError
 * before they reach the application layer. Raw SQLite objects are never
 * exposed outside this class hierarchy.
 */
export abstract class BaseRepository {
  protected withConnection<T>(operation: (db: SQLiteDatabase) => T): T {
    try {
      return operation(getDatabase());
    } catch (error) {
      throw new RepositoryError('Database operation failed', error);
    }
  }
}
