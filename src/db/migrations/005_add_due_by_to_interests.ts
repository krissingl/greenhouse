import type { Migration } from './types';

export const migration005AddDueByToInterests: Migration = {
  id: 5,
  name: 'add_due_by_to_interests',
  up: (db) => {
    db.execSync(`
      ALTER TABLE interests ADD COLUMN due_by TEXT;
    `);
  },
};
