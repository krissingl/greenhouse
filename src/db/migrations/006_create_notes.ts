import type { Migration } from './types';

export const migration006CreateNotes: Migration = {
  id: 6,
  name: 'create_notes',
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        title TEXT,
        body TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
};
