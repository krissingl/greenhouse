import { logger } from '../utils/logger';
import { getDatabase } from './connection';
import { runMigrations } from './migrationRunner';

/**
 * Runs pending database migrations at import time, before the navigation
 * shell renders (see App.tsx, which imports this module first). A failed
 * migration is logged rather than thrown further, so it cannot crash the
 * app or lose existing data — the app continues to start.
 */
try {
  runMigrations(getDatabase());
} catch (error) {
  logger.error('Database migration failed during app startup', error);
}
