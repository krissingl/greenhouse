import { getDatabase } from './connection';
import { runMigrations } from './migrationRunner';

/**
 * Runs pending database migrations at import time, before the navigation
 * shell renders (see App.tsx, which imports this module first). A failed
 * migration is already logged by the migration runner; it's swallowed here
 * rather than thrown further, so it cannot crash the app or lose existing
 * data — the app continues to start.
 */
try {
  runMigrations(getDatabase());
} catch {
  // Logged by runMigrations; swallowed here so startup can continue.
}
