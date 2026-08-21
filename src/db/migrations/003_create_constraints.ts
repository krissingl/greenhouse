import type { Migration } from './types';

export const migration003CreateConstraints: Migration = {
  id: 3,
  name: 'create_constraints',
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS constraints (
        id TEXT PRIMARY KEY,
        interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        dimension TEXT NOT NULL CHECK (dimension IN ('Time', 'Supplies', 'Location', 'Social', 'WeatherSeason', 'EnergyFocus')),
        status TEXT NOT NULL CHECK (status IN ('Unknown', 'None', 'Set')),
        value TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (interest_id, dimension)
      );
    `);
  },
};
