import type { Migration } from './types';

export const migration002CreateInterests: Migration = {
  id: 2,
  name: 'create_interests',
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS interests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT CHECK (type IN ('OneTimeProject', 'StructuredLearning', 'UnstructuredLearning') OR type IS NULL),
        state TEXT NOT NULL DEFAULT 'Backlog' CHECK (state IN ('Backlog', 'InProgress', 'Complete')),
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
};
