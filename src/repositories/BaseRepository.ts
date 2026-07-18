import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '../db';
import { RepositoryError } from './errors';

/**
 * Raw SQLite objects are never exposed outside this class hierarchy.
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
