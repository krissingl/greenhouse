import type { Migration } from './types';

export const migration004AddTypeSkippedAtToInterests: Migration = {
  id: 4,
  name: 'add_type_skipped_at_to_interests',
  up: (db) => {
    db.execSync(`
      ALTER TABLE interests ADD COLUMN type_skipped_at TEXT;
    `);
  },
};
